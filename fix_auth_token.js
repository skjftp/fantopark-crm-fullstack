// This fix ensures authToken is properly managed

// 1. Find the line where authToken is declared
// It should be: let authToken = localStorage.getItem('crm_auth_token');

// 2. In the login success handler, after storing the token:
// localStorage.setItem('crm_auth_token', response.token);
// ADD THIS LINE:
// authToken = response.token;

// 3. In the apiCall function, ensure headers are set correctly:
// 'Authorization': authToken ? `Bearer ${authToken}` : undefined

// 4. When user logs out, clear the authToken:
// authToken = null;
