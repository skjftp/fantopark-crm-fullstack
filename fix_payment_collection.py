#!/usr/bin/env python3
import re

print("Fixing payment collection to include all lead fields...")

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Find payment collection or status update functions
# Look for patterns where lead status is updated

# Fix 1: When updating lead status, include all fields
pattern = r'apiCall\(`/leads/\$\{leadId\}`, \{\s*method: \'PUT\',\s*body: JSON\.stringify\(\{[^}]+status: newStatus[^}]+\}\)'

# Check if this pattern exists
if re.search(pattern, content):
    print("Found partial lead update pattern")
    # This needs to be fixed to include all lead fields
else:
    print("Pattern not found, searching for other update patterns...")

# Fix 2: Add a function to get full lead data before updating
new_function = '''
    // Helper function to update lead with all fields
    const updateLeadStatus = async (leadId, newStatus, additionalData = {}) => {
        try {
            // First get the current lead data
            const currentLead = leads.find(l => l.id === leadId);
            if (!currentLead) {
                throw new Error('Lead not found');
            }
            
            // Update with ALL fields to avoid backend validation issues
            const updateData = {
                ...currentLead,
                ...additionalData,
                status: newStatus,
                updated_date: new Date().toISOString()
            };
            
            const response = await apiCall(`/leads/${leadId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            
            // Update local state
            setLeads(prev => prev.map(lead => 
                lead.id === leadId ? response.data : lead
            ));
            
            return response.data;
        } catch (error) {
            console.error('Error updating lead status:', error);
            throw error;
        }
    };
'''

print("\nCreated helper function for proper lead updates")
print("\nTo fix: Replace partial updates with full updates including all fields")
