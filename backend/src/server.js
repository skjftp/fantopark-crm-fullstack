const express = require('express');
const path = require("path");
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enhanced CORS Configuration for Production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000', 
  'http://localhost:8080',
  'https://skjftp.github.io',
  'https://lehrado.com',        // Your production domain
  'https://www.lehrado.com',    // www variant
  /^https:\/\/fantopark-.*\.vercel\.app$/,
  /^https:\/\/.*-skjftps-projects\.vercel\.app$/,
  /^https:\/\/.*\.netlify\.app$/,  // Netlify domains
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    console.log('🔍 CORS Check - Origin:', origin);
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS - Exact match allowed:', origin);
      return callback(null, true);
    }
    
    // Check regex patterns
    for (const pattern of allowedOrigins) {
      if (pattern instanceof RegExp && pattern.test(origin)) {
        console.log('✅ CORS - Pattern match allowed:', origin);
        return callback(null, true);
      }
    }
    
    console.log('❌ CORS - Origin not allowed:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Additional CORS headers for better compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers explicitly for better compatibility
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.some(pattern => 
    pattern instanceof RegExp && pattern.test(origin)))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS Preflight handled for:', req.url);
    return res.status(200).end();
  }
  
  next();
});

// Debug CORS and requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'None'}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/payables', require('./routes/payables'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/receivables', require('./routes/receivables'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/stadiums', require('./routes/stadiums'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/assignment-rules', require('./routes/assignmentRules'));
app.use('/api/events', require('./routes/events'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'Development',
    corsOrigins: allowedOrigins.length
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    origin: req.headers.origin,
    message: 'CORS is working correctly',
    timestamp: new Date()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error(err.stack);
  
  // CORS-specific error handling
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS policy violation',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins.filter(origin => typeof origin === 'string')
    });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Access via: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 CORS test: http://localhost:${PORT}/api/cors-test`);
  console.log(`✅ CORS configured for:`, allowedOrigins);
});

module.exports = app;
