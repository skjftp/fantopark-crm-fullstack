#!/bin/bash

# Deploy backend to Google Cloud Run with environment variables

echo "🚀 Deploying FanToPark Backend to Cloud Run..."

gcloud run deploy fantopark-backend \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="META_APP_SECRET=7611662ab8e4e65375347effda257067" \
  --set-env-vars="META_VERIFY_TOKEN=fantopark-webhook-verify-2024" \
  --set-env-vars="META_PAGE_ACCESS_TOKEN=EAAiYOriHXGEBPKt8IxBWZBV0KxKb3qMRAVPkajZABR2yKWQUl8ZAwQ9iEutkleVm2ViIQlLmJfywY0DipqgUwvwH35nxHtXXTDEE1FkNPdBgWnL6LxNI5xl8t69Q0Y8DB4Limwu1vSLcntR7Goc3w5uH1jhGBBemqYsgs7ZBsJ6vfMnUKC7l5o9WMQZDZD" \
  --set-env-vars="FACEBOOK_PIXEL_ID=1981449415649203" \
  --set-env-vars="FACEBOOK_APP_ID=2419177785089121" \
  --set-env-vars="FACEBOOK_CONVERSIONS_ACCESS_TOKEN=EAAiYOriHXGEBPBr0E8HVt3gXpwiLAI1IEJaX8n7brytGJZANwcZA5dR7tLxV0XMZBgX86ZB54F3RtjG0Mk8CKkgr9DoDG3GkMYZCSKb7FQW7wHTbVmiilfXM1L3MGENb8ydcggsw6ApmZBbRbkte8Yrw3kajRZAns8KR0iMC9rT3ZAc575ude77wcTfFQB2eCzXQmXYZD" \
  --set-env-vars="BASE_URL=https://crm.fantopark.com" \
  --set-env-vars="WEBSITE_API_USERNAME=mukesh.chandra@fantopark.com" \
  --set-env-vars="WEBSITE_API_PASSWORD=abcd" \
  --set-env-vars="WHATSAPP_BUSINESS_ACCOUNT_ID=609901035292191" \
  --set-env-vars="WHATSAPP_PHONE_NUMBER_ID=604435462747094"

echo "✅ Deployment command executed. Check the output above for status."