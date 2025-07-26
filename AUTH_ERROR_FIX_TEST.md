# Authentication Error Fix Test Guide

## Issue Fixed
When authentication token expires (401/403 errors), the application was trying to redirect to `/login.html` which doesn't exist in a single-page application.

## Changes Made
1. Updated `window.handleAuthError` in `utils/api.js` to:
   - Show an alert message about session expiry
   - Set `isLoggedIn` to false instead of redirecting
   - Clear user data and trigger app re-render
   
2. Created `components/login-form.js` with a proper login form UI that:
   - Shows email and password fields
   - Uses existing `handleLogin` function
   - Displays session expiry message if applicable
   - Works with dark mode

3. Added login-form.js to index.html script imports

## Test Steps

### Test 1: Manual Token Expiry
1. Open browser DevTools
2. Go to Application/Storage → Local Storage
3. Delete `crm_auth_token` or modify it to an invalid value
4. Try to perform any action that requires API call (e.g., refresh page, click a button)
5. Verify:
   - Alert shows "Your session has expired. Please log in again to continue."
   - Login form appears instead of trying to redirect to /login.html
   - No 404 error for missing login.html page

### Test 2: API 401/403 Response
1. Open Network tab in DevTools
2. Perform actions in the app
3. If any API returns 401 or 403:
   - Alert should appear
   - Login form should be displayed
   - User can log in again without page reload

### Test 3: Successful Re-login
1. After session expiry, enter credentials in the login form
2. Click "Sign In"
3. Verify:
   - User is logged back in
   - App returns to normal view
   - Previous location/tab is maintained (if stored)

## Expected Behavior
- No more redirects to non-existent `/login.html`
- Seamless re-authentication within the same page
- User context preserved after re-login

## Console Logs to Watch
- "✅ Login form component loaded" - Confirms login form is available
- No 404 errors for login.html
- Authentication error messages in console