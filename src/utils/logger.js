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
}

// Add pinoLogger for compatibility (simple console)
Logger.pinoLogger = {
    info: Logger.info,
    warn: Logger.warn,
    error: Logger.error,
    debug: Logger.debug
};

module.exports = Logger;
