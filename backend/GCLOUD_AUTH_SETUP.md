# Setting up Firebase/Google Cloud Authentication WITHOUT Keys

This guide shows how to authenticate with Google Cloud/Firebase without downloading service account keys.

## Prerequisites

1. **Install Google Cloud SDK (gcloud)**:
   ```bash
   # macOS with Homebrew
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Verify installation**:
   ```bash
   gcloud --version
   ```

## Setup Steps

### 1. Login to Google Cloud

```bash
# This will open a browser for authentication
gcloud auth login

# Select your Google account that has access to the project
```

### 2. Set Application Default Credentials

```bash
# This creates credentials that all Google Cloud libraries can use
gcloud auth application-default login

# This will open another browser window
# Make sure to use the same account with project access
```

### 3. Set Your Default Project

```bash
# Set your project ID
gcloud config set project enduring-wharf-464005-h7

# Verify it's set
gcloud config get-value project
```

### 4. Update Your .env File

Create a `.env` file with just the project ID:

```bash
# Only need the project ID - no credentials path!
GOOGLE_CLOUD_PROJECT=enduring-wharf-464005-h7

# Your other env vars
JWT_SECRET=your-jwt-secret
PORT=8080
# ... other variables
```

**Important**: Do NOT set `GOOGLE_APPLICATION_CREDENTIALS` when using gcloud auth.

### 5. Test Your Setup

```bash
# Run the test script
node test-firebase-connection.js

# Or test with gcloud directly
gcloud firestore databases list
```

## How It Works

When you run `gcloud auth application-default login`, it creates credentials at:
- **macOS/Linux**: `~/.config/gcloud/application_default_credentials.json`
- **Windows**: `%APPDATA%\gcloud\application_default_credentials.json`

The Google Cloud libraries automatically find and use these credentials.

## Verify Everything is Working

1. **Check your auth status**:
   ```bash
   # See active account
   gcloud auth list
   
   # See application default credentials
   gcloud auth application-default print-access-token
   ```

2. **Test Firestore access**:
   ```bash
   # List collections
   gcloud firestore databases describe
   ```

3. **Run your backend**:
   ```bash
   npm run dev
   ```

## Advantages of This Method

✅ **No key files to manage** - Credentials are stored securely by gcloud  
✅ **Easy to switch projects** - Just run `gcloud config set project`  
✅ **Works across all your projects** - One login for all  
✅ **Automatic token refresh** - No expired credentials  
✅ **Same method works on any machine** - Just login again  

## Common Issues

### "Could not load the default credentials"

Run these commands in order:
```bash
gcloud auth application-default revoke
gcloud auth application-default login
```

### "Permission denied" errors

Make sure your Google account has the right IAM roles:
```bash
# Check your permissions
gcloud projects get-iam-policy enduring-wharf-464005-h7 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:YOUR_EMAIL@gmail.com"
```

### Token expired

```bash
# Refresh your credentials
gcloud auth application-default login
```

## For Team Members

Share these instructions with team members. Each person:
1. Installs gcloud CLI
2. Runs `gcloud auth application-default login` with their Google account
3. Uses the same `.env` file (without any credential paths)

## Security Notes

- These credentials are tied to your Google account
- They expire after a period of inactivity (auto-refresh when used)
- Perfect for development, but use service accounts for production
- Never commit the `~/.config/gcloud` directory