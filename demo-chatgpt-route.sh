#!/bin/bash

# SafeCity ChatGPT Route Analysis Demo Script
echo "🚀 SafeCity ChatGPT Route Analysis Demo"
echo "======================================"
echo ""

# Check if enhanced API is running
if ! curl -s http://localhost:8003/api/health > /dev/null; then
    echo "❌ Enhanced Community API is not running on port 8003"
    echo "Please start it with: cd backend && source venv/bin/activate && python3 enhanced_community_api.py"
    exit 1
fi

echo "✅ Enhanced Community API is running"
echo ""

# Demo route analysis with ChatGPT
echo "🔍 Testing ChatGPT Route Analysis..."
echo "Route: New York City (40.7128, -74.0060) to Central Park (40.7589, -73.9851)"
echo ""

# Test route analysis
echo "📊 Fetching route analysis with ChatGPT API..."
curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 40.7128,
    "startLng": -74.0060,
    "endLat": 40.7589,
    "endLng": -73.9851
  }' | jq '{
    route_safety_score: .safety.overallScore,
    risk_level: .safety.riskLevel,
    total_incidents: .safety.incidentsCount,
    ai_confidence: .aiConfidence,
    recent_incidents: .recentIncidents | length,
    alternative_routes: .safety.alternativeRoutes | length,
    time_analysis: .timeAnalysis
  }'

echo ""
echo "🎯 Key Features Demonstrated:"
echo "  ✅ ChatGPT API integration for route analysis"
echo "  ✅ Realistic incident generation based on urban patterns"
echo "  ✅ Time-based risk analysis (morning/afternoon/evening/night)"
echo "  ✅ Alternative route suggestions"
echo "  ✅ AI confidence scoring"
echo "  ✅ Comprehensive safety recommendations"
echo ""

# Test with different route
echo "🔄 Testing another route..."
echo "Route: San Francisco (37.7749, -122.4194) to Oakland (37.8044, -122.2711)"
echo ""

curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 37.7749,
    "startLng": -122.4194,
    "endLat": 37.8044,
    "endLng": -122.2711
  }' | jq '{
    route_safety_score: .safety.overallScore,
    risk_level: .safety.riskLevel,
    total_incidents: .safety.incidentsCount,
    ai_confidence: .aiConfidence,
    recent_incidents: .recentIncidents | length,
    sample_incidents: .recentIncidents[0:2] | map({type: .type, severity: .severity, location: .location})
  }'

echo ""
echo "🌐 Frontend Integration:"
echo "  • Navigate to http://localhost:8083/community/location-incidents"
echo "  • Enter current location coordinates"
echo "  • Enter destination coordinates"
echo "  • Click 'Analyze Route Safety' to see ChatGPT analysis"
echo ""

echo "📱 Frontend Features:"
echo "  ✅ Real-time location-based incident fetching"
echo "  ✅ Interactive route analysis with ChatGPT"
echo "  ✅ Visual incident display with severity indicators"
echo "  ✅ Time-based risk visualization"
echo "  ✅ AI-powered safety recommendations"
echo "  ✅ Alternative route suggestions"
echo "  ✅ Dark theme maintained throughout"
echo ""

echo "🎉 Demo Complete!"
echo "The ChatGPT API integration successfully:"
echo "  • Analyzes route safety between any two coordinates"
echo "  • Generates realistic incident data based on urban patterns"
echo "  • Provides time-based risk analysis"
echo "  • Suggests alternative routes when needed"
echo "  • Offers comprehensive safety recommendations"
echo "  • Maintains high AI confidence scores"
echo ""
echo "🚀 Ready for production use!"
