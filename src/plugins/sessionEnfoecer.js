const sessionValidator = require('../sessionValidator');
const logger = require('../utils/logger');

module.exports = (sock) => {
    // Intercept all session-related operations
    sock.ev.on('creds.update', (creds) => {
        // Ensure creds have KIHDAH:~ ID
        if (creds && !creds.sessionId) {
            creds.sessionId = `KIHDAH:~${Date.now().toString(16).toUpperCase().substring(0, 16)}`;
            logger.info(`🆔 Assigned KIHDAH:~ ID to credentials: ${creds.sessionId}`);
        }
    });
    
    // Command to verify session
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = process.env.BOT_PREFIX || '.';
        
        if (text.startsWith(`${prefix}verifysession`)) {
            const sessionId = process.env.SESSION_ID || '';
            
            if (!sessionId) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No session ID configured'
                }, { quoted: msg });
                return;
            }
            
            const isValid = sessionValidator.validateSessionId(
                sessionValidator.extractSessionId(sessionId)
            );
            
            const rules = sessionValidator.getRules();
            
            if (isValid) {
                const extracted = sessionValidator.extractSessionId(sessionId);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ *VALID KIHDAH:~ SESSION*\n\n` +
                          `🔑 *ID:* \`${extracted}\`\n` +
                          `📏 *Length:* ${extracted.length} chars\n` +
                          `✅ *Format:* Correct\n` +
                          `⚡ *Status:* Active\n\n` +
                          `*Session validation passed!*`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ *INVALID SESSION*\n\n` +
                          `*Received:* \`${sessionId.substring(0, 30)}...\`\n\n` +
                          `*Required Format:*\n` +
                          `• Prefix: ${rules.prefix}\n` +
                          `• Length: ${rules.length} chars\n` +
                          `• Format: ${rules.format}\n` +
                          `• Example: ${rules.example}\n\n` +
                          `*Get valid session from:*\n` +
                          `https://xgurupairing1-b1268276f8b5.herokuapp.com/pair`
                }, { quoted: msg });
            }
        }
        
        // Show session format help
        if (text.startsWith(`${prefix}sessionformat`)) {
            const rules = sessionValidator.getRules();
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔑 *KIHDAH:~ SESSION FORMAT*\n\n` +
                      `*Prefix:* \`${rules.prefix}\` (fixed)\n` +
                      `*Length:* ${rules.length} characters\n` +
                      `*Format:* ${rules.format}\n` +
                      `*Example:* \`${rules.example}\`\n` +
                      `*Valid chars:* ${rules.validChars}\n\n` +
                      `*For Deployment:*\n` +
                      `\`SESSION_ID="KIHDAH:~A1B2C3D4E5F67890"\`\n\n` +
                      `*Get Session:*\n` +
                      `https://xgurupairing1-b1268276f8b5.herokuapp.com/pair`
            }, { quoted: msg });
        }
    });
};
