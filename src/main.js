require('dotenv').config();
const config = require('./configManager');
const { startBot } = require('./botManager');
const logger = require('./utils/logger');

// Set presence based on config
const presenceMap = {
    1: 'available',
    2: 'composing',
    3: 'recording'
};

// Set initial presence
if (config.get('presence') && presenceMap[config.get('presence')]) {
    process.env.INITIAL_PRESENCE = presenceMap[config.get('presence')];
}

// Performance optimization for Heroku
process.env.UV_THREADPOOL_SIZE = 64;
require('events').EventEmitter.defaultMaxListeners = 50;

const startTime = Date.now();

async function main() {
    logger.info('🚀 Starting KIH-DAH Quantum Bot');
    logger.info(`👑 Owner: ${config.get('ownerName')}`);
    logger.info(`🤖 Bot: ${config.get('botName')}`);
    logger.info(`🔧 Prefix: ${config.get('prefix')}`);
    logger.info(`🌐 Mode: ${config.get('publicMode') ? 'Public' : 'Private'}`);
    
    // Log enabled features
    const enabledFeatures = Object.keys(config.config)
        .filter(key => typeof config.config[key] === 'boolean' && config.config[key])
        .map(key => `• ${key}`)
        .join('\n');
    
    logger.info(`✅ Enabled Features:\n${enabledFeatures}`);
    
    try {
        await startBot();
        
        const startupTime = Date.now() - startTime;
        logger.success(`✅ Bot started in ${startupTime}ms`);
        
        // Send starting message if enabled
        if (config.get('startingBotMessage') && config.get('ownerNumber')) {
            setTimeout(async () => {
                try {
                    const statusMsg = `🤖 *${config.get('botName')} Quantum Activated*\n\n` +
                                    `👑 Owner: ${config.get('ownerName')}\n` +
                                    `⚡ Version: 3.0.0\n` +
                                    `🔧 Prefix: ${config.get('prefix')}\n` +
                                    `✅ Bot is now online!`;
                    
                    await require('./botManager').getSock().sendMessage(
                        config.get('ownerNumber') + '@s.whatsapp.net',
                        { text: statusMsg }
                    );
                } catch (error) {
                    logger.warn('Could not send startup message:', error.message);
                }
            }, 10000);
        }
        
    } catch (error) {
        logger.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('🛑 Received SIGINT, shutting down...');
    process.exit(0);
});

// Start
setImmediate(main);
