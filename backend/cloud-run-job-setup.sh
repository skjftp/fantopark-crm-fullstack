#!/bin/bash

# Alternative: Use Cloud Run Jobs instead of Cloud Scheduler
# This doesn't require App Engine

echo "🚀 Setting up Cloud Run Job for stats aggregation (App Engine not required)"

# Create a simple script that calls our endpoint
cat > trigger-stats.sh << 'EOF'
#!/bin/bash
# Get auth token from metadata server
TOKEN=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://fantopark-backend-150582227311.us-central1.run.app" \
  -H "Metadata-Flavor: Google")

# Call the stats endpoint
curl -X POST https://fantopark-backend-150582227311.us-central1.run.app/api/cron/update-stats \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"source": "cloud-run-job"}'
EOF

# Create a Dockerfile for the job
cat > Dockerfile.cronjob << 'EOF'
FROM curlimages/curl:latest
WORKDIR /app
COPY trigger-stats.sh .
RUN chmod +x trigger-stats.sh
CMD ["sh", "./trigger-stats.sh"]
EOF

echo "Building and deploying Cloud Run Job..."

# Build and push the image
gcloud builds submit --tag gcr.io/enduring-wharf-464005-h7/stats-aggregation-job

# Create the Cloud Run Job
gcloud run jobs create fantopark-stats-aggregation \
  --image gcr.io/enduring-wharf-464005-h7/stats-aggregation-job \
  --region us-central1 \
  --parallelism 1 \
  --task-timeout 600 \
  --max-retries 2

echo "✅ Cloud Run Job created!"

# Create a manual trigger script
cat > trigger-stats-manually.sh << 'EOF'
#!/bin/bash
echo "🔄 Manually triggering stats aggregation..."
gcloud run jobs execute fantopark-stats-aggregation --region us-central1
EOF

chmod +x trigger-stats-manually.sh

echo ""
echo "📊 Job created successfully!"
echo ""
echo "Since Cloud Scheduler requires App Engine, we've created a Cloud Run Job instead."
echo ""
echo "To manually trigger the stats update:"
echo "  ./trigger-stats-manually.sh"
echo ""
echo "For automated scheduling, you have these options:"
echo ""
echo "1. Use GitHub Actions (recommended):"
echo "   - Add a .github/workflows/stats-aggregation.yml file"
echo "   - Schedule it to run every 2 hours"
echo ""
echo "2. Use a simple cron on any server:"
echo "   - Add to crontab: 0 */2 * * * gcloud run jobs execute fantopark-stats-aggregation --region us-central1"
echo ""
echo "3. Use Google Cloud Workflows with a scheduled trigger"