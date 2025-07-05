const { db, collections } = require('../config/db');

class AssignmentRule {
  constructor(data) {
    this.name = data.name;
    this.description = data.description || '';
    this.priority = data.priority || 10; // Lower number = higher priority
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    
    // Conditions for rule matching
    this.conditions = data.conditions || {}; // e.g., {potential_value: {gte: 100000}}
    this.condition_logic = data.condition_logic || 'AND'; // AND/OR
    
    // Assignment strategy
    this.assignment_strategy = data.assignment_strategy || 'round_robin'; // round_robin, weighted_round_robin, least_busy
    this.assignees = data.assignees || []; // Array of {email: 'user@email.com', weight: 50}
    
    // Metadata
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
    this.created_by = data.created_by || '';
    this.last_assignment_index = data.last_assignment_index || 0; // For round robin
  }

  // Save rule to database
  async save() {
    try {
      if (this.id) {
        // Update existing
        await db.collection('crm_assignment_rules').doc(this.id).update({
          ...this,
          updated_date: new Date().toISOString()
        });
        return { id: this.id, ...this };
      } else {
        // Create new
        const docRef = await db.collection('crm_assignment_rules').add({...this});
        return { id: docRef.id, ...this };
      }
    } catch (error) {
      console.error('Error saving assignment rule:', error);
      throw error;
    }
  }

  // Get all assignment rules
  static async getAll() {
    try {
      const snapshot = await db.collection('crm_assignment_rules')
        .orderBy('priority', 'asc')
        .get();
      
      const rules = [];
      snapshot.forEach(doc => {
        rules.push({ id: doc.id, ...doc.data() });
      });
      return rules;
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      throw error;
    }
  }

  // Get active rules only
  static async getActive() {
    try {
      const snapshot = await db.collection('crm_assignment_rules')
        .where('is_active', '==', true)
        .orderBy('priority', 'asc')
        .get();
      
      const rules = [];
      snapshot.forEach(doc => {
        rules.push({ id: doc.id, ...doc.data() });
      });
      return rules;
    } catch (error) {
      console.error('Error fetching active assignment rules:', error);
      throw error;
    }
  }

  // Get rule by ID
  static async getById(id) {
    try {
      const doc = await db.collection('crm_assignment_rules').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching assignment rule:', error);
      throw error;
    }
  }

  // Update rule
  static async update(id, data) {
    try {
      const updateData = { 
        ...data, 
        updated_date: new Date().toISOString() 
      };
      
      await db.collection('crm_assignment_rules').doc(id).update(updateData);
      
      // Return updated document
      const updated = await AssignmentRule.getById(id);
      return updated;
    } catch (error) {
      console.error('Error updating assignment rule:', error);
      throw error;
    }
  }

  // Delete rule
  static async delete(id) {
    try {
      await db.collection('crm_assignment_rules').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting assignment rule:', error);
      throw error;
    }
  }

  // Test lead against rules and return assignment
  static async testAssignment(leadData) {
    try {
      const rules = await AssignmentRule.getActive();
      
      for (const rule of rules) {
        if (AssignmentRule.evaluateConditions(leadData, rule.conditions, rule.condition_logic)) {
          const assignedTo = AssignmentRule.selectAssignee(rule);
          
          if (assignedTo) {
            // Update the last assignment index for round robin
            await AssignmentRule.updateLastAssignmentIndex(rule.id, rule.last_assignment_index);
            
            return {
              assigned_to: assignedTo,
              rule_matched: rule.name,
              rule_id: rule.id,
              assignment_reason: rule.description || `Matched rule: ${rule.name}`,
              auto_assigned: true
            };
          }
        }
      }
      
      return null; // No rule matched
    } catch (error) {
      console.error('Error testing assignment rules:', error);
      throw error;
    }
  }

  // Evaluate if lead matches rule conditions
  static evaluateConditions(leadData, conditions, logic = 'AND') {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions = matches all
    }

    const results = [];

    for (const [field, condition] of Object.entries(conditions)) {
      const leadValue = leadData[field];
      let fieldMatches = false;

      if (typeof condition === 'string' || typeof condition === 'number') {
        // Simple equality check
        fieldMatches = leadValue === condition;
      } else if (typeof condition === 'object') {
        // Complex conditions like {gte: 100000, lt: 500000}
        for (const [operator, value] of Object.entries(condition)) {
          switch (operator) {
            case 'eq':
              fieldMatches = leadValue === value;
              break;
            case 'neq':
              fieldMatches = leadValue !== value;
              break;
            case 'gt':
              fieldMatches = Number(leadValue) > Number(value);
              break;
            case 'gte':
              fieldMatches = Number(leadValue) >= Number(value);
              break;
            case 'lt':
              fieldMatches = Number(leadValue) < Number(value);
              break;
            case 'lte':
              fieldMatches = Number(leadValue) <= Number(value);
              break;
            case 'in':
              fieldMatches = Array.isArray(value) && value.includes(leadValue);
              break;
            case 'contains':
              fieldMatches = String(leadValue).toLowerCase().includes(String(value).toLowerCase());
              break;
          }
          if (fieldMatches) break;
        }
      }

      results.push(fieldMatches);
    }

    // Apply logic
    if (logic === 'OR') {
      return results.some(r => r === true);
    } else {
      return results.every(r => r === true);
    }
  }

  // Select assignee based on strategy
  static selectAssignee(rule) {
    if (!rule.assignees || rule.assignees.length === 0) {
      return null;
    }

    switch (rule.assignment_strategy) {
      case 'round_robin':
        return AssignmentRule.roundRobinSelection(rule);
      
      case 'weighted_round_robin':
        return AssignmentRule.weightedRoundRobinSelection(rule);
      
      case 'least_busy':
        // For now, fallback to round robin - would need to implement workload tracking
        return AssignmentRule.roundRobinSelection(rule);
      
      default:
        return rule.assignees[0]?.email || null;
    }
  }

  // Round robin selection
  static roundRobinSelection(rule) {
    const currentIndex = rule.last_assignment_index || 0;
    const nextIndex = (currentIndex + 1) % rule.assignees.length;
    
    // Update the rule's last assignment index
    rule.last_assignment_index = nextIndex;
    
    return rule.assignees[nextIndex]?.email || null;
  }

  // Weighted round robin selection
  static weightedRoundRobinSelection(rule) {
    // Create weighted pool
    const weightedPool = [];
    rule.assignees.forEach(assignee => {
      const weight = assignee.weight || 50;
      for (let i = 0; i < weight; i++) {
        weightedPool.push(assignee.email);
      }
    });

    if (weightedPool.length === 0) {
      return null;
    }

    const currentIndex = rule.last_assignment_index || 0;
    const nextIndex = (currentIndex + 1) % weightedPool.length;
    
    // Update the rule's last assignment index
    rule.last_assignment_index = nextIndex;
    
    return weightedPool[nextIndex];
  }

  // Update last assignment index
  static async updateLastAssignmentIndex(ruleId, newIndex) {
    try {
      await db.collection('crm_assignment_rules').doc(ruleId).update({
        last_assignment_index: newIndex,
        updated_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating assignment index:', error);
    }
  }
}

module.exports = AssignmentRule;
