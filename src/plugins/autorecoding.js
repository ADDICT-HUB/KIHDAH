module.exports = (sock) => {
    let recordingStates = new Map();
    
    // Auto-recording in voice chats
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const chatId = msg.key.remoteJid;
        
        // Check if message is audio or has voice note
        const isAudio = msg.message.audioMessage;
        const isVoiceNote = isAudio && msg.message.audioMessage?.ptt === true;
        
        if (isVoiceNote && process.env.AUTO_RECORDING === 'true') {
            // Show recording indicator
            try {
                await sock.sendPresenceUpdate('recording', chatId);
                recordingStates.set(chatId, true);
                
                // Stop recording after 5 seconds
                setTimeout(() => {
                    stopRecording(chatId);
                }, 5000);
                
            } catch (error) {
                // Silent
            }
        }
    });
    
    async function stopRecording(chatId) {
        if (!recordingStates.get(chatId)) return;
        
        try {
            await sock.sendPresenceUpdate('paused', chatId);
            recordingStates.delete(chatId);
        } catch (error) {
            // Silent
        }
    }
    
    // Command to control auto-recording
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = process.env.BOT_PREFIX || '.';
        
        if (text.startsWith(`${prefix}autorecording`)) {
            const args = text.split(' ');
            
            if (args[1] === 'on') {
                process.env.AUTO_RECORDING = 'true';
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎙️ Auto-recording ENABLED\n\nI will show recording indicator for voice notes.'
                }, { quoted: msg });
            } else if (args[1] === 'off') {
                process.env.AUTO_RECORDING = 'false';
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎙️ Auto-recording DISABLED\n\nRecording indicator will not be shown.'
                }, { quoted: msg });
            }
        }
    });
    
    // Clean up
    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'close') {
            recordingStates.clear();
        }
    });
};
