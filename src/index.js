require('dotenv').config();
const logger = require('./utils/logger');

console.log(`
╔══════════════════════════════════════╗
║      🤖 KIH DAH BOT v3.0.0          ║
║      👑 Owner: GuruTech              ║
║      🔐 Session: KIHDAH:~ Only      ║
╚══════════════════════════════════════╝
`);

// Check if we need web server (Heroku/Render has PORT)
if (process.env.PORT) {
    logger.info('🌐 Starting web server mode (Heroku/Render)...');
    
    const express = require('express');
    const app = express();
    const PORT = process.env.PORT;
    
    app.get('/', (req, res) => {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>KIH DAH WhatsApp Bot</title>
            <style>
                body { font-family: Arial; padding: 50px; text-align: center; }
                h1 { color: #25D366; }
            </style>
        </head>
        <body>
            <h1>🤖 KIH DAH WhatsApp Bot</h1>
            <p><b>👑 Owner:</b> GuruTech</p>
            <p><b>🔐 Session Format:</b> KIHDAH:~[16 characters]</p>
            <p><b>⚡ Status:</b> Web server running</p>
            <p><b>📞 Get Session:</b> <a href="https://xgurupairing1-b1268276f8b5.herokuapp.com/pair">Click Here</a></p>
        </body>
        </html>
        `);
    });
    
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            bot: 'KIH DAH',
            owner: 'GuruTech',
            platform: 'Heroku',
            time: new Date().toISOString()
        });
    });
    
    app.listen(PORT, () => {
        logger.success(`✅ Web server running on port ${PORT}`);
        // Start the WhatsApp bot
        try {
            require('./src/index.js');
        } catch (error) {
            logger.error('Failed to start bot:', error.message);
            // Try alternative
            try {
                const { startBot } = require('./src/botManager');
                startBot().catch(err => logger.error('Bot error:', err.message));
            } catch (err2) {
                logger.error('Could not start bot at all');
            }
        }
    });
    
} else {
    logger.info('🤖 Starting bot mode (Local)...');
    // Try to load the bot
    try {
        require('./src/index.js');
    } catch (error) {
        logger.error('Failed to load src/index.js:', error.message);
        // Try botManager directly
        try {
            const { startBot } = require('./src/botManager');
            startBot().catch(err => logger.error('Bot error:', err.message));
        } catch (err2) {
            logger.error('No bot files found');
        }
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
