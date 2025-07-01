// Run this in browser console after login to verify
console.log('Token in localStorage:', localStorage.getItem('crm_auth_token'));
console.log('Global authToken:', typeof authToken !== 'undefined' ? authToken : 'undefined');
console.log('Match?', localStorage.getItem('crm_auth_token') === authToken);
