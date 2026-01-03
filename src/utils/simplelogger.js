class SimpleLogger {
    static getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    static info(message, ...args) {
        console.log(`[${this.getTimestamp()}] ℹ️ ${message}`, ...args);
    }

    static success(message, ...args) {
        console.log(`[${this.getTimestamp()}] ✅ ${message}`, ...args);
    }

    static warn(message, ...args) {
        console.log(`[${this.getTimestamp()}] ⚠️ ${message}`, ...args);
    }

    static error(message, ...args) {
        console.log(`[${this.getTimestamp()}] ❌ ${message}`, ...args);
    }

    static debug(message, ...args) {
        if (process.env.DEBUG === 'true') {
            console.log(`[${this.getTimestamp()}] 🐛 ${message}`, ...args);
        }
    }
}

module.exports = SimpleLogger;
