const { makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('./utils/logger');
const sessionManager = require('./sessionManager');
const fs = require('fs');
const path = require('path');
const { Boom } = require('@hapi/boom');

let sock = null;
let qrCode = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

class BotManager {
    constructor() {
        this.authDir = path.join(process.cwd(), 'auth');
        this.sessionData = null;
        this.platform = process.env.PLATFORM || 'unknown';
    }

    // Smart session detection
    async detectSession() {
        logger.info(`🔍 Detecting session on ${this.platform.toUpperCase()} platform`);
        
        // Priority 1: Base64 SESSION_ID from environment
        if (process.env.SESSION_ID) {
            logger.info('📦 Found SESSION_ID in environment');
            const decoded = sessionManager.decodeBase64Session(process.env.SESSION_ID);
            if (decoded && sessionManager.validateSession(decoded)) {
                this.sessionData = decoded;
                logger.success('✅ Base64 session decoded successfully');
                return 'base64';
            } else {
                logger.warn('⚠️ Invalid Base64 session, falling back...');
            }
        }
        
        // Priority 2: Session file
        const fileSession = sessionManager.loadSession();
        if (fileSession) {
            logger.info('📁 Found session file');
            this.sessionData = fileSession;
            return 'file';
        }
        
        // Priority 3: Multi-file auth state
        if (fs.existsSync(path.join(this.authDir, 'creds.json'))) {
            logger.info('🔐 Found multi-file auth');
            return 'multifile';
        }
        
        logger.info('🔑 No session found, will use QR');
        return 'qr';
    }

    async startWhatsApp() {
        try {
            const sessionType = await this.detectSession();
            logger.info(`🔄 Starting with session type: ${sessionType.toUpperCase()}`);
            
            let authState;
            
            switch(sessionType) {
                case 'base64':
                    authState = await this.createAuthFromSessionData();
                    break;
                case 'file':
                    authState = await this.createAuthFromSessionData();
                    break;
                case 'multifile':
                    authState = await useMultiFileAuthState(this.authDir);
                    break;
                default:
                    authState = await useMultiFileAuthState(this.authDir);
            }
            
            const { state, saveCreds } = authState;
            
            sock = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                logger: logger.pinoLogger,
                browser: ['KIH DAH', 'Bot', '3.0.0'],
                syncFullHistory: false,
                markOnlineOnConnect: true,
                emitOwnEvents: false,
                generateHighQualityLinkPreview: true,
                getMessage: async (key) => {
                    return {
                        conversation: 'Message not cached'
                    };
                },
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 10000
            });
            
            // Save credentials when updated
            sock.ev.on('creds.update', saveCreds);
            
            // Handle connection updates
            sock.ev.on('connection.update', async (update) => {
                await this.handleConnectionUpdate(update, saveCreds);
            });
            
            // Load plugins
            this.loadPlugins();
            
            // Start message handler
            this.startMessageHandler();
            
            reconnectAttempts = 0;
            return sock;
            
        } catch (error) {
            logger.error('❌ WhatsApp connection failed:', error);
            
            // Auto-retry
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                logger.info(`🔄 Retry ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in 5s...`);
                setTimeout(() => this.startWhatsApp(), 5000);
            } else {
                logger.error('🚨 Max reconnect attempts reached');
                process.exit(1);
            }
            
            throw error;
        }
    }

    async createAuthFromSessionData() {
        if (!this.sessionData) {
            throw new Error('No session data available');
        }
        
        return {
            state: {
                creds: this.sessionData,
                keys: makeCacheableSignalKeyStore({}),
            },
            saveCreds: () => {
                // Save updated credentials
                if (this.sessionData) {
                    sessionManager.saveSession(this.sessionData);
                }
            }
        };
    }

    async handleConnectionUpdate(update, saveCreds) {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCode = qr;
            logger.info('📱 QR Code Generated');
            qrcode.generate(qr, { small: true });
            
            // For panels, emit QR
            if (typeof global.io !== 'undefined') {
                global.io.emit('qr', qr);
            }
        }
        
        if (connection === 'open') {
            isConnected = true;
            reconnectAttempts = 0;
            logger.success('✅ Connected to WhatsApp');
            
            // Update session data if needed
            if (sock.authState.creds) {
                this.sessionData = sock.authState.creds;
                sessionManager.saveSession(this.sessionData);
            }
            
            this.onConnected();
            
            // Emit to panel
            if (typeof global.io !== 'undefined') {
                global.io.emit('connected', 'Bot is now online!');
            }
        }
        
        if (connection === 'close') {
            isConnected = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const error = lastDisconnect?.error;
            
            logger.warn(`🔌 Connection closed. Status: ${statusCode || 'unknown'}`);
            
            if (error instanceof Boom) {
                logger.error('Boom error:', error.output.payload);
            }
            
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                const delay = Math.min(5000 * reconnectAttempts, 30000);
                logger.info(`🔄 Reconnecting in ${delay/1000}s... (Attempt ${reconnectAttempts})`);
                setTimeout(() => this.startWhatsApp(), delay);
            } else if (!shouldReconnect) {
                logger.error('🚨 Logged out from WhatsApp. Delete auth files and restart.');
                this.cleanAuthFiles();
            }
        }
    }

    loadPlugins() {
        const pluginDir = path.join(__dirname, 'plugins');
        
        if (!fs.existsSync(pluginDir)) {
            fs.mkdirSync(pluginDir, { recursive: true });
            logger.info('📁 Created plugins directory');
            return;
        }
        
        const plugins = fs.readdirSync(pluginDir)
            .filter(file => file.endsWith('.js'))
            .map(file => file.replace('.js', ''));
        
        if (plugins.length === 0) {
            logger.warn('⚠️ No plugins found in plugins directory');
            
            // Create default plugins if none exist
            this.createDefaultPlugins();
            return;
        }
        
        logger.info(`📦 Loading ${plugins.length} plugins...`);
        
        plugins.forEach(plugin => {
            try {
                const pluginPath = path.join(pluginDir, `${plugin}.js`);
                const pluginModule = require(pluginPath);
                
                if (typeof pluginModule === 'function') {
                    pluginModule(sock);
                    logger.success(`✅ Loaded: ${plugin}`);
                }
            } catch (error) {
                logger.error(`❌ Failed to load plugin ${plugin}:`, error.message);
            }
        });
    }

    createDefaultPlugins() {
        const pluginDir = path.join(__dirname, 'plugins');
        
        // Create essential plugins
        const defaultPlugins = {
            'autoreactstatus.js': `
module.exports = (sock) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        if (msg.key.remoteJid === 'status@broadcast') {
            const reactions = ['❤️', '🔥', '👍', '😄', '🎉'];
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];
            
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    react: { text: reaction, key: msg.key }
                });
            } catch (error) {}
        }
    });
};
            `,
            'antilink.js': `
module.exports = (sock) => {
    const blockedDomains = new Set(['chat.whatsapp.com', 't.me', 'discord.gg']);
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const urlRegex = /(https?:\\/\\/[^\\s]+)/g;
        const urls = text.match(urlRegex);
        
        if (urls && msg.key.remoteJid.endsWith('@g.us')) {
            const isBlocked = urls.some(url => {
                try {
                    const domain = new URL(url).hostname.replace('www.', '');
                    return blockedDomains.has(domain);
                } catch { return false; }
            });
            
            if (isBlocked) {
                try {
                    await sock.sendMessage(msg.key.remoteJid, {
                        delete: msg.key
                    });
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: \`⚠️ @\${msg.key.participant.split('@')[0]}, No links allowed!\`,
                        mentions: [msg.key.participant]
                    }, { quoted: msg });
                } catch (error) {}
            }
        }
    });
};
            `
        };
        
        Object.entries(defaultPlugins).forEach(([filename, content]) => {
            fs.writeFileSync(path.join(pluginDir, filename), content);
            logger.info(`📝 Created default plugin: ${filename}`);
        });
    }

    startMessageHandler() {
        const commandHandler = require('./commandHandler');
        const prefix = process.env.BOT_PREFIX || '.';
        
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            
            const msg = messages[0];
            if (!msg.message) return;
            
            // Extract text
            let text = '';
            if (msg.message.conversation) {
                text = msg.message.conversation;
            } else if (msg.message.extendedTextMessage?.text) {
                text = msg.message.extendedTextMessage.text;
            } else if (msg.message.imageMessage?.caption) {
                text = msg.message.imageMessage.caption;
            }
            
            text = text.trim();
            
            // Check if it's a command
            if (text.startsWith(prefix)) {
                const command = text.slice(prefix.length).split(' ')[0].toLowerCase();
                const args = text.slice(prefix.length + command.length).trim().split(' ');
                
                // Remove empty args
                const cleanArgs = args.filter(arg => arg.length > 0);
                
                logger.info(`📨 Command: ${command} from ${msg.key.remoteJid}`);
                
                // Handle command
                await commandHandler.handle(sock, msg, command, cleanArgs);
            }
        });
    }

    onConnected() {
        const uptime = process.uptime();
        const memory = process.memoryUsage();
        
        const statusMsg = `
🤖 *KIH DAH BOT ACTIVATED*
        
👑 Owner: ${process.env.OWNER_NAME || 'GuruTech'}
⚡ Version: 3.0.0
📊 Platform: ${this.platform}
🕒 Uptime: ${uptime.toFixed(2)}s
💾 Memory: ${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB
✅ Status: ONLINE
        
Type ${process.env.BOT_PREFIX || '.'}menu for commands
        `.trim();
        
        logger.success(statusMsg);
        
        // Send to owner
        if (process.env.OWNER_NUMBER) {
            setTimeout(async () => {
                try {
                    await sock.sendMessage(process.env.OWNER_NUMBER + '@s.whatsapp.net', {
                        text: statusMsg
                    });
                } catch (error) {
                    logger.warn('Could not send status to owner:', error.message);
                }
            }, 3000);
        }
    }

    cleanAuthFiles() {
        try {
            if (fs.existsSync(this.authDir)) {
                fs.rmSync(this.authDir, { recursive: true, force: true });
                logger.info('🧹 Cleared auth files');
            }
        } catch (error) {
            logger.error('Failed to clean auth files:', error);
        }
    }

    getQR() {
        return qrCode;
    }

    isConnected() {
        return isConnected;
    }

    getSock() {
        return sock;
    }
}

module.exports = new BotManager();
