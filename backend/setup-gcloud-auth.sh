#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Setting up Google Cloud Authentication (No Keys Required)${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    echo -e "${YELLOW}Please install it first:${NC}"
    echo "brew install --cask google-cloud-sdk"
    echo "Or download from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo -e "${GREEN}✅ gcloud CLI found${NC}"

# Step 1: Login to Google Cloud
echo -e "\n${YELLOW}Step 1: Login to Google Cloud${NC}"
echo "This will open a browser window. Please login with your Google account that has access to the FanToPark project."
echo -e "${YELLOW}Press Enter to continue...${NC}"
read

gcloud auth login

# Step 2: Set application default credentials
echo -e "\n${YELLOW}Step 2: Set Application Default Credentials${NC}"
echo "This will open another browser window. Use the same account."
echo -e "${YELLOW}Press Enter to continue...${NC}"
read

gcloud auth application-default login

# Step 3: Set the project
echo -e "\n${YELLOW}Step 3: Setting default project${NC}"
gcloud config set project enduring-wharf-464005-h7

# Verify project is set
PROJECT=$(gcloud config get-value project)
echo -e "${GREEN}✅ Project set to: $PROJECT${NC}"

# Step 4: Create .env file if it doesn't exist
echo -e "\n${YELLOW}Step 4: Setting up .env file${NC}"

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Google Cloud Project (no credentials path needed with gcloud auth!)
GOOGLE_CLOUD_PROJECT=enduring-wharf-464005-h7

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d

# Server Configuration
PORT=8080
NODE_ENV=development

# Meta/Facebook Configuration (update these with your values)
META_VERIFY_TOKEN=fantopark_webhook_verify_2024
META_APP_SECRET=your-meta-app-secret
META_PAGE_ACCESS_TOKEN=your-page-access-token
META_APP_ID=2419177785089121

# WhatsApp Configuration (optional)
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token

# Email Configuration (optional)
EMAIL_FROM=noreply@fantopark.com
SENDGRID_API_KEY=your-sendgrid-api-key

# Cron Token (optional, for scheduled jobs)
CRON_TOKEN=$(openssl rand -base64 32)
EOF
    echo -e "${GREEN}✅ Created .env file${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    echo "Make sure it has GOOGLE_CLOUD_PROJECT=enduring-wharf-464005-h7"
    echo "And does NOT have GOOGLE_APPLICATION_CREDENTIALS set"
fi

# Step 5: Test the connection
echo -e "\n${YELLOW}Step 5: Testing Firebase connection${NC}"

if [ -f test-firebase-connection.js ]; then
    echo "Running connection test..."
    node test-firebase-connection.js
else
    # Create a simple test
    cat > test-auth.js << 'EOF'
require('dotenv').config();
const { db } = require('./src/config/db');

async function test() {
  try {
    console.log('Testing Firebase connection...');
    const collections = await db.listCollections();
    console.log(`✅ Connected! Found ${collections.length} collections`);
    console.log('Collections:', collections.map(c => c.id).join(', '));
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}
test();
EOF
    node test-auth.js
    rm test-auth.js
fi

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "${YELLOW}You can now run:${NC}"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}To run the stats aggregation:${NC}"
echo "  node src/scripts/run-stats-aggregation.js"
echo ""
echo -e "${YELLOW}Your auth status:${NC}"
gcloud auth list