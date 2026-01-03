const config = require('../configManager');

module.exports = (sock) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = config.get('prefix', '.');
        
        if (text === `${prefix}menu`) {
            const userName = msg.pushName || 'User';
            const date = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString();
            const stats = `Active | ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`;
            
            const menu = config.generateMenu(userName, date, time, stats);
            
            // Send menu with bot image if available
            const botUrl = config.get('botUrl');
            
            if (botUrl && (botUrl.endsWith('.jpg') || botUrl.endsWith('.png') || botUrl.endsWith('.jpeg'))) {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: botUrl },
                    caption: menu
                }, { quoted: msg });
            } else if (botUrl && botUrl.endsWith('.mp4')) {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: botUrl },
                    caption: menu
                }, { quoted: msg });
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: menu
                }, { quoted: msg });
            }
        }
    });
};
