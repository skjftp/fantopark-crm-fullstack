#!/bin/bash
echo "🚀 Starting LOCAL development environment..."

# Get current directory
PROJECT_DIR=$(pwd)

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping development servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend locally (optional)
echo "📡 Starting backend on http://localhost:8080"
cd ~/fantopark-crm-fullstack/backend

# Set development environment
export NODE_ENV=development
export JWT_SECRET=local-dev-secret-key

# Start backend in background
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend locally
echo "🌐 Starting frontend on http://localhost:3000"
cd ~/fantopark-crm-fullstack/frontend

# Create local dev version that connects to localhost backend
cp public/index.html public/index-local.html
sed -i 's|https://fantopark-backend-150582227311.us-central1.run.app|http://localhost:8080|g' public/index-local.html
sed -i 's|https://fantopark-backend-dev-[^/]*|http://localhost:8080|g' public/index-local.html
sed -i 's|<title>FanToPark CRM[^<]*</title>|<title>FanToPark CRM - LOCAL DEV</title>|g' public/index-local.html
sed -i 's|<body>|<body><div style="background:#28a745;color:white;text-align:center;padding:8px;font-weight:bold;font-size:14px;">💻 LOCAL DEVELOPMENT 💻</div>|g' public/index-local.html

echo ""
echo "🎉 Development environment ready!"
echo "📡 Backend:  http://localhost:8080"
echo "🌐 Frontend: http://localhost:3000"
echo "🗄️  Database: dev_crm_* collections"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start frontend server
cd public
python3 -m http.server 3000 --bind 127.0.0.1 &
FRONTEND_PID=$!

# Wait for user to stop
wait
