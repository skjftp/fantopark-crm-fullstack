const whatsappConfig = {
  // WhatsApp Business API Configuration
  apiVersion: 'v18.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN,
  
  // API Endpoints
  apiBaseUrl: 'https://graph.facebook.com',
  
  // Message Templates
  templates: {
    welcomeMessage: 'lead_welcome_v1',
    qualificationStart: 'lead_qualification_v1'
  },
  
  // Qualification Questions Flow
  qualificationQuestions: [
    {
      id: 'budget',
      question: 'What is your budget range for this event?',
      type: 'button',
      options: [
        { id: 'budget_1', title: 'Under ₹50,000', value: '<50000' },
        { id: 'budget_2', title: '₹50,000 - ₹1,00,000', value: '50000-100000' },
        { id: 'budget_3', title: 'Above ₹1,00,000', value: '>100000' }
      ],
      nextQuestion: 'group_size'
    },
    {
      id: 'group_size',
      question: 'How many people will be attending?',
      type: 'button',
      options: [
        { id: 'size_1', title: '1-5 people', value: '1-5' },
        { id: 'size_2', title: '6-15 people', value: '6-15' },
        { id: 'size_3', title: 'More than 15', value: '>15' }
      ],
      nextQuestion: 'decision_timeline'
    },
    {
      id: 'decision_timeline',
      question: 'When do you plan to make a decision?',
      type: 'button',
      options: [
        { id: 'timeline_1', title: 'Within a week', value: '<7days' },
        { id: 'timeline_2', title: '2-4 weeks', value: '2-4weeks' },
        { id: 'timeline_3', title: 'Not sure yet', value: 'undecided' }
      ],
      nextQuestion: 'preferred_seats'
    },
    {
      id: 'preferred_seats',
      question: 'Do you have any seating preferences?',
      type: 'list',
      options: [
        { id: 'seats_1', title: 'Premium/VIP seats', description: 'Best view and amenities' },
        { id: 'seats_2', title: 'Regular seats', description: 'Standard seating' },
        { id: 'seats_3', title: 'No preference', description: 'Any available seats' }
      ],
      nextQuestion: null // End of flow
    }
  ],
  
  // Lead Scoring based on answers
  leadScoring: {
    budget: {
      '<50000': 1,
      '50000-100000': 2,
      '>100000': 3
    },
    group_size: {
      '1-5': 1,
      '6-15': 2,
      '>15': 3
    },
    decision_timeline: {
      '<7days': 3,
      '2-4weeks': 2,
      'undecided': 1
    },
    preferred_seats: {
      'Premium/VIP seats': 3,
      'Regular seats': 2,
      'No preference': 1
    }
  }
};

module.exports = whatsappConfig;