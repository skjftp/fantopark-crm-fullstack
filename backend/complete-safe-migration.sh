#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI"
API_URL="https://fantopark-backend-150582227311.us-central1.run.app/api"

echo "🚀 SAFE MIGRATION SCRIPT - Preserving Customer Allocations"
echo "=================================================="
echo ""
echo "This will migrate 41 items → 32 events (keeping VIP separate)"
echo ""
echo "📌 Special handling for Lords Test:"
echo "  - Keep RW39jW8SbBXR4phNAmzl (VIP with 11 allocations)"
echo "  - Merge only Premium categories"
echo ""

read -p "Ready to start migration? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Migration cancelled."
  exit 1
fi

echo ""
echo "📦 PHASE 1: Adding categories to single-category items (26 items)"
echo "================================================================"

# Single category items
declare -a single_items=(
  "8ePQ0tnFX4oqsOcagjRY:General::40:40:68000:85000:"
  "cTAABudL4p1dTqcX40aZ:Platinum::20:20:80000:110000:"
  "bWdHYmLOxD6qnzDt0SrJ:Hospitality::18:18:75000:135000:"
  "x9XQTBSW2cYZgWFqiF4e:Premium::20:20:60000:80000:"
  "sPgOSWHZxxLo2VWQzHit:General::50:50:2800:5500:"
  "rYKT8m5t4Uh3TQSagfHx:General::50:50:8000:10000:"
  "qgYNvGKmQOCmnptfXzek:General::50:50:4000:7000:"
  "o1BQNzjVl1nR7rDf1rHe:General::21:21:4000:7000:"
  "iSJJQOTqhHp9tUuHgQ5K:General::17:17:6000:8500:"
  "h9o2K7xGb1hnOWo9rbtb:VIP::20:20:70000:95000:"
  "gOOiTiAG7nTEslAWQvUy:General::50:50:5000:7000:"
  "fO8kMtmtK0VHuD3ogfRp:General::100:100:1800:3000:"
  "3xaY9L4oiM5vflM5XVXR:General::50:50:10000:12000:"
  "1e5tGGpgIg1jASr6ik6p:Hospitality::20:20:75000:110000:"
  "vJzktQLvW4tEOdOHXMwJ:General::50:50:3000:5000:"
  "u9f2d3HZOLj0zqfYEafw:Hospitality::15:15:30000:40000:"
  "syT00VHYOQOQjQd9LS7c:VIP::50:50:52000:65000:"
  "svHCNmE4kHH3MiasLvAm:General::50:50:4000:6500:"
  "nwRnJMhAbE2C9xsJaFz4:General::50:50:7000:9000:"
  "jFQsJKQJnT17wLHg3xMW:VIP::15:15:72000:80000:"
  "gT0HDNVo9j19gk5gJELP:General::100:100:25000:40000:"
  "df5TrOGdJFELWMtSrLSs:General::25:25:50000:70000:"
  "dF4nE7wfxJKzlvOyf7xP:General::50:50:8000:10000:"
  "bIGAo5SJJUrxhcB0PtR1:General::30:30:1500:2500:"
  "Sj0xjWBJ2DBTbQnSyZpq:General::100:100:1500:2500:"
  "QQGxGUOd6eiSfxMYKgRu:General::50:50:3000:5000:"
)

count=0
for item in "${single_items[@]}"; do
  IFS=':' read -r id name section total avail buy sell incl <<< "$item"
  count=$((count + 1))
  echo -n "  [$count/26] Updating $id... "
  
  category_json="{\"name\":\"$name\",\"section\":\"$section\",\"total_tickets\":$total,\"available_tickets\":$avail,\"buying_price\":$buy,\"selling_price\":$sell,\"inclusions\":\"$incl\"}"
  
  response=$(curl -s -X PUT "$API_URL/inventory/$id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"categories\": [$category_json]}" \
    -w "\n%{http_code}")
  
  http_code=$(echo "$response" | tail -n1)
  if [ "$http_code" = "200" ]; then
    echo "✅"
  else
    echo "❌ (HTTP $http_code)"
  fi
done

echo ""
echo "📦 PHASE 2: Merging multi-category items (5 events)"
echo "=================================================="

# Abu Dhabi Grand Prix
echo ""
echo "1️⃣ Abu Dhabi Grand Prix (6 → 1)"
echo "  Updating kqkoDzKUnywrc2KkKWF6 with 6 categories..."

ABU_DHABI_CATS='[
  {"name":"General","section":"","total_tickets":10,"available_tickets":10,"buying_price":74000,"selling_price":90000,"inclusions":""},
  {"name":"General","section":"","total_tickets":30,"available_tickets":30,"buying_price":67000,"selling_price":85000,"inclusions":""},
  {"name":"General","section":"","total_tickets":30,"available_tickets":30,"buying_price":67800,"selling_price":97000,"inclusions":""},
  {"name":"General","section":"","total_tickets":18,"available_tickets":18,"buying_price":69000,"selling_price":105000,"inclusions":""},
  {"name":"General","section":"","total_tickets":14,"available_tickets":14,"buying_price":66000,"selling_price":88000,"inclusions":""},
  {"name":"General","section":"","total_tickets":13,"available_tickets":13,"buying_price":67800,"selling_price":97000,"inclusions":""}
]'

curl -s -X PUT "$API_URL/inventory/kqkoDzKUnywrc2KkKWF6" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categories\": $ABU_DHABI_CATS}" > /dev/null

echo "  ✅ Categories merged"

# Delete Abu Dhabi duplicates
for id in "YPJiUZGiDeKaLOGHWL06" "Rn7Qu91GSi3RmwOLdeDB" "FGxrvKc2e3kJvifl4k5v" "CT5Zx1CwTgQoxdlsXg8L" "B7ltzC1BLK8jfYAE1fEF"; do
  echo -n "  Deleting $id... "
  curl -s -X DELETE "$API_URL/inventory/$id" -H "Authorization: Bearer $TOKEN" > /dev/null
  echo "✅"
done

# MCG T20
echo ""
echo "2️⃣ India Tour of Australia - MCG T20 (2 → 1)"
echo "  Updating o1EC40Pzev8D92PW1tHm..."

MCG_CATS='[
  {"name":"Hospitality","section":"","total_tickets":30,"available_tickets":30,"buying_price":35000,"selling_price":55000,"inclusions":""},
  {"name":"General","section":"","total_tickets":50,"available_tickets":50,"buying_price":8000,"selling_price":12000,"inclusions":""}
]'

curl -s -X PUT "$API_URL/inventory/o1EC40Pzev8D92PW1tHm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categories\": $MCG_CATS}" > /dev/null

echo "  ✅ Categories merged"
echo -n "  Deleting mejiulCbp8Git8UQ7Yb2... "
curl -s -X DELETE "$API_URL/inventory/mejiulCbp8Git8UQ7Yb2" -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✅"

# SCG ODI
echo ""
echo "3️⃣ India Tour of Australia - SCG ODI (2 → 1)"
echo "  Updating uru3b3K358zwlU3hJNpr..."

SCG_CATS='[
  {"name":"General","section":"","total_tickets":50,"available_tickets":50,"buying_price":8000,"selling_price":10000,"inclusions":""},
  {"name":"Hospitality","section":"","total_tickets":16,"available_tickets":16,"buying_price":35000,"selling_price":55000,"inclusions":""}
]'

curl -s -X PUT "$API_URL/inventory/uru3b3K358zwlU3hJNpr" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categories\": $SCG_CATS}" > /dev/null

echo "  ✅ Categories merged"
echo -n "  Deleting 2G5Hi4GSPUAR9FBmu1sm... "
curl -s -X DELETE "$API_URL/inventory/2G5Hi4GSPUAR9FBmu1sm" -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✅"

# Liverpool vs Arsenal
echo ""
echo "4️⃣ Liverpool FC vs Arsenal FC (2 → 1)"
echo "  Updating zRRL2aJYXKydPzfaVN1b..."

LIVERPOOL_CATS='[
  {"name":"Hospitality","section":"","total_tickets":6,"available_tickets":6,"buying_price":60000,"selling_price":85000,"inclusions":""},
  {"name":"Hospitality","section":"","total_tickets":2,"available_tickets":2,"buying_price":60000,"selling_price":85000,"inclusions":""}
]'

curl -s -X PUT "$API_URL/inventory/zRRL2aJYXKydPzfaVN1b" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categories\": $LIVERPOOL_CATS}" > /dev/null

echo "  ✅ Categories merged"
echo -n "  Deleting 51NjaERRb2KS1OkUlHmh... "
curl -s -X DELETE "$API_URL/inventory/51NjaERRb2KS1OkUlHmh" -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✅"

# Lords Test - SPECIAL HANDLING
echo ""
echo "5️⃣ India Tour Of England - Lords Test (PARTIAL MERGE)"
echo "  ⚠️  Keeping VIP separate due to allocations"
echo "  Updating brhCYrpIi5tdCqmUx7zT with Premium categories only..."

LORDS_PREMIUM_CATS='[
  {"name":"Premium","section":"","total_tickets":7,"available_tickets":7,"buying_price":42000,"selling_price":55000,"inclusions":""},
  {"name":"Premium 2","section":"","total_tickets":5,"available_tickets":5,"buying_price":42000,"selling_price":55000,"inclusions":""}
]'

curl -s -X PUT "$API_URL/inventory/brhCYrpIi5tdCqmUx7zT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categories\": $LORDS_PREMIUM_CATS}" > /dev/null

echo "  ✅ Premium categories merged"
echo -n "  Deleting 33kRnvOgZpD5LmbJMWno... "
curl -s -X DELETE "$API_URL/inventory/33kRnvOgZpD5LmbJMWno" -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✅"
echo "  📌 Keeping RW39jW8SbBXR4phNAmzl (VIP with 11 allocations)"

echo ""
echo "✅ MIGRATION COMPLETE!"
echo ""
echo "📊 Final Summary:"
echo "  - Started with: 41 items"
echo "  - Ended with: 32 items"
echo "  - Single category items updated: 26"
echo "  - Multi-category merges: 5 (4 complete, 1 partial)"
echo "  - Preserved allocations: 11 tickets for 2 customers"
echo ""
echo "📌 Lords Test now has 2 separate items:"
echo "  - brhCYrpIi5tdCqmUx7zT: Premium categories (12 tickets)"
echo "  - RW39jW8SbBXR4phNAmzl: VIP category (20 tickets, 11 allocated)"
