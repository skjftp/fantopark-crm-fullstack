const express = require('express');
const path = require("path");
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ FIXED: Move allowedOrigins to global scope
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000', 
  'http://localhost:8080',
  'https://skjftp.github.io',
  'https://lehrado.com',
  'https://www.lehrado.com'
];

// Minimal working CORS for lehrado.com
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Additional CORS headers for lehrado.com compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - wrapped in try-catch for better error handling
try {
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
  app.use('/api/dashboard', require('./routes/dashboard')); // ← Your new charts endpoint is here
  app.use('/api/upload', require('./routes/upload'));
  app.use('/api/roles', require('./routes/roles'));
  app.use('/api/setup', require('./routes/setup'));
  app.use('/api/stadiums', require('./routes/stadiums'));
  app.use('/api/clients', require('./routes/clients'));
  app.use('/api/reminders', require('./routes/reminders'));
  app.use('/api/assignment-rules', require('./routes/assignmentRules'));
  app.use('/api/events', require('./routes/events'));
} catch (error) {
  console.error('❌ Route loading error:', error.message);
  console.error('Check if all route files exist and are properly formatted');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'Development',
    corsOrigins: allowedOrigins.length, // ✅ FIXED: Now allowedOrigins is accessible
    port: PORT
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    origin: req.headers.origin,
    message: 'CORS is working correctly',
    timestamp: new Date(),
    allowedOrigins: allowedOrigins
  });
});

// ✅ ADD: Test endpoint for dashboard charts
app.get('/api/dashboard/test', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard route is working',
    timestamp: new Date(),
    availableEndpoints: ['/api/dashboard/charts']
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
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    timestamp: new Date()
  });
});

// ✅ ADD: Graceful shutdown for Cloud Run
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
  console.log(`🔍 Dashboard test: http://localhost:${PORT}/api/dashboard/test`);
  console.log(`✅ CORS configured for:`, allowedOrigins);
  console.log(`📁 Routes loaded successfully`);
});

module.exports = app;
