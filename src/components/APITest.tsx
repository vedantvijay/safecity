import React, { useState } from 'react';
import { crimePredictionService } from '../services/crimePredictionService';

const APITest: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing API call...');
      const locationData = {
        latitude: 13.0827,
        longitude: 80.2707,
        hour: 14,
        month: 9,
        day_of_week: 5,
        cctv_present: false,
        lighting: 'Good' as const,
        police_distance_km: 2.0,
        safety_score: 5.0
      };

      console.log('Sending location data:', locationData);
      const prediction = await crimePredictionService.getCrimePrediction(locationData);
      console.log('Received prediction:', prediction);
      
      setResult(prediction);
    } catch (err) {
      console.error('API test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testRouteAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing Route API call...');
      const routePoints = [
        {
          latitude: 13.0827,
          longitude: 80.2707,
          hour: 14,
          month: 9,
          day_of_week: 5,
          cctv_present: false,
          lighting: 'Good' as const,
          police_distance_km: 2.0,
          safety_score: 5.0
        },
        {
          latitude: 13.0837,
          longitude: 80.2717,
          hour: 14,
          month: 9,
          day_of_week: 5,
          cctv_present: false,
          lighting: 'Good' as const,
          police_distance_km: 2.0,
          safety_score: 5.0
        }
      ];

      console.log('Sending route data:', routePoints);
      const routeAnalysis = await crimePredictionService.analyzeRoute(routePoints);
      console.log('Received route analysis:', routeAnalysis);
      
      setResult(routeAnalysis);
    } catch (err) {
      console.error('Route API test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Test Component</h2>
      
      <div className="space-y-4">
        <button
          onClick={testAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Single Prediction API'}
        </button>

        <button
          onClick={testRouteAPI}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Route Analysis API'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <strong>Result:</strong>
          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open browser console (F12)</li>
          <li>Click "Test Single Prediction API" button</li>
          <li>Check console logs for detailed API call information</li>
          <li>Verify the result shows dynamic values (not static)</li>
        </ol>
      </div>
    </div>
  );
};

export default APITest;
