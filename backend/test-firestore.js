const { db } = require('./src/config/db');
console.log('�� Testing Firestore connection...');
db.collection('crm_leads').limit(1).get().then(snapshot => {console.log('✅ Firestore connection successful!');
console.log('📊 Found', snapshot.size,'lead(s)');
process.exit(0);
})
.catch(error => {console.error('❌ Firestore connection failed:', error.message);
process.exit(1);
});
