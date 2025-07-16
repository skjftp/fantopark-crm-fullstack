const { db, collections } = require('../config/db');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.status = data.status;
    this.department = data.department;
    this.password = data.password;
    this.birthday = data.birthday || null;
    this.created_date = data.created_date;
    this.updated_date = data.updated_date;
  }

  static async find(query) {
    try {
      let queryRef = db.collection(collections.users);
      
      // Apply query filters
      for (const [key, value] of Object.entries(query)) {
        queryRef = queryRef.where(key, '==', value);
      }
      
      const snapshot = await queryRef.get();
      const users = [];
      snapshot.forEach(doc => {
        users.push(new User({ id: doc.id, ...doc.data() }));
      });
      return users;
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  }

  static async findById(id) {
    try {
      const doc = await db.collection(collections.users).doc(id).get();
      if (doc.exists) {
        return new User({ id: doc.id, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async findByEmail(email) {
    try {
      const snapshot = await db.collection(collections.users)
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return new User({ id: doc.id, ...doc.data() });
      }
      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async getAll() {
    try {
      const snapshot = await db.collection(collections.users).get();
      const users = [];
      snapshot.forEach(doc => {
        users.push(new User({ id: doc.id, ...doc.data() }));
      });
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async save() {
    try {
      const userData = {
        name: this.name,
        email: this.email,
        role: this.role,
        status: this.status,
        department: this.department,
        updated_date: new Date().toISOString()
      };

      if (this.password) {
        userData.password = this.password;
      }

      if (this.id) {
        // Update existing user
        await db.collection(collections.users).doc(this.id).update(userData);
      } else {
        // Create new user
        userData.created_date = new Date().toISOString();
        const docRef = await db.collection(collections.users).add(userData);
        this.id = docRef.id;
      }
      return this;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async delete() {
    try {
      if (this.id) {
        await db.collection(collections.users).doc(this.id).delete();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Helper method to get user without password
  toJSON() {
    const userData = { ...this };
    delete userData.password;
    return userData;
  }
}

module.exports = User;
