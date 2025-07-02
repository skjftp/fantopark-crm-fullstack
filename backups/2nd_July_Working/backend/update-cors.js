// Add this to your CORS configuration in server.js
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://localhost:8080',
    'https://skjftp.github.io',  // Add this line
    'https://fantopark-crm-fullstack.web.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
