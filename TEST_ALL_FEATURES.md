# 🧪 SafeCity - Complete Feature Testing Guide

## ✅ Prerequisites

### Services Must Be Running
```bash
# Check all services are running:
curl http://localhost:8080  # Frontend
curl http://localhost:8000/api/health  # Crime API
curl http://localhost:8003/api/health  # Community API
```

## 1. 🚨 SOS Button Testing

### Setup
1. Open http://localhost:8080
2. Look for red SOS button (bottom right corner)
3. Click Settings icon (⚙️) next to SOS button

### Configure
1. Enter your name
2. Enter your email
3. Update emergency contacts:
   - Name: Your emergency contact name
   - Email: Valid email address
   - Relationship: Friend/Family/etc.

### Test SOS
1. Click the red SOS button
2. Allow location access when prompted
3. Wait for "SOS ALERT SENT" toast notification
4. Check the email inbox of emergency contacts

### Expected Result
- ✅ Toast notification: "Emergency alerts sent to X contact(s)"
- ✅ Email received with:
  - Your location (latitude/longitude)
  - Google Maps link
  - Timestamp
  - Emergency message

### Troubleshooting
**If SOS doesn't work:**
1. Check browser console (F12) for errors
2. Verify EmailJS credentials in `.env`:
   ```
   VITE_EMAILJS_SERVICE_ID=service_vqddhdh
   VITE_EMAILJS_TEMPLATE_ID=template_duu0sn8
   VITE_EMAILJS_PUBLIC_KEY=l3-oi62WmJ-1hLHlo
   ```
3. Test EmailJS directly:
   ```bash
   curl -X POST https://api.emailjs.com/api/v1.0/email/send \
     -H "Content-Type: application/json" \
     -d '{
       "service_id": "service_vqddhdh",
       "template_id": "template_duu0sn8",
       "user_id": "l3-oi62WmJ-1hLHlo",
       "template_params": {
         "to_email": "test@example.com",
         "message": "Test"
       }
     }'
   ```
4. Check EmailJS dashboard: https://dashboard.emailjs.com/

## 2. 👥 Community Posts Testing

### Access Community
1. Click "Community" in navigation menu
2. Or go to: http://localhost:8080/community

### View Community Stats
- Should see:
  - Community Members count
  - Safety Rating (%)
  - Active Alerts count
  - Crime Rate Change (%)

### View Alerts
- Scroll to "Recent Alerts" section
- Should see list of alerts with:
  - Title
  - Location
  - Time ago
  - Severity badge (low/medium/high)

### View Discussions
- Scroll to "Community Discussions" section
- Should see discussion posts with:
  - Title
  - Author
  - Reply count
  - Time ago
  - Category badge

### Create New Discussion
1. Click "New Discussion" button
2. Fill in:
   - Title: "Test Post"
   - Content: "This is a test discussion"
   - Category: Select "Safety"
   - Author: Your name
3. Click "Create Discussion"
4. Should see success toast
5. New post should appear in list

### Test with API
```bash
# Get community stats
curl http://localhost:8003/community/stats

# Get discussions
curl http://localhost:8003/community/discussions

# Create a post
curl -X POST http://localhost:8003/community/discussions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Safety Discussion",
    "content": "Testing the community feature",
    "category": "Safety",
    "author": "Test User"
  }'

# Get alerts
curl http://localhost:8003/community/alerts
```

### Expected Results
- ✅ Stats load and display
- ✅ Alerts list shows recent incidents
- ✅ Discussions load with posts
- ✅ Can create new discussion
- ✅ New post appears immediately

### Troubleshooting
**If Community doesn't load:**
1. Check Community API is running:
   ```bash
   curl http://localhost:8003/api/health
   ```
2. Check browser console for CORS errors
3. Verify `.env` has:
   ```
   VITE_COMMUNITY_API_URL=http://localhost:8003
   ```
4. Check backend logs for errors
5. Restart Community API:
   ```bash
   cd backend
   python enhanced_community_api.py
   ```

## 3. 🗺️ Chatbot Route Suggestions

### Setup
1. Open http://localhost:8080
2. Map should be visible on left
3. Chatbot should be visible on right

### Test Route Suggestion Flow

#### Step 1: Set Locations on Map
1. Click "My Location" button to set start point
2. Search for destination (e.g., "Marina Beach, Chennai")
3. Or click on map to set destination

#### Step 2: Ask Chatbot for Route
Type any of these queries:
- "Suggest a safe route"
- "Find me the safest way to my destination"
- "Show me routes with police stations"
- "I need a well-lit route"
- "Suggest route to hospital"
- "Find route avoiding high crime areas"

#### Step 3: Verify Response
Chatbot should respond with:
- ✅ Start location safety analysis
- ✅ Destination safety analysis
- ✅ AI route recommendations
- ✅ Real-time safety factors
- ✅ Route distance calculation
- ✅ Message: "I've added [type] routes to your existing route options!"

#### Step 4: Check Map
After chatbot response:
- ✅ New routes should appear on map
- ✅ Route buttons should show multiple options
- ✅ Each route should have safety score
- ✅ Can click to switch between routes

### Test Specific Route Types

**Police Station Route:**
```
User: "Find me a route with police stations nearby"
```
Expected:
- Chatbot analyzes request
- Calls `onRouteRequest({ prioritizePoliceStations: true })`
- Map generates "Police Station Route"
- Route appears in route list

**Well-Lit Route:**
```
User: "I need a well-lit route for night travel"
```
Expected:
- Chatbot detects lighting preference
- Calls `onRouteRequest({ prioritizeLighting: true, timeOfDay: 'night' })`
- Map generates "Well-Lit Route"
- Route appears in route list

**Safe Route:**
```
User: "Show me the safest route avoiding crime areas"
```
Expected:
- Chatbot detects safety priority
- Calls `onRouteRequest({ avoidHighCrimeAreas: true })`
- Map generates "Safe Route"
- Route appears in route list

### Test with Different Destinations

**Hospital:**
```
User: "Find route to nearest hospital"
```
Expected:
- Chatbot suggests hospital routes
- Provides safety analysis
- Shows multiple route options

**School:**
```
User: "Safe route to school"
```
Expected:
- Chatbot analyzes school route
- Prioritizes safety
- Shows well-lit options

**Night Travel:**
```
User: "I'm traveling at night, suggest safe route"
```
Expected:
- Chatbot considers night time
- Prioritizes lighting and police presence
- Shows night-safe routes

### Verify Integration

**Check onRouteRequest is called:**
1. Open browser console (F12)
2. Type route query in chatbot
3. Should see console log: "Processing route request from chatbot"
4. Should see route preferences object

**Check routes are added:**
1. After chatbot response
2. Look at map route buttons
3. Should see new route types added
4. Route count should increase

### Expected Results
- ✅ Chatbot understands route queries
- ✅ Analyzes start and destination safety
- ✅ Calls onRouteRequest with preferences
- ✅ Map generates new routes
- ✅ Routes appear in route list
- ✅ Can switch between all routes
- ✅ Each route shows safety score

### Troubleshooting

**Chatbot doesn't suggest routes:**
1. Check if both start and destination are set on map
2. Verify chatbot receives mapLocations prop
3. Check console for errors
4. Try query: "analyze route safety"

**Routes don't appear on map:**
1. Check onRouteRequest callback is connected
2. Verify MapPage passes callback to chatbot
3. Check GoogleMap component receives onRouteRequest
4. Look for console errors in route generation

**Safety scores not showing:**
1. Verify ML API is running (Port 8000)
2. Check route analysis endpoint:
   ```bash
   curl -X POST http://localhost:8000/api/predict-route \
     -H "Content-Type: application/json" \
     -d '{"locations":[{"latitude":13.0827,"longitude":80.2707}]}'
   ```
3. Check browser network tab for API calls

## 4. 🗺️ Heatmap Testing

### Enable Heatmap
1. Open map page
2. Look for "Show Safety" toggle button
3. Click to enable heatmap

### Verify Heatmap Display
- ✅ Colored overlay appears on map
- ✅ Colors range from green (safe) to red (dangerous)
- ✅ Heatmap updates when zooming/panning
- ✅ Can toggle on/off

### Test Heatmap API
```bash
curl -X POST http://localhost:8000/api/safety-heatmap \
  -H "Content-Type: application/json" \
  -d '{
    "north": 13.1,
    "south": 13.0,
    "east": 80.3,
    "west": 80.2
  }'
```

Expected response:
```json
{
  "success": true,
  "heatmapData": [
    {"lat": 13.0, "lng": 80.2, "weight": 0.15},
    {"lat": 13.05, "lng": 80.25, "weight": 0.45},
    ...
  ]
}
```

### Color Interpretation
- 🟢 **Green (0-0.25)**: Very safe, low crime risk
- 🟡 **Yellow (0.25-0.50)**: Moderate risk
- 🟠 **Orange (0.50-0.75)**: Elevated risk, caution advised
- 🔴 **Red (0.75-1.0)**: High risk, avoid if possible

### Troubleshooting
**Heatmap not showing:**
1. Check if toggle button exists
2. Verify Google Maps visualization library loaded
3. Check console for errors
4. Test heatmap API endpoint
5. Verify map bounds are valid

## 5. 🎯 Complete Integration Test

### Full Workflow Test
1. **Open App**: http://localhost:8080
2. **Set Location**: Click "My Location"
3. **Search Destination**: Search for "Marina Beach"
4. **Ask Chatbot**: "Suggest safest route to Marina Beach"
5. **Verify**:
   - Chatbot analyzes both locations
   - Shows safety scores
   - Adds new routes to map
   - Can see multiple route options
6. **Enable Heatmap**: Toggle "Show Safety"
7. **Compare Routes**: Click different route buttons
8. **Check Community**: Go to Community page
9. **Create Post**: Share route experience
10. **Test SOS**: Configure and test emergency alert

### Success Criteria
- ✅ All services running
- ✅ Map loads with Google API
- ✅ Chatbot responds to queries
- ✅ Routes generated with safety scores
- ✅ Heatmap displays crime risk
- ✅ Community features work
- ✅ SOS button sends alerts

## 📊 Quick Status Check

Run this to verify all services:
```bash
# Frontend
curl -s http://localhost:8080 | head -n 1

# Crime API
curl -s http://localhost:8000/api/health | grep -o '"status":"healthy"'

# Community API  
curl -s http://localhost:8003/api/health | grep -o '"status":"healthy"'
```

All should return success responses.

## 🐛 Common Issues

### Issue: "API not responding"
**Solution**: Restart backend services
```bash
cd backend
python api_server.py  # Terminal 1
python enhanced_community_api.py  # Terminal 2
```

### Issue: "Map not loading"
**Solution**: Check Google Maps API key in `.env`
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCS9FOUebt88LT6W7uTjd2u9d6LgpRpkJs
```

### Issue: "Chatbot not suggesting routes"
**Solution**: 
1. Set both start and destination on map first
2. Use specific keywords: "route", "safe", "suggest"
3. Check console for errors

### Issue: "Community page blank"
**Solution**: 
1. Verify Community API running (Port 8003)
2. Check CORS settings
3. Clear browser cache

### Issue: "SOS not sending"
**Solution**:
1. Verify EmailJS credentials
2. Check browser allows location access
3. Test with curl to EmailJS API

---

**Testing Complete!** ✅

All features should now be working. If you encounter any issues, check the troubleshooting sections above.
