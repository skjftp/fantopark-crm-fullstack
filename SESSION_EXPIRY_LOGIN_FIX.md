# Session Expiry Login Fix Test Guide

## Issue Fixed
After session expiry, users were unable to login again because:
1. The `apiCall` function was checking for token expiry even for login requests
2. The expired token was being sent in the Authorization header for login requests
3. Old auth data wasn't being cleared before new login attempts

## Changes Made
1. **Updated `apiCall` in `utils/api.js`**:
   - Skip token expiry check for `/auth/` endpoints
   - Don't send Authorization header for auth endpoints
   
2. **Updated login form in `components/login-form.js`**:
   - Clear localStorage auth data before login attempt
   - Clear window.authToken before login

## Test Steps

### Test 1: Normal Session Expiry Flow
1. Open browser DevTools → Application → Local Storage
2. Find and delete `crm_auth_token` or modify it to make it invalid
3. Try to perform any action (e.g., click a tab, refresh)
4. Verify:
   - Alert shows "Your session has expired..."
   - Login form appears
5. Enter valid credentials
6. Click "Sign In"
7. Verify:
   - Login succeeds
   - App shows normal dashboard/content
   - New token is stored in localStorage

### Test 2: Multiple Login Attempts
1. After session expiry, try logging in with wrong credentials first
2. Verify error message appears
3. Then try with correct credentials
4. Verify login succeeds

### Test 3: Check API Calls
1. Open Network tab
2. During login after session expiry, verify:
   - POST to `/api/auth/login` has NO Authorization header
   - Response returns new token
   - Subsequent API calls use the new token

## Expected Behavior
- No infinite loop of "session expired" messages
- Clean login flow after session expiry
- New session created successfully
- App functions normally after re-login

## Console Logs to Watch
- Check for "Token expired" errors
- Verify `/auth/login` request doesn't include expired token
- Look for successful login response with new token