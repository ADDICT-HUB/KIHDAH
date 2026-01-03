module.exports = (sock) => {
    sock.ev.on('call', async (call) => {
        const from = call.from;
        
        // Reject all calls automatically
        try {
            await sock.rejectCall(call.id, from);
            
            // Send auto-reply
            if (!from.endsWith('@g.us')) {
                await sock.sendMessage(from, {
                    text: `📵 Calls are not allowed. Please use text messages only.\n\n*Bot:* KIH DAH\n*Owner:* GuruTech`
                });
            }
        } catch (error) {
            // Silent
        }
    });
};
