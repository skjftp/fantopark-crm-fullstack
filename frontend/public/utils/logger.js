// utils/logger.js
// Unified logging system for FanToPark CRM

class Logger {
  constructor() {
    this.config = {
      enabled: false, // Set to true in development
      levels: {
        debug: { enabled: false, symbol: '🔍' },
        info: { enabled: true, symbol: 'ℹ️' },
        warn: { enabled: true, symbol: '⚠️' },
        error: { enabled: true, symbol: '❌' },
        success: { enabled: true, symbol: '✅' }
      },
      suppressPatterns: [
        'component loaded successfully',
        'All app effects initialized',
        'Not showing allocation management',
        'Not showing delivery form',
        'Bulk Assign Modal',
        'ALLOCATION MANAGEMENT DEBUG',
        'DELIVERY FORM DEBUG',
        'Rendering Enhanced Recent Activity',
        'state.set',
        'Available inventory-related setters',
        'chart not found'
      ],
      performance: {
        enabled: false,
        threshold: 200 // Only log operations slower than 200ms
      }
    };
    
    this.performance = {};
    this.initialize();
  }

  initialize() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    // Override console methods
    if (!this.config.enabled) {
      this.applyFilters();
    }
  }

  applyFilters() {
    const self = this;
    
    console.log = function(...args) {
      const message = String(args[0] || '');
      
      // Check suppression patterns
      const shouldSuppress = self.config.suppressPatterns.some(pattern => 
        message.includes(pattern)
      );
      
      if (!shouldSuppress && self.config.levels.info.enabled) {
        self.originalConsole.log.apply(console, args);
      }
    };

    console.debug = function(...args) {
      if (self.config.levels.debug.enabled) {
        self.originalConsole.debug.apply(console, args);
      }
    };
  }

  // Logging methods
  debug(...args) {
    if (this.config.enabled && this.config.levels.debug.enabled) {
      this.originalConsole.log(this.config.levels.debug.symbol, ...args);
    }
  }

  info(...args) {
    if (this.config.levels.info.enabled) {
      this.originalConsole.log(this.config.levels.info.symbol, ...args);
    }
  }

  warn(...args) {
    if (this.config.levels.warn.enabled) {
      this.originalConsole.warn(this.config.levels.warn.symbol, ...args);
    }
  }

  error(...args) {
    if (this.config.levels.error.enabled) {
      this.originalConsole.error(this.config.levels.error.symbol, ...args);
    }
  }

  success(...args) {
    if (this.config.levels.success.enabled) {
      this.originalConsole.log(this.config.levels.success.symbol, ...args);
    }
  }

  // Performance tracking
  time(label) {
    if (this.config.performance.enabled) {
      this.performance[label] = performance.now();
    }
  }

  timeEnd(label) {
    if (this.config.performance.enabled && this.performance[label]) {
      const duration = performance.now() - this.performance[label];
      if (duration > this.config.performance.threshold) {
        this.warn(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      }
      delete this.performance[label];
    }
  }

  // Configuration methods
  enable() {
    this.config.enabled = true;
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;
    this.info('Logger enabled - all logs visible');
  }

  disable() {
    this.config.enabled = false;
    this.applyFilters();
    this.originalConsole.log('Logger disabled - applying filters');
  }

  setLevel(level, enabled) {
    if (this.config.levels[level]) {
      this.config.levels[level].enabled = enabled;
    }
  }

  addSuppressionPattern(pattern) {
    this.config.suppressPatterns.push(pattern);
  }

  removeSuppressionPattern(pattern) {
    const index = this.config.suppressPatterns.indexOf(pattern);
    if (index > -1) {
      this.config.suppressPatterns.splice(index, 1);
    }
  }

  // Utility method for conditional logging
  conditional(condition, ...args) {
    if (condition) {
      this.debug(...args);
    }
  }
}

// Create singleton instance
window.logger = new Logger();

// Convenience methods
window.log = {
  debug: (...args) => window.logger.debug(...args),
  info: (...args) => window.logger.info(...args),
  warn: (...args) => window.logger.warn(...args),
  error: (...args) => window.logger.error(...args),
  success: (...args) => window.logger.success(...args),
  time: (label) => window.logger.time(label),
  timeEnd: (label) => window.logger.timeEnd(label)
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}
