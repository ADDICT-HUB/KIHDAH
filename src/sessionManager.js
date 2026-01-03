const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

class SessionManager {
    constructor() {
        this.authDir = path.join(process.cwd(), 'auth');
        this.sessionFile = path.join(this.authDir, 'session.enc');
    }

    // Decode Base64 session
    decodeBase64Session(base64String) {
        try {
            // Remove data URL prefix if present
            let cleanBase64 = base64String;
            if (base64String.includes('base64,')) {
                cleanBase64 = base64String.split('base64,')[1];
            }
            
            const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
            return JSON.parse(decoded);
        } catch (error) {
            logger.error('Failed to decode Base64 session:', error.message);
            return null;
        }
    }

    // Encode session to Base64
    encodeSession(sessionData) {
        try {
            const jsonString = JSON.stringify(sessionData);
            return Buffer.from(jsonString).toString('base64');
        } catch (error) {
            logger.error('Failed to encode session:', error);
            return null;
        }
    }

    // Save session to file
    saveSession(sessionData) {
        try {
            if (!fs.existsSync(this.authDir)) {
                fs.mkdirSync(this.authDir, { recursive: true });
            }
            
            const encoded = this.encodeSession(sessionData);
            fs.writeFileSync(this.sessionFile, encoded);
            logger.success('Session saved to file');
            return true;
        } catch (error) {
            logger.error('Failed to save session:', error);
            return false;
        }
    }

    // Load session from file
    loadSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const encoded = fs.readFileSync(this.sessionFile, 'utf-8');
                return this.decodeBase64Session(encoded);
            }
            return null;
        } catch (error) {
            logger.error('Failed to load session:', error);
            return null;
        }
    }

    // Quick session validation
    validateSession(sessionData) {
        return sessionData && 
               typeof sessionData === 'object' &&
               sessionData.clientID &&
               sessionData.serverToken &&
               sessionData.clientToken;
    }
}

module.exports = new SessionManager();
