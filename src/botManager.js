
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('./utils/logger');
const sessionManager = require('./sessionManager');
const sessionValidator = require('./sessionValidator');
const fs = require('fs');
const path = require('path');

let sock = null;
let qrCode = null;
let isConnected = false;

class BotManager {
    constructor() {
        this.authDir = path.join(process.cwd(), 'auth');
        this.sessionData = null;
        this.platform = process.env.PLATFORM || 'unknown';
        this.plugins = []; // Initialize plugins array
    }

    // STRICT: Only accept KIHDAH:~ sessions
    async detectSession() {
        logger.info(`🔍 Strict Session Detection - KIHDAH:~ FORMAT ONLY`);
        
        const sessionId = process.env.SESSION_ID || '';
        
        if (!sessionId) {
            logger.warn('⚠️ No SESSION_ID provided, will use QR code');
            return 'qr';
        }
        
        // STRICT VALIDATION: Only accept KIHDAH:~ format
        const extractedSessionId = sessionValidator.extractSessionId(sessionId);
        
        if (!extractedSessionId) {
            logger.error('🚨 INVALID SESSION ID');
            logger.error('   Your session must be in format: KIHDAH:~[16 hex characters]');
            logger.error('   Example: KIHDAH:~A1B2C3D4E5F67890');
            logger.error('   Get valid session from: https://xgurupairing1-b1268276f8b5.herokuapp.com/pair');
            
            // Show error and exit
            this.showSessionError(sessionId);
            return 'invalid';
        }
        
        logger.success(`✅ Valid KIHDAH:~ session detected: ${extractedSessionId}`);
        
        // Now decode if it's Base64
        if (sessionValidator.isBase64(sessionId)) {
            this.sessionData = sessionManager.decodeBase64Session(sessionId);
            return 'base64';
        } else {
            // It's already the raw KIHDAH:~ ID
            // We need to get the actual session data from somewhere
            // For now, we'll use multi-file auth
            logger.info('📁 Using multi-file auth with validated session ID');
            return 'multifile';
        }
    }

    showSessionError(invalidSession) {
        const rules = sessionValidator.getRules();
        
        console.log('\n' + '='.repeat(60));
        console.log('🚨 KIH DAH BOT - SESSION VALIDATION FAILED');
        console.log('='.repeat(60));
        console.log(`\n❌ Your session ID is INVALID:`);
        console.log(`   Received: ${invalidSession.substring(0, 50)}...`);
        
        console.log(`\n✅ Required Format:`);
        console.log(`   Prefix: ${rules.prefix}`);
        console.log(`   Length: ${rules.length} characters`);
        console.log(`   Format: ${rules.format}`);
        console.log(`   Example: ${rules.example}`);
        console.log(`   Valid chars: ${rules.validChars}`);
        
        console.log(`\n🔗 Get a valid session from:`);
        console.log(`   https://xgurupairing1-b1268276f8b5.herokuapp.com/pair`);
        
        console.log(`\n📝 For Heroku/Render deployment:`);
        console.log(`   SESSION_ID="KIHDAH:~A1B2C3D4E5F67890"`);
        
        console.log('\n' + '='.repeat(60));
        console.log('Bot will now exit. Please fix your session ID.');
        console.log('='.repeat(60) + '\n');
        
        process.exit(1);
    }

    async startWhatsApp() {
        try {
            const sessionType = await this.detectSession();
            
            if (sessionType === 'invalid') {
                // Already handled in showSessionError
                return null;
            }
            
            logger.info(`🔄 Starting with session type: ${sessionType.toUpperCase()}`);
            
            let authState;
            
            switch(sessionType) {
                case 'base64':
                    authState = await this.createAuthFromSessionData();
                    break;
                case 'multifile':
                    authState = await useMultiFileAuthState(this.authDir);
                    break;
                default:
                    authState = await useMultiFileAuthState(this.authDir);
            }
            
            const { state, saveCreds } = authState;
            
            // FIX: Don't pass logger to avoid issues, or use proper pino logger
            sock = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                // Remove or fix logger parameter:
                // logger: logger.pinoLogger, // Comment this out
                browser: ['KIHDAH', 'Quantum', '3.0.0'],
                syncFullHistory: false,
                markOnlineOnConnect: true,
                emitOwnEvents: false,
                connectTimeoutMs: 60000
            });
            
            // Save credentials
            sock.ev.on('creds.update', saveCreds);
            
            // Handle connection
            sock.ev.on('connection.update', async (update) => {
                await this.handleConnectionUpdate(update, saveCreds);
            });
            
            // FIX: Add loadPlugins method or remove the call
            this.loadPlugins(); // This will now work with the method below
            
            // Start message handler
            this.startMessageHandler();
            
            isConnected = true;
            logger.success('✅ WhatsApp connection established with valid KIHDAH:~ session');
            
            return sock;
            
        } catch (error) {
            logger.error('❌ WhatsApp connection failed:', error);
            
            if (error.message.includes('session') || error.message.includes('auth')) {
                logger.error('💡 Tip: Make sure your KIHDAH:~ session is fresh and valid');
                logger.error('   Get new session from: https://xgurupairing1-b1268276f8b5.herokuapp.com/pair');
            }
            
            throw error;
        }
    }

    // FIX: Add the missing loadPlugins method
    loadPlugins() {
        try {
            logger.info('🔌 Loading plugins...');
            // You can implement your plugin loading logic here
            // For now, just log that plugins are loaded
            logger.success('✅ Plugins loaded (0 plugins)');
        } catch (error) {
            logger.warn('⚠️ Could not load plugins:', error.message);
        }
    }

    // FIX: Add the missing startMessageHandler method
    startMessageHandler() {
        try {
            sock.ev.on('messages.upsert', async ({ messages }) => {
                try {
                    const message = messages[0];
                    
                    if (!message.message || message.key.fromMe) {
                        return;
                    }
                    
                    const text = this.extractMessageText(message.message);
                    
                    // Basic ping command
                    if (text === '!ping' || text === '.ping') {
                        await sock.sendMessage(message.key.remoteJid, {
                            text: '🏓 Pong! KIHDAH Bot is online!'
                        });
                    }
                    
                } catch (error) {
                    logger.error('Message handler error:', error);
                }
            });
            
            logger.success('✅ Message handler started');
        } catch (error) {
            logger.error('❌ Failed to start message handler:', error);
        }
    }

    extractMessageText(messageContent) {
        if (messageContent.conversation) {
            return messageContent.conversation;
        }
        if (messageContent.extendedTextMessage?.text) {
            return messageContent.extendedTextMessage.text;
        }
        if (messageContent.imageMessage?.caption) {
            return messageContent.imageMessage.caption;
        }
        if (messageContent.videoMessage?.caption) {
            return messageContent.videoMessage.caption;
        }
        return '';
    }

    async createAuthFromSessionData() {
        if (!this.sessionData) {
            throw new Error('No KIHDAH:~ session data available');
        }
        
        // Verify session has KIHDAH:~ ID
        if (!this.sessionData.sessionId || !this.sessionData.sessionId.startsWith('KIHDAH:~')) {
            throw new Error('Session data missing KIHDAH:~ ID');
        }
        
        return {
            state: {
                creds: this.sessionData,
                keys: {}
            },
            saveCreds: () => {
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
            logger.info('📱 QR Code Generated (using because session was not provided)');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'open') {
            isConnected = true;
            logger.success('✅ Connected to WhatsApp');
            
            // Update session data
            if (sock.authState.creds) {
                this.sessionData = sock.authState.creds;
                
                // Ensure it has KIHDAH:~ ID
                if (!this.sessionData.sessionId || !this.sessionData.sessionId.startsWith('KIHDAH:~')) {
                    this.sessionData.sessionId = `KIHDAH:~${Date.now().toString(16).toUpperCase().substring(0, 16)}`;
                }
                
                sessionManager.saveSession(this.sessionData);
            }
            
            this.onConnected();
        }
        
        if (connection === 'close') {
            isConnected = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            
            if (statusCode === DisconnectReason.loggedOut) {
                logger.error('🚨 Logged out from WhatsApp. Session expired.');
                logger.error('💡 Get new KIHDAH:~ session from generator');
                this.cleanAuthFiles();
            } else {
                logger.warn('🔌 Connection closed, reconnecting...');
                setTimeout(() => this.startWhatsApp(), 5000);
            }
        }
    }

    cleanAuthFiles() {
        try {
            if (fs.existsSync(this.authDir)) {
                fs.rmSync(this.authDir, { recursive: true });
                logger.info('🧹 Cleaned auth files');
            }
        } catch (error) {
            logger.warn('Could not clean auth files:', error.message);
        }
    }

    onConnected() {
        const sessionId = this.sessionData?.sessionId || 'Unknown';
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        
        const statusMsg = `
🤖 *KIH DAH QUANTUM ACTIVATED*

🔑 *Session:* ${sessionId}
👑 *Owner:* ${process.env.OWNER_NAME || 'GuruTech'}
⚡ *Version:* 3.0.0
💾 *Memory:* ${memory}MB
✅ *Status:* ONLINE (KIHDAH:~ Verified)

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
                    logger.warn('Could not send status to owner');
                }
            }, 3000);
        }
    }

    // Helper method to get current socket
    getSocket() {
        return sock;
    }

    // Helper method to get connection status
    isBotConnected() {
        return isConnected;
    }

    // Helper method to get QR code
    getQRCode() {
        return qrCode;
    }
}

module.exports = new BotManager();
