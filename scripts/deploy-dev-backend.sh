#!/bin/bash
echo "🚀 Deploying development backend..."
cd ~/fantopark-crm-fullstack/backend

gcloud run deploy fantopark-backend-dev \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project enduring-wharf-464005-h7 \
  --set-env-vars="NODE_ENV=development,JWT_SECRET=dev-jwt-secret-key-12345"

DEV_URL=$(gcloud run services describe fantopark-backend-dev --platform=managed --region=us-central1 --project=enduring-wharf-464005-h7 --format="value(status.url)")

echo "✅ Development backend deployed!"
echo "🔗 Dev Backend URL: $DEV_URL"
echo ""
echo "Next steps:"
echo "1. Update frontend to use this URL"
echo "2. Test the development environment"
