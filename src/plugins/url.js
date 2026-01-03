const axios = require('axios');

module.exports = (sock) => {
    // URL shortening services
    const shorteners = {
        tinyurl: async (url) => {
            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            return response.data;
        },
        isgd: async (url) => {
            const response = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
            return response.data;
        },
        vgd: async (url) => {
            const response = await axios.get(`https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
            return response.data;
        }
    };
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = process.env.BOT_PREFIX || '.';
        
        // URL Shorten command
        if (text.startsWith(`${prefix}shorten`)) {
            const args = text.split(' ');
            if (args.length < 2) {
                await showURLHelp(sock, msg);
                return;
            }
            
            const url = args[1];
            const service = args[2] || 'tinyurl';
            
            if (!isValidUrl(url)) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid URL\nExample: .shorten https://google.com'
                }, { quoted: msg });
                return;
            }
            
            await shortenURL(sock, msg, url, service);
        }
        
        // URL Expand command
        else if (text.startsWith(`${prefix}expand`)) {
            const args = text.split(' ');
            if (args.length < 2) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Usage: .expand [short-url]\nExample: .expand https://tinyurl.com/abc123'
                }, { quoted: msg });
                return;
            }
            
            const shortUrl = args[1];
            await expandURL(sock, msg, shortUrl);
        }
        
        // Auto-detect URLs in messages
        else if (process.env.URL_AUTO_DETECT === 'true') {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = text.match(urlRegex);
            
            if (urls && urls.length > 0) {
                // Send URL info for each detected URL
                for (const url of urls.slice(0, 3)) { // Limit to 3 URLs
                    await sendURLInfo(sock, msg, url);
                }
            }
        }
    });
    
    async function showURLHelp(sock, msg) {
        const help = `
🔗 *URL Tools*
        
Shorten, expand, and analyze URLs.

Commands:
• ${prefix}shorten [url] [service] - Shorten URL
• ${prefix}expand [short-url] - Expand shortened URL
• ${prefix}url info [url] - Get URL information

Services: tinyurl, isgd, vgd

Examples:
${prefix}shorten https://google.com tinyurl
${prefix}expand https://tinyurl.com/abc123
${prefix}url info https://github.com
        `.trim();
        
        await sock.sendMessage(msg.key.remoteJid, { text: help }, { quoted: msg });
    }
    
    async function shortenURL(sock, msg, url, service) {
        try {
            if (!shorteners[service]) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Unknown service: ${service}\nAvailable: ${Object.keys(shorteners).join(', ')}`
                }, { quoted: msg });
                return;
            }
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Shortening URL...'
            }, { quoted: msg });
            
            const shortUrl = await shorteners[service](url);
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔗 *URL Shortened*\n\n🌐 Service: ${service.toUpperCase()}\n📥 Original: ${url}\n📤 Shortened: ${shortUrl}\n\n📋 Copy: \`${shortUrl}\``
            }, { quoted: msg });
            
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Failed to shorten URL: ${error.message}`
            }, { quoted: msg });
        }
    }
    
    async function expandURL(sock, msg, shortUrl) {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Expanding URL...'
            }, { quoted: msg });
            
            const response = await axios.head(shortUrl, {
                maxRedirects: 0,
                validateStatus: null
            });
            
            let expandedUrl = shortUrl;
            
            if ([301, 302, 307, 308].includes(response.status)) {
                expandedUrl = response.headers.location;
            } else {
                // Try to get final URL with follow redirects
                const finalResponse = await axios.get(shortUrl, {
                    maxRedirects: 10
                });
                expandedUrl = finalResponse.request.res.responseUrl;
            }
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔗 *URL Expanded*\n\n📥 Short: ${shortUrl}\n📤 Expanded: ${expandedUrl}\n\n⚠️ Always verify URLs before clicking!`
            }, { quoted: msg });
            
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Failed to expand URL: ${error.message}`
            }, { quoted: msg });
        }
    }
    
    async function sendURLInfo(sock, msg, url) {
        try {
            const response = await axios.head(url, {
                timeout: 5000
            });
            
            const headers = response.headers;
            const info = {
                'Status': response.status,
                'Content-Type': headers['content-type'] || 'Unknown',
                'Content-Length': headers['content-length'] ? `${Math.round(headers['content-length'] / 1024)}KB` : 'Unknown',
                'Server': headers.server || 'Unknown',
                'Security': headers['strict-transport-security'] ? 'HTTPS Enforced' : 'Standard'
            };
            
            const infoText = Object.entries(info)
                .map(([key, value]) => `• ${key}: ${value}`)
                .join('\n');
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔍 *URL Analysis*\n\n📌 URL: ${url}\n\n${infoText}\n\n⚠️ Scan completed`
            });
            
        } catch (error) {
            // Silent fail for auto-detection
        }
    }
    
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
};
