#!/bin/bash

echo "🔄 Restarting Community API Server with Location-Based Endpoints..."

# Kill any existing Python processes on port 8003
pkill -f "python3 community_api.py" 2>/dev/null || true

# Wait a moment
sleep 2

# Start the server
cd /Users/vedantvijay/Desktop/urban-safe-zone/backend
python3 community_api.py &

echo "✅ Server restarted! New endpoints available:"
echo "   GET /community/location-alerts - Location-based alerts"
echo "   GET /community/ai-analysis - AI crime analysis"
echo ""
echo "🌐 Server running on http://localhost:8003"
echo "🧪 Test the location endpoint:"
echo "   curl 'http://localhost:8003/community/ai-analysis?lat=13.0827&lng=80.2707&radius=5'"
