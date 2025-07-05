// This is the auto-assignment code to add to the POST route in leads.js
// Add this after: const newLeadData = req.body;

// AUTO-ASSIGNMENT LOGIC - Add this code
if (!newLeadData.assigned_to || newLeadData.assigned_to === '') {
  try {
    console.log('🤖 Evaluating auto-assignment for new lead:', newLeadData.name);
    const assignment = await AssignmentRule.evaluateLeadAssignment(newLeadData);
    
    if (assignment.assigned_to) {
      newLeadData.assigned_to = assignment.assigned_to;
      newLeadData.assignment_rule_used = assignment.assignment_rule_used;
      newLeadData.assignment_reason = assignment.assignment_reason;
      newLeadData.auto_assigned = true;
      console.log(`✅ Auto-assigned to: ${assignment.assigned_to} via ${assignment.assignment_reason}`);
    } else {
      console.log('⚠️ No assignment could be determined');
    }
  } catch (assignmentError) {
    console.error('❌ Auto-assignment failed (non-critical):', assignmentError);
    // Don't fail the lead creation if assignment fails
  }
}
