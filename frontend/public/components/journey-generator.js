// frontend/public/components/journey-generator.js - Sports-Enhanced Version
window.JourneyGenerator = function({ order, onClose }) {
  const [loading, setLoading] = React.useState(false);
  const [journeyUrl, setJourneyUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [step, setStep] = React.useState('details'); // details, packages, preview, done
  const [packageType, setPackageType] = React.useState('tickets_only');
  const [selectedServices, setSelectedServices] = React.useState([]);
  
  // Sports-specific state
  const [sportType, setSportType] = React.useState('cricket');
  const [eventFormat, setEventFormat] = React.useState('match');
  const [isLocalEvent, setIsLocalEvent] = React.useState(false);
  const [matchFormat, setMatchFormat] = React.useState('');
  const [teams, setTeams] = React.useState({ home: '', away: '' });
  
  // Available sports
  const sports = {
    cricket: { name: 'Cricket', icon: '🏏', formats: ['T20', 'ODI', 'Test', 'Other'] },
    football: { name: 'Football', icon: '⚽', formats: ['League', 'Cup', 'International'] },
    tennis: { name: 'Tennis', icon: '🎾', formats: ['Grand Slam', 'ATP/WTA', 'Exhibition'] },
    f1: { name: 'Formula 1', icon: '🏎️', formats: ['Race Weekend', 'Qualifying', 'Practice'] },
    basketball: { name: 'Basketball', icon: '🏀', formats: ['Regular Season', 'Playoffs', 'Finals'] },
    rugby: { name: 'Rugby', icon: '🏉', formats: ['International', 'League', 'Tournament'] }
  };
  
  // Available services (modified based on local/travel)
  const getAvailableServices = () => {
    const baseServices = {
      hospitality: { label: 'VIP Hospitality', icon: '🥂' },
      meals: { label: 'Meal Packages', icon: '🍽️' },
      parking: { label: 'Premium Parking', icon: '🚗' },
      merchandise: { label: 'Official Merchandise', icon: '👕' }
    };
    
    if (!isLocalEvent) {
      return {
        flights: { label: 'Flights', icon: '✈️' },
        accommodation: { label: 'Hotel Accommodation', icon: '🏨' },
        visa_assistance: { label: 'Visa Assistance', icon: '📄' },
        transfers: { label: 'Airport & Venue Transfers', icon: '🚗' },
        ...baseServices,
        city_tour: { label: 'City Tours', icon: '🏛️' },
        insurance: { label: 'Travel Insurance', icon: '🛡️' }
      };
    }
    
    return baseServices;
  };
  
  // Package presets (dynamic based on local/travel)
  const getPackagePresets = () => {
    if (isLocalEvent) {
      return {
        tickets_only: {
          name: 'Match Tickets Only',
          services: []
        },
        hospitality: {
          name: 'Hospitality Package',
          services: ['hospitality', 'meals', 'parking']
        },
        premium_local: {
          name: 'Premium Experience',
          services: ['hospitality', 'meals', 'parking', 'merchandise']
        },
        custom: {
          name: 'Custom Package',
          services: []
        }
      };
    }
    
    return {
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
  };
  
  const handlePackageChange = (type) => {
    setPackageType(type);
    const presets = getPackagePresets();
    setSelectedServices(presets[type].services);
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
        
        // Sports-specific data
        sport_type: sportType,
        event_format: eventFormat,
        is_local_event: isLocalEvent,
        match_format: matchFormat,
        teams: teams,
        
        // Stadium info (if available)
        stadium_info: {
          name: order.venue,
          city: order.city || (isLocalEvent ? 'Local' : 'TBD'),
          capacity: order.stadium_capacity
        },
        
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
              title: sportType === 'cricket' ? 'Pavilion Access' : 'VIP Lounge',
              description: 'Exclusive access to premium areas',
              icon: '🥂'
            },
            {
              title: 'Gourmet Dining',
              description: 'Curated menu by renowned chefs',
              icon: '🍽️'
            },
            {
              title: sportType === 'cricket' ? 'Meet Cricket Legends' : 'Meet & Greet',
              description: 'Exclusive interaction opportunities',
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
  
  // Step 1: Event Details
  if (step === 'details') {
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
    },
      React.createElement('div', {
        className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto'
      },
        React.createElement('h3', {
          className: 'text-xl font-semibold mb-4'
        }, 'Event Details'),
        
        React.createElement('p', {
          className: 'text-gray-600 dark:text-gray-400 mb-6'
        }, `Creating journey for ${order.client_name} - ${order.event_name}`),
        
        // Sport Type
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h4', { className: 'font-medium mb-3' }, 'Sport Type'),
          React.createElement('div', { className: 'grid grid-cols-3 gap-3' },
            Object.entries(sports).map(([type, sport]) =>
              React.createElement('button', {
                key: type,
                onClick: () => setSportType(type),
                className: `p-3 border rounded-lg text-sm flex flex-col items-center ${
                  sportType === type 
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'border-gray-300 dark:border-gray-600'
                }`
              },
                React.createElement('span', { className: 'text-2xl mb-1' }, sport.icon),
                React.createElement('span', null, sport.name)
              )
            )
          )
        ),
        
        // Match Format (for selected sport)
        sports[sportType]?.formats && React.createElement('div', { className: 'mb-6' },
          React.createElement('h4', { className: 'font-medium mb-3' }, 'Match Format'),
          React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
            sports[sportType].formats.map(format =>
              React.createElement('button', {
                key: format,
                onClick: () => setMatchFormat(format),
                className: `p-2 border rounded ${
                  matchFormat === format 
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'border-gray-300 dark:border-gray-600'
                }`
              }, format)
            )
          )
        ),
        
        // Teams (optional)
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h4', { className: 'font-medium mb-3' }, 'Teams (Optional)'),
          React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
            React.createElement('input', {
              type: 'text',
              placeholder: sportType === 'cricket' ? 'India' : 'Home Team',
              value: teams.home,
              onChange: (e) => setTeams({ ...teams, home: e.target.value }),
              className: 'p-2 border rounded dark:bg-gray-700 dark:border-gray-600'
            }),
            React.createElement('input', {
              type: 'text',
              placeholder: sportType === 'cricket' ? 'Australia' : 'Away Team',
              value: teams.away,
              onChange: (e) => setTeams({ ...teams, away: e.target.value }),
              className: 'p-2 border rounded dark:bg-gray-700 dark:border-gray-600'
            })
          )
        ),
        
        // Local Event Toggle
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', {
            className: 'flex items-center cursor-pointer'
          },
            React.createElement('input', {
              type: 'checkbox',
              checked: isLocalEvent,
              onChange: (e) => setIsLocalEvent(e.target.checked),
              className: 'mr-3 w-5 h-5'
            }),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium' }, 'Local Event'),
              React.createElement('p', { className: 'text-sm text-gray-500' }, 
                'Check this if the customer lives in the same city as the event'
              )
            )
          )
        ),
        
        // Navigation
        React.createElement('div', { className: 'flex gap-3' },
          React.createElement('button', {
            onClick: onClose,
            className: 'flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-lg'
          }, 'Cancel'),
          
          React.createElement('button', {
            onClick: () => setStep('packages'),
            className: 'flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 rounded-lg font-medium'
          }, 'Next: Select Package')
        )
      )
    );
  }
  
  // Step 2: Package Selection
  if (step === 'packages') {
    const availableServices = getAvailableServices();
    const packagePresets = getPackagePresets();
    
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
    },
      React.createElement('div', {
        className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto'
      },
        React.createElement('h3', {
          className: 'text-xl font-semibold mb-4'
        }, 'Select Package'),
        
        React.createElement('p', {
          className: 'text-gray-600 dark:text-gray-400 mb-6'
        }, isLocalEvent ? 'Local event packages' : 'Travel packages available'),
        
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
        
        // Journey Preview
        React.createElement('div', {
          className: 'mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg'
        },
          React.createElement('h5', { className: 'font-medium mb-2' }, 'Journey Preview:'),
          React.createElement('div', { className: 'text-sm space-y-1' },
            React.createElement('p', null, `🏏 ${sports[sportType].name} - ${matchFormat || 'Match'}`),
            React.createElement('p', null, `📍 ${isLocalEvent ? 'Local Event' : 'Travel Required'}`),
            React.createElement('p', null, `📦 ${packagePresets[packageType].name}`),
            selectedServices.length > 0 && React.createElement('p', null, 
              `✓ ${selectedServices.length} additional services included`
            )
          )
        ),
        
        // Navigation
        React.createElement('div', { className: 'flex gap-3' },
          React.createElement('button', {
            onClick: () => setStep('details'),
            className: 'px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg'
          }, 'Back'),
          
          React.createElement('button', {
            onClick: generateJourney,
            disabled: loading,
            className: 'flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 rounded-lg font-medium disabled:opacity-50'
          }, loading ? 'Generating...' : 'Generate Journey')
        )
      )
    );
  }
  
  // Step 3: Done - show journey URL
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
            onClick: () => alert('Send via WhatsApp/Email integration coming soon!'),
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
