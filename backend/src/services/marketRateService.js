// backend/src/services/marketRateService.js
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache with configurable TTL to respect rate limits
const marketRateCache = new NodeCache({ 
  stdTTL: parseInt(process.env.MARKET_RATE_CACHE_TTL || '900') 
});

// Partner configurations
const PARTNER_CONFIGS = {
  xs2event: {
    name: 'XS2Event',
    baseUrl: process.env.XS2EVENT_API_URL || 'https://api.xs2event.com/v1',
    authType: 'apikey',
    credentials: {
      // Use environment variable or update here with actual API key
      apiKey: process.env.XS2EVENT_API_KEY || 'YOUR_XS2EVENT_API_KEY_HERE'
    },
    rateLimit: {
      maxRequests: parseInt(process.env.XS2EVENT_RATE_LIMIT || '100'),
      windowMs: 3600000 // 1 hour
    }
  }
  // Future partners can be added here
};

// Rate limiter tracking
const rateLimiters = {};

class MarketRateService {
  constructor() {
    this.initializeRateLimiters();
  }

  initializeRateLimiters() {
    Object.keys(PARTNER_CONFIGS).forEach(partner => {
      rateLimiters[partner] = {
        requests: [],
        maxRequests: PARTNER_CONFIGS[partner].rateLimit.maxRequests,
        windowMs: PARTNER_CONFIGS[partner].rateLimit.windowMs
      };
    });
  }

  // Check if we're within rate limits
  canMakeRequest(partner) {
    const limiter = rateLimiters[partner];
    const now = Date.now();
    
    // Remove old requests outside the window
    limiter.requests = limiter.requests.filter(
      timestamp => now - timestamp < limiter.windowMs
    );
    
    return limiter.requests.length < limiter.maxRequests;
  }

  // Record a request
  recordRequest(partner) {
    rateLimiters[partner].requests.push(Date.now());
  }

  // Get cache key for a search
  getCacheKey(partner, eventName, additionalParams = {}) {
    const params = { eventName, ...additionalParams };
    return `${partner}_${JSON.stringify(params)}`;
  }

  // Fetch from XS2Event
  async fetchFromXS2Event(eventName, alternativeName = null) {
    const config = PARTNER_CONFIGS.xs2event;
    
    // Validate API key
    if (!config.credentials.apiKey || config.credentials.apiKey === 'YOUR_XS2EVENT_API_KEY_HERE') {
      throw new Error('XS2Event API key not configured. Please set XS2EVENT_API_KEY environment variable or update marketRateService.js');
    }
    
    // Check rate limit
    if (!this.canMakeRequest('xs2event')) {
      throw new Error('Rate limit exceeded for XS2Event. Please try again later.');
    }

    // Check cache first
    const cacheKey = this.getCacheKey('xs2event', eventName, { alternativeName });
    const cachedData = marketRateCache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data for:', eventName);
      return cachedData;
    }

    try {
      // Record the request
      this.recordRequest('xs2event');

      // API Key authentication header
      const headers = {
        'x-api-key': config.credentials.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      // Search for events by name
      const searchName = alternativeName || eventName;
      const today = new Date().toISOString().split('T')[0];
      
      // First, search for events
      const eventsResponse = await axios.get(
        `${config.baseUrl}/events`,
        {
          params: {
            event_name: searchName, // Direct name search parameter
            date_start: `ge:${today}`, // Events starting today or later
            page_size: 10,
            sorting: 'date_start:asc' // Sort by start date
          },
          headers
        }
      );

      if (!eventsResponse.data || !eventsResponse.data.events || eventsResponse.data.events.length === 0) {
        return {
          partner: 'xs2event',
          eventName: searchName,
          found: false,
          tickets: [],
          searchedAt: new Date().toISOString()
        };
      }

      // Get the first matching event from the events array
      const event = eventsResponse.data.events[0];
      
      // Fetch tickets for this event
      const ticketsResponse = await axios.get(
        `${config.baseUrl}/tickets`,
        {
          params: {
            event_id: event.event_id,
            ticket_status: 'available',
            stock: 'gt:0' // Only tickets with stock > 0
          },
          headers
        }
      );

      // Group tickets by category as recommended in docs
      const ticketGroups = {};
      ticketsResponse.data.forEach(ticket => {
        const groupKey = `${ticket.category_id}_${ticket.sub_category}`;
        if (!ticketGroups[groupKey]) {
          ticketGroups[groupKey] = {
            category: ticket.category_name || ticket.category_id,
            subCategory: ticket.sub_category,
            tickets: []
          };
        }
        ticketGroups[groupKey].tickets.push(ticket);
      });

      const result = {
        partner: 'xs2event',
        eventName: searchName,
        found: true,
        eventDetails: {
          id: event.event_id,
          name: event.event_name,
          date: event.date_start,
          venue: event.venue_name,
          city: event.city,
          sport: event.sport_type
        },
        ticketGroups: Object.values(ticketGroups).map(group => ({
          category: group.category,
          subCategory: group.subCategory,
          lowestPrice: Math.min(...group.tickets.map(t => t.price)),
          highestPrice: Math.max(...group.tickets.map(t => t.price)),
          totalQuantity: group.tickets.reduce((sum, t) => sum + (t.stock || 0), 0),
          tickets: group.tickets.map(ticket => ({
            ticketId: ticket.ticket_id,
            price: ticket.price,
            currency: ticket.currency || 'USD',
            quantity: ticket.stock,
            section: ticket.section,
            row: ticket.row,
            seat: ticket.seat,
            deliveryType: ticket.delivery_type,
            ticketType: ticket.ticket_type,
            validity: ticket.ticket_validity
          }))
        })),
        rawTicketCount: ticketsResponse.data.length,
        searchedAt: new Date().toISOString()
      };

      // Cache the result
      marketRateCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error fetching from XS2Event:', error.message);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        throw new Error(`XS2Event API error: ${error.response.status} - ${error.response.statusText}`);
      }
      
      throw error;
    }
  }

  // Main method to fetch market rates
  async fetchMarketRates(eventName, options = {}) {
    const { partners = ['xs2event'], alternativeName } = options;
    const results = [];

    for (const partner of partners) {
      try {
        let result;
        
        switch (partner) {
          case 'xs2event':
            result = await this.fetchFromXS2Event(eventName, alternativeName);
            break;
          // Add more partners here in the future
          default:
            console.warn(`Unknown partner: ${partner}`);
            continue;
        }

        results.push(result);
      } catch (error) {
        console.error(`Error fetching from ${partner}:`, error.message);
        results.push({
          partner,
          eventName,
          error: error.message,
          searchedAt: new Date().toISOString()
        });
      }
    }

    return results;
  }

  // Get rate limit status
  getRateLimitStatus(partner) {
    if (!rateLimiters[partner]) {
      return { error: 'Unknown partner' };
    }

    const limiter = rateLimiters[partner];
    const now = Date.now();
    
    // Clean old requests
    limiter.requests = limiter.requests.filter(
      timestamp => now - timestamp < limiter.windowMs
    );

    return {
      partner,
      used: limiter.requests.length,
      limit: limiter.maxRequests,
      remaining: limiter.maxRequests - limiter.requests.length,
      resetsIn: limiter.requests.length > 0 
        ? Math.ceil((limiter.requests[0] + limiter.windowMs - now) / 1000) 
        : 0
    };
  }

  // Clear cache for specific event or all
  clearCache(eventName = null) {
    if (eventName) {
      const keys = marketRateCache.keys();
      keys.forEach(key => {
        if (key.includes(eventName)) {
          marketRateCache.del(key);
        }
      });
    } else {
      marketRateCache.flushAll();
    }
  }
}

module.exports = new MarketRateService();
