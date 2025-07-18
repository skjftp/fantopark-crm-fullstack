// frontend/public/components/inventory-form-manager.js

window.InventoryFormManager = function({ formIds = [], onChange }) {
  const [ids, setIds] = React.useState(formIds || []);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newFormId, setNewFormId] = React.useState('');
  const [newFormName, setNewFormName] = React.useState('');
  
  // Known Facebook forms - this could be fetched from the backend
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
        onChange(updatedIds);
      }
      
      setNewFormId('');
      setNewFormName('');
      setShowAddForm(false);
    }
  };
  
  const removeFormId = (idToRemove) => {
    const updatedIds = ids.filter(f => f.id !== idToRemove);
    setIds(updatedIds);
    onChange(updatedIds);
  };
  
  const selectKnownForm = (formId) => {
    const form = knownForms.find(f => f.id === formId);
    if (form) {
      setNewFormId(form.id);
      setNewFormName(form.name);
    }
  };
  
  return (
    <div className="form-group">
      <label className="font-weight-bold">
        <i className="fab fa-facebook mr-2"></i>
        Facebook/Instagram Lead Forms
      </label>
      
      {/* Display linked forms */}
      <div className="linked-forms mb-3">
        {ids.length === 0 ? (
          <div className="text-muted">
            <small>No forms linked yet. Click below to add forms.</small>
          </div>
        ) : (
          ids.map((form) => (
            <div key={form.id} className="d-inline-block mr-2 mb-2">
              <span className="badge badge-primary" style={{ fontSize: '14px', padding: '8px 12px' }}>
                <i className="fab fa-facebook-square mr-1"></i>
                {form.name || form.id}
                <button
                  type="button"
                  className="ml-2 text-white border-0 bg-transparent"
                  style={{ cursor: 'pointer', fontSize: '16px' }}
                  onClick={() => removeFormId(form.id)}
                  title="Remove form"
                >
                  ×
                </button>
              </span>
            </div>
          ))
        )}
      </div>
      
      {/* Add form button */}
      {!showAddForm && (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowAddForm(true)}
        >
          <i className="fas fa-plus mr-1"></i>
          Link Facebook Form
        </button>
      )}
      
      {/* Add form interface */}
      {showAddForm && (
        <div className="card mt-3">
          <div className="card-body">
            <h6 className="card-title">Add Facebook/Instagram Form</h6>
            
            {/* Known forms dropdown */}
            <div className="form-group">
              <label>Select from existing forms:</label>
              <select
                className="form-control"
                value={newFormId}
                onChange={(e) => selectKnownForm(e.target.value)}
              >
                <option value="">-- Select a form --</option>
                {knownForms
                  .filter(f => !ids.find(existing => existing.id === f.id))
                  .map(form => (
                    <option key={form.id} value={form.id}>
                      {form.name}
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="text-center my-3">
              <small className="text-muted">— OR —</small>
            </div>
            
            {/* Manual entry */}
            <div className="form-group">
              <label>Enter form details manually:</label>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Form ID (e.g., 588401144285325)"
                value={newFormId}
                onChange={(e) => setNewFormId(e.target.value)}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Form Name (e.g., SingaporeGP_020625_LV)"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
              />
            </div>
            
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-sm btn-secondary mr-2"
                onClick={() => {
                  setShowAddForm(false);
                  setNewFormId('');
                  setNewFormName('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={addFormId}
                disabled={!newFormId}
              >
                Add Form
              </button>
            </div>
          </div>
        </div>
      )}
      
      <small className="form-text text-muted mt-2">
        Link Facebook/Instagram lead forms to automatically associate leads with this inventory item.
        When leads come from these forms, they'll be tagged with this event and ticket category.
      </small>
    </div>
  );
};
