#!/bin/bash

# Google Cloud Scheduler Setup for Stats Aggregation
# Run this script to set up the cron job that updates stats every 2 hours

PROJECT_ID="enduring-wharf-464005-h7"
LOCATION="us-central1"
SERVICE_URL="https://fantopark-backend-150582227311.us-central1.run.app"
SERVICE_ACCOUNT="fantopark-backend@enduring-wharf-464005-h7.iam.gserviceaccount.com"

echo "🕐 Setting up Cloud Scheduler for stats aggregation..."

# Create the scheduler job
gcloud scheduler jobs create http fantopark-stats-aggregation \
    --location="${LOCATION}" \
    --schedule="0 */2 * * *" \
    --uri="${SERVICE_URL}/api/cron/update-stats" \
    --http-method=POST \
    --oidc-service-account-email="${SERVICE_ACCOUNT}" \
    --oidc-token-audience="${SERVICE_URL}" \
    --time-zone="Asia/Kolkata" \
    --description="Updates FanToPark performance stats every 2 hours" \
    --attempt-deadline="10m" \
    --headers="Content-Type=application/json" \
    --message-body="{\"source\": \"cloud-scheduler\"}"

echo "✅ Cloud Scheduler job created!"
echo ""
echo "📊 Job Details:"
echo "- Name: fantopark-stats-aggregation"
echo "- Schedule: Every 2 hours (0 */2 * * *)"
echo "- Timezone: Asia/Kolkata"
echo "- Endpoint: ${SERVICE_URL}/api/cron/update-stats"
echo ""
echo "To manually trigger the job:"
echo "gcloud scheduler jobs run fantopark-stats-aggregation --location=${LOCATION}"
echo ""
echo "To view job status:"
echo "gcloud scheduler jobs describe fantopark-stats-aggregation --location=${LOCATION}"