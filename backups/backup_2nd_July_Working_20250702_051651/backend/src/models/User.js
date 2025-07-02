
  static async find(query) {
    try {
      const snapshot = await db.collection('crm_users').where(Object.keys(query)[0], '==', Object.values(query)[0]).get();
      const users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  }
