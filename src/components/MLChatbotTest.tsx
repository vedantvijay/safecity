import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Route, 
  MapPin, 
  Navigation, 
  Shield, 
  AlertTriangle,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { openAIService } from '@/services/openai';
import { crimePredictionService } from '@/services/crimePredictionService';
import { toast } from 'sonner';

const MLChatbotTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'running' | 'success' | 'error';
    result?: string;
    error?: string;
  }>>([]);

  const runTest = async (testName: string, testFunction: () => Promise<string>) => {
    setTestResults(prev => [...prev, { test: testName, status: 'running' }]);
    
    try {
      const result = await testFunction();
      setTestResults(prev => 
        prev.map(t => 
          t.test === testName 
            ? { ...t, status: 'success', result }
            : t
        )
      );
      toast.success(`${testName} completed successfully!`);
    } catch (error) {
      setTestResults(prev => 
        prev.map(t => 
          t.test === testName 
            ? { ...t, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
            : t
        )
      );
      toast.error(`${testName} failed!`);
    }
  };

  const testMLModelExplanation = async (): Promise<string> => {
    const mockPrediction = {
      latitude: 13.0827,
      longitude: 80.2707,
      predicted_crimes: 2.3,
      risk_level: "MEDIUM",
      risk_probability: 65,
      factors: {
        lighting: "Good",
        police_distance: 1.2,
        time_of_day: "evening"
      }
    };
    
    return await openAIService.explainMLModelInsights(mockPrediction);
  };

  const testRouteSuggestion = async (): Promise<string> => {
    return await openAIService.getRouteSuggestions(
      13.0827, 80.2707, // Start location
      13.0877, 80.2757, // End location (5km away)
      {
        prioritizePoliceStations: true,
        prioritizeLighting: true,
        avoidHighCrimeAreas: true,
        timeOfDay: 'evening'
      }
    );
  };

  const testLocationAnalysis = async (): Promise<string> => {
    return await openAIService.analyzeCurrentLocationSafety(
      13.0827, 80.2707, 'evening'
    );
  };

  const testCrimePrediction = async (): Promise<string> => {
    const locationData = {
      latitude: 13.0827,
      longitude: 80.2707,
      hour: 14,
      month: 9,
      day_of_week: 1,
      cctv_present: true,
      lighting: 'Good' as const,
      police_distance_km: 2.5,
      safety_score: 75
    };
    const prediction = await crimePredictionService.getCrimePrediction(locationData);
    return `ML Model Prediction: ${JSON.stringify(prediction, null, 2)}`;
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    await runTest('ML Model Explanation', testMLModelExplanation);
    await runTest('Route Suggestion (Police Stations)', testRouteSuggestion);
    await runTest('Location Safety Analysis', testLocationAnalysis);
    await runTest('Crime Prediction API', testCrimePrediction);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>ML-Integrated Chatbot Test Suite</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Test the enhanced chatbot's ML integration capabilities including route suggestions, 
            police station proximity analysis, and safety factor recommendations.
          </p>
          
          <div className="flex space-x-4">
            <Button onClick={runAllTests} className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>Run All Tests</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runTest('ML Model Explanation', testMLModelExplanation)}
              className="flex items-center space-x-2"
            >
              <Brain className="h-4 w-4" />
              <span>Test ML Explanation</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runTest('Route Suggestion', testRouteSuggestion)}
              className="flex items-center space-x-2"
            >
              <Route className="h-4 w-4" />
              <span>Test Route Suggestions</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runTest('Location Analysis', testLocationAnalysis)}
              className="flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Test Location Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((test, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.test}</span>
                  </div>
                  <Badge className={getStatusColor(test.status)}>
                    {test.status.toUpperCase()}
                  </Badge>
                </div>
                
                {test.result && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h4 className="font-medium mb-2">Result:</h4>
                    <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                      {test.result}
                    </pre>
                  </div>
                )}
                
                {test.error && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">Error:</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">{test.error}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>ML-Integrated Chatbot Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Route className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Route Suggestions</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered route recommendations based on police station proximity, 
                lighting conditions, and crime risk assessment.
              </p>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-500" />
                <span className="font-medium">Location Safety Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time safety assessment of current location using ML model 
                predictions and environmental factors.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span className="font-medium">ML Model Explanations</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Intelligent explanations of ML model predictions in plain language 
                with actionable safety recommendations.
              </p>
              
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Safety Factor Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Comprehensive analysis of lighting, police presence, and other 
                safety factors affecting crime risk.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MLChatbotTest;
