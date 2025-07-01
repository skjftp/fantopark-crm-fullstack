// Add this diagnostic code to your frontend to debug auth issues
function debugAuth() {
    const token = localStorage.getItem('crm_auth_token');
    const authTokenVar = typeof authToken !== 'undefined' ? authToken : 'undefined';
    
    console.log('=== AUTH DEBUG ===');
    console.log('Token in localStorage:', token ? `${token.substring(0, 50)}...` : 'null');
    console.log('authToken variable:', authTokenVar ? `${authTokenVar.substring(0, 50)}...` : 'null/undefined');
    console.log('Token matches:', token === authTokenVar);
    console.log('Token length:', token ? token.length : 0);
    console.log('Starts with quotes:', token && (token.startsWith('"') || token.startsWith("'")));
    
    // Test API call
    fetch(`${API_URL}/users`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }).then(r => {
        console.log('Test API call status:', r.status);
        return r.text();
    }).then(text => {
        console.log('Response:', text);
    });
}

// Call this after login or when debugging
// debugAuth();
