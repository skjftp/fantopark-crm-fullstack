#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI"
API_URL="https://fantopark-backend-150582227311.us-central1.run.app/api"

echo "🔧 Fixing Event Names"
echo "===================="
echo ""

# Liverpool FC vs Arsenal FC
echo -n "1. Fixing Liverpool FC vs Arsenal FC... "
curl -s -X PUT "$API_URL/inventory/zRRL2aJYXKydPzfaVN1b" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_name": "Liverpool FC vs Arsenal FC", "event_date": "2025-08-30"}' > /dev/null
echo "✅"

# India Tour of Australia - SCG ODI
echo -n "2. Fixing India Tour of Australia, 2025 - SCG ODI... "
curl -s -X PUT "$API_URL/inventory/uru3b3K358zwlU3hJNpr" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_name": "India Tour of Australia, 2025 - SCG ODI", "event_date": "2025-10-25"}' > /dev/null
echo "✅"

# India Tour of Australia - MCG T20
echo -n "3. Fixing India Tour of Australia, 2025 - MCG T20... "
curl -s -X PUT "$API_URL/inventory/o1EC40Pzev8D92PW1tHm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_name": "India Tour of Australia, 2025 - MCG T20", "event_date": "2025-10-31"}' > /dev/null
echo "✅"

# Abu Dhabi Grand Prix
echo -n "4. Fixing Abu Dhabi Grand Prix... "
curl -s -X PUT "$API_URL/inventory/kqkoDzKUnywrc2KkKWF6" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_name": "Abu Dhabi Grand Prix", "event_date": "2025-12-07"}' > /dev/null
echo "✅"

# India Tour Of England - Lords Test (Premium categories only)
echo -n "5. Fixing India Tour Of England, 2025 - Lords Test... "
curl -s -X PUT "$API_URL/inventory/brhCYrpIi5tdCqmUx7zT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_name": "India Tour Of England, 2025 - Lords Test", "event_date": "2025-07-11"}' > /dev/null
echo "✅"

echo ""
echo "✅ All event names fixed!"
echo ""
echo "Please refresh your inventory page to see the updated names."
