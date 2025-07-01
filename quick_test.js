// Quick test after the fix
console.log('Testing login...');
fetch('https://fantopark-backend-ofkn6rpg3a-uc.a.run.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fantopark.com', password: 'admin123' })
})
.then(r => r.json())
.then(data => {
    console.log('Login response:', data);
    if (data.token) {
        console.log('✅ Login successful!');
        // Test API call
        return fetch('https://fantopark-backend-ofkn6rpg3a-uc.a.run.app/api/users', {
            headers: { 'Authorization': `Bearer ${data.token}` }
        });
    }
})
.then(r => r.json())
.then(users => console.log('✅ API call successful! Users:', users.length))
.catch(e => console.error('Error:', e));
