// Form Configuration - All form field definitions and geographic data
window.stadiumFormFields = [
  { name: 'name', label: 'Stadium Name', type: 'text', required: true, placeholder: 'e.g., Wankhede Stadium' },
  { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g., Mumbai' },
  { name: 'state', label: 'State/Province', type: 'text', required: false, placeholder: 'e.g., Maharashtra' },
  { name: 'country', label: 'Country', type: 'select', required: true, options: [
    'India', 'United States', 'United Kingdom', 'Australia', 'Canada', 'South Africa',
    'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Pakistan', 'Afghanistan',
    'Spain', 'Germany', 'France', 'Italy', 'Brazil', 'Argentina', 'Japan', 'China',
    'Mexico', 'UAE', 'Singapore', 'Saudi Arabia', 'Bahrain', 'Qatar', 'Azerbaijan',
    'Hungary', 'Netherlands', 'Belgium', 'Ireland', 'Other'
  ]},
  { name: 'sport_type', label: 'Primary Sport', type: 'select', required: true, options: [
    'Cricket', 'Football', 'Basketball', 'Tennis', 'Hockey', 'Baseball', 
    'Rugby', 'Athletics', 'Formula 1', 'Multi-Sport', 'Other'
  ]},
  { name: 'capacity', label: 'Seating Capacity', type: 'number', required: false, placeholder: 'e.g., 33000' },
  { name: 'opened_year', label: 'Year Opened', type: 'number', required: false, placeholder: 'e.g., 1974' }
];

// Indian States and Union Territories
window.INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 
  'Lakshadweep', 'Puducherry'
];

console.log('✅ Form configurations loaded');
