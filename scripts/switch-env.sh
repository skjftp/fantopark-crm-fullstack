#!/bin/bash

if [ "$1" == "dev" ]; then
    echo "🔄 Switching to DEVELOPMENT environment..."
    git checkout development
    echo "✅ Switched to development branch"
    echo "📁 Current branch: $(git branch --show-current)"
    echo "🌐 Frontend will use: Development Backend"
    echo "🗄️  Database will use: dev_crm_* collections"
    
elif [ "$1" == "prod" ]; then
    echo "🔄 Switching to PRODUCTION environment..."
    git checkout main
    echo "✅ Switched to main branch"
    echo "📁 Current branch: $(git branch --show-current)"
    echo "🌐 Frontend will use: Production Backend"
    echo "🗄️  Database will use: crm_* collections"
    
else
    echo "Usage: ./scripts/switch-env.sh [dev|prod]"
    echo ""
    echo "Current environment:"
    echo "📁 Branch: $(git branch --show-current)"
    if [ "$(git branch --show-current)" == "main" ]; then
        echo "🏭 Environment: PRODUCTION"
    elif [ "$(git branch --show-current)" == "development" ]; then
        echo "🧪 Environment: DEVELOPMENT"  
    else
        echo "🔀 Environment: FEATURE BRANCH"
    fi
fi
