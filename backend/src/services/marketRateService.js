// backend/src/services/marketRateService.js
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache with 15 minute TTL to respect rate limits
const marketRateCache = new NodeCache({ stdTTL: 900 });

// Partner configurations
const PARTNER_CONFIGS = {
  xs2event: {
    name: 'XS2Event',
    baseUrl: 'https://api.xs2event.com/v1',
    authType: 'basic',
    credentials: {
      username: 'akshay@fantopark.com',
      password: 'FanToPark@2026'
    },
    rateLimit: {
      maxRequests: 100,
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

      // Create auth header
      const auth = Buffer.from(
        `${config.credentials.username}:${config.credentials.password}`
      ).toString('base64');

      // Search for the event
      const searchName = alternativeName || eventName;
      const searchResponse = await axios.get(
        `${config.baseUrl}/events/search`,
        {
          params: {
            q: searchName,
            limit: 10
          },
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!searchResponse.data || searchResponse.data.length === 0) {
        return {
          partner: 'xs2event',
          eventName: searchName,
          found: false,
          tickets: [],
          searchedAt: new Date().toISOString()
        };
      }

      // Get the first matching event
      const event = searchResponse.data[0];
      
      // Fetch ticket details for the event
      const ticketsResponse = await axios.get(
        `${config.baseUrl}/events/${event.id}/tickets`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      const result = {
        partner: 'xs2event',
        eventName: searchName,
        found: true,
        eventDetails: {
          id: event.id,
          name: event.name,
          date: event.date,
          venue: event.venue,
          city: event.city
        },
        tickets: ticketsResponse.data.map(ticket => ({
          category: ticket.category,
          section: ticket.section,
          row: ticket.row,
          quantity: ticket.quantity_available,
          price: ticket.price,
          currency: ticket.currency,
          sellerType: ticket.seller_type,
          deliveryMethod: ticket.delivery_method,
          listingId: ticket.listing_id
        })),
        searchedAt: new Date().toISOString()
      };

      // Cache the result
      marketRateCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error fetching from XS2Event:', error.message);
      
      if (error.response) {
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
