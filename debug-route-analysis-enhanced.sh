#!/bin/bash

echo "🔍 SafeCity Route Analysis Debug Test"
echo "====================================="
echo ""

echo "1. Testing Backend API Health..."
echo "--------------------------------"
curl -s http://localhost:8003/api/health | jq '.' 2>/dev/null || echo "❌ Backend health check failed"

echo ""
echo "2. Testing Route Analysis API..."
echo "--------------------------------"
echo "Testing with Chennai to Delhi coordinates..."
curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -d '{"startLat": 13.0836939, "startLng": 80.270186, "endLat": 28.6139, "endLng": 77.2090}' \
  -s | jq '.safety.overallScore' 2>/dev/null || echo "❌ Route analysis failed"

echo ""
echo "3. Testing Frontend API Service..."
echo "--------------------------------"
echo "Testing with same coordinates..."
curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"startLat": 13.0836939, "startLng": 80.270186, "endLat": 28.6139, "endLng": 77.2090}' \
  -s | jq '.recentIncidents | length' 2>/dev/null || echo "❌ Frontend API test failed"

echo ""
echo "4. Testing Geocoding Service..."
echo "------------------------------"
echo "Testing Chennai geocoding..."
curl -s "https://nominatim.openstreetmap.org/search?format=json&q=Chennai&limit=1&countrycodes=in" | jq '.[0].lat, .[0].lon' 2>/dev/null || echo "❌ Geocoding test failed"

echo ""
echo "5. Testing Delhi geocoding..."
echo "-----------------------------"
curl -s "https://nominatim.openstreetmap.org/search?format=json&q=Delhi&limit=1&countrycodes=in" | jq '.[0].lat, .[0].lon' 2>/dev/null || echo "❌ Geocoding test failed"

echo ""
echo "6. Frontend Testing Instructions:"
echo "---------------------------------"
echo "1. Open http://localhost:8080"
echo "2. Go to Location Incidents page"
echo "3. Enter 'Chennai' in Start City"
echo "4. Enter 'Delhi' in Destination City"
echo "5. Click 'Analyze Route Safety'"
echo "6. Open browser Developer Tools (F12)"
echo "7. Check Console tab for detailed error logs"
echo "8. Look for:"
echo "   - 'Starting route analysis with:' log"
echo "   - 'API: analyzeRoute called with:' log"
echo "   - 'API: analyzeRoute response:' log"
echo "   - Any error messages"

echo ""
echo "7. Common Issues & Solutions:"
echo "-----------------------------"
echo "❌ CORS Error: Backend not allowing frontend requests"
echo "   Solution: Check CORS configuration in backend"
echo ""
echo "❌ Network Error: Cannot connect to backend"
echo "   Solution: Ensure backend is running on port 8003"
echo ""
echo "❌ Geocoding Error: City names not found"
echo "   Solution: Try different city names or check internet connection"
echo ""
echo "❌ API Error: Wrong parameter format"
echo "   Solution: Check parameter names (startLat, startLng, endLat, endLng)"
echo ""
echo "❌ Frontend Error: JavaScript error"
echo "   Solution: Check browser console for specific error messages"

echo ""
echo "8. Debug Commands:"
echo "-----------------"
echo "  - Check backend: curl http://localhost:8003/api/health"
echo "  - Check frontend: curl http://localhost:8080"
echo "  - Check processes: ps aux | grep -E '(python|node)'"
echo "  - Check ports: lsof -i :8003, lsof -i :8080"
echo "  - Check logs: tail -f backend logs"

echo ""
echo "9. Test Results:"
echo "---------------"
echo "If all tests pass, the issue is likely in the frontend JavaScript."
echo "Check the browser console for detailed error messages."
echo "The enhanced error handling should now show specific error details."
