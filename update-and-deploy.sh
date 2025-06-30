#!/bin/bash
echo "Updating and deploying FanToPark CRM..."

if [ -f index.html ]; then
    echo "Copying index.html to frontend/public/index.html..."
    cp index.html frontend/public/index.html
else
    echo "WARNING: index.html not found in root!"
fi

git add index.html frontend/public/index.html
git commit -m "${1:-Update index.html}" || echo "No changes to commit"
git push origin main

echo ""
echo "✅ Pushed to main!"
echo "GitHub Actions will deploy from frontend/public/index.html"
echo "Check deployment status at: https://github.com/skjftp/fantopark-crm-fullstack/actions"
echo ""
echo "Site URL: https://skjftp.github.io/fantopark-crm-fullstack/"
