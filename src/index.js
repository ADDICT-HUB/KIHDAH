require('dotenv').config();
const { startBot } = require('./botManager');
const logger = require('./utils/logger');

// Performance optimization
process.env.UV_THREADPOOL_SIZE = 128;
require('events').EventEmitter.defaultMaxListeners = 100;

// Fast startup
const startTime = Date.now();

async function main() {
    logger.info('🚀 Starting KIH DAH Bot - Optimized Version');
    logger.info('👑 Owner: GuruTech');
    logger.info('⚡ Platform: ' + (process.env.PLATFORM || 'Multi-Cloud'));
    
    try {
        await startBot();
        const startupTime = Date.now() - startTime;
        logger.success(`✅ Bot started in ${startupTime}ms`);
        
        // Performance monitor
        setInterval(() => {
            const memUsage = process.memoryUsage();
            if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
                logger.warn(`High memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            }
        }, 60000); // Check every minute
        
    } catch (error) {
        logger.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('🛑 Received SIGINT, shutting down...');
    process.exit(0);
});

// Start with high priority
setImmediate(main);
