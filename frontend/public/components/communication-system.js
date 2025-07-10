// Communication Timeline System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles communication tracking, timeline display, and form management

// Communication Timeline Component
window.CommunicationTimeline = ({ leadId, leadName }) => {
  const [communications, setCommunications] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);

  const fetchCommunications = async () => {
    if (!leadId) return;

    try {
      setLoading(true);
      const response = await window.apiCall(`/communications/lead/${leadId}`);
      setCommunications(response.data || []);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCommunications();
  }, [leadId]);

  const addCommunication = async (commData) => {
    try {
      const response = await window.apiCall('/communications', {
        method: 'POST',
        body: JSON.stringify({
          ...commData,
          lead_id: leadId
        })
      });

      if (response.data) {
        setCommunications(prev => [response.data, ...prev]);
        setShowAddForm(false);
        alert('Communication logged successfully!');
      }
    } catch (error) {
      console.error('Error adding communication:', error);
      alert('Failed to log communication: ' + error.message);
    }
  };

  return React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border mt-6' },
    React.createElement('div', { className: 'p-4 border-b flex justify-between items-center' },
      React.createElement('h3', { className: 'text-lg font-semibold flex items-center gap-2' },
        React.createElement('span', null, '📞'),
        `Communication Timeline (${communications.length})`
      ),
      React.createElement('button', {
        onClick: () => setShowAddForm(true),
        className: 'px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700'
      }, '+ Add Communication')
    ),

    showAddForm && React.createElement('div', { className: 'p-4 bg-gray-50 border-b' },
      React.createElement(window.CommunicationForm, {
        onSubmit: addCommunication,
        onCancel: () => setShowAddForm(false)
      })
    ),

    React.createElement('div', { className: 'p-4' },
      loading ? React.createElement('div', { className: 'text-center py-8' }, 'Loading communications...') :
      communications.length === 0 ? React.createElement('div', { className: 'text-center py-8 text-gray-500' },
        'No communications yet. Click "Add Communication" to start tracking interactions.'
      ) :
      React.createElement('div', { className: 'space-y-4' },
        communications.map((comm, index) => 
          React.createElement('div', { 
            key: comm.id,
            className: 'flex gap-4 p-3 border-l-4 border-blue-200 bg-gray-50 rounded-r'
          },
            React.createElement('div', { className: 'flex-shrink-0' },
              React.createElement('div', { className: 'w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg' },
                window.getCommIcon(comm.communication_type)
              )
            ),

            React.createElement('div', { className: 'flex-1' },
              React.createElement('div', { className: 'flex items-start justify-between' },
                React.createElement('div', null,
                  React.createElement('h4', { className: 'font-medium text-gray-900' }, 
                    comm.subject || `${comm.communication_type} ${comm.direction}`
                  ),
                  React.createElement('p', { className: 'text-sm text-gray-600 mt-1' }, comm.content)
                ),
                React.createElement('div', { className: 'text-xs text-gray-500 text-right' },
                  React.createElement('div', null, new Date(comm.created_date).toLocaleDateString()),
                  React.createElement('div', null, new Date(comm.created_date).toLocaleTimeString())
                )
              ),

              React.createElement('div', { className: 'flex gap-2 mt-2 flex-wrap' },
                comm.duration_minutes && React.createElement('span', { 
                  className: 'px-2 py-1 bg-gray-200 text-xs rounded' 
                }, `${comm.duration_minutes} min`),
                
                comm.outcome && React.createElement('span', { 
                  className: `px-2 py-1 text-xs rounded ${window.getOutcomeColor(comm.outcome)}` 
                }, comm.outcome.replace('_', ' ')),
                
                comm.temperature && comm.temperature !== 'warm' && React.createElement('span', { 
                  className: `px-2 py-1 text-xs rounded ${
                    comm.temperature === 'hot' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`
                }, comm.temperature),
                
                comm.is_auto_logged && React.createElement('span', { 
                  className: 'px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded' 
                }, 'Auto-logged')
              ),

              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                `by ${comm.created_by_name || comm.created_by}`
              )
            )
          )
        )
      )
    )
  );
};

// Communication Form Component
window.CommunicationForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState({
    communication_type: 'call',
    direction: 'outbound',
    subject: '',
    content: '',
    duration_minutes: '',
    outcome: '',
    temperature: 'warm'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject && !formData.content) {
      alert('Please provide a subject or content');
      return;
    }

    onSubmit({
      ...formData,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null
    });
  };

  return React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Type'),
        React.createElement('select', {
          value: formData.communication_type,
          onChange: (e) => setFormData(prev => ({ ...prev, communication_type: e.target.value })),
          className: 'w-full p-2 border border-gray-300 rounded text-sm'
        },
          React.createElement('option', { value: 'call' }, '📞 Phone Call'),
          React.createElement('option', { value: 'email' }, '📧 Email'),
          React.createElement('option', { value: 'whatsapp' }, '💬 WhatsApp'),
          React.createElement('option', { value: 'meeting' }, '🤝 Meeting')
        )
      ),

      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Direction'),
        React.createElement('select', {
          value: formData.direction,
          onChange: (e) => setFormData(prev => ({ ...prev, direction: e.target.value })),
          className: 'w-full p-2 border border-gray-300 rounded text-sm'
        },
          React.createElement('option', { value: 'outbound' }, '📤 Outbound'),
          React.createElement('option', { value: 'inbound' }, '📥 Inbound')
        )
      )
    ),

    React.createElement('div', null,
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Subject'),
      React.createElement('input', {
        type: 'text',
        value: formData.subject,
        onChange: (e) => setFormData(prev => ({ ...prev, subject: e.target.value })),
        className: 'w-full p-2 border border-gray-300 rounded text-sm',
        placeholder: 'Brief summary...'
      })
    ),

    React.createElement('div', null,
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Details'),
      React.createElement('textarea', {
        value: formData.content,
        onChange: (e) => setFormData(prev => ({ ...prev, content: e.target.value })),
        className: 'w-full p-2 border border-gray-300 rounded text-sm',
        rows: 3,
        placeholder: 'Detailed notes...'
      })
    ),

    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Outcome'),
        React.createElement('select', {
          value: formData.outcome,
          onChange: (e) => setFormData(prev => ({ ...prev, outcome: e.target.value })),
          className: 'w-full p-2 border border-gray-300 rounded text-sm'
        },
          React.createElement('option', { value: '' }, 'Select outcome...'),
          React.createElement('option', { value: 'interested' }, '✅ Interested'),
          React.createElement('option', { value: 'not_interested' }, '❌ Not Interested'),
          React.createElement('option', { value: 'follow_up' }, '🔄 Follow Up Required')
        )
      ),

      formData.communication_type === 'call' && React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Duration (min)'),
        React.createElement('input', {
          type: 'number',
          value: formData.duration_minutes,
          onChange: (e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value })),
          className: 'w-full p-2 border border-gray-300 rounded text-sm',
          placeholder: '15'
        })
      ),

      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Temperature'),
        React.createElement('select', {
          value: formData.temperature,
          onChange: (e) => setFormData(prev => ({ ...prev, temperature: e.target.value })),
          className: 'w-full p-2 border border-gray-300 rounded text-sm'
        },
          React.createElement('option', { value: 'hot' }, '🔥 Hot'),
          React.createElement('option', { value: 'warm' }, '🌡️ Warm'),
          React.createElement('option', { value: 'cold' }, '❄️ Cold')
        )
      )
    ),

    React.createElement('div', { className: 'flex gap-2 justify-end' },
      React.createElement('button', {
        type: 'button',
        onClick: onCancel,
        className: 'px-4 py-2 text-gray-600 hover:text-gray-800'
      }, 'Cancel'),
      React.createElement('button', {
        type: 'submit',
        className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      }, 'Log Communication')
    )
  );
};

// Communication helper functions
window.getCommIcon = (type) => {
  const icons = {
    call: '📞',
    email: '📧', 
    whatsapp: '💬',
    meeting: '🤝',
    sms: '📱',
    system: '🤖'
  };
  return icons[type] || '📝';
};

window.getOutcomeColor = (outcome) => {
  const colors = {
    interested: 'bg-green-100 text-green-800',
    not_interested: 'bg-red-100 text-red-800',
    follow_up: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800'
  };
  return colors[outcome] || 'bg-blue-100 text-blue-800';
};

// Communication utilities
window.formatCommunicationDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

window.getCommunicationSummary = (communications) => {
  const summary = {
    total: communications.length,
    calls: communications.filter(c => c.communication_type === 'call').length,
    emails: communications.filter(c => c.communication_type === 'email').length,
    meetings: communications.filter(c => c.communication_type === 'meeting').length,
    lastContact: communications.length > 0 ? communications[0].created_date : null,
    totalDuration: communications
      .filter(c => c.duration_minutes)
      .reduce((sum, c) => sum + (c.duration_minutes || 0), 0)
  };

  return summary;
};

window.getLastCommunicationOfType = (communications, type) => {
  return communications
    .filter(c => c.communication_type === type)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
};

window.getCommunicationsByOutcome = (communications, outcome) => {
  return communications.filter(c => c.outcome === outcome);
};

window.getRecentCommunications = (communications, days = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return communications.filter(c => new Date(c.created_date) >= cutoffDate);
};

// Auto-communication logging helper
window.logAutoSystemCommunication = async (leadId, subject, content, type = 'system') => {
  try {
    const commData = {
      lead_id: leadId,
      communication_type: type,
      direction: 'system',
      subject: subject,
      content: content,
      is_auto_logged: true,
      created_date: new Date().toISOString(),
      created_by: 'System'
    };

    const response = await window.apiCall('/communications', {
      method: 'POST',
      body: JSON.stringify(commData)
    });

    console.log('Auto-logged system communication:', response);
    return response;
  } catch (error) {
    console.error('Failed to auto-log communication:', error);
  }
};

// Communication analytics helper
window.getCommunicationAnalytics = (communications) => {
  const analytics = {
    engagementScore: 0,
    averageResponseTime: 0,
    preferredChannel: 'call',
    communicationTrend: 'stable'
  };

  if (communications.length === 0) return analytics;

  // Calculate engagement score based on communication frequency and outcomes
  const positiveOutcomes = communications.filter(c => 
    ['interested', 'follow_up'].includes(c.outcome)
  ).length;
  
  analytics.engagementScore = Math.min(100, 
    (positiveOutcomes / communications.length) * 100
  );

  // Find preferred communication channel
  const channelCounts = communications.reduce((acc, c) => {
    acc[c.communication_type] = (acc[c.communication_type] || 0) + 1;
    return acc;
  }, {});

  analytics.preferredChannel = Object.keys(channelCounts).reduce((a, b) => 
    channelCounts[a] > channelCounts[b] ? a : b
  );

  // Communication trend (simple version)
  const recentComms = window.getRecentCommunications(communications, 7);
  const olderComms = communications.filter(c => 
    !recentComms.some(recent => recent.id === c.id)
  ).slice(0, 7);

  if (recentComms.length > olderComms.length) {
    analytics.communicationTrend = 'increasing';
  } else if (recentComms.length < olderComms.length) {
    analytics.communicationTrend = 'decreasing';
  }

  return analytics;
};

// Communication reminder helper
window.shouldCreateFollowUpReminder = (communication) => {
  return communication.outcome === 'follow_up' && 
         !communication.follow_up_reminder_created;
};

window.createFollowUpReminder = async (communication, leadData) => {
  try {
    const reminderData = {
      lead_id: communication.lead_id,
      title: `Follow up on ${communication.communication_type}`,
      description: `Follow up required from communication: ${communication.subject || communication.content}`,
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      priority: 'medium',
      assigned_to: leadData.assigned_to || communication.created_by,
      created_by: 'System',
      auto_generated: true,
      communication_id: communication.id
    };

    const response = await window.apiCall('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData)
    });

    // Mark communication as having reminder created
    await window.apiCall(`/communications/${communication.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...communication,
        follow_up_reminder_created: true
      })
    });

    console.log('Follow-up reminder created:', response);
    return response;
  } catch (error) {
    console.error('Failed to create follow-up reminder:', error);
  }
};

console.log('✅ Communication Timeline System component loaded successfully');
