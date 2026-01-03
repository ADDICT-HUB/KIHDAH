const fs = require('fs');
const path = require('path');

module.exports = (sock) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = process.env.BOT_PREFIX || '.';
        
        if (text.startsWith(`${prefix}menu`)) {
            const args = text.split(' ');
            const menuType = args[1] || '1';
            
            if (menuType === '2') {
                await sendFullMenu(sock
