# Firebase Credentials Setup Guide

There are multiple ways to configure Firebase/Google Cloud credentials for local development:

## Option 1: Using Service Account JSON File (Recommended)

1. **Download Service Account Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your project (e.g., `enduring-wharf-464005-h7`)
   - Navigate to IAM & Admin → Service Accounts
   - Find your service account (e.g., `fantopark-backend@enduring-wharf-464005-h7.iam.gserviceaccount.com`)
   - Click on the service account → Keys tab → Add Key → Create new key
   - Choose JSON format and download

2. **Store the JSON file**:
   ```bash
   # Create a secure directory for credentials
   mkdir -p ~/.google-cloud-keys
   
   # Move the downloaded JSON to this directory
   mv ~/Downloads/your-service-account-key.json ~/.google-cloud-keys/fantopark-firebase-key.json
   
   # Set proper permissions
   chmod 600 ~/.google-cloud-keys/fantopark-firebase-key.json
   ```

3. **Set environment variable in .env**:
   ```bash
   # Create .env file from example
   cp .env.example .env
   
   # Edit .env and set the path
   GOOGLE_APPLICATION_CREDENTIALS=/Users/YOUR_USERNAME/.google-cloud-keys/fantopark-firebase-key.json
   GOOGLE_CLOUD_PROJECT=enduring-wharf-464005-h7
   ```

## Option 2: Using Base64 Encoded JSON (Good for CI/CD)

1. **Encode your service account JSON**:
   ```bash
   # Convert JSON to base64
   base64 -i ~/.google-cloud-keys/fantopark-firebase-key.json > service-account-base64.txt
   
   # Copy the base64 string
   cat service-account-base64.txt
   ```

2. **Update your db.js config**:
   ```javascript
   // backend/src/config/db.js
   const { Firestore } = require('@google-cloud/firestore');
   
   // Initialize Firestore
   let db;
   
   if (process.env.GOOGLE_CREDENTIALS_BASE64) {
     // Decode base64 credentials
     const credentialsJSON = Buffer.from(
       process.env.GOOGLE_CREDENTIALS_BASE64, 
       'base64'
     ).toString('utf-8');
     
     const credentials = JSON.parse(credentialsJSON);
     
     db = new Firestore({
       projectId: process.env.GOOGLE_CLOUD_PROJECT,
       credentials: credentials
     });
   } else {
     // Use default credentials (from GOOGLE_APPLICATION_CREDENTIALS)
     db = new Firestore({
       projectId: process.env.GOOGLE_CLOUD_PROJECT
     });
   }
   ```

3. **Add to .env**:
   ```bash
   GOOGLE_CREDENTIALS_BASE64=your-long-base64-string-here
   GOOGLE_CLOUD_PROJECT=enduring-wharf-464005-h7
   ```

## Option 3: Using gcloud CLI (Development Only)

1. **Install gcloud CLI**:
   ```bash
   # macOS
   brew install google-cloud-sdk
   ```

2. **Authenticate**:
   ```bash
   gcloud auth application-default login
   ```

3. **Set project**:
   ```bash
   gcloud config set project enduring-wharf-464005-h7
   ```

4. **No need to set GOOGLE_APPLICATION_CREDENTIALS** - gcloud handles it automatically

## Testing Your Setup

Create a test script to verify credentials:

```javascript
// test-firebase-connection.js
require('dotenv').config();
const { db } = require('./src/config/db');

async function testConnection() {
  try {
    console.log('Testing Firebase connection...');
    const testDoc = await db.collection('crm_users').limit(1).get();
    console.log('✅ Successfully connected to Firebase!');
    console.log(`Found ${testDoc.size} document(s)`);
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
  }
}

testConnection();
```

Run: `node test-firebase-connection.js`

## Security Best Practices

1. **Never commit credentials**:
   ```bash
   # Add to .gitignore
   .env
   *.json
   service-account-*.txt
   *-firebase-key.json
   ```

2. **Use environment-specific credentials**:
   - Development: Personal service account with limited permissions
   - Production: Service account with production permissions

3. **Rotate keys regularly**:
   - Delete old keys from Google Cloud Console
   - Generate new keys every 90 days

## Common Issues

1. **"Could not load the default credentials"**:
   - Check if GOOGLE_APPLICATION_CREDENTIALS path is absolute
   - Verify the JSON file exists and is readable
   - Ensure GOOGLE_CLOUD_PROJECT is set correctly

2. **"Permission denied"**:
   - Check service account has required permissions
   - Verify project ID matches your service account's project

3. **"Invalid JSON"**:
   - Check if base64 encoding/decoding is correct
   - Ensure no extra whitespace in base64 string

## Example .env for FanToPark

```bash
# Firebase/Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/Users/sumitjha/.google-cloud-keys/fantopark-firebase-key.json
GOOGLE_CLOUD_PROJECT=enduring-wharf-464005-h7

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Meta/Facebook
META_VERIFY_TOKEN=fantopark_webhook_verify_2024
META_APP_SECRET=your-meta-app-secret
META_PAGE_ACCESS_TOKEN=your-page-access-token

# Server
PORT=8080
NODE_ENV=development
```