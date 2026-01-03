const fs = require('fs');
const path = require('path');

module.exports = (sock) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = process.env.BOT_PREFIX || '.';
        
        if (text.startsWith(`${prefix}menu`)) {
            const args = text.split(' ');
            const menuType = args[1] || '1';
            
            if (menuType === '2') {
                await sendFullMenu(sock, msg);
            } else if (menuType === '3') {
                await sendOwnerMenu(sock, msg);
            } else {
                await sendQuickMenu(sock, msg);
            }
        }
    });
    
    async function sendQuickMenu(sock, msg) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const menu = `
┏━━「 *KIH DAH BOT* 」━
┃ ⚡ *QUICK MENU*
┃ 👑 Owner: ${process.env.OWNER_NAME || 'GuruTech'}
┃ 🔧 Prefix: ${process.env.BOT_PREFIX || '.'}
┃ 🕒 Uptime: ${hours}h ${minutes}m ${seconds}s
┠────────────────────
┃ 📱 *Core Commands*
┃ • ${prefix}menu 1 - This menu
┃ • ${prefix}menu 2 - Full menu
┃ • ${prefix}ping - Check speed
┃ • ${prefix}owner - Contact owner
┃ 
┃ 🎵 *Media*
┃ • ${prefix}play [song] - Play music
┃ • ${prefix}ytdl [url] - YouTube DL
┃ • ${prefix}sticker - Make sticker
┃ • ${prefix}toimg - To image
┃ 
┃ 🛠 *Tools*
┃ • ${prefix}vcf - Contact cards
┃ • ${prefix}shorten - URL shortener
┃ • ${prefix}ai [ask] - AI chat
┃ • ${prefix}tts [text] - Text to speech
┃ 
┃ ⚙️ *Group*
┃ • ${prefix}antilink [on/off]
┃ • ${prefix}anticall [on/off]
┃ • ${prefix}antibug [on/off]
┃ • ${prefix}welcome [on/off]
┃ 
┃ 💎 *Owner*
┃ • ${prefix}menu 3 - Owner menu
┃ • ${prefix}eval [code]
┃ • ${prefix}bc [message]
┗━━━━━━━━━━━━━━━━━━━━
⚡ *Type ${prefix}menu 2 for 50+ commands*
        `.trim();
        
        await sock.sendMessage(msg.key.remoteJid, { text: menu });
    }
    
    async function sendFullMenu(sock, msg) {
        // Load all available commands
        const commandDir = path.join(__dirname, '..');
        const plugins = fs.readdirSync(__dirname)
            .filter(f => f.endsWith('.js'))
            .map(f => f.replace('.js', ''));
        
        const pluginCommands = plugins.map(p => `• ${prefix}${p}`).join('\n');
        
        const menu = `
╔══════════════════════════════
║  🤖 *KIH DAH BOT v3.0*
║  👑 Owner: ${process.env.OWNER_NAME || 'GuruTech'}
║  ⚡ Platform: ${process.env.PLATFORM || 'Multi-Cloud'}
║  🔧 Prefix: ${prefix}
╠══════════════════════════════
║  📋 *AVAILABLE PLUGINS (${plugins.length})*
║  
${pluginCommands}
║  
╠══════════════════════════════
║  🎵 *MEDIA COMMANDS*
║  • ${prefix}play [query] - Play audio
║  • ${prefix}ytmp3 [url] - YouTube MP3
║  • ${prefix}ytmp4 [url] - YouTube MP4
║  • ${prefix}igdl [url] - Instagram DL
║  • ${prefix}fbdl [url] - Facebook DL
║  • ${prefix}tiktok [url] - TikTok DL
║  • ${prefix}spotify [url] - Spotify DL
║  
║  🖼 *IMAGE TOOLS*
║  • ${prefix}sticker - Image to sticker
║  • ${prefix}toimg - Sticker to image
║  • ${prefix}attp [text] - Animated text
║  • ${prefix}ttp [text] - Text to image
║  • ${prefix}emojimix [emoji1+emoji2]
║  
║  🔧 *UTILITIES*
║  • ${prefix}shorten [url] - Shorten URL
║  • ${prefix}expand [url] - Expand URL
║  • ${prefix}vcf [name] [num] - Make contact
║  • ${prefix}weather [city] - Weather info
║  • ${prefix}quote - Random quote
║  • ${prefix}joke - Random joke
║  • ${prefix}fact - Random fact
║  • ${prefix}news - Latest news
║  
║  🤖 *AI & CHAT*
║  • ${prefix}ai [question] - ChatGPT
║  • ${prefix}gpt4 [question] - GPT-4
║  • ${prefix}bard [question] - Google Bard
║  • ${prefix}tts [text] - Text to speech
║  • ${prefix}stt - Speech to text
║  
║  👥 *GROUP MANAGEMENT*
║  • ${prefix}antilink [on/off]
║  • ${prefix}anticall [on/off]
║  • ${prefix}antibug [on/off]
║  • ${prefix}antispam [on/off]
║  • ${prefix}welcome [on/off]
║  • ${prefix}goodbye [on/off]
║  • ${prefix}promote [@user]
║  • ${prefix}demote [@user]
║  • ${prefix}kick [@user]
║  • ${prefix}add [number]
║  • ${prefix}del [@user]
║  
║  ⚙️ *BOT SETTINGS*
║  • ${prefix}autoreact [on/off]
║  • ${prefix}autoview [on/off]
║  • ${prefix}autotype [on/off]
║  • ${prefix}autorecord [on/off]
║  • ${prefix}status - Bot status
║  • ${prefix}restart - Restart bot
║  • ${prefix}logout - Logout session
║  
║  💎 *OWNER ONLY*
║  • ${prefix}eval [code]
║  • ${prefix}exec [cmd]
║  • ${prefix}bc [msg] - Broadcast
║  • ${prefix}bcast [msg] - Broadcast all
║  • ${prefix}ban [@user]
║  • ${prefix}unban [@user]
║  • ${prefix}block [number]
║  • ${prefix}unblock [number]
║  
╠══════════════════════════════
║  📊 *STATUS*
║  • Plugins: ${plugins.length} loaded
║  • Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
║  • Uptime: ${formatUptime(process.uptime())}
║  • Platform: ${process.env.PLATFORM || 'Unknown'}
║  
╚══════════════════════════════
*Need help? Contact ${process.env.OWNER_NAME || 'GuruTech'}*
        `.trim();
        
        await sock.sendMessage(msg.key.remoteJid, { text: menu });
    }
    
    async function sendOwnerMenu(sock, msg) {
        // Check if sender is owner
        const sender = msg.key.remoteJid;
        const ownerNumber = process.env.OWNER_NUMBER;
        
        if (!ownerNumber || !sender.includes(ownerNumber.replace('+', ''))) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Owner menu is restricted to bot owner only.'
            }, { quoted: msg });
            return;
        }
        
        const menu = `
🔐 *OWNER MENU - KIH DAH BOT*

⚙️ *System Commands*
• ${prefix}eval [code] - Execute JavaScript
• ${prefix}exec [cmd] - Execute shell command
• ${prefix}bash [cmd] - Execute bash
• ${prefix}term [cmd] - Terminal access

📊 *Bot Management*
• ${prefix}restart - Restart bot
• ${prefix}shutdown - Shutdown bot
• ${prefix}update - Update bot
• ${prefix}backup - Backup data
• ${prefix}clearlog - Clear logs
• ${prefix}clearauth - Clear auth
• ${prefix}logout - Logout session

📡 *Broadcast*
• ${prefix}bc [msg] - Broadcast to all
• ${prefix}bcast [msg] - Broadcast all chats
• ${prefix}bimg [caption] - Broadcast image
• ${prefix}bvideo [caption] - Broadcast video
• ${prefix}baudio [caption] - Broadcast audio

👤 *User Management*
• ${prefix}ban [@user] - Ban user
• ${prefix}unban [@user] - Unban user
• ${prefix}block [number] - Block number
• ${prefix}unblock [number] - Unblock
• ${prefix}listban - List banned
• ${prefix}listblock - List blocked

📁 *File Operations*
• ${prefix}getfile [name] - Get file
• ${prefix}listfiles - List files
• ${prefix}delfile [name] - Delete file
• ${prefix}upload [url] - Upload file

🔧 *Advanced*
• ${prefix}setenv [key] [value] - Set env
• ${prefix}getenv [key] - Get env
• ${prefix}listen [jid] - Listen to chat
• ${prefix}ignore [jid] - Ignore chat
• ${prefix}leave [jid] - Leave group
• ${prefix}join [link] - Join group

📈 *Statistics*
• ${prefix}stats - Bot statistics
• ${prefix}users - User count
• ${prefix}groups - Group count
• ${prefix}chats - Chat count
• ${prefix}commands - Command usage

⚠️ *Danger Zone*
• ${prefix}reset - Factory reset
• ${prefix}cleardb - Clear database
• ${prefix}clearcache - Clear cache
• ${prefix}forceupdate - Force update

*Use with caution! Some commands are irreversible.*
        `.trim();
        
        await sock.sendMessage(msg.key.remoteJid, { text: menu });
    }
    
    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
        if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    }
};
