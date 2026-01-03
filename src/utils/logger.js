const chalk = require('chalk');

// SIMPLE logger without pino transport issues
class Logger {
    getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    info(message, ...args) {
        console.log(chalk.blue(`[${this.getTimestamp()}] ℹ️ ${message}`), ...args);
    }

    success(message, ...args) {
        console.log(chalk.green(`[${this.getTimestamp()}] ✅ ${message}`), ...args);
    }

    warn(message, ...args) {
        console.log(chalk.yellow(`[${this.getTimestamp()}] ⚠️ ${message}`), ...args);
    }

    error(message, ...args) {
        console.log(chalk.red(`[${this.getTimestamp()}] ❌ ${message}`), ...args);
    }

    debug(message, ...args) {
        if (process.env.DEBUG === 'true') {
            console.log(chalk.gray(`[${this.getTimestamp()}] 🐛 ${message}`), ...args);
        }
    }
    
    // Add child method that Baileys expects
    child(options) {
        // Return a new instance instead of static reference
        return new Logger();
    }
}

// Create instance
const loggerInstance = new Logger();

// Also export static methods for backward compatibility
module.exports = loggerInstance;
module.exports.Logger = Logger;
