// src/server.js
require('dotenv').config();
const express = require('express');
const { startBot } = require('./botManager');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic routes
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>KIH DAH WhatsApp Bot</title>
        <style>
            body { font-family: Arial; padding: 50px; text-align: center; }
            .logo { width: 150px; border-radius: 50%; }
            .btn { display: inline-block; padding: 15px 30px; margin: 10px; 
                   background: #25D366; color: white; text-decoration: none; 
                   border-radius: 5px; font-weight: bold; }
        </style>
    </head>
    <body>
        <img src="https://files.catbox.moe/atpgij.jpg" class="logo" alt="GuruTech">
        <h1>🤖 KIH DAH WhatsApp Bot</h1>
        <p>👑 Created by <b>GuruTech</b></p>
        <p>🔐 Session Format: <code>KIHDAH:~[16 characters]</code></p>
        
        <div style="margin: 30px 0;">
            <a href="https://xgurupairing1-b1268276f8b5.herokuapp.com/pair" class="btn">
                🔗 Get KIHDAH:~ Session
            </a>
            <a href="/health" class="btn" style="background: #5865F2;">
                🩺 Health Check
            </a>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: left; max-width: 600px; margin: 0 auto;">
            <h3>📋 Bot Status:</h3>
            <p>✅ Web server: Running</p>
            <p>🤖 Bot: Starting...</p>
            <p>🔑 Session: ${process.env.SESSION_ID ? 'Configured' : 'Not set (using QR)'}</p>
            <p>🌐 Port: ${PORT}</p>
            <p>⚡ Platform: ${process.env.PLATFORM || 'Heroku'}</p>
        </div>
    </body>
    </html>
    `);
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        bot: 'KIH DAH',
        owner: 'GuruTech',
        session_format: 'KIHDAH:~ required',
        timestamp: new Date().toISOString()
    });
});

app.get('/panel', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Bot Panel</title></head>
    <body>
        <h1>🤖 Bot Control Panel</h1>
        <p>Coming soon...</p>
        <a href="/">← Back</a>
    </body>
    </html>
    `);
});

// Start server
app.listen(PORT, () => {
    logger.info(`✅ Web server running on port ${PORT}`);
    logger.info(`🌐 URL: http://localhost:${PORT}`);
    
    // Start WhatsApp bot
    startBot().catch(error => {
        logger.error('❌ Failed to start bot:', error.message);
    });
});

// Handle errors
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
