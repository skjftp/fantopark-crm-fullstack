// Quick re-login function for browser console
async function quickLogin() {
    const API_URL = 'https://fantopark-backend-150582227311.us-central1.run.app/api';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@fantopark.com',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('✅ Login successful! Token refreshed.');
            console.log('User:', data.user);
            
            // Now check orders
            const ordersResponse = await fetch(`${API_URL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });
            const orders = await ordersResponse.json();
            console.log('Orders:', orders);
            console.log('Total orders:', orders.data?.length || 0);
            
            return orders;
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

// Run: quickLogin()
