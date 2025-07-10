// Help Guide Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderHelpGuide = () => {
  if (!showHelpGuide) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: () => setShowHelpGuide(false)
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 'How to Use FanToPark CRM'),
        React.createElement('button', {
          onClick: () => setShowHelpGuide(false),
          className: 'text-gray-500 hover:text-gray-700'
        }, '✕')
      ),
      React.createElement('div', { className: 'space-y-4 text-gray-700 dark:text-gray-300' },
        React.createElement('h3', { className: 'font-bold text-lg' }, 'Workflow Overview:'),
        React.createElement('ol', { className: 'list-decimal list-inside space-y-2' },
          React.createElement('li', null, 'Sales Team: Create and qualify leads (Hot/Warm/Cold)'),
          React.createElement('li', null, 'Sales Team: Convert qualified leads to orders'),
          React.createElement('li', null, 'Finance Team: Approve orders (or Sales Head for Payment Post Service)'),
          React.createElement('li', null, 'Supply Team: Schedule and manage deliveries'),
          React.createElement('li', null, 'Finance Team: Generate invoices and track payments')
        ),
        React.createElement('div', { className: 'mt-4 pt-4 border-t' },
          React.createElement('p', { className: 'font-medium' }, 'Quick Tips:'),
          React.createElement('ul', { className: 'list-disc list-inside mt-2 space-y-1 text-sm' },
            React.createElement('li', null, 'Use the dark mode toggle for comfortable viewing'),
            React.createElement('li', null, 'Check "My Actions" tab for your pending tasks'),
            React.createElement('li', null, 'All actions are logged and tracked automatically')
          )
        )
      )
    )
  );
};

console.log('✅ Help Guide component loaded successfully');
