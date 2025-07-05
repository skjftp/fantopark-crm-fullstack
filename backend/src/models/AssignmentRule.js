const { db } = require('../config/db');

class AssignmentRule {
  constructor(data) {
    this.name = data.name;
    this.description = data.description || '';
    this.priority = data.priority || 1; // Higher = more important
    this.active = data.active !== false;
    this.conditions = data.conditions || []; // Array of condition objects
    this.assignees = data.assignees || []; // Array of assignee objects with weights
    this.assignment_strategy = data.assignment_strategy || 'weighted_round_robin';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
    this.usage_count = data.usage_count || 0;
    this.last_used_date = data.last_used_date || null;
    this.created_by = data.created_by || '';
  }

  async save() {
    const docRef = await db.collection('crm_assignment_rules').add({...this});
    return { id: docRef.id, ...this };
  }

  static async getAll() {
    const snapshot = await db.collection('crm_assignment_rules')
      .get();
    
    const rules = [];
    snapshot.forEach(doc => {
      rules.push({ id: doc.id, ...doc.data() });
    });
    // Sort manually by priority (highest first)
    rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    // Sort manually by priority (highest first)
    rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    return rules;
  }

  static async getActiveRules() {
    const snapshot = await db.collection('crm_assignment_rules')
      .where('active', '==', true)
      .get();
    
    const rules = [];
    snapshot.forEach(doc => {
      rules.push({ id: doc.id, ...doc.data() });
    });
    // Sort manually by priority (highest first)
    rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    return rules;
  }

  static async evaluateLeadAssignment(leadData) {
    try {
      const rules = await AssignmentRule.getActiveRules();
      console.log(`🤖 Evaluating ${rules.length} assignment rules for lead: ${leadData.name}`);
      
      for (const rule of rules) {
        if (AssignmentRule.matchesConditions(rule.conditions, leadData)) {
          const assignee = await AssignmentRule.selectAssignee(rule, leadData);
          if (assignee) {
            // Update rule usage
            await AssignmentRule.updateUsage(rule.id);
            console.log(`✅ Rule matched: ${rule.name} → Assigned to: ${assignee}`);
            return {
              assigned_to: assignee,
              assignment_rule_used: rule.id,
              assignment_reason: `Auto-assigned via rule: ${rule.name}`
            };
          }
        }
      }
      
      // Fallback to load balancing
      console.log('📊 No rules matched, using load balancing');
      return await AssignmentRule.loadBalanceAssignment(leadData);
      
    } catch (error) {
      console.error('Assignment evaluation error:', error);
      return { assigned_to: null, error: error.message };
    }
  }

  static matchesConditions(conditions, leadData) {
    if (!conditions || conditions.length === 0) return true;
    
    return conditions.every(condition => {
      const { field, operator, value } = condition;
      const leadValue = leadData[field];
      
      switch (operator) {
        case '>=': return parseFloat(leadValue || 0) >= parseFloat(value);
        case '<=': return parseFloat(leadValue || 0) <= parseFloat(value);
        case '>': return parseFloat(leadValue || 0) > parseFloat(value);
        case '<': return parseFloat(leadValue || 0) < parseFloat(value);
        case '==': return leadValue === value;
        case '!=': return leadValue !== value;
        case 'in': return Array.isArray(value) ? value.includes(leadValue) : false;
        case 'contains': return leadValue?.toLowerCase().includes(value.toLowerCase());
        case 'starts_with': return leadValue?.toLowerCase().startsWith(value.toLowerCase());
        default: return false;
      }
    });
  }

  static async selectAssignee(rule, leadData) {
    const { assignees, assignment_strategy } = rule;
    
    if (!assignees || assignees.length === 0) return null;
    
    switch (assignment_strategy) {
      case 'weighted_round_robin':
        return AssignmentRule.weightedSelection(assignees);
      case 'least_busy':
        return await AssignmentRule.leastBusySelection(assignees);
      case 'geographic':
        return AssignmentRule.geographicSelection(assignees, leadData);
      case 'first_available':
        return assignees[0]?.user_email;
      default:
        return assignees[0]?.user_email;
    }
  }

  static weightedSelection(assignees) {
    const totalWeight = assignees.reduce((sum, a) => sum + (a.weight || 1), 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const assignee of assignees) {
      currentWeight += (assignee.weight || 1);
      if (random <= currentWeight) {
        return assignee.user_email;
      }
    }
    return assignees[0]?.user_email;
  }

  static async leastBusySelection(assignees) {
    try {
      const userLoads = {};
      
      // Get current active lead count for each assignee
      for (const assignee of assignees) {
        const snapshot = await db.collection('crm_leads')
          .where('assigned_to', '==', assignee.user_email)
          .where('status', 'in', ['new', 'contacted', 'interested', 'quoted', 'follow_up_required'])
          .get();
        userLoads[assignee.user_email] = snapshot.size;
      }
      
      // Find the least busy
      const leastBusy = assignees.reduce((min, assignee) => 
        userLoads[assignee.user_email] < userLoads[min.user_email] ? assignee : min
      );
      
      return leastBusy.user_email;
    } catch (error) {
      console.error('Least busy selection error:', error);
      return assignees[0]?.user_email;
    }
  }

  static geographicSelection(assignees, leadData) {
    // Simple geographic matching based on city
    const leadCity = leadData.city_of_residence?.toLowerCase();
    
    if (leadCity) {
      const cityMatch = assignees.find(a => 
        a.specialties?.cities?.some(city => 
          city.toLowerCase().includes(leadCity) || leadCity.includes(city.toLowerCase())
        )
      );
      if (cityMatch) return cityMatch.user_email;
    }
    
    // Fallback to weighted selection
    return AssignmentRule.weightedSelection(assignees);
  }

  static async loadBalanceAssignment(leadData) {
    try {
      // Get all active sales users
      const usersSnapshot = await db.collection('crm_users')
        .where('status', '==', 'active')
        .where('role', 'in', ['sales_executive', 'sales_manager'])
        .get();
      
      if (usersSnapshot.empty) {
        return { assigned_to: null, assignment_reason: 'No sales users available' };
      }
      
      const salesUsers = [];
      usersSnapshot.forEach(doc => {
        salesUsers.push({ user_email: doc.data().email, weight: 1 });
      });
      
      const assignee = await AssignmentRule.leastBusySelection(salesUsers);
      
      return {
        assigned_to: assignee,
        assignment_rule_used: 'load_balancing',
        assignment_reason: 'Auto-assigned via load balancing (no rules matched)'
      };
      
    } catch (error) {
      console.error('Load balancing error:', error);
      return { assigned_to: null, error: error.message };
    }
  }

  static async updateUsage(ruleId) {
    try {
      await db.collection('crm_assignment_rules').doc(ruleId).update({
        usage_count: db.FieldValue.increment(1),
        last_used_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating rule usage:', error);
    }
  }

  static async update(id, data) {
    const updateData = { ...data, updated_date: new Date().toISOString() };
    await db.collection('crm_assignment_rules').doc(id).update(updateData);
    
    const doc = await db.collection('crm_assignment_rules').doc(id).get();
    return { id: doc.id, ...doc.data() };
  }

  static async delete(id) {
    await db.collection('crm_assignment_rules').doc(id).delete();
    return { success: true };
  }
}

module.exports = AssignmentRule;
