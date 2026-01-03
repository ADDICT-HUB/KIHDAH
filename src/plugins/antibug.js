module.exports = (sock) => {
    const suspiciousPatterns = [
        /eval\(/i,
        /Function\(/i,
        /process\./i,
        /require\(/i,
        /fs\./i,
        /child_process/i,
        /spawn\(/i,
        /exec\(/i
    ];
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || '';
        
        // Check for malicious code
        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(text));
        
        if (isSuspicious) {
            try {
                // Delete message
                await sock.sendMessage(msg.key.remoteJid, {
                    delete: msg.key
                });
                
                // Warn admin
                if (process.env.OWNER_NUMBER) {
                    await sock.sendMessage(process.env.OWNER_NUMBER + '@s.whatsapp.net', {
                        text: `⚠️ *SECURITY ALERT*\n\nPotential bug/exploit detected from: ${msg.key.participant || msg.key.remoteJid}\n\nMessage: ${text.substring(0, 100)}...`
                    });
                }
                
                // Kick user if in group
                if (msg.key.remoteJid.endsWith('@g.us')) {
                    await sock.groupParticipantsUpdate(
                        msg.key.remoteJid,
                        [msg.key.participant],
                        'remove'
                    );
                }
                
            } catch (error) {
                // Silent
            }
        }
    });
};
