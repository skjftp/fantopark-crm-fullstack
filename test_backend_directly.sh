#!/bin/bash

echo "Testing backend lead update directly..."

# Get token from browser localStorage first
echo "1. Get your token from browser console: localStorage.getItem('token')"
echo "2. Replace YOUR_TOKEN_HERE below"
echo ""

TOKEN="YOUR_TOKEN_HERE"
API_URL="https://fantopark-backend-150582227311.us-central1.run.app/api"

# Test lead update
curl -X GET "$API_URL/leads" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.data[0]'

echo -e "\nNow test updating the first lead's status..."
