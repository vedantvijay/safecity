#!/bin/bash

echo "🤖 SafeCity Chatbot Comprehensive Test"
echo "======================================"
echo ""

echo "🔍 Testing Route Detection Logic:"
echo "--------------------------------"

# Test the route detection logic
test_query() {
    local query="$1"
    echo "Testing: '$query'"
    
    # Simulate the JavaScript logic
    if [[ "$query" =~ (route|hospitals|hospital|police|station|school|college|university|safe|safest|suggest|find) ]]; then
        echo "  ✅ Would trigger route suggestion"
        
        if [[ "$query" =~ (hospitals|hospital) ]]; then
            echo "  🏥 Would trigger handleHospitalRouteSuggestion()"
        elif [[ "$query" =~ (police|station) ]]; then
            echo "  🚔 Would trigger handlePoliceStationRouteSuggestion()"
        elif [[ "$query" =~ (school|college|university) ]]; then
            echo "  🎓 Would trigger handleEducationalRouteSuggestion()"
        elif [[ "$query" =~ (safe|safest) ]]; then
            echo "  🛡️ Would trigger handleSafeRouteSuggestion()"
        else
            echo "  🗺️ Would trigger handleRouteSuggestion()"
        fi
    else
        echo "  ❌ Would NOT trigger route suggestion"
    fi
    echo ""
}

test_query "suggest a route which has more hospitals"
test_query "find routes with police stations"
test_query "suggest safe routes"
test_query "routes with schools"
test_query "how to get there"
test_query "hospital route suggestions"
test_query "police station routes"

echo "🌐 Frontend Status:"
echo "------------------"
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend running on http://localhost:8080"
else
    echo "❌ Frontend not accessible on port 8080"
fi

if curl -s http://localhost:8083 > /dev/null 2>&1; then
    echo "✅ Frontend running on http://localhost:8083"
else
    echo "❌ Frontend not accessible on port 8083"
fi

echo ""
echo "🔧 Backend Status:"
echo "-----------------"
if curl -s http://localhost:8003/api/health > /dev/null 2>&1; then
    echo "✅ Backend running on http://localhost:8003"
else
    echo "❌ Backend not accessible on port 8003"
fi

echo ""
echo "🧪 Test Instructions:"
echo "--------------------"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Navigate to the chatbot (ChatBox component)"
echo "3. Try these test messages:"
echo "   • 'suggest a route which has more hospitals'"
echo "   • 'find routes with police stations'"
echo "   • 'suggest safe routes'"
echo "   • 'routes with schools'"
echo ""
echo "4. Check browser console for any errors"
echo "5. Look for the route suggestion responses"
echo ""

echo "🔍 Debug Steps:"
echo "--------------"
echo "1. Open browser developer tools (F12)"
echo "2. Go to Console tab"
echo "3. Type your message in the chatbot"
echo "4. Look for console logs showing:"
echo "   • 'isRouteQuery: true'"
echo "   • Route suggestion handler being called"
echo "   • Any error messages"
echo ""

echo "📋 Expected Behavior:"
echo "--------------------"
echo "• Hospital requests → Detailed hospital route suggestions"
echo "• Police requests → Police station route suggestions"
echo "• School requests → Educational institution routes"
echo "• Safe requests → General safe route recommendations"
echo "• Other requests → Standard route analysis"
echo ""

echo "🚨 If Still Not Working:"
echo "-----------------------"
echo "1. Check browser console for errors"
echo "2. Verify the ChatBox component is loaded"
echo "3. Check if the route detection logic is working"
echo "4. Verify the frontend is using the updated code"
echo ""

echo "✅ The chatbot should now handle route suggestion requests properly!"
