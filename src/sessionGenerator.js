// src/sessionGenerator.js
const crypto = require('crypto');

class SessionGenerator {
    constructor() {
        this.sessionPrefix = 'KIHDAH:~';
    }

    generateSessionId(userNumber) {
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        const hash = crypto.createHash('md5')
            .update(`${userNumber}${timestamp}${random}`)
            .digest('hex')
            .substring(0, 16)
            .toUpperCase();
        
        return `${this.sessionPrefix}${hash}`;
    }

    parseSessionId(input) {
        if (input && input.startsWith(this.sessionPrefix)) {
            return input;
        }
        return this.generateSessionId('unknown');
    }

    isValidSessionId(sessionId) {
        return sessionId && 
               sessionId.startsWith(this.sessionPrefix) &&
               sessionId.length === (this.sessionPrefix.length + 16);
    }
}

module.exports = new SessionGenerator();
