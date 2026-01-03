const ytdl = require('ytdl-core');
const axios = require('axios');

module.exports = (sock) => {
    const commandPrefix = process.env.BOT_PREFIX || '.';
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || !msg.message.conversation) return;
        
        const text = msg.message.conversation.toLowerCase();
        
        if (text.startsWith(`${commandPrefix}play`)) {
            const query = text.replace(`${commandPrefix}play`, '').trim();
            
            if (!query) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a song name or YouTube URL.\nExample: .play shape of you'
                }, { quoted: msg });
                return;
            }
            
            try {
                // Search YouTube
                const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                const response = await axios.get(searchUrl);
                
                // Extract first video ID (simplified)
                const videoIdMatch = response.data.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
                
                if (videoIdMatch) {
                    const videoId = videoIdMatch[1];
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    const info = await ytdl.getInfo(videoId);
                    
                    // Send video info
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `🎵 *Now Playing*\n📌 Title: ${info.videoDetails.title}\n⏱ Duration: ${info.videoDetails.lengthSeconds}s\n👁 Views: ${info.videoDetails.viewCount}\n🔗 URL: ${videoUrl}\n\n*Downloading audio...*`
                    }, { quoted: msg });
                    
                    // Get audio stream
                    const audioStream = ytdl(videoId, { filter: 'audioonly', quality: 'highestaudio' });
                    
                    // Convert to buffer
                    const chunks = [];
                    for await (const chunk of audioStream) {
                        chunks.push(chunk);
                    }
                    const audioBuffer = Buffer.concat(chunks);
                    
                    // Send audio
                    await sock.sendMessage(msg.key.remoteJid, {
                        audio: audioBuffer,
                        mimetype: 'audio/mpeg',
                        fileName: `${info.videoDetails.title}.mp3`
                    });
                    
                } else {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ No results found. Try a different search term.'
                    }, { quoted: msg });
                }
                
            } catch (error) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Error: ${error.message}`
                }, { quoted: msg });
            }
        }
    });
};
