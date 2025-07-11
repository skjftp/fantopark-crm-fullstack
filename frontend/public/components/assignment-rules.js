/**
 * FanToPark CRM - Assignment Rules Manager Component
 * Phase 3: Component Extraction
 * 
 * Large React component for managing lead assignment rules
 */

// AssignmentRulesManager Component - extracted from index.html
window.AssignmentRulesManager = React.memo(({ currentUser }) => {
  // Simple state without complex initialization tracking
  const [rules, setRules] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState(null);
  const [testingRule, setTestingRule] = React.useState(false);
  const [availableUsers, setAvailableUsers] = React.useState([]);
  const [isRunningAssignment, setIsRunningAssignment] = React.useState(false);
  const [assignmentResults, setAssignmentResults] = React.useState(null);
  const [showResults, setShowResults] = React.useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = React.useState(false);
const [newAssigneeId, setNewAssigneeId] = React.useState('');
const [newAssigneeWeight, setNewAssigneeWeight] = React.useState(50);

  const [ruleFormData, setRuleFormData] = React.useState({
    name: '',
    description: '',
    priority: 1,
    conditions: {
      potential_value: '',
      potential_value_operator: 'gte',
      business_type: '',
      lead_source: ''
    },
    assignment_strategy: 'weighted_round_robin',
    assignees: [],
    is_active: true
  });

  // Load rules function
  const loadRules = React.useCallback(async () => {
    if (!window.hasPermission('leads', 'assign')) return;
    
    try {
      setLoading(true);
      const response = await window.apiCall('/assignment-rules');
      setRules(response.data || []);
    } catch (error) {
      console.error('Error loading assignment rules:', error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load available users
  const loadUsers = React.useCallback(async () => {
    try {
      const response = await window.apiCall('/users');
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setAvailableUsers([]);
    }
  }, []);

  // Load data on mount
  React.useEffect(() => {
    loadRules();
    loadUsers();
  }, [loadRules, loadUsers]);

  // Save rule function
  const saveRule = async () => {
    try {
      setLoading(true);
      
      if (editingRule) {
        await window.apiCall(`/assignment-rules/${editingRule.id}`, {
          method: 'PUT',
          body: JSON.stringify(ruleFormData)
        });
      } else {
        await window.apiCall('/assignment-rules', {
          method: 'POST',
          body: JSON.stringify(ruleFormData)
        });
      }
      
      await loadRules();
      setShowForm(false);
      setEditingRule(null);
      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Error saving rule: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setRuleFormData({
      name: '',
      description: '',
      priority: 1,
      conditions: {
        potential_value: '',
        potential_value_operator: 'gte',
        business_type: '',
        lead_source: ''
      },
      assignment_strategy: 'weighted_round_robin',
      assignees: [],
      is_active: true
    });
  };

  // Toggle rule active status
  const toggleRule = async (ruleId, currentStatus) => {
    try {
      await window.apiCall(`/assignment-rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      await loadRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Error updating rule: ' + error.message);
    }
  };

  // Delete rule
  const deleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await window.apiCall(`/assignment-rules/${ruleId}`, {
        method: 'DELETE'
      });
      await loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Error deleting rule: ' + error.message);
    }
  };

  // Test rule
  const testRule = async () => {
    setTestingRule(true);
    try {
      const response = await window.apiCall('/assignment-rules/test', {
        method: 'POST'
      });
      alert('Test completed! Check console for results.');
      console.log('Assignment test results:', response);
    } catch (error) {
      console.error('Error testing rules:', error);
      alert('Error testing rules: ' + error.message);
    } finally {
      setTestingRule(false);
    }
  };

  // Run assignment
  const runAssignment = async () => {
    if (!confirm('Run assignment for all unassigned leads?')) return;
    
    setIsRunningAssignment(true);
    try {
      const response = await window.apiCall('/assignment-rules/run', {
        method: 'POST'
      });
      setAssignmentResults(response);
      setShowResults(true);
      await loadRules();
    } catch (error) {
      console.error('Error running assignment:', error);
      alert('Error running assignment: ' + error.message);
    } finally {
      setIsRunningAssignment(false);
    }
  };

  // Format conditions helper
  const formatConditions = (conditions) => {
    const parts = [];
    if (conditions.potential_value) {
      parts.push(`Value ${conditions.potential_value_operator} ${conditions.potential_value}`);
    }
    if (conditions.business_type) {
      parts.push(`Type: ${conditions.business_type}`);
    }
    if (conditions.lead_source) {
      parts.push(`Source: ${conditions.lead_source}`);
    }
    return parts.join(', ') || 'No conditions';
  };

  // Add this debug section right before the return statement
if (showForm) {
  console.log('🔍 showForm is true - form should be visible but form component is missing');
}

  // ✅ COMPLETE ASSIGNMENT RULES FORM - EXACT PRODUCTION MATCH
// Add this code to your assignment-rules.js file, RIGHT BEFORE the main return statement

// Form rendering function (add this before the main return)
if (showForm) {
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: () => {
      console.log('🔍 Modal overlay clicked - closing form');
      setShowForm(false);
      setEditingRule(null);
      resetForm();
    }
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto',
      onClick: (e) => e.stopPropagation()
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center p-6 border-b' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900' },
          editingRule ? 'Edit Assignment Rule' : 'Create Assignment Rule'
        ),
        React.createElement('button', {
          onClick: () => {
            console.log('🔍 Close button clicked');
            setShowForm(false);
            setEditingRule(null);
            resetForm();
          },
          className: 'text-gray-400 hover:text-gray-600 text-2xl font-bold'
        }, '✕')
      ),

      // Form Content
      React.createElement('div', { className: 'p-6' },
        React.createElement('form', {
          onSubmit: (e) => {
            e.preventDefault();
            console.log('🔍 Assignment rule form submitted');
            saveRule();
          }
        },
          // Rule Name and Priority Row
          React.createElement('div', { className: 'grid grid-cols-2 gap-6 mb-6' },
            // Rule Name
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
                'Rule Name *'
              ),
              React.createElement('input', {
                type: 'text',
                value: ruleFormData.name || '',
                onChange: (e) => setRuleFormData(prev => ({ ...prev, name: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                placeholder: '',
                required: true
              })
            ),
            // Priority
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
                'Priority'
              ),
              React.createElement('input', {
                type: 'number',
                value: ruleFormData.priority || 1,
                onChange: (e) => setRuleFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                min: 1,
                max: 100
              })
            )
          ),

          // Description
          React.createElement('div', { className: 'mb-6' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
              'Description'
            ),
            React.createElement('textarea', {
              value: ruleFormData.description || '',
              onChange: (e) => setRuleFormData(prev => ({ ...prev, description: e.target.value })),
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              placeholder: '',
              rows: 4
            })
          ),

          // Conditions Section
          React.createElement('div', { className: 'mb-6' },
            React.createElement('h3', { className: 'text-lg font-medium text-gray-900 mb-4' },
              'Conditions'
            ),
            React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
              // Potential Value
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
                  'Potential Value'
                ),
                React.createElement('div', { className: 'flex' },
                  React.createElement('select', {
                    value: ruleFormData.conditions?.potential_value_operator || 'gte',
                    onChange: (e) => setRuleFormData(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, potential_value_operator: e.target.value }
                    })),
                    className: 'px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50'
                  },
                    React.createElement('option', { value: 'gte' }, '≥'),
                    React.createElement('option', { value: 'lte' }, '≤'),
                    React.createElement('option', { value: 'eq' }, '='),
                    React.createElement('option', { value: 'gt' }, '>'),
                    React.createElement('option', { value: 'lt' }, '<')
                  ),
                  React.createElement('input', {
                    type: 'text',
                    value: ruleFormData.conditions?.potential_value || '',
                    onChange: (e) => setRuleFormData(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, potential_value: e.target.value }
                    })),
                    className: 'flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    placeholder: 'e.g., 100000'
                  })
                )
              ),
              // Business Type
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
                  'Business Type'
                ),
                React.createElement('select', {
                  value: ruleFormData.conditions?.business_type || '',
                  onChange: (e) => setRuleFormData(prev => ({
                    ...prev,
                    conditions: { ...prev.conditions, business_type: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                },
                  React.createElement('option', { value: '' }, 'Any'),
                  React.createElement('option', { value: 'B2C' }, 'B2C'),
                  React.createElement('option', { value: 'B2B' }, 'B2B')
                )
              ),
              // Lead Source
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
                  'Lead Source'
                ),
                React.createElement('select', {
                  value: ruleFormData.conditions?.lead_source || '',
                  onChange: (e) => setRuleFormData(prev => ({
                    ...prev,
                    conditions: { ...prev.conditions, lead_source: e.target.value }
                  })),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                },
                  React.createElement('option', { value: '' }, 'Any'),
                  React.createElement('option', { value: 'Facebook' }, 'Facebook'),
                  React.createElement('option', { value: 'Instagram' }, 'Instagram'),
                  React.createElement('option', { value: 'LinkedIn' }, 'LinkedIn'),
                  React.createElement('option', { value: 'Website' }, 'Website'),
                  React.createElement('option', { value: 'Friends and Family' }, 'Friends and Family'),
                  React.createElement('option', { value: 'Through Champion' }, 'Through Champion'),
                  React.createElement('option', { value: 'Existing Client' }, 'Existing Client'),
                  React.createElement('option', { value: 'WhatsApp' }, 'WhatsApp'),
                  React.createElement('option', { value: 'Email Campaign' }, 'Email Campaign'),
                  React.createElement('option', { value: 'Cold Call' }, 'Cold Call'),
                  React.createElement('option', { value: 'Other' }, 'Other')
                )
              )
            )
          ),

          // Assignment Strategy
          React.createElement('div', { className: 'mb-6' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
              'Assignment Strategy'
            ),
            React.createElement('select', {
              value: ruleFormData.assignment_strategy || 'weighted_round_robin',
              onChange: (e) => setRuleFormData(prev => ({ ...prev, assignment_strategy: e.target.value })),
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            },
              React.createElement('option', { value: 'weighted_round_robin' }, 'Weighted Round Robin'),
              React.createElement('option', { value: 'round_robin' }, 'Round Robin'),
              React.createElement('option', { value: 'least_busy' }, 'Least Busy')
            )
          ),

         // Assignees Section
React.createElement('div', { className: 'mb-6' },
  React.createElement('div', { className: 'flex justify-between items-center mb-4' },
    React.createElement('h3', { className: 'text-lg font-medium text-gray-900' },
      'Assignees'
    ),
    React.createElement('div', { className: 'relative' },
      React.createElement('button', {
        type: 'button',
        onClick: () => {
          console.log('🔍 Add Assignee clicked');
          setShowAssigneeDropdown(!showAssigneeDropdown);
        },
        className: 'bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700'
      }, '+ Add Assignee'),
      
      // Assignee Selection Dropdown
      showAssigneeDropdown && React.createElement('div', {
        className: 'absolute top-full right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-10'
      },
        React.createElement('div', { className: 'p-4' },
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
              'Select User'
            ),
            React.createElement('select', {
              value: newAssigneeId,
              onChange: (e) => setNewAssigneeId(e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            },
              React.createElement('option', { value: '' }, 'Choose a user...'),
              // Filter out users who are already assigned
              availableUsers.filter(user => 
                !(ruleFormData.assignees || []).some(assignee => assignee.id === user.id)
              ).map(user =>
                React.createElement('option', { key: user.id, value: user.id },
                  `${user.name} (${user.email})`
                )
              )
            )
          ),
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
              'Weight'
            ),
            React.createElement('input', {
              type: 'number',
              value: newAssigneeWeight,
              onChange: (e) => setNewAssigneeWeight(parseInt(e.target.value) || 50),
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              min: 1,
              max: 100,
              placeholder: '50'
            })
          ),
          React.createElement('div', { className: 'flex justify-end space-x-2' },
            React.createElement('button', {
              type: 'button',
              onClick: () => {
                setShowAssigneeDropdown(false);
                setNewAssigneeId('');
                setNewAssigneeWeight(50);
              },
              className: 'px-3 py-1 text-gray-600 bg-gray-100 rounded text-sm hover:bg-gray-200'
            }, 'Cancel'),
            React.createElement('button', {
              type: 'button',
              onClick: () => {
                if (newAssigneeId) {
                  const selectedUser = availableUsers.find(user => user.id === newAssigneeId);
                  if (selectedUser) {
                    console.log('🔍 Adding assignee:', selectedUser.name);
                    const newAssignee = {
                      id: selectedUser.id,
                      name: selectedUser.name,
                      email: selectedUser.email,
                      weight: newAssigneeWeight
                    };
                    setRuleFormData(prev => ({
                      ...prev,
                      assignees: [...(prev.assignees || []), newAssignee]
                    }));
                    setShowAssigneeDropdown(false);
                    setNewAssigneeId('');
                    setNewAssigneeWeight(50);
                  }
                }
              },
              disabled: !newAssigneeId,
              className: 'px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400'
            }, 'Add')
          )
        )
      )
    )
  ),
  
  // Assignees List (same as before)
  React.createElement('div', { className: 'space-y-2' },
    (ruleFormData.assignees || []).length === 0 ? 
      React.createElement('p', { className: 'text-gray-500 text-sm' },
        'No assignees added yet. Click "Add Assignee" to get started.'
      ) :
      (ruleFormData.assignees || []).map((assignee, index) => 
        React.createElement('div', { 
          key: index,
          className: 'flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50'
        },
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('span', { className: 'font-medium' },
              assignee.name || 'Unknown User'
            ),
            assignee.email && React.createElement('span', { className: 'text-gray-500 text-sm' },
              `(${assignee.email})`
            )
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('span', { className: 'text-sm text-gray-600' }, 'Weight:'),
            React.createElement('input', {
              type: 'number',
              value: assignee.weight || 50,
              onChange: (e) => {
                const newAssignees = [...(ruleFormData.assignees || [])];
                newAssignees[index] = { ...assignee, weight: parseInt(e.target.value) || 50 };
                setRuleFormData(prev => ({ ...prev, assignees: newAssignees }));
              },
              className: 'w-16 px-2 py-1 border border-gray-300 rounded text-sm',
              min: 1,
              max: 100
            }),
            React.createElement('button', {
              type: 'button',
              onClick: () => {
                const newAssignees = (ruleFormData.assignees || []).filter((_, i) => i !== index);
                setRuleFormData(prev => ({ ...prev, assignees: newAssignees }));
              },
              className: 'text-red-600 hover:text-red-800 font-bold text-lg'
            }, '✕')
          )
        )
      )
  )
),

          // Form Buttons
          React.createElement('div', { className: 'flex justify-end space-x-3 pt-4 border-t' },
            React.createElement('button', {
              type: 'button',
              onClick: () => {
                setShowForm(false);
                setEditingRule(null);
                resetForm();
              },
              className: 'px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium'
            }, 'Cancel'),
            React.createElement('button', {
              type: 'submit',
              disabled: loading,
              className: 'px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium'
            }, loading ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule'))
          )
        )
      )
    )
  );
}
  // Render main component
  return React.createElement('div', { className: 'space-y-6' },
    // Header
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 'Assignment Rules'),
      React.createElement('div', { className: 'flex space-x-3' },
        React.createElement('button', {
          onClick: runAssignment,
          disabled: isRunningAssignment,
          className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400'
        }, isRunningAssignment ? 
          React.createElement('span', null, '⏳ Running...') :
          React.createElement('span', null, '🚀 Run Assignment')
        ),
        React.createElement('button', {
          onClick: testRule,
          disabled: testingRule,
          className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400'
        }, testingRule ? 'Testing...' : '🧪 Test Rules'),
        React.createElement('button', {
          onClick: () => { 
  console.log('🔍 Add New Rule clicked!'); 
 // alert('Form functionality temporarily disabled - form component missing'); 
  setShowForm(true); 
},
          className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
        }, '+ Add New Rule')
      )
    ),

    // Stats
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-blue-600' }, rules.length),
        React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Rules')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-green-600' }, rules.filter(r => r.is_active).length),
        React.createElement('div', { className: 'text-sm text-gray-600' }, 'Active Rules')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-orange-600' }, 
          rules.reduce((sum, r) => sum + (r.assignees?.length || 0), 0)
        ),
        React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Assignees')
      )
    ),

    // Rules List
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' },
        React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'Assignment Rules')
      ),
      React.createElement('div', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
        rules.length === 0 ?
        React.createElement('div', { className: 'p-8 text-center text-gray-500' },
          React.createElement('div', { className: 'text-4xl mb-2' }, '⚙️'),
          React.createElement('p', { className: 'mb-4' }, 'No assignment rules configured'),
          React.createElement('button', {
            onClick: () => { 
  console.log('🔍 Create First Rule clicked!'); 
  alert('Form functionality temporarily disabled - form component missing'); 
  setShowForm(true); 
},
            className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
          }, 'Create First Rule')
        ) :
        rules.map(rule => 
          React.createElement('div', { 
            key: rule.id, 
            className: 'p-6 hover:bg-gray-50 dark:hover:bg-gray-700' 
          },
            React.createElement('div', { className: 'flex items-start justify-between' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('div', { className: 'flex items-center space-x-3 mb-2' },
                  React.createElement('h3', { className: 'text-lg font-medium text-gray-900 dark:text-white' }, rule.name),
                  React.createElement('span', { 
                    className: `px-2 py-1 rounded-full text-xs font-medium ${
                      rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }` 
                  }, rule.is_active ? 'Active' : 'Inactive'),
                  React.createElement('span', { 
                    className: 'px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium' 
                  }, `Priority: ${rule.priority}`)
                ),
                React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 mb-3' }, rule.description),
                React.createElement('div', { className: 'text-sm text-gray-500 space-y-1' },
                  React.createElement('div', null, `Conditions: ${formatConditions(rule.conditions)}`),
                  React.createElement('div', null, `Strategy: ${rule.assignment_strategy}`),
                  React.createElement('div', null, `Assignees: ${rule.assignees?.length || 0}`)
                )
              ),
              React.createElement('div', { className: 'flex items-center space-x-2' },
                React.createElement('button', {
                  onClick: () => toggleRule(rule.id, rule.is_active),
                  className: `px-3 py-1 rounded text-sm font-medium ${
                    rule.is_active 
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`
                }, rule.is_active ? 'Deactivate' : 'Activate'),
                React.createElement('button', {
                  onClick: () => {
                    setEditingRule(rule);
                    setRuleFormData({ ...rule });
                    setShowForm(true);
                  },
                  className: 'px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200'
                }, 'Edit'),
                React.createElement('button', {
                  onClick: () => deleteRule(rule.id),
                  className: 'px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200'
                }, 'Delete')
              )
            )
          )
        )
      )
    )
  );
});

console.log('✅ Assignment Rules Manager component loaded');
