const fetch = require('node-fetch');
require('dotenv').config();

async function testPayablesAPI() {
    const API_URL = 'https://fantopark-backend-150582227311.us-central1.run.app/api';
    
    // First, let's login to get a token
    console.log('1. Getting auth token...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@fantopark.com',
            password: 'admin123'
        })
    });
    
    const { token } = await loginRes.json();
    console.log('Token received:', token ? '✓' : '✗');
    
    // Test payables endpoint
    console.log('\n2. Testing payables endpoint...');
    const payablesRes = await fetch(`${API_URL}/payables`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    console.log('Payables endpoint status:', payablesRes.status);
    if (payablesRes.status === 404) {
        console.log('❌ Payables endpoint not found - not deployed');
    } else {
        const data = await payablesRes.json();
        console.log('Payables response:', data);
    }
    
    // Check finance/payables endpoint
    console.log('\n3. Testing finance/payables endpoint...');
    const financeRes = await fetch(`${API_URL}/finance/payables`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    console.log('Finance endpoint status:', financeRes.status);
}

testPayablesAPI().catch(console.error);
