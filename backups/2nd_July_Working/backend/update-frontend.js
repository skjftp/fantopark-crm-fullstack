// This script will update your v4working frontend to use the API

console.log(`
=== Frontend Update Instructions ===

To connect your v4working frontend to this backend:

1. Add API configuration at the top of your HTML file:
   <script>
     const API_URL = 'http://localhost:8080/api';
     let authToken = localStorage.getItem('crm_auth_token');
   </script>

2. Update localStorage calls to API calls:
   
   Replace:
     localStorage.setItem('crm_leads', JSON.stringify(leads));
   
   With:
     fetch(API_URL + '/leads', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer ' + authToken
       },
       body: JSON.stringify(leadData)
     })

3. Update the login function to use the API:
   
   Replace the localStorage check with:
     fetch(API_URL + '/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
     })
     .then(res => res.json())
     .then(data => {
       if (data.token) {
         authToken = data.token;
         localStorage.setItem('crm_auth_token', data.token);
         setUser(data.user);
         setIsLoggedIn(true);
       }
     })

4. Add API error handling and loading states

The backend matches all your existing fields and functionality exactly!
`);
