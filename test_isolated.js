// Run this in browser console to test authentication flow

async function testAuthFlow() {
    console.log('=== ISOLATED AUTH TEST ===');
    
    // Step 1: Clear everything
    console.log('\n1. Clearing all storage...');
    localStorage.clear();
    sessionStorage.clear();
    
    // Step 2: Test login
    console.log('\n2. Testing login...');
    const loginResponse = await fetch('https://fantopark-backend-150582227311.us-central1.run.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@fantopark.com',
            password: 'admin123'
        })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginResponse.status, loginData);
    
    if (!loginData.token) {
        console.error('No token received!');
        return;
    }
    
    // Step 3: Store token
    console.log('\n3. Storing token...');
    const token = loginData.token;
    localStorage.setItem('crm_auth_token', token);
    console.log('Token stored:', token.substring(0, 50) + '...');
    
    // Step 4: Test API call with token
    console.log('\n4. Testing API call with token...');
    const apiResponse = await fetch('https://fantopark-backend-150582227311.us-central1.run.app/api/users', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    console.log('API Response:', apiResponse.status);
    if (apiResponse.ok) {
        const users = await apiResponse.json();
        console.log('✅ SUCCESS! Got users:', users.length);
    } else {
        const error = await apiResponse.text();
        console.error('❌ FAILED:', error);
    }
}

// Run the test
testAuthFlow();
