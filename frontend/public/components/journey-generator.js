window.JourneyGenerator = function({ order, onClose }) {
  const [loading, setLoading] = React.useState(false);
  const [journeyUrl, setJourneyUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  
  const generateJourney = async () => {
    setLoading(true);
    try {
      const response = await window.apiCall('/journeys/create', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.id,
          lead_id: order.lead_id,
          client_name: order.client_name,
          event_id: order.event_id,
          event_name: order.event_name,
          event_date: order.event_date,
          venue: order.venue || 'Wembley Stadium, London',
          
          // Add premium details
          experiences: [
            {
              title: 'Gourmet Dining',
              description: 'Michelin-star chef curated menu',
              icon: '🍽️'
            },
            {
              title: 'Luxury Transport',
              description: 'Private chauffeur service',
              icon: '🚗'
            },
            {
              title: 'VIP Access',
              description: 'Exclusive stadium tour',
              icon: '📸'
            }
          ],
          
          transport_details: {
            outbound: order.flight_details?.outbound || 'Business Class - To be confirmed',
            return: order.flight_details?.return || 'Business Class - To be confirmed'
          },
          
          accommodation_details: {
            hotel: order.hotel_name || 'The Langham, London',
            check_in: order.check_in_date,
            check_out: order.check_out_date
          }
        })
      });
      
      if (response.success) {
        setJourneyUrl(response.journey_url);
      }
    } catch (error) {
      console.error('Error generating journey:', error);
      alert('Failed to generate journey link');
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(journeyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const sendToClient = async () => {
    // Implement email/WhatsApp sending
    alert('Journey link sent to client!');
  };
  
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full'
    },
      React.createElement('h3', {
        className: 'text-xl font-semibold mb-4'
      }, 'Generate Premium Journey'),
      
      React.createElement('p', {
        className: 'text-gray-600 dark:text-gray-400 mb-4'
      }, `Create a premium journey experience for ${order.client_name}`),
      
      !journeyUrl ? (
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('button', {
            onClick: generateJourney,
            disabled: loading,
            className: 'w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50'
          }, loading ? 'Generating...' : 'Generate Journey Link'),
          
          React.createElement('button', {
            onClick: onClose,
            className: 'w-full bg-gray-200 dark:bg-gray-700 py-3 rounded-lg'
          }, 'Cancel')
        )
      ) : (
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', {
            className: 'bg-gray-100 dark:bg-gray-700 p-3 rounded-lg break-all text-sm'
          }, journeyUrl),
          
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement('button', {
              onClick: copyToClipboard,
              className: 'flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600'
            }, copied ? '✓ Copied!' : 'Copy Link'),
            
            React.createElement('button', {
              onClick: sendToClient,
              className: 'flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600'
            }, 'Send to Client')
          ),
          
          React.createElement('a', {
            href: journeyUrl,
            target: '_blank',
            className: 'block text-center bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700'
          }, 'Preview Journey'),
          
          React.createElement('button', {
            onClick: onClose,
            className: 'w-full bg-gray-200 dark:bg-gray-700 py-2 rounded-lg'
          }, 'Close')
        )
      )
    )
  );
};
