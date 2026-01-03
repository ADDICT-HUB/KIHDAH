const chalk = require('chalk');
const pino = require('pino');

const pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

class Logger {
    static info(message, ...args) {
        const formatted = `[${new Date().toLocaleTimeString()}] ${message}`;
        console.log(chalk.blue(`[KIH-DAH] ${formatted}`), ...args);
        pinoLogger.info(message, ...args);
    }

    static success(message, ...args) {
        const formatted = `[${new Date().toLocaleTimeString()}] ${message}`;
        console.log(chalk.green(`[KIH-DAH] ${formatted}`), ...args);
        pinoLogger.info(message, ...args);
    }

    static warn(message, ...args) {
        const formatted = `[${new Date().toLocaleTimeString()}] ${message}`;
        console.log(chalk.yellow(`[KIH-DAH] ${formatted}`), ...args);
        pinoLogger.warn(message, ...args);
    }

    static error(message, ...args) {
        const formatted = `[${new Date().toLocaleTimeString()}] ${message}`;
        console.log(chalk.red(`[KIH-DAH] ${formatted}`), ...args);
        pinoLogger.error(message, ...args);
    }

    static debug(message, ...args) {
        if (process.env.DEBUG === 'true') {
            const formatted = `[${new Date().toLocaleTimeString()}] ${message}`;
            console.log(chalk.gray(`[KIH-DAH] ${formatted}`), ...args);
            pinoLogger.debug(message, ...args);
        }
    }
}

module.exports = Logger;
module.exports.pinoLogger = pinoLogger;
