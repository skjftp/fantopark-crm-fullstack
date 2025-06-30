// Copy and paste this into browser console
(async () => {
    const token = localStorage.getItem('token');
    const API_URL = 'https://fantopark-backend-150582227311.us-central1.run.app/api';
    
    console.log('Checking orders...');
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Orders:', data);
        console.log('Total orders:', data.data?.length || 0);
        
        if (data.data && data.data.length > 0) {
            console.table(data.data.slice(0, 5));
        }
    } catch (error) {
        console.error('Error:', error);
    }
})();
