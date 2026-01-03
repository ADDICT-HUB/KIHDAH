const config = require('../configManager');
const logger = require('../utils/logger');

module.exports = (sock) => {
    const deletedMessages = new Map();
    
    sock.ev.on('messages.delete', async (item) => {
        const { keys } = item;
        
        keys.forEach(async (key) => {
            const messageId = key.id;
            const chatId = key.remoteJid;
            const deleter = key.participant;
            
            // Store deleted message info
            deletedMessages.set(messageId, {
                chatId,
                deleter,
                timestamp: Date.now()
            });
            
            // Send to inbox if enabled
            if (config.get('antiDeleteSentInbox') && deleter) {
                try {
                    const deleterName = deleter.split('@')[0];
                    const message = `⚠️ *Message Deleted*\n\n` +
                                   `👤 Deleted by: @${deleterName}\n` +
                                   `💬 Chat: ${chatId}\n` +
                                   `⏰ Time: ${new Date().toLocaleTimeString()}`;
                    
                    await sock.sendMessage(sock.user.id, {
                        text: message,
                        mentions: [deleter]
                    });
                } catch (error) {
                    logger.error('Failed to send anti-delete to inbox:', error.message);
                }
            }
            
            // Recover in conversation if enabled
            if (config.get('antiDeleteRecoverConvention') && deleter && chatId.endsWith('@g.us')) {
                try {
                    const deleterName = deleter.split('@')[0];
                    const warning = `⚠️ @${deleterName} deleted a message in this group!`;
                    
                    await sock.sendMessage(chatId, {
                        text: warning,
                        mentions: [deleter]
                    });
                } catch (error) {
                    logger.error('Failed to recover deleted message:', error.message);
                }
            }
        });
        
        // Clean old entries
        const now = Date.now();
        for (const [msgId, data] of deletedMessages.entries()) {
            if (now - data.timestamp > 86400000) { // 24 hours
                deletedMessages.delete(msgId);
            }
        }
    });
    
    // Command to check deleted messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = config.get('prefix', '.');
        
        if (text.startsWith(`${prefix}antidelete`)) {
            const args = text.split(' ');
            
            if (args[1] === 'list') {
                const deletedList = Array.from(deletedMessages.entries())
                    .slice(-5)
                    .map(([msgId, data]) => 
                        `• ID: ${msgId.substring(0, 8)}...\n  By: ${data.deleter || 'Unknown'}\n  Time: ${new Date(data.timestamp).toLocaleTimeString()}`
                    )
                    .join('\n\n');
                
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `📋 *Last 5 Deleted Messages*\n\n${deletedList || 'No deletions tracked'}`
                }, { quoted: msg });
            }
        }
    });
};
