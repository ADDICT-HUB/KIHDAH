module.exports = (sock) => {
    const blockedDomains = new Set([
        'whatsapp.com', 'whatsapp.net', 'chat.whatsapp.com',
        't.me', 'telegram.me', 'discord.gg', 'instagram.com',
        'facebook.com', 'twitter.com', 'youtube.com'
    ]);
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || '';
        
        // Check if message contains URL
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex);
        
        if (urls && msg.key.remoteJid.endsWith('@g.us')) {
            const isBlocked = urls.some(url => {
                try {
                    const domain = new URL(url).hostname.replace('www.', '');
                    return blockedDomains.has(domain);
                } catch {
                    return false;
                }
            });
            
            if (isBlocked) {
                try {
                    // Delete the message
                    await sock.sendMessage(msg.key.remoteJid, {
                        delete: msg.key
                    });
                    
                    // Warn user
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `⚠️ @${msg.key.participant.split('@')[0]}, Links are not allowed in this group!`,
                        mentions: [msg.key.participant]
                    }, { quoted: msg });
                } catch (error) {
                    // Silent
                }
            }
        }
    });
};
