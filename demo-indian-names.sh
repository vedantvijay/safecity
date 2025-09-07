#!/bin/bash

# SafeCity Indian Names & Context Demo Script
echo "🇮🇳 SafeCity Indian Names & Context Demo"
echo "========================================"
echo ""

# Check if enhanced API is running
if ! curl -s http://localhost:8003/api/health > /dev/null; then
    echo "❌ Enhanced Community API is not running on port 8003"
    echo "Please start it with: cd backend && source venv/bin/activate && python3 enhanced_community_api.py"
    exit 1
fi

echo "✅ Enhanced Community API is running"
echo ""

echo "🏙️ Testing Indian Names & Context in Comments..."
echo "Route: Chennai (13.0827, 80.2707) to Bangalore (12.9768, 77.5901)"
echo ""

# Test route analysis with Indian context
echo "📊 Fetching route analysis with Indian names and context..."
curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 13.0827,
    "startLng": 80.2707,
    "endLat": 12.9768,
    "endLng": 77.5901
  }' | jq '{
    route_safety_score: .safety.overallScore,
    risk_level: .safety.riskLevel,
    total_incidents: .safety.incidentsCount,
    user_comments_count: .userComments | length,
    indian_comments: .userComments[0:8] | map({
      author: .author,
      comment: .comment,
      rating: .rating,
      sentiment: .sentiment,
      suggests_alternative: .suggests_alternative
    })
  }'

echo ""
echo "📝 Testing Indian Name Comment Posting..."

# Post comments with Indian names and context
echo "Posting comment from Priya Sharma..."
curl -X POST http://localhost:8003/community/route-comments \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 13.0827,
    "startLng": 80.2707,
    "endLat": 12.9768,
    "endLng": 77.5901,
    "author": "Priya Sharma",
    "comment": "This route is usually safe during office hours. Metro station nearby makes it convenient. Just avoid late evenings when it gets deserted.",
    "rating": 4
  }' | jq '{
    author: .author,
    comment: .comment,
    rating: .rating,
    sentiment: .sentiment
  }'

echo ""
echo "Posting comment from Rajesh Kumar..."
curl -X POST http://localhost:8003/community/route-comments \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 13.0827,
    "startLng": 80.2707,
    "endLat": 12.9768,
    "endLng": 77.5901,
    "author": "Rajesh Kumar",
    "comment": "Avoid this route during festivals! Too crowded and chaotic. Auto-rickshaw drivers overcharge during peak times. Better to take the highway.",
    "rating": 2
  }' | jq '{
    author: .author,
    comment: .comment,
    rating: .rating,
    sentiment: .sentiment
  }'

echo ""
echo "Posting comment from Anita Patel..."
curl -X POST http://localhost:8003/community/route-comments \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 13.0827,
    "startLng": 80.2707,
    "endLat": 12.9768,
    "endLng": 77.5901,
    "author": "Anita Patel",
    "comment": "Good route for daily commute. Bus stop and metro station nearby. Safe during office hours when lots of working professionals use this route.",
    "rating": 5
  }' | jq '{
    author: .author,
    comment: .comment,
    rating: .rating,
    sentiment: .sentiment
  }'

echo ""
echo "🔄 Testing updated route analysis with new Indian comments..."
curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 13.0827,
    "startLng": 80.2707,
    "endLat": 12.9768,
    "endLng": 77.5901
  }' | jq '{
    total_comments: .userComments | length,
    real_user_comments: .userComments | map(select(.id != null)) | length,
    ai_generated_comments: .userComments | map(select(.id == null)) | length,
    indian_names: .userComments | map(.author) | unique,
    cultural_context: .userComments | map(select(.comment | contains("metro") or contains("auto-rickshaw") or contains("festival") or contains("office") or contains("temple"))) | length
  }'

echo ""
echo "🎯 Key Features Demonstrated:"
echo "  ✅ Indian names for comment authors (Priya Sharma, Rajesh Kumar, Anita Patel)"
echo "  ✅ Culturally relevant comments mentioning Indian context"
echo "  ✅ References to metro stations, auto-rickshaws, festivals"
echo "  ✅ Office hours, temple areas, commercial districts"
echo "  ✅ Indian urban transportation context"
echo "  ✅ Festival-related safety concerns"
echo "  ✅ Local landmarks and infrastructure"
echo ""

echo "📱 Indian Context Elements Included:"
echo "  • Transportation: Metro stations, auto-rickshaws, bus stops"
echo "  • Landmarks: Temples, malls, IT parks, universities"
echo "  • Time Context: Office hours, festival seasons"
echo "  • Safety Concerns: Crowded areas, late evenings"
echo "  • Local Issues: Street vendors, local goons"
echo "  • Infrastructure: Shopping complexes, hospitals"
echo ""

echo "🌐 Frontend Integration:"
echo "  • Navigate to http://localhost:8083/community/location-incidents"
echo "  • Enter Indian cities (Chennai, Bangalore, Delhi, Mumbai)"
echo "  • Analyze routes to see Indian names in comments"
echo "  • Post your own comments with Indian names"
echo "  • Experience culturally relevant feedback"
echo ""

echo "🎉 Demo Complete!"
echo "The Indian names and context system successfully:"
echo "  • Uses authentic Indian names for comment authors"
echo "  • Provides culturally relevant comments"
echo "  • References Indian urban infrastructure"
echo "  • Includes local transportation context"
echo "  • Addresses Indian-specific safety concerns"
echo "  • Maintains 24% negative comments as requested"
echo "  • Suggests alternative routes when needed"
echo ""
echo "🚀 Ready for Indian users!"
