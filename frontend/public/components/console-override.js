// Safe Console Log Filter
// This script reduces console noise without affecting functionality

(function() {
  'use strict';
  
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Store original console.log
  const originalLog = console.log;
  
  // Patterns to suppress (emoji-heavy debug messages)
  const suppressPatterns = [
    '✅', '🔍', '📊', '🔄', '🎯', '🚀', '❌', '🎉',
    'component loaded successfully',
    'All app effects initialized',
    'Not showing allocation management',
    'Not showing delivery form',
    'Bulk Assign Modal',
    'ALLOCATION MANAGEMENT DEBUG',
    'DELIVERY FORM DEBUG',
    'Rendering Enhanced Recent Activity'
  ];
  
  // Override console.log
  console.log = function(...args) {
    const message = String(args[0] || '');
    
    // Check if message contains any suppress patterns
    const shouldSuppress = suppressPatterns.some(pattern => 
      message.includes(pattern)
    );
    
    // If not suppressed, call original console.log
    if (!shouldSuppress) {
      originalLog.apply(console, args);
    }
  };
  
  // Add debug toggle function
  window.toggleDebugLogs = function(enabled = true) {
    if (enabled) {
      console.log = originalLog;
      console.log('🔧 Debug logs enabled');
    } else {
      // Re-apply the override
      console.log = function(...args) {
        const message = String(args[0] || '');
        const shouldSuppress = suppressPatterns.some(pattern => 
          message.includes(pattern)
        );
        if (!shouldSuppress) {
          originalLog.apply(console, args);
        }
      };
      originalLog('🔇 Debug logs filtered');
    }
  };
  
  console.log('🔇 Console noise filter activated');
})();
