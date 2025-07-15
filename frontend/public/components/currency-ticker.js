// Currency Ticker Component for FanToPark CRM - Simplified Debug Version

window.renderCurrencyTicker = () => {
  // Simple static display for testing
  return React.createElement('div', { className: 'flex items-center gap-2 text-sm text-gray-600' },
    React.createElement('span', null, '💱'),
    React.createElement('span', null, 'USD: ₹83.50'),
    React.createElement('span', null, '|'),
    React.createElement('span', null, 'EUR: ₹90.20'),
    React.createElement('span', null, '|'),
    React.createElement('span', null, 'GBP: ₹105.50')
  );
};

console.log('✅ Currency Ticker component loaded successfully');
