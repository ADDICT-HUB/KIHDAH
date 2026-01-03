module.exports = (sock) => {
    let typingStates = new Map();
    let typingIntervals = new Map();
    
    // Auto-typing in response to messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const chatId = msg.key.remoteJid;
        
        // Don't type in status updates
        if (chatId === 'status@broadcast') return;
        
        // Only type in private chats or when mentioned
        if (!chatId.endsWith('@g.us') || 
            msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(sock.user.id)) {
            
            if (process.env.AUTO_TYPING !== 'false') {
                await startTyping(chatId);
                
                // Stop typing after 3 seconds
                setTimeout(() => stopTyping(chatId), 3000);
            }
        }
    });
    
    async function startTyping(chatId) {
        if (typingStates.get(chatId)) return; // Already typing
        
        try {
            await sock.sendPresenceUpdate('composing', chatId);
            typingStates.set(chatId, true);
            
            // Auto-stop after 30 seconds (safety)
            typingIntervals.set(chatId, setTimeout(() => {
                stopTyping(chatId);
            }, 30000));
            
        } catch (error) {
            // Silent
        }
    }
    
    function stopTyping(chatId) {
        if (!typingStates.get(chatId)) return;
        
        try {
            sock.sendPresenceUpdate('paused', chatId);
            typingStates.delete(chatId);
            
            const interval = typingIntervals.get(chatId);
            if (interval) {
                clearTimeout(interval);
                typingIntervals.delete(chatId);
            }
        } catch (error) {
            // Silent
        }
    }
    
    // Command to control auto-typing
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = process.env.BOT_PREFIX || '.';
        
        if (text.startsWith(`${prefix}autotyping`)) {
            const args = text.split(' ');
            
            if (args[1] === 'on') {
                process.env.AUTO_TYPING = 'true';
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '⌨️ Auto-typing ENABLED\n\nI will show typing indicator when you message me.'
                }, { quoted: msg });
            } else if (args[1] === 'off') {
                process.env.AUTO_TYPING = 'false';
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '⌨️ Auto-typing DISABLED\n\nTyping indicator will not be shown.'
                }, { quoted: msg });
            }
        }
    });
    
    // Clean up on disconnect
    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'close') {
            typingStates.clear();
            typingIntervals.forEach(interval => clearTimeout(interval));
            typingIntervals.clear();
        }
    });
};
