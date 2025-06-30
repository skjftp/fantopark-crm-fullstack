
// Add this to browser console to debug
async function checkOrderPersistence() {
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    // Check backend directly
    const response = await fetch('https://fantopark-backend-150582227311.us-central1.run.app/orders', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    const orders = await response.json();
    console.log('Backend orders:', orders);
    return orders;
}

// Run: checkOrderPersistence()
