import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Bot, AlertTriangle, MapPin } from 'lucide-react';
import { openAIService } from '@/services/openai';
import { crimePredictionService } from '@/services/crimePredictionService';

const ChatbotTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testMLIntegration = async () => {
    setIsLoading(true);
    const results: any[] = [];

    try {
      // Test 1: Basic ML Model Explanation
      console.log('Testing ML model explanation...');
      const mlExplanation = await openAIService.provideSafetyEducation('ML crime prediction model');
      results.push({
        test: 'ML Model Explanation',
        result: mlExplanation,
        status: 'success'
      });

      // Test 2: Crime Prediction Analysis
      console.log('Testing crime prediction analysis...');
      const predictionData = {
        riskLevel: 'HIGH' as const,
        riskProbability: 85,
        predictedCrimeCount: 313,
        location: 'Downtown Chennai',
        timeOfDay: 'Evening (8 PM)'
      };
      
      const crimeAnalysis = await openAIService.analyzeCrimePrediction(predictionData);
      results.push({
        test: 'Crime Prediction Analysis',
        result: crimeAnalysis,
        status: 'success'
      });

      // Test 3: Route Safety Analysis
      console.log('Testing route safety analysis...');
      const routeData = {
        averageRisk: 65,
        maxRisk: 85,
        minRisk: 45,
        riskLevel: 'HIGH' as const,
        pointsAnalyzed: 12,
        routeType: 'City Center Route'
      };
      
      const routeAnalysis = await openAIService.analyzeRouteSafety(routeData);
      results.push({
        test: 'Route Safety Analysis',
        result: routeAnalysis,
        status: 'success'
      });

      // Test 4: Real API Integration
      console.log('Testing real API integration...');
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
      
      const realPrediction = await crimePredictionService.getCrimePrediction(locationData);
      if (realPrediction) {
        const realAnalysis = await openAIService.analyzeCrimePrediction({
          riskLevel: realPrediction.risk_level,
          riskProbability: realPrediction.risk_probability,
          predictedCrimeCount: realPrediction.predicted_crime_count,
          location: 'Chennai (Real API)',
          timeOfDay: 'Afternoon'
        });
        
        results.push({
          test: 'Real API Integration',
          result: realAnalysis,
          status: 'success',
          apiData: realPrediction
        });
      }

      // Test 5: Safety Education
      console.log('Testing safety education...');
      const safetyEducation = await openAIService.provideSafetyEducation('nighttime safety');
      results.push({
        test: 'Safety Education',
        result: safetyEducation,
        status: 'success'
      });

    } catch (error) {
      console.error('Test error:', error);
      results.push({
        test: 'Error Test',
        result: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">🤖 Chatbot ML Integration Test</h2>
        <p className="text-muted-foreground">
          Test the chatbot's ability to understand and explain ML crime predictions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Test Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button
              onClick={testMLIntegration}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>{isLoading ? 'Testing...' : 'Run ML Integration Tests'}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={clearResults}
              disabled={isLoading}
            >
              Clear Results
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Running comprehensive ML integration tests...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Test Results</h3>
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    {result.status === 'success' ? (
                      <Shield className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{result.test}</span>
                  </CardTitle>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{result.result}</p>
                  </div>
                  
                  {result.apiData && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Real API Data:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Risk Level:</span> {result.apiData.risk_level}
                        </div>
                        <div>
                          <span className="font-medium">Risk %:</span> {result.apiData.risk_probability}%
                        </div>
                        <div>
                          <span className="font-medium">Crime Count:</span> {result.apiData.predicted_crime_count}
                        </div>
                        <div>
                          <span className="font-medium">Recommendation:</span> {result.apiData.safety_recommendation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>What This Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">ML Model Understanding</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Explains Random Forest Regressor</li>
                <li>• Understands risk level calculations</li>
                <li>• Knows about Chennai crime data</li>
                <li>• Explains prediction factors</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Safety Recommendations</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Provides contextual advice</li>
                <li>• Suggests practical safety measures</li>
                <li>• Explains risk percentages</li>
                <li>• Offers route alternatives</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotTest;
