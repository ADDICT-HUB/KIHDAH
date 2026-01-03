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
        <head><title>KIH DAH Bot</title></head>
        <body>
            <h1>🤖 KIH DAH WhatsApp Bot</h1>
            <p>Running on Heroku...</p>
        </body>
        </html>
        `);
    });
    
    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });
    
    app.listen(PORT, () => {
        logger.info(`✅ Web server on port ${PORT}`);
        // Start the bot - FIX THIS LINE!
        require('./src/main.js');  // Changed from './src/index.js'
    });
    
} else {
    logger.info('🤖 Starting bot mode (Local)...');
    require('./src/main.js');  // Changed from './src/index.js'
}

// Error handling
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
