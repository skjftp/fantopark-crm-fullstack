// Lead Inclusions Component
// Add this as a new file: frontend/public/components/lead-inclusions.js

// Initialize state for inclusions
window.initializeInclusionsState = function() {
  window.leadInclusionsData = {
    flights: [],
    hotels: [],
    transfers: [],
    sightseeing: [],
    other: [],
    notes: '',
    lastUpdated: null,
    updatedBy: null
  };
  
  window.showInclusionsTab = false;
  window.editingInclusion = null;
  window.showInclusionForm = false;
  window.inclusionType = 'flights';
};

// Main Inclusions Component
window.renderLeadInclusions = function(lead) {
  const { useState, useEffect } = React;
  
  // Component function
  const InclusionsTab = () => {
    const [inclusions, setInclusions] = useState(window.leadInclusionsData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('flights');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
      type: 'flights',
      details: {},
      id: null
    });
    
    // Fetch inclusions data
    useEffect(() => {
      fetchInclusionsData();
    }, [lead.id]);
    
    const fetchInclusionsData = async () => {
      try {
        setLoading(true);
        const response = await window.apiCall(`/leads/${lead.id}/inclusions`);
        if (response.data) {
          setInclusions(response.data);
          window.leadInclusionsData = response.data;
        }
      } catch (error) {
        console.error('Error fetching inclusions:', error);
        // Initialize with empty data if none exists
        setInclusions(window.leadInclusionsData);
      } finally {
        setLoading(false);
      }
    };
    
    // Save inclusions data
    const saveInclusions = async () => {
      try {
        setSaving(true);
        const response = await window.apiCall(`/leads/${lead.id}/inclusions`, {
          method: 'PUT',
          body: JSON.stringify(inclusions)
        });
        alert('Inclusions saved successfully!');
      } catch (error) {
        console.error('Error saving inclusions:', error);
        alert('Failed to save inclusions: ' + error.message);
      } finally {
        setSaving(false);
      }
    };
    
    // Add new inclusion item
    const addInclusionItem = () => {
      setFormData({
        type: activeSection,
        details: getEmptyFormData(activeSection),
        id: Date.now() // Temporary ID
      });
      setShowAddForm(true);
      setEditingItem(null);
    };
    
    // Edit inclusion item
    const editInclusionItem = (item, type) => {
      setFormData({
        type: type,
        details: { ...item },
        id: item.id
      });
      setEditingItem(item.id);
      setShowAddForm(true);
    };
    
    // Save inclusion item (add or update)
    const saveInclusionItem = () => {
      const newItem = {
        id: editingItem || Date.now(),
        ...formData.details,
        addedDate: editingItem ? formData.details.addedDate : new Date().toISOString(),
        addedBy: window.currentUser?.email || 'Unknown'
      };
      
      setInclusions(prev => {
        const updated = { ...prev };
        if (editingItem) {
          // Update existing item
          updated[formData.type] = updated[formData.type].map(item =>
            item.id === editingItem ? newItem : item
          );
        } else {
          // Add new item
          updated[formData.type] = [...(updated[formData.type] || []), newItem];
        }
        return updated;
      });
      
      setShowAddForm(false);
      setEditingItem(null);
    };
    
    // Delete inclusion item
    const deleteInclusionItem = (itemId, type) => {
      if (confirm('Are you sure you want to delete this item?')) {
        setInclusions(prev => ({
          ...prev,
          [type]: prev[type].filter(item => item.id !== itemId)
        }));
      }
    };
    
    // Get empty form data based on type
    const getEmptyFormData = (type) => {
      switch (type) {
        case 'flights':
          return {
            from: '',
            to: '',
            departureDate: '',
            returnDate: '',
            class: 'Economy',
            airlines: '',
            passengers: 1,
            notes: ''
          };
        case 'hotels':
          return {
            hotelName: '',
            location: '',
            checkIn: '',
            checkOut: '',
            roomType: '',
            occupancy: 'Single',
            numberOfRooms: 1,
            mealPlan: 'Breakfast',
            notes: ''
          };
        case 'transfers':
          return {
            type: 'Airport Transfer',
            from: '',
            to: '',
            date: '',
            vehicleType: 'Sedan',
            passengers: 1,
            notes: ''
          };
        case 'sightseeing':
          return {
            destination: '',
            activities: '',
            date: '',
            duration: 'Half Day',
            guide: 'No',
            notes: ''
          };
        case 'other':
          return {
            title: '',
            description: '',
            date: '',
            cost: '',
            notes: ''
          };
        default:
          return {};
      }
    };
    
    // Render form based on type
    const renderInclusionForm = () => {
      const { details } = formData;
      
      switch (formData.type) {
        case 'flights':
          return React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'From'),
                React.createElement('input', {
                  type: 'text',
                  value: details.from || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, from: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'e.g., Mumbai'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'To'),
                React.createElement('input', {
                  type: 'text',
                  value: details.to || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, to: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'e.g., New York'
                })
              )
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Departure Date'),
                React.createElement('input', {
                  type: 'date',
                  value: details.departureDate || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, departureDate: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Return Date'),
                React.createElement('input', {
                  type: 'date',
                  value: details.returnDate || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, returnDate: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                })
              )
            ),
            React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Class'),
                React.createElement('select', {
                  value: details.class || 'Economy',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, class: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                },
                  React.createElement('option', { value: 'Economy' }, 'Economy'),
                  React.createElement('option', { value: 'Premium Economy' }, 'Premium Economy'),
                  React.createElement('option', { value: 'Business' }, 'Business'),
                  React.createElement('option', { value: 'First' }, 'First')
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Airlines (Optional)'),
                React.createElement('input', {
                  type: 'text',
                  value: details.airlines || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, airlines: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'Preferred airlines'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Passengers'),
                React.createElement('input', {
                  type: 'number',
                  value: details.passengers || 1,
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, passengers: parseInt(e.target.value) }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  min: '1'
                })
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Notes'),
              React.createElement('textarea', {
                value: details.notes || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, notes: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                rows: '2',
                placeholder: 'Additional requirements or preferences'
              })
            )
          );
          
        case 'hotels':
          return React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Hotel Name'),
                React.createElement('input', {
                  type: 'text',
                  value: details.hotelName || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, hotelName: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'Hotel name or type'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Location'),
                React.createElement('input', {
                  type: 'text',
                  value: details.location || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, location: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'City or area'
                })
              )
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Check-in Date'),
                React.createElement('input', {
                  type: 'date',
                  value: details.checkIn || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, checkIn: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Check-out Date'),
                React.createElement('input', {
                  type: 'date',
                  value: details.checkOut || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, checkOut: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                })
              )
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Room Type'),
                React.createElement('input', {
                  type: 'text',
                  value: details.roomType || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, roomType: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'e.g., Deluxe, Suite'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Occupancy'),
                React.createElement('select', {
                  value: details.occupancy || 'Single',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, occupancy: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                },
                  React.createElement('option', { value: 'Single' }, 'Single'),
                  React.createElement('option', { value: 'Double' }, 'Double'),
                  React.createElement('option', { value: 'Twin' }, 'Twin'),
                  React.createElement('option', { value: 'Triple' }, 'Triple'),
                  React.createElement('option', { value: 'Quad' }, 'Quad')
                )
              )
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Number of Rooms'),
                React.createElement('input', {
                  type: 'number',
                  value: details.numberOfRooms || 1,
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, numberOfRooms: parseInt(e.target.value) }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  min: '1'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Meal Plan'),
                React.createElement('select', {
                  value: details.mealPlan || 'Breakfast',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, mealPlan: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                },
                  React.createElement('option', { value: 'Room Only' }, 'Room Only'),
                  React.createElement('option', { value: 'Breakfast' }, 'Breakfast'),
                  React.createElement('option', { value: 'Half Board' }, 'Half Board'),
                  React.createElement('option', { value: 'Full Board' }, 'Full Board'),
                  React.createElement('option', { value: 'All Inclusive' }, 'All Inclusive')
                )
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Special Requirements'),
              React.createElement('textarea', {
                value: details.notes || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, notes: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                rows: '2',
                placeholder: 'e.g., Sea view, Non-smoking, Near beach'
              })
            )
          );
          
        case 'transfers':
          return React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Transfer Type'),
              React.createElement('select', {
                value: details.type || 'Airport Transfer',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, type: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md'
              },
                React.createElement('option', { value: 'Airport Transfer' }, 'Airport Transfer'),
                React.createElement('option', { value: 'City Transfer' }, 'City Transfer'),
                React.createElement('option', { value: 'Inter-city Transfer' }, 'Inter-city Transfer'),
                React.createElement('option', { value: 'Meet & Greet' }, 'Meet & Greet'),
                React.createElement('option', { value: 'Railway Transfer' }, 'Railway Transfer')
              )
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'From'),
                React.createElement('input', {
                  type: 'text',
                  value: details.from || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, from: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'Pickup location'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'To'),
                React.createElement('input', {
                  type: 'text',
                  value: details.to || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, to: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'Drop location'
                })
              )
            ),
            React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Date'),
                React.createElement('input', {
                  type: 'date',
                  value: details.date || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, date: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Vehicle Type'),
                React.createElement('select', {
                  value: details.vehicleType || 'Sedan',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, vehicleType: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                },
                  React.createElement('option', { value: 'Sedan' }, 'Sedan'),
                  React.createElement('option', { value: 'SUV' }, 'SUV'),
                  React.createElement('option', { value: 'Van' }, 'Van'),
                  React.createElement('option', { value: 'Mini Bus' }, 'Mini Bus'),
                  React.createElement('option', { value: 'Coach' }, 'Coach')
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Passengers'),
                React.createElement('input', {
                  type: 'number',
                  value: details.passengers || 1,
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, passengers: parseInt(e.target.value) }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  min: '1'
                })
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Additional Notes'),
              React.createElement('textarea', {
                value: details.notes || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, notes: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                rows: '2',
                placeholder: 'e.g., Flight details, special requirements'
              })
            )
          );
          
        case 'sightseeing':
          return React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Destination/City'),
              React.createElement('input', {
                type: 'text',
                value: details.destination || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, destination: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                placeholder: 'e.g., Paris, Dubai'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Activities/Attractions'),
              React.createElement('textarea', {
                value: details.activities || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, activities: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                rows: '3',
                placeholder: 'List of places to visit or activities'
              })
            ),
            React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Date'),
                React.createElement('input', {
                  type: 'date',
                  value: details.date || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, date: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Duration'),
                React.createElement('select', {
                  value: details.duration || 'Half Day',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, duration: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                },
                  React.createElement('option', { value: 'Half Day' }, 'Half Day'),
                  React.createElement('option', { value: 'Full Day' }, 'Full Day'),
                  React.createElement('option', { value: 'Evening' }, 'Evening'),
                  React.createElement('option', { value: 'Multi-day' }, 'Multi-day')
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Guide Required'),
                React.createElement('select', {
                  value: details.guide || 'No',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, guide: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                },
                  React.createElement('option', { value: 'No' }, 'No'),
                  React.createElement('option', { value: 'Yes' }, 'Yes'),
                  React.createElement('option', { value: 'Audio Guide' }, 'Audio Guide')
                )
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Special Requirements'),
              React.createElement('textarea', {
                value: details.notes || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, notes: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                rows: '2',
                placeholder: 'e.g., Wheelchair accessible, Language preference'
              })
            )
          );
          
        case 'other':
          return React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Title'),
              React.createElement('input', {
                type: 'text',
                value: details.title || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, title: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                placeholder: 'e.g., Travel Insurance, Visa Assistance'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Description'),
              React.createElement('textarea', {
                value: details.description || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, description: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                rows: '3',
                placeholder: 'Detailed description'
              })
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Date (if applicable)'),
                React.createElement('input', {
                  type: 'date',
                  value: details.date || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, date: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Estimated Cost'),
                React.createElement('input', {
                  type: 'text',
                  value: details.cost || '',
                  onChange: (e) => setFormData(prev => ({
                    ...prev,
                    details: { ...prev.details, cost: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border rounded-md',
                  placeholder: 'Optional'
                })
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Notes'),
              React.createElement('textarea', {
                value: details.notes || '',
                onChange: (e) => setFormData(prev => ({
                  ...prev,
                  details: { ...prev.details, notes: e.target.value }
                })),
                className: 'w-full px-3 py-2 border rounded-md',
                rows: '2'
              })
            )
          );
      }
    };
    
    // Render section items
    const renderSectionItems = (items, type) => {
      if (!items || items.length === 0) {
        return React.createElement('p', { className: 'text-gray-500 text-center py-4' }, 
          'No items added yet'
        );
      }
      
      return React.createElement('div', { className: 'space-y-3' },
        items.map((item, index) => 
          React.createElement('div', { 
            key: item.id,
            className: 'border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors'
          },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('div', { className: 'flex-1' },
                renderItemSummary(item, type)
              ),
              React.createElement('div', { className: 'flex space-x-2 ml-4' },
                React.createElement('button', {
                  onClick: () => editInclusionItem(item, type),
                  className: 'text-blue-600 hover:text-blue-800 text-sm'
                }, '✏️ Edit'),
                React.createElement('button', {
                  onClick: () => deleteInclusionItem(item.id, type),
                  className: 'text-red-600 hover:text-red-800 text-sm'
                }, '🗑️ Delete')
              )
            )
          )
        )
      );
    };
    
    // Render item summary based on type
    const renderItemSummary = (item, type) => {
      switch (type) {
        case 'flights':
          return React.createElement('div', null,
            React.createElement('div', { className: 'font-medium' },
              `${item.from} → ${item.to}`
            ),
            React.createElement('div', { className: 'text-sm text-gray-600' },
              `${item.departureDate} to ${item.returnDate} • ${item.class} • ${item.passengers} pax`
            ),
            item.airlines && React.createElement('div', { className: 'text-sm text-gray-500' },
              `Airlines: ${item.airlines}`
            )
          );
          
        case 'hotels':
          return React.createElement('div', null,
            React.createElement('div', { className: 'font-medium' },
              item.hotelName || 'Hotel'
            ),
            React.createElement('div', { className: 'text-sm text-gray-600' },
              `${item.location} • ${item.checkIn} to ${item.checkOut}`
            ),
            React.createElement('div', { className: 'text-sm text-gray-500' },
              `${item.roomType} • ${item.occupancy} • ${item.numberOfRooms} room(s) • ${item.mealPlan}`
            )
          );
          
        case 'transfers':
          return React.createElement('div', null,
            React.createElement('div', { className: 'font-medium' },
              item.type
            ),
            React.createElement('div', { className: 'text-sm text-gray-600' },
              `${item.from} → ${item.to}`
            ),
            React.createElement('div', { className: 'text-sm text-gray-500' },
              `${item.date} • ${item.vehicleType} • ${item.passengers} pax`
            )
          );
          
        case 'sightseeing':
          return React.createElement('div', null,
            React.createElement('div', { className: 'font-medium' },
              item.destination
            ),
            React.createElement('div', { className: 'text-sm text-gray-600' },
              `${item.date} • ${item.duration} • Guide: ${item.guide}`
            ),
            React.createElement('div', { className: 'text-sm text-gray-500' },
              item.activities
            )
          );
          
        case 'other':
          return React.createElement('div', null,
            React.createElement('div', { className: 'font-medium' },
              item.title
            ),
            React.createElement('div', { className: 'text-sm text-gray-600' },
              item.description
            ),
            item.cost && React.createElement('div', { className: 'text-sm text-gray-500' },
              `Cost: ${item.cost}`
            )
          );
      }
    };
    
    // Main render
    return React.createElement('div', { className: 'p-6' },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h3', { className: 'text-xl font-semibold' }, 
          '📋 Travel Inclusions'
        ),
        React.createElement('button', {
          onClick: saveInclusions,
          disabled: saving,
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
        }, saving ? 'Saving...' : '💾 Save All Inclusions')
      ),
      
      // Loading state
      loading ? React.createElement('div', { className: 'text-center py-8' },
        React.createElement('div', { className: 'text-gray-500' }, '⏳ Loading inclusions...')
      ) :
      
      // Main content
      React.createElement('div', null,
        // Section tabs
        React.createElement('div', { className: 'border-b mb-4' },
          React.createElement('nav', { className: 'flex space-x-6' },
            ['flights', 'hotels', 'transfers', 'sightseeing', 'other'].map(section =>
              React.createElement('button', {
                key: section,
                onClick: () => setActiveSection(section),
                className: `pb-2 px-1 ${
                  activeSection === section
                    ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }, 
                section.charAt(0).toUpperCase() + section.slice(1),
                inclusions[section]?.length > 0 && 
                React.createElement('span', { 
                  className: 'ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs'
                }, inclusions[section].length)
              )
            )
          )
        ),
        
        // Active section content
        React.createElement('div', { className: 'bg-white rounded-lg border p-4' },
          // Add button
          React.createElement('div', { className: 'flex justify-end mb-4' },
            React.createElement('button', {
              onClick: addInclusionItem,
              className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center'
            }, 
              '➕ Add ',
              activeSection.charAt(0).toUpperCase() + activeSection.slice(1)
            )
          ),
          
          // Items list
          renderSectionItems(inclusions[activeSection], activeSection)
        ),
        
        // Notes section
        React.createElement('div', { className: 'mt-6 bg-gray-50 rounded-lg p-4' },
          React.createElement('h4', { className: 'font-medium mb-2' }, '📝 General Notes'),
          React.createElement('textarea', {
            value: inclusions.notes || '',
            onChange: (e) => setInclusions(prev => ({ ...prev, notes: e.target.value })),
            className: 'w-full px-3 py-2 border rounded-md',
            rows: '4',
            placeholder: 'Any additional requirements or special instructions for the entire trip...'
          })
        ),
        
        // Quote upload section
        lead.status === 'quote_requested' && React.createElement('div', { 
          className: 'mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'
        },
          React.createElement('h4', { className: 'font-medium mb-2 text-blue-900' }, 
            '📤 Supply Team Actions'
          ),
          React.createElement('p', { className: 'text-sm text-blue-700 mb-3' },
            'Review the inclusions above and prepare a quote based on the requirements.'
          ),
          React.createElement('button', {
            onClick: () => window.openQuoteUploadModal && window.openQuoteUploadModal(lead),
            className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          }, '📄 Upload Quote')
        )
      ),
      
      // Add/Edit form modal
      showAddForm && React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        onClick: () => setShowAddForm(false)
      },
        React.createElement('div', {
          className: 'bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto',
          onClick: (e) => e.stopPropagation()
        },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4' },
            (editingItem ? 'Edit ' : 'Add ') + 
            formData.type.charAt(0).toUpperCase() + formData.type.slice(1)
          ),
          
          renderInclusionForm(),
          
          React.createElement('div', { className: 'flex justify-end space-x-3 mt-6' },
            React.createElement('button', {
              onClick: () => setShowAddForm(false),
              className: 'px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
            }, 'Cancel'),
            React.createElement('button', {
              onClick: saveInclusionItem,
              className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            }, editingItem ? 'Update' : 'Add')
          )
        )
      )
    );
  };
  
  return React.createElement(InclusionsTab);
};

// Initialize on load
window.initializeInclusionsState();

console.log('✅ Lead Inclusions component loaded');
