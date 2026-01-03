require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { startBot, getQR } = require('./src/botManager');
const logger = require('./src/utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Web Dashboard Routes
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>KIH DAH Bot - GuruTech</title>
        <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            .container { max-width: 800px; margin: auto; }
            .qr-box { margin: 20px; padding: 20px; border: 2px solid #333; }
            input { padding: 10px; margin: 10px; width: 300px; }
            button { padding: 10px 20px; background: #25D366; color: white; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 KIH DAH WhatsApp Bot</h1>
            <p>Created by <b>GuruTech</b></p>
            
            <div id="panel">
                <h3>Choose Authentication Method:</h3>
                <button onclick="showQRMethod()">📱 Scan QR Code</button>
                <button onclick="showSessionMethod()">🔑 Enter Session ID</button>
                
                <div id="qrSection" style="display:none;">
                    <div class="qr-box" id="qrCode"></div>
                    <p>Scan this QR code with WhatsApp</p>
                </div>
                
                <div id="sessionSection" style="display:none;">
                    <input type="text" id="sessionId" placeholder="Enter Session ID or Pairing Code">
                    <button onclick="connectWithSession()">Connect</button>
                </div>
                
                <div id="status"></div>
            </div>
        </div>
        
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            const statusDiv = document.getElementById('status');
            
            socket.on('qr', (qr) => {
                document.getElementById('qrCode').innerHTML = qr;
                statusDiv.innerHTML = '<p style="color:orange">QR Code Generated - Scan Now</p>';
            });
            
            socket.on('connected', () => {
                statusDiv.innerHTML = '<p style="color:green">✅ Bot Connected Successfully!</p>';
            });
            
            socket.on('error', (msg) => {
                statusDiv.innerHTML = '<p style="color:red">❌ ' + msg + '</p>';
            });
            
            function showQRMethod() {
                document.getElementById('qrSection').style.display = 'block';
                document.getElementById('sessionSection').style.display = 'none';
                socket.emit('getQR');
            }
            
            function showSessionMethod() {
                document.getElementById('sessionSection').style.display = 'block';
                document.getElementById('qrSection').style.display = 'none';
            }
            
            function connectWithSession() {
                const sessionId = document.getElementById('sessionId').value;
                if(sessionId) {
                    socket.emit('session', sessionId);
                    statusDiv.innerHTML = '<p>Connecting with session...</p>';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// API endpoints for panels
app.post('/api/start', (req, res) => {
    const { session_id, platform } = req.body;
    logger.info(`Starting bot from panel - Platform: ${platform}`);
    res.json({ success: true, message: 'Bot starting...' });
});

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'running', 
        bot: 'KIH DAH', 
        owner: 'GuruTech',
        uptime: process.uptime()
    });
});

// Health check for Render/Heroku
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Start bot when server starts
io.on('connection', (socket) => {
    logger.info('Panel user connected');
    
    socket.on('getQR', () => {
        const qr = getQR();
        if(qr) socket.emit('qr', qr);
    });
    
    socket.on('session', (sessionId) => {
        logger.info(`Session ID received: ${sessionId.substring(0, 10)}...`);
        socket.emit('connected', 'Session connected!');
    });
});

// Start server
server.listen(PORT, () => {
    logger.info(`🚀 KIH DAH Bot Server running on port ${PORT}`);
    logger.info(`🔗 Panel URL: http://localhost:${PORT}`);
    
    // Start WhatsApp bot
    startBot().catch(err => {
        logger.error('Failed to start bot:', err);
    });
});
