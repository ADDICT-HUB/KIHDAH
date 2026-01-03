const logger = require('./utils/logger');

class SessionValidator {
    constructor() {
        this.requiredPrefix = 'KIHDAH:~';
        this.sessionLength = this.requiredPrefix.length + 16; // KIHDAH:~ + 16 chars
    }

    // Strict validation - ONLY accepts KIHDAH:~ format
    validateSessionId(sessionId) {
        if (!sessionId || typeof sessionId !== 'string') {
            logger.error('❌ Session ID is empty or not a string');
            return false;
        }

        // Check if it starts with KIHDAH:~
        if (!sessionId.startsWith(this.requiredPrefix)) {
            logger.error(`❌ Session must start with ${this.requiredPrefix}`);
            logger.error(`   Received: ${sessionId.substring(0, 30)}...`);
            return false;
        }

        // Check total length
        if (sessionId.length !== this.sessionLength) {
            logger.error(`❌ Session ID must be ${this.sessionLength} characters`);
            logger.error(`   Got ${sessionId.length} characters`);
            return false;
        }

        // Check format after prefix (16 uppercase hex chars)
        const suffix = sessionId.substring(this.requiredPrefix.length);
        const hexRegex = /^[A-F0-9]{16}$/;
        
        if (!hexRegex.test(suffix)) {
            logger.error('❌ Session suffix must be 16 uppercase hex characters (A-F, 0-9)');
            logger.error(`   Got: ${suffix}`);
            return false;
        }

        logger.success(`✅ Valid KIHDAH:~ session ID: ${sessionId}`);
        return true;
    }

    // Extract session ID from various inputs (strict mode)
    extractSessionId(input) {
        if (!input) {
            logger.error('❌ No session input provided');
            return null;
        }

        logger.info(`🔍 Processing session input: ${input.substring(0, 30)}...`);

        // Case 1: Already in KIHDAH:~ format
        if (this.validateSessionId(input)) {
            return input;
        }

        // Case 2: Base64 that contains KIHDAH:~ format
        if (this.isBase64(input)) {
            try {
                const decoded = Buffer.from(input, 'base64').toString('utf-8');
                
                // Try to find KIHDAH:~ in the decoded JSON
                const match = decoded.match(/"sessionId"\s*:\s*"KIHDAH:~[A-F0-9]{16}"/);
                if (match) {
                    // Extract the sessionId value
                    const sessionMatch = decoded.match(/"sessionId"\s*:\s*"([^"]+)"/);
                    if (sessionMatch && this.validateSessionId(sessionMatch[1])) {
                        logger.success(`✅ Extracted KIHDAH:~ ID from Base64: ${sessionMatch[1]}`);
                        return sessionMatch[1];
                    }
                }
                
                logger.error('❌ Base64 does not contain valid KIHDAH:~ session ID');
                return null;
                
            } catch (error) {
                logger.error('❌ Invalid Base64 format:', error.message);
                return null;
            }
        }

        // Case 3: Try to find KIHDAH:~ in the string
        const kihdahMatch = input.match(/KIHDAH:~[A-F0-9]{16}/);
        if (kihdahMatch && this.validateSessionId(kihdahMatch[0])) {
            logger.success(`✅ Found KIHDAH:~ ID in string: ${kihdahMatch[0]}`);
            return kihdahMatch[0];
        }

        logger.error('❌ No valid KIHDAH:~ session ID found');
        logger.error('   Expected format: KIHDAH:~ followed by 16 hex characters (A-F, 0-9)');
        logger.error('   Example: KIHDAH:~A1B2C3D4E5F67890');
        
        return null;
    }

    // Check if string is valid Base64
    isBase64(str) {
        try {
            // Remove data URL prefix if present
            const cleanStr = str.includes('base64,') ? str.split('base64,')[1] : str;
            
            // Check if it's valid base64
            return Buffer.from(cleanStr, 'base64').toString('base64') === cleanStr;
        } catch {
            return false;
        }
    }

    // Generate example session ID for error messages
    generateExample() {
        const chars = 'ABCDEF0123456789';
        let suffix = '';
        for (let i = 0; i < 16; i++) {
            suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `${this.requiredPrefix}${suffix}`;
    }

    // Get validation rules for display
    getRules() {
        return {
            prefix: this.requiredPrefix,
            length: this.sessionLength,
            format: 'KIHDAH:~[16 uppercase hex characters]',
            example: this.generateExample(),
            validChars: 'A-F, 0-9 (uppercase only)'
        };
    }
}

module.exports = new SessionValidator();
