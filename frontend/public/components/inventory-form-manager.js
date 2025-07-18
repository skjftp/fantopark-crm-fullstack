// frontend/public/components/inventory-form-manager.js

window.InventoryFormManager = function({ formIds = [], onChange }) {
  // Known Facebook forms - MOVED TO TOP
  const knownForms = [
    { id: '4186748481542102', name: 'Test 17 Jul 2025' },
    { id: '1361858031771489', name: 'Wimbledon_090625_LV' },
    { id: '4195550474007198', name: 'ENG vsIND_090625_LV' },
    { id: '690611760531730', name: 'Football Summer Camp' },
    { id: '588401144285325', name: 'SingaporeGP_020625_LV' },
    { id: '672746342293356', name: 'AbuDhabiGP_300525_LV' },
    { id: '1856941958476167', name: 'Singapore GP 120425' },
    { id: '552584130643806', name: 'French Open 280325' },
    { id: '676855538081129', name: 'Champions League Finals 210325' },
    { id: '1164566588107212', name: 'Liverpool Trophy Parade 200325' },
    { id: '2041573222995561', name: 'Wimbledon 200225' },
    { id: '948610634143954', name: 'ENG vs IND 200325' },
    { id: '655689847406692', name: 'British GP 190325' },
    { id: '622356407371384', name: 'Baku GP 190325' },
    { id: '954155226879225', name: 'Monaco GP 190325' },
    { id: '1289160652169423', name: 'RCB Leaders' },
    { id: '1399637408064503', name: 'Liverpool Trophy Parade Travel' },
    { id: '3028173734013762', name: 'India Tour of England Travel' },
    { id: '508677818565775', name: 'Champions Trophy Travel' },
    { id: '2366098453775541', name: 'IND vs NZ India Travel' },
    { id: '1505479607079951', name: 'IND vs NZ Mid East Travel' },
    { id: '675033785184274', name: 'Monaco GP Travel' }
  ];
  
  // Convert formIds array to objects with names - NOW knownForms is available
  const initializeIds = () => {
    return (formIds || []).map(id => {
      const knownForm = knownForms.find(f => f.id === id);
      return {
        id: typeof id === 'object' ? id.id : id,
        name: typeof id === 'object' ? id.name : (knownForm ? knownForm.name : id)
      };
    });
  };
  
  const [ids, setIds] = React.useState(initializeIds());
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newFormId, setNewFormId] = React.useState('');
  const [newFormName, setNewFormName] = React.useState('');
  
  const addFormId = () => {
    if (newFormId) {
      const existingForm = knownForms.find(f => f.id === newFormId);
      const newForm = {
        id: newFormId,
        name: existingForm ? existingForm.name : (newFormName || newFormId)
      };
      
      // Check if already added
      if (!ids.find(f => f.id === newFormId)) {
        const updatedIds = [...ids, newForm];
        setIds(updatedIds);
        // Send only IDs array to onChange
        onChange(updatedIds.map(f => f.id));
      }
      
      setNewFormId('');
      setNewFormName('');
      setShowAddForm(false);
    }
  };
  
  const removeFormId = (idToRemove) => {
    const updatedIds = ids.filter(f => f.id !== idToRemove);
    setIds(updatedIds);
    // Send only IDs array to onChange
    onChange(updatedIds.map(f => f.id));
  };
  
  const selectKnownForm = (formId) => {
    const form = knownForms.find(f => f.id === formId);
    if (form) {
      setNewFormId(form.id);
      setNewFormName(form.name);
    }
  };
  
  return React.createElement('div', { className: 'space-y-4' },
    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 dark:text-gray-300' },
      React.createElement('span', null, '📘 '),
      'Facebook/Instagram Lead Forms'
    ),
    
    // Display linked forms
    React.createElement('div', { className: 'space-y-2' },
      ids.length === 0 ? 
        React.createElement('div', { className: 'text-sm text-gray-500 dark:text-gray-400 italic' },
          'No forms linked yet. Click below to add forms.'
        ) :
        ids.map((form) => 
          React.createElement('div', { 
            key: form.id, 
            className: 'inline-flex items-center mr-2 mb-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm'
          },
            React.createElement('span', { className: 'mr-2' }, '📘'),
            React.createElement('span', null, form.name || form.id),
            React.createElement('button', {
              type: 'button',
              className: 'ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100',
              onClick: () => removeFormId(form.id),
              title: 'Remove form'
            }, '✕')
          )
        )
    ),
    
    // Add form button
    !showAddForm && React.createElement('button', {
      type: 'button',
      className: 'px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors',
      onClick: () => setShowAddForm(true)
    }, '+ Link Facebook Form'),
    
    // Add form interface
    showAddForm && React.createElement('div', { 
      className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600' 
    },
      React.createElement('h6', { className: 'text-sm font-semibold mb-3' }, 'Add Facebook/Instagram Form'),
      
      // Known forms dropdown
      React.createElement('div', { className: 'mb-3' },
        React.createElement('label', { className: 'block text-sm text-gray-700 dark:text-gray-300 mb-1' }, 
          'Select from existing forms:'
        ),
        React.createElement('select', {
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md',
          value: newFormId,
          onChange: (e) => selectKnownForm(e.target.value)
        },
          React.createElement('option', { value: '' }, '-- Select a form --'),
          knownForms
            .filter(f => !ids.find(existing => existing.id === f.id))
            .map(form => 
              React.createElement('option', { key: form.id, value: form.id }, form.name)
            )
        )
      ),
      
      React.createElement('div', { className: 'text-center my-3 text-sm text-gray-500' }, '— OR —'),
      
      // Manual entry
      React.createElement('div', { className: 'space-y-2 mb-3' },
        React.createElement('label', { className: 'block text-sm text-gray-700 dark:text-gray-300' }, 
          'Enter form details manually:'
        ),
        React.createElement('input', {
          type: 'text',
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md',
          placeholder: 'Form ID (e.g., 588401144285325)',
          value: newFormId,
          onChange: (e) => setNewFormId(e.target.value)
        }),
        React.createElement('input', {
          type: 'text',
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md',
          placeholder: 'Form Name (e.g., SingaporeGP_020625_LV)',
          value: newFormName,
          onChange: (e) => setNewFormName(e.target.value)
        })
      ),
      
      // Action buttons
      React.createElement('div', { className: 'flex justify-end space-x-2' },
        React.createElement('button', {
          type: 'button',
          className: 'px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600',
          onClick: () => {
            setShowAddForm(false);
            setNewFormId('');
            setNewFormName('');
          }
        }, 'Cancel'),
        React.createElement('button', {
          type: 'button',
          className: 'px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50',
          onClick: addFormId,
          disabled: !newFormId
        }, 'Add Form')
      )
    ),
    
    React.createElement('small', { className: 'block text-xs text-gray-500 dark:text-gray-400 mt-2' },
      'Link Facebook/Instagram lead forms to automatically associate leads with this inventory item. When leads come from these forms, they\'ll be tagged with this event.'
    )
  );
};

console.log('✅ Inventory Form Manager loaded successfully');
