#!/bin/bash
echo "🔧 Fixing state variables across all components..."

# Navigate to components directory
cd components

# Fix common state variable patterns
for file in *.js; do
    echo "Fixing $file..."
    
    # Fix show* variables
    sed -i 's/if (!show\([A-Z][a-zA-Z]*\))/if (!window.show\1)/g' "$file"
    
    # Fix current* variables  
    sed -i 's/if (!current\([A-Z][a-zA-Z]*\))/if (!window.current\1)/g' "$file"
    
    # Fix editing* variables
    sed -i 's/if (!editing\([A-Z][a-zA-Z]*\))/if (!window.editing\1)/g' "$file"
    
    # Fix other common patterns
    sed -i 's/\!show\([A-Z][a-zA-Z]*\) ||/!window.show\1 ||/g' "$file"
    sed -i 's/\!current\([A-Z][a-zA-Z]*\) ||/!window.current\1 ||/g' "$file"
    sed -i 's/\!editing\([A-Z][a-zA-Z]*\) ||/!window.editing\1 ||/g' "$file"
    
    # Fix variable assignments
    sed -i 's/= show\([A-Z][a-zA-Z]*\);/= window.show\1;/g' "$file"
    sed -i 's/= current\([A-Z][a-zA-Z]*\);/= window.current\1;/g' "$file"
    sed -i 's/= editing\([A-Z][a-zA-Z]*\);/= window.editing\1;/g' "$file"
done

echo "✅ All state variables fixed!"
