// frontend/public/components/journey-generator.js - Enhanced version
window.JourneyGenerator = function({ order, onClose }) {
  const [loading, setLoading] = React.useState(false);
  const [journeyUrl, setJourneyUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [step, setStep] = React.useState('select'); // select, preview, done
  const [packageType, setPackageType] = React.useState('tickets_only');
  const [selectedServices, setSelectedServices] = React.useState([]);
  
  // Available services
  const availableServices = {
    flights: { label: 'Flights', icon: '✈️' },
    accommodation: { label: 'Hotel Accommodation', icon: '🏨' },
    visa_assistance: { label: 'Visa Assistance', icon: '📄' },
    transfers: { label: 'Airport & Venue Transfers', icon: '🚗' },
    hospitality: { label: 'VIP Hospitality', icon: '🥂' },
    meals: { label: 'Meal Packages', icon: '🍽️' },
    city_tour: { label: 'City Tours', icon: '🏛️' },
    insurance: { label: 'Travel Insurance', icon: '🛡️' }
  };
  
  // Package presets
  const packagePresets = {
    tickets_only: {
      name: 'Tickets Only',
      services: []
    },
    standard_package: {
      name: 'Standard Package',
      services: ['flights', 'accommodation', 'transfers']
    },
    premium_package: {
      name: 'Premium Package',
      services: ['flights', 'accommodation', 'transfers', 'hospitality', 'visa_assistance']
    },
    custom: {
      name: 'Custom Package',
      services: []
    }
  };
  
  const handlePackageChange = (type) => {
    setPackageType(type);
    setSelectedServices(packagePresets[type].services);
  };
  
  const toggleService = (service) => {
    if (packageType !== 'custom') {
      setPackageType('custom');
    }
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };
  
  const generateJourney = async () => {
    setLoading(true);
    try {
      const journeyData = {
        order_id: order.id,
        lead_id: order.lead_id,
        client_name: order.client_name,
        event_id: order.event_id,
        event_name: order.event_name,
        event_date: order.event_date,
        venue: order.venue || 'Venue TBD',
        package_type: packageType,
        included_services: selectedServices,
        
        // Add details based on selected services
        ...(selectedServices.includes('flights') && {
          transport_details: {
            outbound: order.flight_details?.outbound || 'To be confirmed',
            return: order.flight_details?.return || 'To be confirmed'
          }
        }),
        
        ...(selectedServices.includes('accommodation') && {
          accommodation_details: {
            hotel: order.hotel_name || 'Premium Hotel (TBD)',
            check_in: order.check_in_date,
            check_out: order.check_out_date
          }
        }),
        
        ...(selectedServices.includes('hospitality') && {
          experiences: [
            {
              title: 'Gourmet Dining',
              description: 'Curated menu by renowned chefs',
              icon: '🍽️'
            },
            {
              title: 'VIP Lounge Access',
              description: 'Exclusive pre-event hospitality',
              icon: '🥂'
            },
            {
              title: 'Meet & Greet',
              description: 'Opportunity to meet sports legends',
              icon: '🤝'
            }
          ]
        })
      };
      
      const response = await window.apiCall('/journeys/create', {
        method: 'POST',
        body: JSON.stringify(journeyData)
      });
      
      if (response.success) {
        setJourneyUrl(response.journey_url);
        setStep('done');
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
    alert('Journey link can be sent via email/WhatsApp: ' + journeyUrl);
  };
  
  // Render based on step
  if (step === 'select') {
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
    },
      React.createElement('div', {
        className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto'
      },
        React.createElement('h3', {
          className: 'text-xl font-semibold mb-4'
        }, 'Create Premium Journey Experience'),
        
        React.createElement('p', {
          className: 'text-gray-600 dark:text-gray-400 mb-6'
        }, `Select package type for ${order.client_name}`),
        
        // Package type selection
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h4', { className: 'font-medium mb-3' }, 'Package Type'),
          React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
            Object.entries(packagePresets).map(([type, preset]) =>
              React.createElement('button', {
                key: type,
                onClick: () => handlePackageChange(type),
                className: `p-3 border rounded-lg text-sm ${
                  packageType === type 
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'border-gray-300 dark:border-gray-600'
                }`
              }, preset.name)
            )
          )
        ),
        
        // Services selection
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h4', { className: 'font-medium mb-3' }, 'Included Services'),
          React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
            Object.entries(availableServices).map(([service, info]) =>
              React.createElement('label', {
                key: service,
                className: 'flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
              },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: selectedServices.includes(service),
                  onChange: () => toggleService(service),
                  className: 'mr-2'
                }),
                React.createElement('span', { className: 'mr-2' }, info.icon),
                React.createElement('span', { className: 'text-sm' }, info.label)
              )
            )
          )
        ),
        
        // Preview selected services
        selectedServices.length > 0 && React.createElement('div', {
          className: 'mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg'
        },
          React.createElement('h5', { className: 'font-medium mb-2' }, 'Journey will include:'),
          React.createElement('ul', { className: 'text-sm space-y-1' },
            ['Tickets Confirmation', ...selectedServices.map(s => availableServices[s].label)].map(item =>
              React.createElement('li', { key: item }, '✓ ' + item)
            )
          )
        ),
        
        // Action buttons
        React.createElement('div', { className: 'flex gap-3' },
          React.createElement('button', {
            onClick: onClose,
            className: 'flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-lg'
          }, 'Cancel'),
          
          React.createElement('button', {
            onClick: generateJourney,
            disabled: loading,
            className: 'flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50'
          }, loading ? 'Generating...' : 'Generate Journey')
        )
      )
    );
  }
  
  // Done step - show journey URL
  if (step === 'done') {
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
    },
      React.createElement('div', {
        className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full'
      },
        React.createElement('h3', {
          className: 'text-xl font-semibold mb-4'
        }, '✨ Journey Created!'),
        
        React.createElement('div', {
          className: 'bg-gray-100 dark:bg-gray-700 p-3 rounded-lg break-all text-sm mb-4'
        }, journeyUrl),
        
        React.createElement('div', { className: 'space-y-3' },
          React.createElement('button', {
            onClick: copyToClipboard,
            className: 'w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600'
          }, copied ? '✓ Copied!' : 'Copy Link'),
          
          React.createElement('button', {
            onClick: sendToClient,
            className: 'w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600'
          }, 'Send to Client'),
          
          React.createElement('a', {
            href: journeyUrl,
            target: '_blank',
            className: 'block w-full text-center bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700'
          }, 'Preview Journey'),
          
          React.createElement('button', {
            onClick: onClose,
            className: 'w-full bg-gray-200 dark:bg-gray-700 py-2 rounded-lg'
          }, 'Close')
        )
      )
    );
  }
};
