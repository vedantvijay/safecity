// Test the Flask API integration from browser console
// Copy and paste this into your browser console while on the map page

async function testFlaskIntegration() {
  console.log('🧪 Testing Flask API Integration...');
  
  try {
    // Test 1: Direct API call
    console.log('1. Testing direct API call...');
    const response = await fetch('http://localhost:8002/api/crime/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: 13.0827,
        longitude: 80.2707,
        hour: 14
      })
    });
    
    const result = await response.json();
    console.log('✅ Direct API response:', result);
    
    // Test 2: Service call
    console.log('2. Testing service call...');
    if (typeof crimePredictionService !== 'undefined') {
      const prediction = await crimePredictionService.getCrimePrediction({
        latitude: 13.0827,
        longitude: 80.2707,
        hour: 14
      });
      console.log('✅ Service response:', prediction);
    } else {
      console.log('❌ crimePredictionService not found');
    }
    
    // Test 3: Check if API is accessible
    console.log('3. Testing API health...');
    const healthResponse = await fetch('http://localhost:8002/api/health');
    const healthResult = await healthResponse.json();
    console.log('✅ Health check:', healthResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('Possible issues:');
    console.log('1. Flask API not running on port 8002');
    console.log('2. CORS issues');
    console.log('3. Network connectivity');
    console.log('4. Service not imported correctly');
  }
}

// Run the test
testFlaskIntegration();

// Instructions
console.log(`
📋 Debugging Steps:

1. Make sure Flask API is running:
   cd backend && source crime_analysis_env/bin/activate && python3 crime_api.py

2. Check browser console for errors

3. Check Network tab in DevTools for failed requests

4. Verify the API URL in crimePredictionService.ts is correct

5. Check if CORS is working properly
`);
