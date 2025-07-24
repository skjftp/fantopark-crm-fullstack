const axios = require('axios');
const whatsappConfig = require('../config/whatsappConfig');
const admin = require('../config/firebase');
const NodeCache = require('node-cache');
const moment = require('moment-timezone');

// Cache for conversation states (TTL: 24 hours)
const conversationCache = new NodeCache({ stdTTL: 86400 });

class WhatsAppService {
  constructor() {
    this.apiUrl = `${whatsappConfig.apiBaseUrl}/${whatsappConfig.apiVersion}`;
    this.phoneNumberId = whatsappConfig.phoneNumberId;
    this.accessToken = whatsappConfig.accessToken;
  }

  // Send a WhatsApp message
  async sendMessage(to, message) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(url, message, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error);
      throw error;
    }
  }

  // Send welcome message when lead is assigned
  async sendWelcomeMessage(leadData, assignedRep) {
    try {
      const phoneNumber = this.formatPhoneNumber(leadData.phone);
      
      // Template message with parameters
      const message = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: whatsappConfig.templates.welcomeMessage,
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: leadData.name || 'there' },
                { type: 'text', text: assignedRep.name },
                { type: 'text', text: assignedRep.phone || '' },
                { type: 'text', text: leadData.preferredTime || 'your preferred time' }
              ]
            }
          ]
        }
      };

      const result = await this.sendMessage(phoneNumber, message);

      // Log the communication
      await this.logCommunication(leadData.id, 'whatsapp', 'welcome_message', message);

      // Start qualification flow after a delay
      setTimeout(() => {
        this.startQualificationFlow(leadData);
      }, 30000); // 30 seconds delay

      return result;
    } catch (error) {
      console.error('Error sending welcome message:', error);
      throw error;
    }
  }

  // Start the qualification question flow
  async startQualificationFlow(leadData) {
    try {
      const phoneNumber = this.formatPhoneNumber(leadData.phone);
      const firstQuestion = whatsappConfig.qualificationQuestions[0];

      // Initialize conversation state
      const conversationState = {
        leadId: leadData.id,
        currentQuestion: firstQuestion.id,
        responses: {},
        startTime: moment().tz('Asia/Kolkata').format(),
        lastActivity: moment().tz('Asia/Kolkata').format()
      };

      conversationCache.set(phoneNumber, conversationState);

      // Send the first question
      await this.sendQuestion(phoneNumber, firstQuestion);

    } catch (error) {
      console.error('Error starting qualification flow:', error);
    }
  }

  // Send a qualification question
  async sendQuestion(phoneNumber, question) {
    let message;

    if (question.type === 'button') {
      // Interactive button message
      message = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: question.question
          },
          action: {
            buttons: question.options.map(opt => ({
              type: 'reply',
              reply: {
                id: opt.id,
                title: opt.title
              }
            }))
          }
        }
      };
    } else if (question.type === 'list') {
      // Interactive list message
      message = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: question.question
          },
          action: {
            button: 'Select an option',
            sections: [
              {
                title: 'Options',
                rows: question.options.map(opt => ({
                  id: opt.id,
                  title: opt.title,
                  description: opt.description
                }))
              }
            ]
          }
        }
      };
    }

    await this.sendMessage(phoneNumber, message);
  }

  // Process incoming WhatsApp message
  async processIncomingMessage(webhookData) {
    try {
      const message = webhookData.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message) return;

      const phoneNumber = message.from;
      const conversationState = conversationCache.get(phoneNumber);

      if (!conversationState) {
        // No active conversation, ignore or send a generic message
        return;
      }

      // Process the response
      if (message.type === 'interactive') {
        const responseId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;
        await this.handleQuestionResponse(phoneNumber, responseId, conversationState);
      } else if (message.type === 'text') {
        // Handle free text responses if needed
        await this.handleTextResponse(phoneNumber, message.text.body, conversationState);
      }

    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  // Handle question response
  async handleQuestionResponse(phoneNumber, responseId, conversationState) {
    try {
      const currentQuestion = whatsappConfig.qualificationQuestions.find(
        q => q.id === conversationState.currentQuestion
      );

      if (!currentQuestion) return;

      // Find the selected option
      const selectedOption = currentQuestion.options.find(opt => opt.id === responseId);
      if (!selectedOption) return;

      // Store the response
      conversationState.responses[currentQuestion.id] = {
        question: currentQuestion.question,
        answer: selectedOption.title,
        value: selectedOption.value,
        timestamp: moment().tz('Asia/Kolkata').format()
      };

      // Update conversation state
      conversationState.lastActivity = moment().tz('Asia/Kolkata').format();

      // Save response to lead details
      await this.saveResponseToLead(conversationState.leadId, currentQuestion.id, selectedOption);

      // Move to next question or complete the flow
      if (currentQuestion.nextQuestion) {
        const nextQuestion = whatsappConfig.qualificationQuestions.find(
          q => q.id === currentQuestion.nextQuestion
        );
        
        if (nextQuestion) {
          conversationState.currentQuestion = nextQuestion.id;
          conversationCache.set(phoneNumber, conversationState);
          await this.sendQuestion(phoneNumber, nextQuestion);
        }
      } else {
        // Qualification complete
        await this.completeQualification(phoneNumber, conversationState);
      }

    } catch (error) {
      console.error('Error handling question response:', error);
    }
  }

  // Complete the qualification flow
  async completeQualification(phoneNumber, conversationState) {
    try {
      // Calculate lead score
      let totalScore = 0;
      let maxScore = 0;

      for (const [questionId, response] of Object.entries(conversationState.responses)) {
        const scoring = whatsappConfig.leadScoring[questionId];
        if (scoring && scoring[response.value]) {
          totalScore += scoring[response.value];
        }
        maxScore += 3; // Max score per question is 3
      }

      const leadScore = Math.round((totalScore / maxScore) * 100);

      // Update lead with qualification data
      const db = admin.firestore();
      const leadRef = db.collection('crm_leads').doc(conversationState.leadId);
      
      await leadRef.update({
        whatsappQualification: {
          responses: conversationState.responses,
          score: leadScore,
          completedAt: moment().tz('Asia/Kolkata').format(),
          duration: moment().diff(moment(conversationState.startTime), 'minutes')
        },
        leadScore: leadScore,
        qualificationStatus: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Send completion message
      const completionMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'Thank you for providing this information! Your relationship manager will contact you soon with personalized recommendations based on your preferences.'
        }
      };

      await this.sendMessage(phoneNumber, completionMessage);

      // Log activity
      await this.logActivity(conversationState.leadId, 'qualification_completed', {
        score: leadScore,
        responses: conversationState.responses
      });

      // Clear conversation cache
      conversationCache.del(phoneNumber);

    } catch (error) {
      console.error('Error completing qualification:', error);
    }
  }

  // Save individual response to lead
  async saveResponseToLead(leadId, questionId, response) {
    try {
      const db = admin.firestore();
      const leadRef = db.collection('crm_leads').doc(leadId);

      // Update lead with the response
      await leadRef.update({
        [`qualificationResponses.${questionId}`]: {
          question: response.question,
          answer: response.title,
          value: response.value,
          answeredAt: moment().tz('Asia/Kolkata').format()
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Error saving response to lead:', error);
    }
  }

  // Format phone number for WhatsApp
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  // Log communication
  async logCommunication(leadId, channel, type, content) {
    try {
      const db = admin.firestore();
      const communicationData = {
        leadId,
        channel,
        type,
        content: JSON.stringify(content),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: moment().tz('Asia/Kolkata').format()
      };

      await db.collection('crm_communications').add(communicationData);
    } catch (error) {
      console.error('Error logging communication:', error);
    }
  }

  // Log activity
  async logActivity(leadId, action, details) {
    try {
      const db = admin.firestore();
      const activityData = {
        leadId,
        action,
        details,
        channel: 'whatsapp',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: moment().tz('Asia/Kolkata').format()
      };

      await db.collection('crm_activities').add(activityData);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Handle text responses (fallback)
  async handleTextResponse(phoneNumber, text, conversationState) {
    // For now, just prompt to use the buttons
    const message = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: 'Please select one of the options provided above to continue.'
      }
    };

    await this.sendMessage(phoneNumber, message);
  }
}

module.exports = new WhatsAppService();