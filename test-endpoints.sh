#!/bin/bash

echo "🔍 Checking if Community API Server is running..."
if curl -s http://localhost:8003/api/health > /dev/null; then
    echo "✅ Server is running on port 8003"
    
    echo "🧪 Testing location-based endpoints..."
    
    echo "Testing /community/location-alerts:"
    curl -s "http://localhost:8003/community/location-alerts?lat=13.0827&lng=80.2707&radius=5" | head -c 200
    echo ""
    
    echo "Testing /community/ai-analysis:"
    curl -s "http://localhost:8003/community/ai-analysis?lat=13.0827&lng=80.2707&radius=5" | head -c 200
    echo ""
    
else
    echo "❌ Server is not running on port 8003"
    echo "🚀 Starting server..."
    cd /Users/vedantvijay/Desktop/urban-safe-zone/backend
    python3 community_api.py &
    sleep 3
    echo "✅ Server started!"
fi
