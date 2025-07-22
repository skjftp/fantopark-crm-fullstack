// Run this in browser console to test payables API
console.log('=== TESTING PAYABLES API ===');

const token = localStorage.getItem('crm_auth_token');

// Test direct payables endpoint
fetch('https://fantopark-backend-150582227311.us-central1.run.app/api/payables', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(r => r.json())
.then(data => {
    console.log('Payables API response:', data);
    if (data.data) {
        console.log('Number of payables:', data.data.length);
        data.data.forEach(p => {
            console.log(`- ${p.eventName}: ₹${p.amount} (${p.status})`);
        });
    }
})
.catch(err => console.error('Error:', err));

// If using apiCall function
if (typeof apiCall !== 'undefined') {
    apiCall('/payables').then(response => {
        console.log('apiCall response:', response);
    });
}
