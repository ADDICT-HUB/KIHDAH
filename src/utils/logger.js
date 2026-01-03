const chalk = require('chalk');

// SIMPLE logger without pino transport issues
class Logger {
    static getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    static info(message, ...args) {
        console.log(chalk.blue(`[${this.getTimestamp()}] ℹ️ ${message}`), ...args);
    }

    static success(message, ...args) {
        console.log(chalk.green(`[${this.getTimestamp()}] ✅ ${message}`), ...args);
    }

    static warn(message, ...args) {
        console.log(chalk.yellow(`[${this.getTimestamp()}] ⚠️ ${message}`), ...args);
    }

    static error(message, ...args) {
        console.log(chalk.red(`[${this.getTimestamp()}] ❌ ${message}`), ...args);
    }

    static debug(message, ...args) {
        if (process.env.DEBUG === 'true') {
            console.log(chalk.gray(`[${this.getTimestamp()}] 🐛 ${message}`), ...args);
        }
    }
    
    // Add child method that Baileys expects
    static child(options) {
        return {
            info: (...args) => Logger.info(...args),
            warn: (...args) => Logger.warn(...args),
            error: (...args) => Logger.error(...args),
            debug: (...args) => Logger.debug(...args),
            trace: (...args) => Logger.debug(...args), // Alias for debug
            fatal: (...args) => Logger.error(...args), // Alias for error
            child: (childOptions) => Logger.child(childOptions) // Recursive child
        };
    }
}

// Add pinoLogger for compatibility (simple console)
Logger.pinoLogger = {
    info: Logger.info,
    warn: Logger.warn,
    error: Logger.error,
    debug: Logger.debug,
    trace: Logger.debug,
    fatal: Logger.error,
    child: (options) => Logger.child(options)
};

module.exports = Logger;
