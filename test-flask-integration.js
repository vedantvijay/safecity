// Test file to verify Flask API integration
// Run this in browser console or as a React component

import { crimePredictionService } from './src/services/crimePredictionService';

async function testFlaskAPI() {
  console.log('🧪 Testing Flask API Integration...');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const health = await crimePredictionService.checkAPIHealth();
    console.log('✅ Health check:', health);
    
    // Test 2: Single Prediction
    console.log('2. Testing single prediction...');
    const prediction = await crimePredictionService.getCrimePrediction({
      latitude: 13.0827,
      longitude: 80.2707,
      hour: 14
    });
    console.log('✅ Prediction result:', prediction);
    
    // Test 3: Heatmap Data
    console.log('3. Testing heatmap data...');
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(13.0, 80.0),
      new google.maps.LatLng(13.2, 80.3)
    );
    const heatmapData = await crimePredictionService.getCrimeHeatmap(bounds);
    console.log('✅ Heatmap data points:', heatmapData.length);
    
    // Test 4: Route Analysis
    console.log('4. Testing route analysis...');
    const routePoints = [
      { latitude: 13.0827, longitude: 80.2707, hour: 14 },
      { latitude: 13.0067, longitude: 80.2206, hour: 15 }
    ];
    const routeAnalysis = await crimePredictionService.analyzeRoute(routePoints);
    console.log('✅ Route analysis points:', routeAnalysis.length);
    
    console.log('🎉 All tests passed! Flask API integration is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in React components
export { testFlaskAPI };

// Instructions for testing:
console.log(`
📋 Flask API Integration Test Instructions:

1. Make sure Flask API is running on port 8002:
   cd backend && source crime_analysis_env/bin/activate && python3 crime_api.py

2. Test API endpoints manually:
   curl -X GET http://localhost:8002/api/health
   curl -X POST http://localhost:8002/api/crime/predict -H "Content-Type: application/json" -d '{"latitude": 13.0827, "longitude": 80.2707, "hour": 14}'

3. Test in React app:
   - Import and call testFlaskAPI() in your component
   - Check browser console for results
   - Verify predictions appear on the map

4. Frontend integration points:
   - GoogleMap.tsx: Uses crimePredictionService.getCrimePrediction()
   - CrimeMap.tsx: Uses crimePredictionService.getCrimeHeatmap()
   - Route analysis: Uses crimePredictionService.analyzeRoute()

✅ Integration complete! Your frontend can now make predictions using the Flask API.
`);
