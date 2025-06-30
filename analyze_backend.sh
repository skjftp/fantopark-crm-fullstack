#!/bin/bash

echo "=== Analyzing Backend Routes ==="

# Check leads.js structure
echo -e "\n1. LEADS.JS Structure:"
echo "  Checking for update endpoint..."
grep -c "router.put" backend/src/routes/leads.js
echo "  Checking for Firestore update calls..."
grep -c "\.update\|\.set" backend/src/routes/leads.js

# Check orders.js structure  
echo -e "\n2. ORDERS.JS Structure:"
echo "  Checking for create endpoint..."
grep -c "router.post" backend/src/routes/orders.js
echo "  Checking for Firestore set/add calls..."
grep -c "\.add\|\.set" backend/src/routes/orders.js

# Look for common backend issues
echo -e "\n3. Common Issues:"
echo "  Checking for missing await statements..."
grep -n "update\|set\|add" backend/src/routes/leads.js | grep -v "await" | head -5
grep -n "update\|set\|add" backend/src/routes/orders.js | grep -v "await" | head -5

echo -e "\n4. Looking for transaction usage..."
grep -c "transaction\|batch" backend/src/routes/leads.js backend/src/routes/orders.js
