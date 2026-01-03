const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const sessionGen = require('./sessionGenerator');

class SessionManager {
    constructor() {
        this.authDir = path.join(process.cwd(), 'auth');
        this.sessionFile = path.join(this.authDir, 'session.kihdah');
        this.sessionData = null;
    }

    // Process session ID - convert to KIHDAH:~ format
    processSessionId(input) {
        if (!input) return null;
        
        logger.info(`Processing session input: ${input.substring(0, 20)}...`);
        
        // If it's already in KIHDAH:~ format
        if (sessionGen.isValidSessionId(input)) {
            logger.success(`✅ Valid KIHDAH:~ session ID: ${input}`);
            return input;
        }
        
        // Try to parse and convert
        const parsedId = sessionGen.parseSessionId(input);
        
        if (sessionGen.isValidSessionId(parsedId)) {
            logger.info(`🔄 Converted to KIHDAH:~ format: ${parsedId}`);
            return parsedId;
        }
        
        // If it's Base64, decode and check
        if (this.isBase64(input)) {
            try {
                const decoded = Buffer.from(input, 'base64').toString('utf-8');
                const session = JSON.parse(decoded);
                
                if (session.sessionId && sessionGen.isValidSessionId(session.sessionId)) {
                    logger.success(`✅ Found KIHDAH:~ ID in Base64: ${session.sessionId}`);
                    return session.sessionId;
                }
                
                // Convert existing session to KIHDAH:~ format
                const newSessionId = sessionGen.generateSessionId(session.userId || 'unknown');
                session.sessionId = newSessionId;
                
                const newBase64 = Buffer.from(JSON.stringify(session)).toString('base64');
                logger.info(`🔄 Upgraded to KIHDAH:~ format: ${newSessionId}`);
                
                return newSessionId;
                
            } catch (error) {
                logger.warn('⚠️ Could not parse Base64, treating as raw ID');
            }
        }
        
        // Generate new KIHDAH:~ ID
        const newId = sessionGen.generateSessionId('converted');
        logger.info(`🔄 Generated new KIHDAH:~ ID: ${newId}`);
        
        return newId;
    }

    // Decode Base64 session
    decodeBase64Session(base64String) {
        try {
            let cleanBase64 = base64String;
            if (base64String.includes('base64,')) {
                cleanBase64 = base64String.split('base64,')[1];
            }
            
            const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
            const session = JSON.parse(decoded);
            
            // Ensure session has KIHDAH:~ ID
            if (!session.sessionId || !session.sessionId.startsWith('KIHDAH:~')) {
                session.sessionId = sessionGen.generateSessionId(session.userId || 'unknown');
                logger.info(`🔄 Added KIHDAH:~ ID to session: ${session.sessionId}`);
            }
            
            return session;
        } catch (error) {
            logger.error('Failed to decode Base64 session:', error.message);
            
            // Create new session with KIHDAH:~ ID
            return {
                sessionId: sessionGen.generateSessionId('error-recovery'),
                createdAt: new Date().toISOString(),
                platform: 'KIHDAH-QUANTUM',
                version: '3.0.0',
                owner: 'GuruTech',
                data: {}
            };
        }
    }

    // Encode session to Base64 with KIHDAH:~ ID
    encodeSession(sessionData) {
        try {
            // Ensure session has KIHDAH:~ ID
            if (!sessionData.sessionId || !sessionData.sessionId.startsWith('KIHDAH:~')) {
                sessionData.sessionId = sessionGen.generateSessionId(sessionData.userId || 'unknown');
            }
            
            const jsonString = JSON.stringify(sessionData);
            return Buffer.from(jsonString).toString('base64');
        } catch (error) {
            logger.error('Failed to encode session:', error);
            return null;
        }
    }

    // Save session with KIHDAH:~ ID
    saveSession(sessionData) {
        try {
            if (!fs.existsSync(this.authDir)) {
                fs.mkdirSync(this.authDir, { recursive: true });
            }
            
            // Ensure KIHDAH:~ ID
            if (!sessionData.sessionId || !sessionData.sessionId.startsWith('KIHDAH:~')) {
                sessionData.sessionId = sessionGen.generateSessionId(sessionData.userId || 'saved');
            }
            
            // Update metadata
            sessionData.updatedAt = new Date().toISOString();
            sessionData.platform = 'KIHDAH-QUANTUM';
            sessionData.version = '3.0.0';
            
            const encoded = this.encodeSession(sessionData);
            fs.writeFileSync(this.sessionFile, encoded);
            
            // Also save to sessions directory
            sessionGen.createSession(sessionData.userId || 'unknown', sessionData);
            
            logger.success(`✅ Session saved with ID: ${sessionData.sessionId}`);
            return true;
        } catch (error) {
            logger.error('Failed to save session:', error);
            return false;
        }
    }

    // Load session
    loadSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const encoded = fs.readFileSync(this.sessionFile, 'utf-8');
                return this.decodeBase64Session(encoded);
            }
            
            // Try to find any session file
            const files = fs.readdirSync(this.authDir)
                .filter(f => f.endsWith('.json') || f.endsWith('.b64'));
            
            if (files.length > 0) {
                const firstFile = path.join(this.authDir, files[0]);
                const content = fs.readFileSync(firstFile, 'utf-8');
                
                if (firstFile.endsWith('.b64')) {
                    return this.decodeBase64Session(content);
                } else {
                    return JSON.parse(content);
                }
            }
            
            return null;
        } catch (error) {
            logger.error('Failed to load session:', error);
            return null;
        }
    }

    // Get current session ID
    getCurrentSessionId() {
        const session = this.loadSession();
        return session ? session.sessionId : null;
    }

    // Validate session
    validateSession(sessionData) {
        return sessionData && 
               sessionData.sessionId &&
               sessionData.sessionId.startsWith('KIHDAH:~') &&
               sessionData.clientID &&
               sessionData.serverToken;
    }

    // Check if string is Base64
    isBase64(str) {
        if (!str || typeof str !== 'string') return false;
        
        // Remove data URL prefix
        const cleanStr = str.includes('base64,') ? str.split('base64,')[1] : str;
        
        // Check Base64 pattern
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(cleanStr)) return false;
        
        // Try to decode
        try {
            const decoded = Buffer.from(cleanStr, 'base64').toString('utf-8');
            // Check if it looks like JSON
            return decoded.startsWith('{') && decoded.endsWith('}');
        } catch {
            return false;
        }
    }
}

module.exports = new SessionManager();
