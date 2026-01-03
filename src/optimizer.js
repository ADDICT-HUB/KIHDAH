const logger = require('./utils/logger');

class MemoryOptimizer {
    constructor() {
        this.maxMemoryMB = 300; // Your limit: 300MB
        this.checkInterval = 60000; // Check every minute
        this.cleanedUp = false;
    }

    startMonitoring() {
        logger.info(`🧠 Memory limit: ${this.maxMemoryMB}MB`);
        
        setInterval(() => {
            this.checkMemory();
        }, this.checkInterval);

        // Initial check
        setTimeout(() => this.checkMemory(), 10000);
    }

    checkMemory() {
        const memory = process.memoryUsage();
        const usedMB = memory.heapUsed / 1024 / 1024;
        const totalMB = memory.heapTotal / 1024 / 1024;
        const usagePercent = (usedMB / this.maxMemoryMB) * 100;

        if (usagePercent > 80) {
            logger.warn(`⚠️ High memory: ${usedMB.toFixed(2)}MB/${this.maxMemoryMB}MB (${usagePercent.toFixed(1)}%)`);
            this.cleanup();
        } else if (usagePercent > 60) {
            logger.info(`📊 Memory: ${usedMB.toFixed(2)}MB/${this.maxMemoryMB}MB (${usagePercent.toFixed(1)}%)`);
        }

        // Log memory stats every 5 checks
        if (Math.random() < 0.2) {
            logger.debug(`Memory: ${usedMB.toFixed(2)}MB used, ${totalMB.toFixed(2)}MB total`);
        }
    }

    cleanup() {
        if (this.cleanedUp) return;

        logger.info('🧹 Performing memory cleanup...');
        
        try {
            // Clear require cache for non-essential modules
            this.clearModuleCache();
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                logger.info('🗑️ Garbage collection forced');
            }
            
            // Clear any large arrays/maps
            this.clearLargeDataStructures();
            
            this.cleanedUp = true;
            
            setTimeout(() => {
                this.cleanedUp = false;
            }, 30000); // Allow cleanup again after 30 seconds
            
        } catch (error) {
            logger.error('Cleanup failed:', error.message);
        }
    }

    clearModuleCache() {
        const keepModules = ['fs', 'path', 'events', 'stream', 'util', 'buffer'];
        const cache = require.cache;
        
        for (const key in cache) {
            if (!keepModules.some(module => key.includes(module))) {
                delete cache[key];
            }
        }
    }

    clearLargeDataStructures() {
        // Clear global caches if they exist
        if (global.messageCache) {
            global.messageCache.clear();
        }
        
        if (global.userCache) {
            global.userCache.clear();
        }
        
        // Clear any interval timers
        const maxTimerId = setTimeout(() => {}, 0);
        for (let i = maxTimerId - 100; i < maxTimerId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
    }

    // Optimize bot for low memory
    applyOptimizations() {
        logger.info('⚡ Applying memory optimizations...');
        
        // Reduce Node.js memory limits
        process.env.NODE_OPTIONS = '--max-old-space-size=300';
        
        // Disable expensive features
        process.env.DISABLE_LOGS = 'true';
        process.env.DISABLE_STATS = 'true';
        process.env.CACHE_ENABLED = 'false';
        
        // Reduce buffer sizes
        require('buffer').INSPECT_MAX_BYTES = 50;
        
        logger.success('✅ Memory optimizations applied');
    }
}

module.exports = new MemoryOptimizer();
