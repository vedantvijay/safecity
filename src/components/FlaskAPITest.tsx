// Simple test component to verify Flask API integration
// Add this to your React app to test the integration

import React, { useState, useEffect } from 'react';
import { crimePredictionService } from '../services/crimePredictionService';

const FlaskAPITest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testAPI = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      // Test 1: Health check
      const health = await crimePredictionService.checkAPIHealth();
      console.log('Health check:', health);
      
      // Test 2: Prediction
      const prediction = await crimePredictionService.getCrimePrediction({
        latitude: 13.0827,
        longitude: 80.2707,
        hour: 14
      });
      
      console.log('Prediction result:', prediction);
      
      if (prediction) {
        setTestResult(`✅ API Working! Prediction: ${prediction.predicted_crime_count}, Risk: ${prediction.risk_level}`);
      } else {
        setTestResult('❌ API returned null');
      }
      
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h3 className="text-lg font-semibold mb-4">Flask API Integration Test</h3>
      
      <button 
        onClick={testAPI}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test API'}
      </button>
      
      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <pre>{testResult}</pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Make sure Flask API is running on port 8002:</p>
        <code className="bg-gray-200 px-2 py-1 rounded">
          cd backend && source crime_analysis_env/bin/activate && python3 crime_api.py
        </code>
      </div>
    </div>
  );
};

export default FlaskAPITest;
