#!/bin/bash
echo "🚀 Deploying production backend..."
cd ~/fantopark-crm-fullstack/backend

gcloud run deploy fantopark-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project enduring-wharf-464005-h7 \
  --set-env-vars="NODE_ENV=production"

echo "✅ Production backend deployed!"
