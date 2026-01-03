const config = require('../configManager');
const logger = require('../utils/logger');

module.exports = (sock) => {
    // Auto React to Status
    if (config.get('autoReactStatus')) {
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            if (msg.key.remoteJid === 'status@broadcast') {
                const emojis = config.get('statusReactEmojis', ['💚', '🚀', '🌎', '✅']);
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                
                try {
                    await sock.sendMessage(msg.key.remoteJid, {
                        react: {
                            text: randomEmoji,
                            key: msg.key
                        }
                    });
                    logger.debug(`Reacted to status with: ${randomEmoji}`);
                } catch (error) {
                    // Silent
                }
            }
        });
    }
    
    // Auto Reply to Status View
    if (config.get('autoReplyStatus')) {
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            if (msg.key.remoteJid === 'status@broadcast') {
                const replyText = config.get('replyStatusText', 'Your status has been viewed successfully ✅');
                
                try {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: replyText
                    });
                } catch (error) {
                    // Silent
                }
            }
        });
    }
    
    // Auto Read Status
    if (config.get('autoReadStatus')) {
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            if (msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                } catch (error) {
                    // Silent
                }
            }
        });
    }
    
    // Auto Download Status
    if (config.get('autoDownloadStatus')) {
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            if (msg.key.remoteJid === 'status@broadcast') {
                try {
                    // Forward status to self
                    await sock.sendMessage(sock.user.id, {
                        forward: msg
                    });
                } catch (error) {
                    // Silent
                }
            }
        });
    }
    
    // Auto Read Messages
    if (config.get('autoRead')) {
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            try {
                await sock.readMessages([msg.key]);
            } catch (error) {
                // Silent
            }
        });
    }
    
    // Auto Reject Calls
    if (config.get('autoRejectCall')) {
        sock.ev.on('call', async (call) => {
            try {
                await sock.rejectCall(call.id, call.from);
                logger.info(`Rejected call from ${call.from}`);
                
                // Send auto message if from individual
                if (!call.from.endsWith('@g.us')) {
                    await sock.sendMessage(call.from, {
                        text: '📵 Calls are not accepted. Please send a message instead.'
                    });
                }
            } catch (error) {
                logger.error('Failed to reject call:', error.message);
            }
        });
    }
    
    // Auto Update Bio
    if (config.get('autoBio')) {
        const updateBio = async () => {
            try {
                const bios = [
                    `🤖 ${config.get('botName')} Bot by ${config.get('ownerName')}`,
                    `⚡ Powered by KIH-DAH Quantum`,
                    `👑 Created by ${config.get('ownerName')}`,
                    `🚀 Fast WhatsApp Bot`
                ];
                
                const randomBio = bios[Math.floor(Math.random() * bios.length)];
                await sock.updateProfileStatus(randomBio);
                logger.info(`Updated bio to: ${randomBio}`);
            } catch (error) {
                logger.error('Failed to update bio:', error.message);
            }
        };
        
        // Update every hour
        setInterval(updateBio, 3600000);
        updateBio(); // Initial update
    }
};
