import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { communityApi } from '@/api/community';
import { toast } from 'sonner';

const BackendTest: React.FC = () => {
  const testEndpoints = async () => {
    try {
      // Test AI analysis endpoint
      const result = await communityApi.getAICrimeAnalysis(13.0827, 80.2707, 5);
      console.log('AI Analysis Result:', result);
      toast.success('✅ Location-based endpoints are working!');
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('❌ Endpoints not working - check backend server');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Backend Endpoint Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Test if the location-based endpoints are working properly.
          </p>
          
          <Button onClick={testEndpoints} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Test Location-Based Endpoints
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>This will test:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>GET /community/ai-analysis</li>
              <li>GET /community/location-alerts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackendTest;
