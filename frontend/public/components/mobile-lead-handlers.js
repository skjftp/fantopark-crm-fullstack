// Mobile Lead Action Handlers Debug
// Check if handlers exist and add debugging

// Wait for the app to be fully loaded before checking
window.addEventListener('load', function() {
  console.log('🔍 Checking mobile lead handlers availability:');
  console.log('- window.openEditForm:', typeof window.openEditForm);
  console.log('- window.handleLeadProgression:', typeof window.handleLeadProgression);
  console.log('- window.openAssignForm:', typeof window.openAssignForm);
  console.log('- window.openPaymentForm:', typeof window.openPaymentForm);
  console.log('- window.handleDelete:', typeof window.handleDelete);
});

console.log('✅ Mobile lead handlers debug loaded');