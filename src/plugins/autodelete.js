module.exports = (sock) => {
    const deletedMessages = new Map();
    
    // Listen for message deletions
    sock.ev.on('messages.delete', async (item) => {
        try {
            const { keys } = item;
            
            keys.forEach(async (key) => {
                const messageId = key.id;
                const chatId = key.remoteJid;
                
                // Store deletion info
                deletedMessages.set(messageId, {
                    chatId,
                    timestamp: Date.now(),
                    deleter: key.participant || 'unknown'
                });
                
                // Notify in chat if enabled
                if (process.env.ANTI_DELETE_STATUS === 'true') {
                    const deleter = key.participant ? 
                        `@${key.participant.split('@')[0]}` : 
                        'Someone';
                    
                    const warning = `⚠️ *Message Deleted*\n\n👤 Deleter: ${deleter}\n💬 A message was deleted here\n\n*Anti-Delete is active*`;
                    
                    await sock.sendMessage(chatId, {
                        text: warning,
                        mentions: key.participant ? [key.participant] : []
                    });
                }
            });
            
            // Clean old entries
            const now = Date.now();
            for (const [msgId, data] of deletedMessages.entries()) {
                if (now - data.timestamp > 3600000) { // 1 hour
                    deletedMessages.delete(msgId);
                }
            }
            
        } catch (error) {
            // Silent
        }
    });
    
    // Command to check deleted messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = process.env.BOT_PREFIX || '.';
        
        if (text.startsWith(`${prefix}antidelete`)) {
            const args = text.split(' ');
            
            if (args[1] === 'on') {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '✅ Anti-Delete enabled\n\nI will notify when messages are deleted.'
                }, { quoted: msg });
            } else if (args[1] === 'off') {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Anti-Delete disabled\n\nMessage deletions will not be tracked.'
                }, { quoted: msg });
            } else if (args[1] === 'list') {
                const deletedList = Array.from(deletedMessages.entries())
                    .slice(-10)
                    .map(([msgId, data]) => 
                        `• Message ID: ${msgId.substring(0, 8)}...\n  Chat: ${data.chatId}\n  By: ${data.deleter}\n  Time: ${new Date(data.timestamp).toLocaleTimeString()}\n`
                    )
                    .join('\n');
                
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `📋 *Last 10 Deleted Messages*\n\n${deletedList || 'No deletions tracked'}`
                }, { quoted: msg });
            }
        }
    });
};
