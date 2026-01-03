const fs = require('fs');
const path = require('path');

module.exports = (sock) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || '';
        const prefix = process.env.BOT_PREFIX || '.';
        
        if (text.startsWith(`${prefix}vcf`)) {
            const args = text.split(' ');
            const command = args[1];
            
            if (!command || command === 'help') {
                await showVCFHelp(sock, msg);
                return;
            }
            
            if (command === 'create') {
                await createVCF(sock, msg, args.slice(2));
            } else if (command === 'list') {
                await listVCF(sock, msg);
            } else if (command === 'get') {
                await getVCF(sock, msg, args[2]);
            }
        }
    });
    
    async function showVCFHelp(sock, msg) {
        const help = `
📇 *VCF Contact Card System*
        
Create and share contact cards easily.

Commands:
• ${prefix}vcf create [name] [number] - Create contact card
• ${prefix}vcf list - List your saved contacts
• ${prefix}vcf get [name] - Get specific contact
• ${prefix}vcf help - Show this help

Example:
${prefix}vcf create GuruTech 919876543210
        `.trim();
        
        await sock.sendMessage(msg.key.remoteJid, { text: help }, { quoted: msg });
    }
    
    async function createVCF(sock, msg, args) {
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Usage: .vcf create [name] [number]\nExample: .vcf create GuruTech 919876543210'
            }, { quoted: msg });
            return;
        }
        
        const name = args[0];
        let number = args[1];
        
        // Clean number
        number = number.replace(/[^0-9]/g, '');
        if (!number.startsWith('91') && number.length === 10) {
            number = '91' + number; // Add India code if missing
        }
        
        // Create VCF content
        const vcfContent = `BEGIN:VCARD
VERSION:3.0
FN:${name}
N:;${name};;;
TEL;type=CELL;type=VOICE;waid=${number}:+${number}
END:VCARD`;
        
        // Save to file
        const vcfDir = path.join(process.cwd(), 'vcf_cards');
        if (!fs.existsSync(vcfDir)) {
            fs.mkdirSync(vcfDir, { recursive: true });
        }
        
        const filename = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.vcf`;
        const filepath = path.join(vcfDir, filename);
        fs.writeFileSync(filepath, vcfContent);
        
        // Send as contact
        await sock.sendMessage(msg.key.remoteJid, {
            contacts: {
                displayName: name,
                contacts: [{
                    vcard: vcfContent
                }]
            }
        });
        
        // Also send as file
        await sock.sendMessage(msg.key.remoteJid, {
            document: fs.readFileSync(filepath),
            fileName: `${name}.vcf`,
            mimetype: 'text/vcard'
        });
        
        logger.info(`Created VCF for ${name}: ${number}`);
    }
    
    async function listVCF(sock, msg) {
        const vcfDir = path.join(process.cwd(), 'vcf_cards');
        
        if (!fs.existsSync(vcfDir)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '📇 No contact cards saved yet.\nUse .vcf create [name] [number] to make one.'
            }, { quoted: msg });
            return;
        }
        
        const files = fs.readdirSync(vcfDir).filter(f => f.endsWith('.vcf'));
        
        if (files.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '📇 No contact cards found.'
            }, { quoted: msg });
            return;
        }
        
        const contacts = files.map(f => {
            const name = f.split('_')[0].replace(/_/g, ' ');
            return `• ${name} (${f})`;
        }).join('\n');
        
        await sock.sendMessage(msg.key.remoteJid, {
            text: `📇 *Saved Contact Cards*\n\n${contacts}\n\nUse .vcf get [name] to retrieve`
        }, { quoted: msg });
    }
    
    async function getVCF(sock, msg, name) {
        if (!name) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please specify a contact name\nExample: .vcf get GuruTech'
            }, { quoted: msg });
            return;
        }
        
        const vcfDir = path.join(process.cwd(), 'vcf_cards');
        const searchName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        const files = fs.readdirSync(vcfDir).filter(f => 
            f.startsWith(searchName) && f.endsWith('.vcf')
        );
        
        if (files.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ No contact found with name: ${name}`
            }, { quoted: msg });
            return;
        }
        
        // Get the most recent
        const latestFile = files.sort().reverse()[0];
        const filepath = path.join(vcfDir, latestFile);
        
        await sock.sendMessage(msg.key.remoteJid, {
            document: fs.readFileSync(filepath),
            fileName: `${name}.vcf`,
            mimetype: 'text/vcard'
        }, { quoted: msg });
    }
};
