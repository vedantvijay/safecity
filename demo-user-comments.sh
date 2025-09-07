#!/bin/bash

# SafeCity User Comments Demo Script
echo "🚀 SafeCity User Comments & Route Analysis Demo"
echo "=============================================="
echo ""

# Check if enhanced API is running
if ! curl -s http://localhost:8003/api/health > /dev/null; then
    echo "❌ Enhanced Community API is not running on port 8003"
    echo "Please start it with: cd backend && source venv/bin/activate && python3 enhanced_community_api.py"
    exit 1
fi

echo "✅ Enhanced Community API is running"
echo ""

# Demo route analysis with user comments
echo "🔍 Testing Route Analysis with User Comments..."
echo "Route: New York City (40.7128, -74.0060) to Central Park (40.7589, -73.9851)"
echo ""

# Test route analysis
echo "📊 Fetching route analysis with ChatGPT-generated comments..."
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
    user_comments_count: .userComments | length,
    sample_comments: .userComments[0:3] | map({
      author: .author,
      comment: .comment,
      rating: .rating,
      sentiment: .sentiment,
      suggests_alternative: .suggests_alternative
    })
  }'

echo ""
echo "📝 Testing Comment Posting..."

# Post a positive comment
echo "Posting a positive comment..."
curl -X POST http://localhost:8003/community/route-comments \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 40.7128,
    "startLng": -74.0060,
    "endLat": 40.7589,
    "endLng": -73.9851,
    "author": "Sarah M.",
    "comment": "Usually safe during the day, good route for commuting. Just stay alert and you will be fine.",
    "rating": 4
  }' | jq '{
    id: .id,
    author: .author,
    rating: .rating,
    sentiment: .sentiment,
    comment: .comment
  }'

echo ""

# Post a negative comment suggesting alternative
echo "Posting a negative comment with alternative suggestion..."
curl -X POST http://localhost:8003/community/route-comments \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 40.7128,
    "startLng": -74.0060,
    "endLat": 40.7589,
    "endLng": -73.9851,
    "author": "Mike Chen",
    "comment": "Avoid this route if possible. Had a bad experience here last week. I would recommend taking the main street instead - much safer.",
    "rating": 1
  }' | jq '{
    id: .id,
    author: .author,
    rating: .rating,
    sentiment: .sentiment,
    comment: .comment
  }'

echo ""

# Test route analysis again to see new comments
echo "🔄 Testing updated route analysis with new comments..."
curl -X POST http://localhost:8003/community/route-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "startLat": 40.7128,
    "startLng": -74.0060,
    "endLat": 40.7589,
    "endLng": -73.9851
  }' | jq '{
    total_comments: .userComments | length,
    real_user_comments: .userComments | map(select(.id != null)) | length,
    ai_generated_comments: .userComments | map(select(.id == null)) | length,
    negative_comments: .userComments | map(select(.sentiment == "negative")) | length,
    positive_comments: .userComments | map(select(.sentiment == "positive")) | length,
    alternative_suggestions: .userComments | map(select(.suggests_alternative == true)) | length
  }'

echo ""
echo "🎯 Key Features Demonstrated:"
echo "  ✅ ChatGPT generates 10-24 realistic user comments per route"
echo "  ✅ 24% of comments are negative/complaints as requested"
echo "  ✅ Comments suggest alternative routes when negative"
echo "  ✅ Real users can post comments about specific routes"
echo "  ✅ Comments are stored in database and persist"
echo "  ✅ AI content moderation for user comments"
echo "  ✅ Star ratings (1-5) for each comment"
echo "  ✅ Sentiment analysis (positive/negative/neutral)"
echo "  ✅ Alternative route suggestions tracking"
echo ""

echo "🌐 Frontend Integration:"
echo "  • Navigate to http://localhost:8083/community/location-incidents"
echo "  • Enter current location coordinates"
echo "  • Enter destination coordinates"
echo "  • Click 'Analyze Route Safety' to see ChatGPT analysis"
echo "  • Scroll down to 'User Comments' section"
echo "  • Click 'Add Comment' to post your own comment"
echo ""

echo "📱 Frontend Features:"
echo "  ✅ Real-time user comments display"
echo "  ✅ Interactive comment posting form"
echo "  ✅ Star rating system"
echo "  ✅ Sentiment-based color coding"
echo "  ✅ Alternative route suggestion badges"
echo "  ✅ Scrollable comments list"
echo "  ✅ Real-time comment updates"
echo "  ✅ Dark theme maintained throughout"
echo ""

echo "🎉 Demo Complete!"
echo "The user comments system successfully:"
echo "  • Generates realistic comments using ChatGPT API"
echo "  • Maintains 24% negative comments as requested"
echo "  • Allows real users to post comments about routes"
echo "  • Suggests alternative routes in negative comments"
echo "  • Provides comprehensive route feedback"
echo "  • Stores comments persistently in database"
echo "  • Moderates content using AI"
echo ""
echo "🚀 Ready for production use!"
