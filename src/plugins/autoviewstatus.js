module.exports = (sock) => {
    let viewedStatuses = new Set();
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        if (msg.key.remoteJid === 'status@broadcast') {
            const statusId = msg.key.id;
            
            if (!viewedStatuses.has(statusId)) {
                viewedStatuses.add(statusId);
                
                try {
                    await sock.readMessages([msg.key]);
                    
                    // Keep cache clean
                    if (viewedStatuses.size > 100) {
                        viewedStatuses = new Set([...viewedStatuses].slice(-50));
                    }
                } catch (error) {
                    // Silent
                }
            }
        }
    });
};
