const logger = require('./utils/logger');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.prefix = process.env.BOT_PREFIX || '.';
        this.initCommands();
    }

    initCommands() {
        // Core commands
        this.commands.set('menu', this.handleMenu.bind(this));
        this.commands.set('help', this.handleHelp.bind(this));
        this.commands.set('ping', this.handlePing.bind(this));
        this.commands.set('owner', this.handleOwner.bind(this));
        this.commands.set('speed', this.handleSpeed.bind(this));
        
        // Feature commands
        this.commands.set('sticker', this.handleSticker.bind(this));
        this.commands.set('quote', this.handleQuote.bind(this));
        this.commands.set('ai', this.handleAI.bind(this));
        this.commands.set('tts', this.handleTTS.bind(this));
        
        logger.info(`Loaded ${this.commands.size} commands`);
    }

    async handle(sock, msg, command, args) {
        const handler = this.commands.get(command);
        if (handler) {
            try {
                await handler(sock, msg, args);
            } catch (error) {
                logger.error(`Command ${command} error:`, error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Command error: ${error.message}`
                }, { quoted: msg });
            }
        }
    }

    // Menu System - 2 Types
    async handleMenu(sock, msg, args) {
        const menuType = args[0] || '1';
        
        if (menuType === '2') {
            // Type 2 Menu
            const menu = `
╔═══════════════════════
║  🤖 *KIH DAH BOT v3.0*
║  👑 Owner: *GuruTech*
║  ⚡ Prefix: ${this.prefix}
╠═══════════════════════
║  📌 *CORE COMMANDS*
║  • ${this.prefix}ping - Bot speed
║  • ${this.prefix}owner - Contact owner
║  • ${this.prefix}menu 1 - Show menu 1
║  • ${this.prefix}menu 2 - Show menu 2
║  
║  🎵 *MEDIA COMMANDS*
║  • ${this.prefix}play - Play music
║  • ${this.prefix}ytdl - Download video
║  • ${this.prefix}igdl - Instagram DL
║  • ${this.prefix}fbdl - Facebook DL
║  
║  🛠 *UTILITY COMMANDS*
║  • ${this.prefix}sticker - Make sticker
║  • ${this.prefix}toimg - Sticker to image
║  • ${this.prefix}quote - Random quote
║  • ${this.prefix}tts - Text to speech
║  
║  🔧 *GROUP COMMANDS*
║  • ${this.prefix}antilink [on/off]
║  • ${this.prefix}anticall [on/off]
║  • ${this.prefix}welcome [on/off]
║  • ${this.prefix}promote [@user]
║  
║  ⚙️ *OWNER COMMANDS*
║  • ${this.prefix}eval [code]
║  • ${this.prefix}exec [command]
║  • ${this.prefix}bc [message]
║  • ${this.prefix}logout
║  
╚═══════════════════════
            `.trim();
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: menu,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true
                }
            });
        } else {
            // Type 1 Menu (Compact)
            const menu = `
┏━━「 *KIH DAH MENU* 」━━
┃ ⚡ Bot Speed: Active
┃ 👑 Owner: GuruTech
┃ 🔧 Prefix: ${this.prefix}
┠────────────────────
┃ 📱 *Main Commands*
┃ • ${this.prefix}play [song]
┃ • ${this.prefix}ytdl [url]
┃ • ${this.prefix}sticker
┃ • ${this.prefix}toimg
┃ • ${this.prefix}ai [ask]
┃ • ${this.prefix}tts [text]
┃ • ${this.prefix}quote
┃ • ${this.prefix}ping
┠────────────────────
┃ ⚙️ *Group Settings*
┃ • ${this.prefix}antilink
┃ • ${this.prefix}anticall
┃ • ${this.prefix}antibug
┃ • ${this.prefix}welcome
┠────────────────────
┃ 💎 *Owner Only*
┃ • ${this.prefix}eval
┃ • ${this.prefix}bc
┃ • ${this.prefix}logout
┗━━━━━━━━━━━━━━━━━━━━
*Type ${this.prefix}menu 2 for full list*
            `.trim();
            
            await sock.sendMessage(msg.key.remoteJid, { text: menu });
        }
    }

    async handlePing(sock, msg) {
        const start = Date.now();
        const sent = await sock.sendMessage(msg.key.remoteJid, { text: '🏓 Pinging...' });
        const latency = Date.now() - start;
        
        await sock.sendMessage(msg.key.remoteJid, {
            text: `⚡ *PONG!*\n\n🕒 Latency: ${latency}ms\n💻 Runtime: ${process.uptime().toFixed(2)}s\n📊 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
            edit: sent.key
        });
    }

    async handleOwner(sock, msg) {
        const owner = process.env.OWNER_NUMBER || '919876543210';
        await sock.sendMessage(msg.key.remoteJid, {
            text: `👑 *OWNER INFORMATION*\n\n• Name: GuruTech\n• WhatsApp: +${owner}\n• Bot: KIH DAH v3.0\n• Platform: Multi-Cloud\n\n📞 Contact for bot issues or collaboration.`,
            contacts: {
                displayName: 'GuruTech',
                contacts: [{
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:GuruTech\nTEL;type=CELL;type=VOICE;waid=${owner}:+${owner}\nEND:VCARD`
                }]
            }
        });
    }

    async handleSpeed(sock, msg) {
        const start = performance.now();
        
        // Test processing speed
        let operations = 0;
        for (let i = 0; i < 1000000; i++) {
            operations++;
        }
        
        const end = performance.now();
        const speed = (end - start).toFixed(2);
        
        await sock.sendMessage(msg.key.remoteJid, {
            text: `⚡ *SPEED TEST*\n\nProcessing: 1M ops in ${speed}ms\nAvg: ${(1000000 / (end - start)).toFixed(0)} ops/ms\nStatus: ${speed < 10 ? '🚀 Excellent' : speed < 50 ? '✅ Good' : '⚠️ Slow'}`
        });
    }

    async handleSticker(sock, msg) {
        if (msg.message.imageMessage) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🔄 Creating sticker...'
            }, { quoted: msg });
            
            // Sticker creation logic here
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: { url: msg.message.imageMessage.url }
            });
        } else {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please send an image with caption .sticker'
            }, { quoted: msg });
        }
    }

    async handleQuote(sock, msg) {
        const quotes = [
            "⚡ Speed is the name of the game. - KIH DAH Bot",
            "👑 Created by GuruTech with lightning speed.",
            "🤖 Automate everything, but with caution.",
            "💻 Code today, deploy tomorrow, scale forever.",
            "🚀 Fast, secure, reliable - that's KIH DAH!"
        ];
        
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        await sock.sendMessage(msg.key.remoteJid, { text: `💬 *Quote of the day*\n\n"${randomQuote}"` });
    }

    async handleAI(sock, msg, args) {
        const question = args.join(' ');
        if (!question) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide a question.\nExample: .ai What is AI?'
            }, { quoted: msg });
            return;
        }
        
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🤖 *AI Response*\n\nQuestion: ${question}\n\nAnswer: This is a simulated response. Connect to OpenAI API for real AI responses.\n\nAdd OPENAI_API_KEY to .env file.`
        }, { quoted: msg });
    }

    async handleTTS(sock, msg, args) {
        const text = args.join(' ');
        if (!text) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide text.\nExample: .tts Hello World'
            }, { quoted: msg });
            return;
        }
        
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🔊 *Text to Speech*\n\nText: ${text}\n\nAudio feature requires TTS API integration.`
        }, { quoted: msg });
    }
}

module.exports = new CommandHandler();
