// Mobile Floating Action Button Component
window.MobileFAB = function({ onClick, icon = '+', color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30',
    green: 'bg-green-600 hover:bg-green-700 shadow-green-600/30',
    purple: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30',
    red: 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
  };

  return React.createElement('button', {
    className: `mobile-fab ${colorClasses[color] || colorClasses.blue}`,
    onClick: onClick,
    style: {
      position: 'fixed',
      bottom: '80px', // Above bottom navigation
      right: '20px',
      width: '56px',
      height: '56px',
      borderRadius: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: '300',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 100,
      transition: 'all 0.3s ease',
      border: 'none',
      cursor: 'pointer'
    }
  }, icon);
};

console.log('✅ Mobile FAB component loaded');