
const fs = require('fs');

const commands = JSON.parse(fs.readFileSync('migration-commands.json', 'utf8'));

console.log('🔍 API COMMANDS TO CHECK ALLOCATIONS\n');

console.log('Replace YOUR_TOKEN with your actual auth token and run these commands:\n');

// Get all IDs that will be deleted

const deleteIds = [];

commands.forEach(cmd => {

  if (cmd.deleteIds) {

    deleteIds.push(...cmd.deleteIds);

  }

});

// Generate curl commands to check allocations for each

console.log('# Check allocations for items to be deleted:');

deleteIds.forEach((id, index) => {

  console.log(`\n# Check ${index + 1}/${deleteIds.length} - ID: ${id}`);

  console.log(`curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/${id}/allocations" \\`);

  console.log(`  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'`);

});

console.log('\n# Or check all at once with this script:');

console.log('TOKEN="YOUR_TOKEN"');

console.log('echo "Checking allocations for items to be deleted..."');

deleteIds.forEach(id => {

  console.log(`echo -n "ID ${id}: "`);

  console.log(`curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/${id}/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"`);

});

