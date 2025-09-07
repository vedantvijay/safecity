#!/bin/bash

echo "🔍 SafeCity Route Analysis Debug Test"
echo "====================================="
echo ""

echo "1. Testing Backend API directly..."
echo "--------------------------------"
curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -d '{"startLat": 13.0836939, "startLng": 80.270186, "endLat": 13.0827, "endLng": 80.2707}' \
  -s | jq '.route.safety.overallScore' 2>/dev/null || echo "❌ Backend API test failed"

echo ""
echo "2. Testing Geocoding Service..."
echo "------------------------------"
curl -s "https://nominatim.openstreetmap.org/search?format=json&q=Chennai&limit=1&countrycodes=in" | jq '.[0].lat, .[0].lon' 2>/dev/null || echo "❌ Geocoding test failed"

echo ""
echo "3. Testing Frontend API Service..."
echo "--------------------------------"
curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -d '{"startLat": 13.0836939, "startLng": 80.270186, "endLat": 13.0827, "endLng": 80.2707}' \
  -s | jq '.recentIncidents | length' 2>/dev/null || echo "❌ Frontend API test failed"

echo ""
echo "4. Checking Frontend Console..."
echo "------------------------------"
echo "Open browser developer tools and check for errors in the console"
echo "Look for:"
echo "  - CORS errors"
echo "  - Network errors"
echo "  - JavaScript errors"
echo "  - API response errors"

echo ""
echo "5. Testing Steps:"
echo "----------------"
echo "1. Open http://localhost:8080"
echo "2. Go to Location Incidents page"
echo "3. Enter 'Chennai' in Start City"
echo "4. Enter 'Delhi' in Destination City"
echo "5. Click 'Analyze Route Safety'"
echo "6. Check browser console for errors"

echo ""
echo "6. Common Issues:"
echo "----------------"
echo "  - CORS: Backend not allowing frontend requests"
echo "  - Network: Backend not running on port 8003"
echo "  - Geocoding: City names not found"
echo "  - API: Wrong parameter format"
echo "  - Frontend: JavaScript errors"

echo ""
echo "7. Debug Commands:"
echo "-----------------"
echo "  - Check backend: curl http://localhost:8003/api/health"
echo "  - Check frontend: curl http://localhost:8080"
echo "  - Check processes: ps aux | grep -E '(python|node)'"
echo "  - Check ports: lsof -i :8003, lsof -i :8080"
