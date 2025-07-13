// ===============================================
// UPDATED BACKEND CORS CONFIGURATION
// Update your backend/server.js CORS section
// ===============================================

const express = require('express');
const path = require("path");
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ FIXED: Updated allowedOrigins to include Cloud Workstations
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000', 
  'http://localhost:8080',
  'https://skjftp.github.io',
  'https://lehrado.com',
  'https://www.lehrado.com',
  // ✅ ADD: Cloud Workstation patterns
  /^https:\/\/\d+-.*\.cluster-.*\.cloudworkstations\.dev$/,
  /^https:\/\/.*-my-workstation\.cluster-.*\.cloudworkstations\.dev$/
];

// ✅ UPDATED: More flexible CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ UPDATED: Enhanced CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check origin against patterns
  const isAllowed = allowedOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === origin;
    } else if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    return false;
  });
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Rest of your server configuration remains the same...
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

// ✅ UPDATED: Enhanced health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'Development',
    corsOrigins: allowedOrigins.length,
    port: PORT,
    origin: req.headers.origin
  });
});

// ✅ UPDATED: Enhanced CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  const origin = req.headers.origin;
  const isAllowed = allowedOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === origin;
    } else if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    return false;
  });

  res.json({
    success: true,
    origin: origin,
    isAllowed: isAllowed,
    message: isAllowed ? 'CORS is working correctly' : 'Origin not allowed',
    timestamp: new Date(),
    allowedPatterns: allowedOrigins.map(o => o.toString())
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error(err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS policy violation',
      origin: req.headers.origin,
      allowedPatterns: allowedOrigins.map(o => o.toString())
    });
  }
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    timestamp: new Date()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Access via: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 CORS test: http://localhost:${PORT}/api/cors-test`);
  console.log(`✅ CORS configured for Cloud Workstations and other origins`);
  console.log(`📁 Routes loaded successfully`);
});

module.exports = app;
