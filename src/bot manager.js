const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

let sock = null;
let qrCode = null;
let sessionData = null;

// Support for session ID from panels
async function connectWithSession(sessionId) {
    try {
        logger.info('Connecting with session ID...');
        
        // Parse session data (could be JSON string or pairing code)
        if (sessionId.startsWith('{')) {
            sessionData = JSON.parse(sessionId);
        } else {
            // Handle pairing code or other formats
            sessionData = { pairingCode: sessionId };
        }
        
        await startWhatsApp();
        return true;
    } catch (error) {
        logger.error('Session connection failed:', error);
        return false;
    }
}

async function startWhatsApp() {
    try {
        const authDir = path.join(process.cwd(), 'auth');
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }
        
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: logger.pinoLogger,
            browser: ['Ubuntu', 'Chrome', '20.0.04'],
            syncFullHistory: false,
            markOnlineOnConnect: true
        });
        
        // Store credentials
        sock.ev.on('creds.update', saveCreds);
        
        // Handle QR
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                qrCode = qr;
                logger.info('New QR Generated');
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'open') {
                logger.success('✅ Connected to WhatsApp');
                onConnected();
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.warn(`Connection closed. Reconnect: ${shouldReconnect}`);
                
                if (shouldReconnect) {
                    setTimeout(startWhatsApp, 5000);
                }
            }
        });
        
        // Load plugins
        loadPlugins();
        
        return sock;
    } catch (error) {
        logger.error('WhatsApp connection failed:', error);
        throw error;
    }
}

function loadPlugins() {
    // Load all feature plugins
    const plugins = [
        'autoreactstatus',
        'autoviewstatus',
        'antideletestatus',
        'antidelete',
        'autotyping',
        'autorecording',
        'antilink',
        'anticall',
        'play',
        'url',
        'vcf',
        'antibug'
    ];
    
    plugins.forEach(plugin => {
        try {
            require(`./plugins/${plugin}.js`)(sock);
            logger.info(`✅ Loaded plugin: ${plugin}`);
        } catch (error) {
            logger.warn(`⚠️ Plugin ${plugin} not found or error: ${error.message}`);
        }
    });
}

function onConnected() {
    logger.success('🤖 KIH DAH Bot is ready!');
    logger.success('👑 Owner: GuruTech');
    
    // Send welcome message to owner
    if (process.env.OWNER_NUMBER) {
        const welcomeMsg = `*🤖 KIH DAH BOT ACTIVATED*\n\n👑 Owner: ${process.env.OWNER_NAME || 'GuruTech'}\n⏰ Time: ${new Date().toLocaleString()}\n✅ Bot is now online and ready!`;
        sock.sendMessage(process.env.OWNER_NUMBER + '@s.whatsapp.net', { text: welcomeMsg });
    }
}

// Get current QR for panel
function getQR() {
    return qrCode;
}

// Start bot with environment detection
async function startBot() {
    const platform = process.env.PLATFORM || 'unknown';
    logger.info(`Starting KIH DAH Bot on ${platform.toUpperCase()}`);
    
    // Check for session ID in environment (for panels)
    if (process.env.SESSION_ID) {
        await connectWithSession(process.env.SESSION_ID);
    } else {
        await startWhatsApp();
    }
}

module.exports = { startBot, getQR, connectWithSession };
