#!/bin/bash
echo "Checking backend deployment status..."
echo ""

# Check if the DELETE routes are working
API_URL="https://fantopark-backend-ofkn6rpg3a-uc.a.run.app"

echo "Testing API health..."
curl -s "$API_URL/health" || echo "API might be updating..."

echo ""
echo "To manually trigger deployment:"
echo "1. Go to: https://console.cloud.google.com/cloud-build/triggers"
echo "2. Click 'RUN' on the fantopark-backend trigger"
echo ""
echo "Deployment usually takes 5-10 minutes."
