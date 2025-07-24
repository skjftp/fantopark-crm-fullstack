// frontend/public/components/inventory-form-manager.js
// Enhanced with real-time Facebook Forms API and 15-minute cache

window.InventoryFormManager = function({ formIds = [], onChange }) {
  // State management
  const [ids, setIds] = React.useState([]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newFormId, setNewFormId] = React.useState('');
  const [newFormName, setNewFormName] = React.useState('');
  
  // API state
  const [apiState, setApiState] = React.useState({
    forms: [],
    loading: true,
    error: null,
    cached: false,
    cacheAge: 0,
    lastUpdated: null
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredForms, setFilteredForms] = React.useState([]);
  
  // Fallback forms (in case API fails completely)
  const fallbackForms = [
    { id: '4186748481542102', name: 'Test 17 Jul 2025' },
    { id: '1361858031771489', name: 'Wimbledon_090625_LV' },
    { id: '4195550474007198', name: 'ENG vsIND_090625_LV' },
    { id: '1006049624527097', name: 'Wimbledon_090625_LV_copy' },
    { id: '1048078150633985', name: 'ENG vs NED_080625_LV' },
    { id: '1561492171449067', name: 'ENG vs NED_080625_LV_copy' },
    { id: '831648302437896', name: 'Test 07 Jun 2025' },
    { id: '1175866460503088', name: 'Eid Mubarak ' },
    { id: '502977965627085', name: 'ICC WTC 2025_080625_SV' },
    { id: '1161951871883113', name: 'ENG vs IND_080625_SV' },
    { id: '932135978602077', name: 'ICC WTC 2025_080625_LV' },
    { id: '538099682154851', name: 'test 5 june' },
    { id: '442155992028644', name: 'Test 3 Jun' },
    { id: '485055524143946', name: 'test 31 may' },
    { id: '3789895631233863', name: 'pakistan zindabad Lead Campaign' },
    { id: '501588535822002', name: 'ENG vs IND_310525_LV' },
    { id: '514004984591628', name: 'IPL FINAL_250525_LV' },
    { id: '8102885213133831', name: 'ENG vs PAK_250525_SV' },
    { id: '1179468056506113', name: 'ENG vs PAK_250525_LV' },
    { id: '950644110409797', name: 'IPL FINAL_250525_SV' },
    { id: '8096641830399488', name: 'Test 24 May' },
    { id: '471847355668094', name: 'Test Lead Campaign' },
    { id: '1045859040543845', name: 'Test Lead Campaign' },
    { id: '546494481313468', name: 'Test Lead Campaign' },
    { id: '540052832288071', name: 'Test Lead Campaign' },
    { id: '426756600460316', name: 'Test Lead Campaign' },
    { id: '402816786229845', name: 'Test Lead Campaign' }
  ];

  // Initialize form IDs
  const initializeIds = React.useCallback(() => {
    return (formIds || []).map(id => {
      if (typeof id === 'object') {
        return { id: id.id, name: id.name };
      }
      
      // Try to find name from API forms or fallback
      const apiForm = apiState.forms.find(f => f.id === id);
      const fallbackForm = fallbackForms.find(f => f.id === id);
      
      return {
        id: id,
        name: apiForm?.name || fallbackForm?.name || id
      };
    });
  }, [formIds, apiState.forms]);

  // Fetch forms from API
  const fetchForms = React.useCallback(async (showLoading = true) => {
    if (showLoading) {
      setApiState(prev => ({ ...prev, loading: true, error: null }));
    }
    
    try {
      console.log('🔄 Fetching Facebook forms from API...');
      
      const response = await window.apiCall('/facebook-forms');
      
      if (response.success) {
        console.log(`✅ Fetched ${response.data.length} forms (cached: ${response.cached})`);
        
        setApiState({
          forms: response.data || [],
          loading: false,
          error: null,
          cached: response.cached || false,
          cacheAge: response.cacheAge || 0,
          lastUpdated: new Date().toISOString(),
          fallbackUsed: response.fallbackUsed || false,
          apiError: response.apiError || null
        });
        
        // Update search results
        filterForms(searchQuery, response.data || []);
        
      } else {
        throw new Error(response.error || 'Failed to fetch forms');
      }
      
    } catch (error) {
      console.error('❌ Error fetching forms:', error);
      
      setApiState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        forms: prev.forms.length > 0 ? prev.forms : fallbackForms, // Keep existing or use fallback
        fallbackUsed: true
      }));
      
      // Update search results with fallback
      filterForms(searchQuery, fallbackForms);
    }
  }, [searchQuery]);

  // Filter forms based on search query
  const filterForms = React.useCallback((query, forms) => {
    if (!query.trim()) {
      setFilteredForms(forms); // Show all forms when no search query
      return;
    }
    
    const filtered = forms.filter(form =>
      form.name.toLowerCase().includes(query.toLowerCase()) ||
      form.id.includes(query)
    );
    
    setFilteredForms(filtered); // Show all matching results
  }, []);

  // Handle search input
  const handleSearch = React.useCallback((query) => {
    setSearchQuery(query);
    filterForms(query, apiState.forms);
  }, [apiState.forms, filterForms]);

  // Initialize data on mount
  React.useEffect(() => {
    fetchForms();
  }, []);

  // Update IDs when formIds prop or API data changes
  React.useEffect(() => {
    setIds(initializeIds());
  }, [initializeIds]);

  // Add form ID
  const addFormId = async () => {
    if (!newFormId.trim()) return;
    
    try {
      let formToAdd = {
        id: newFormId.trim(),
        name: newFormName.trim() || newFormId.trim()
      };
      
      // Check if form exists in API data
      const existingApiForm = apiState.forms.find(f => f.id === newFormId.trim());
      if (existingApiForm) {
        formToAdd.name = existingApiForm.name;
      }
      
      // Check if already added
      if (ids.find(f => f.id === formToAdd.id)) {
        alert('This form is already linked!');
        return;
      }
      
      // If it's a manual entry and not in API, add it to API
      if (!existingApiForm && newFormName.trim()) {
        try {
          const response = await window.apiCall('/facebook-forms/custom', {
            method: 'POST',
            body: JSON.stringify({
              formId: newFormId.trim(),
              formName: newFormName.trim()
            })
          });
          
          if (response.success) {
            console.log('✅ Added custom form to API');
            // Refresh forms list to include the new form
            await fetchForms(false);
          }
        } catch (error) {
          console.warn('⚠️ Could not add to API, but will add locally:', error);
        }
      }
      
      const updatedIds = [...ids, formToAdd];
      setIds(updatedIds);
      onChange(updatedIds.map(f => f.id));
      
      // Reset form
      setNewFormId('');
      setNewFormName('');
      setShowAddForm(false);
      setSearchQuery('');
      
    } catch (error) {
      console.error('❌ Error adding form:', error);
      alert('Error adding form: ' + error.message);
    }
  };

  // Remove form ID
  const removeFormId = (idToRemove) => {
    const updatedIds = ids.filter(f => f.id !== idToRemove);
    setIds(updatedIds);
    onChange(updatedIds.map(f => f.id));
  };

  // Select form from dropdown
  const selectKnownForm = (formId) => {
    const form = apiState.forms.find(f => f.id === formId);
    if (form) {
      setNewFormId(form.id);
      setNewFormName(form.name);
      setSearchQuery('');
    }
  };

  // Refresh forms
  const refreshForms = () => {
    fetchForms();
  };

  // Get available forms (not already selected)
  const availableForms = React.useMemo(() => {
    return filteredForms.filter(f => !ids.find(existing => existing.id === f.id));
  }, [filteredForms, ids]);

  return React.createElement('div', { className: 'space-y-4' },
    // Header with status
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 dark:text-gray-300' },
        React.createElement('span', null, '📘 '),
        'Facebook/Instagram Lead Forms'
      ),
      React.createElement('div', { className: 'flex items-center space-x-2 text-xs' },
        // Cache status
        apiState.loading ? 
          React.createElement('span', { className: 'text-blue-600' }, '🔄 Loading...') :
          apiState.cached ?
            React.createElement('span', { 
              className: 'text-green-600',
              title: `Cached data (${apiState.cacheAge} min old)` 
            }, `📋 Cached (${apiState.cacheAge}m)`) :
            React.createElement('span', { 
              className: 'text-blue-600',
              title: 'Fresh data from Facebook API' 
            }, '🔄 Live'),
        
        // Refresh button
        React.createElement('button', {
          type: 'button',
          className: 'text-blue-600 hover:text-blue-800 disabled:opacity-50',
          onClick: refreshForms,
          disabled: apiState.loading,
          title: 'Refresh forms from Facebook'
        }, '🔄'),
        
        // Forms count
        React.createElement('span', { 
          className: 'text-gray-500',
          title: `${apiState.forms.length} forms available` 
        }, `(${apiState.forms.length})`)
      )
    ),
    
    // API Error warning
    apiState.error && React.createElement('div', { 
      className: 'p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800' 
    },
      React.createElement('span', null, '⚠️ '),
      apiState.fallbackUsed ? 
        'Using cached forms (API temporarily unavailable)' :
        `API Warning: ${apiState.error}`
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
            React.createElement('span', { title: `ID: ${form.id}` }, form.name || form.id),
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
      React.createElement('h6', { className: 'text-sm font-semibold mb-3' }, 'Link Facebook/Instagram Form'),
      
      // Search interface
      React.createElement('div', { className: 'mb-3' },
        React.createElement('label', { className: 'block text-sm text-gray-700 dark:text-gray-300 mb-1' }, 
          'Search existing forms:'
        ),
        React.createElement('input', {
          type: 'text',
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md',
          placeholder: 'Search by form name or ID...',
          value: searchQuery,
          onChange: (e) => handleSearch(e.target.value)
        })
      ),
      
      // Forms dropdown
      availableForms.length > 0 && React.createElement('div', { className: 'mb-3' },
        React.createElement('select', {
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md',
          value: newFormId,
          onChange: (e) => selectKnownForm(e.target.value)
        },
          React.createElement('option', { value: '' }, 
            `-- Select from ${availableForms.length} available forms --`
          ),
          availableForms.map(form => 
            React.createElement('option', { key: form.id, value: form.id }, 
              `${form.name}${form.source ? ` (${form.source})` : ''}`
            )
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
            setSearchQuery('');
          }
        }, 'Cancel'),
        React.createElement('button', {
          type: 'button',
          className: 'px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50',
          onClick: addFormId,
          disabled: !newFormId.trim()
        }, 'Add Form')
      )
    ),
    
    // Help text
    React.createElement('small', { className: 'block text-xs text-gray-500 dark:text-gray-400 mt-2' },
      'Link Facebook/Instagram lead forms to automatically associate leads with this inventory item. ',
      'Forms are fetched from Facebook Ads Manager in real-time with 15-minute cache. ',
      React.createElement('strong', null, `${apiState.forms.length} forms available`)
    )
  );
};

console.log('✅ Enhanced Inventory Form Manager with real-time API loaded successfully');