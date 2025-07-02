const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://localhost:8080',
  /^https:\/\/fantopark-.*\.vercel\.app$/,  // Matches any fantopark Vercel preview URL
  /^https:\/\/.*-skjftps-projects\.vercel\.app$/,  // Matches any of your Vercel deployments
];

module.exports = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const allowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
