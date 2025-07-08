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
          onClick: () => setShowForm(true),
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
            onClick: () => setShowForm(true),
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
