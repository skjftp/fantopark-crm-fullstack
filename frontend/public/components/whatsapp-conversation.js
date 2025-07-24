async function WhatsAppConversation(leadId) {
  try {
    // Fetch lead details and WhatsApp conversations
    const [leadResponse, communicationsResponse] = await Promise.all([
      makeApiCall(`/api/leads/${leadId}`),
      makeApiCall(`/api/communications?leadId=${leadId}&channel=whatsapp`)
    ]);

    const lead = leadResponse;
    const communications = communicationsResponse || [];

    // Get qualification responses if available
    const qualificationData = lead.whatsappQualification || {};
    const qualificationResponses = lead.qualificationResponses || {};

    return `
      <div class="whatsapp-conversation-container">
        <div class="whatsapp-header">
          <i class="fab fa-whatsapp"></i>
          <h3>WhatsApp Conversation</h3>
          ${lead.phone ? `
            <button class="btn btn-sm btn-primary" onclick="sendWhatsAppMessage('${leadId}')">
              <i class="fas fa-paper-plane"></i> Send Message
            </button>
          ` : ''}
        </div>

        ${qualificationData.score ? `
          <div class="qualification-summary">
            <h4>Lead Qualification</h4>
            <div class="qualification-score">
              <div class="score-circle ${getScoreClass(qualificationData.score)}">
                ${qualificationData.score}%
              </div>
              <div class="score-details">
                <p><strong>Status:</strong> ${lead.qualificationStatus || 'Pending'}</p>
                <p><strong>Completed:</strong> ${formatDateTime(qualificationData.completedAt)}</p>
                <p><strong>Duration:</strong> ${qualificationData.duration || 0} minutes</p>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="qualification-responses">
          <h4>Qualification Responses</h4>
          ${Object.keys(qualificationResponses).length > 0 ? `
            <div class="responses-list">
              ${Object.entries(qualificationResponses).map(([key, response]) => `
                <div class="response-item">
                  <div class="response-question">${response.question}</div>
                  <div class="response-answer">
                    <strong>${response.answer}</strong>
                    <span class="response-time">${formatDateTime(response.answeredAt)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<p class="no-responses">No qualification responses yet</p>'}
        </div>

        <div class="conversation-history">
          <h4>Message History</h4>
          ${communications.length > 0 ? `
            <div class="messages-list">
              ${communications.map(comm => {
                let content;
                try {
                  content = JSON.parse(comm.content);
                } catch (e) {
                  content = { text: comm.content };
                }
                
                return `
                  <div class="message-item ${comm.type}">
                    <div class="message-type">${formatMessageType(comm.type)}</div>
                    <div class="message-content">
                      ${formatMessageContent(content)}
                    </div>
                    <div class="message-time">${formatDateTime(comm.createdAt)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<p class="no-messages">No WhatsApp messages yet</p>'}
        </div>
      </div>

      <style>
        .whatsapp-conversation-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }

        .whatsapp-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
        }

        .whatsapp-header i {
          color: #25D366;
          font-size: 24px;
        }

        .whatsapp-header h3 {
          flex: 1;
          margin: 0;
        }

        .qualification-summary {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .qualification-score {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 10px;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: white;
        }

        .score-circle.high {
          background: #10b981;
        }

        .score-circle.medium {
          background: #f59e0b;
        }

        .score-circle.low {
          background: #ef4444;
        }

        .score-details p {
          margin: 5px 0;
        }

        .qualification-responses,
        .conversation-history {
          margin-top: 25px;
        }

        .responses-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .response-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }

        .response-question {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 5px;
        }

        .response-answer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .response-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
          max-height: 400px;
          overflow-y: auto;
        }

        .message-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }

        .message-item.welcome_message {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .message-type {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .message-content {
          margin: 10px 0;
          line-height: 1.5;
        }

        .message-time {
          font-size: 12px;
          color: #9ca3af;
          text-align: right;
        }

        .no-responses,
        .no-messages {
          color: #6b7280;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }

        @media (max-width: 768px) {
          .whatsapp-conversation-container {
            padding: 15px;
          }

          .score-circle {
            width: 60px;
            height: 60px;
            font-size: 20px;
          }

          .qualification-score {
            flex-direction: column;
            text-align: center;
          }
        }
      </style>
    `;
  } catch (error) {
    console.error('Error loading WhatsApp conversation:', error);
    return `
      <div class="error-message">
        <p>Error loading WhatsApp conversation</p>
      </div>
    `;
  }
}

// Helper functions
function getScoreClass(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function formatMessageType(type) {
  const types = {
    'welcome_message': 'Welcome Message',
    'qualification_question': 'Qualification Question',
    'qualification_response': 'Lead Response',
    'manual_message': 'Manual Message'
  };
  return types[type] || type;
}

function formatMessageContent(content) {
  if (typeof content === 'string') {
    return `<p>${content}</p>`;
  }
  
  if (content.text) {
    return `<p>${content.text.body || content.text}</p>`;
  }
  
  if (content.template) {
    return `<p><em>Template: ${content.template.name}</em></p>`;
  }
  
  if (content.interactive) {
    return `
      <div>
        <p>${content.interactive.body?.text || ''}</p>
        ${content.interactive.action?.buttons ? `
          <div class="buttons">
            ${content.interactive.action.buttons.map(btn => 
              `<span class="button-option">${btn.reply.title}</span>`
            ).join(' ')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  return '<p><em>Message content</em></p>';
}

// Function to send WhatsApp message
async function sendWhatsAppMessage(leadId) {
  if (confirm('This will send a WhatsApp welcome message to the lead. Continue?')) {
    try {
      showLoader();
      const response = await makeApiCall('/api/whatsapp/send-welcome', 'POST', { leadId });
      hideLoader();
      
      if (response.success) {
        showNotification('WhatsApp message sent successfully!', 'success');
        // Reload the conversation
        const container = document.querySelector('.whatsapp-conversation-container').parentElement;
        container.innerHTML = await WhatsAppConversation(leadId);
      } else {
        showNotification(response.error || 'Failed to send message', 'error');
      }
    } catch (error) {
      hideLoader();
      showNotification('Error sending WhatsApp message', 'error');
    }
  }
}