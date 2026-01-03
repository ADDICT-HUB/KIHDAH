module.exports = (sock) => {
    const reactions = ['❤️', '🔥', '👍', '😄', '🎉'];
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        // Check if it's a status update
        if (msg.key.remoteJid === 'status@broadcast') {
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];
            
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    react: {
                        text: reaction,
                        key: msg.key
                    }
                });
            } catch (error) {
                // Silent fail - don't spam logs
            }
        }
    });
};
