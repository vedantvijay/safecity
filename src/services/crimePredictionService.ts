// Crime Prediction Service for React/Next.js
// This service connects your frontend to the CPAA ML model API

export interface CrimePrediction {
  predicted_crime_count: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_probability: number;
  safety_recommendation: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  hour?: number;
  month?: number;
  day_of_week?: number;
  cctv_present?: boolean;
  lighting?: 'Good' | 'Poor' | 'Unknown';
  police_distance_km?: number;
  safety_score?: number;
  road_type?: string;
  jurisdiction?: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface RouteAnalysis {
  location: LocationData;
  prediction: CrimePrediction;
}

class CrimePredictionService {
  private baseUrl: string;

  constructor() {
    // Configure API endpoint
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-backend-domain.com/api' 
      : 'http://localhost:8002/api';  // Updated to port 8002 for Flask API
  }

  /**
   * Get crime prediction for a specific location
   */
  async getCrimePrediction(locationData: LocationData): Promise<CrimePrediction | null> {
    try {
      console.log('Getting crime prediction for:', locationData);
      console.log('Base URL:', this.baseUrl);
      console.log('Full URL:', `${this.baseUrl}/crime/predict`);
      
      const response = await fetch(`${this.baseUrl}/crime/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      if (!response.ok) {
        console.error('API Response not OK:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response data:', result);
      console.log('Risk level from API:', result.risk_level);
      console.log('Prediction value:', result.prediction);
      
      // Handle Flask API response format
      if (result.success && result.prediction !== undefined) {
        // Convert simple prediction to CrimePrediction format
        const prediction = result.prediction;
        const riskLevel = result.risk_level || (prediction < 100 ? 'LOW' : prediction < 250 ? 'MEDIUM' : 'HIGH');
        
        // Calculate risk probability based on the actual risk level from API
        let riskProbability: number;
        const normalizedRiskLevel = result.risk_level?.toUpperCase() || 'LOW';
        if (normalizedRiskLevel === 'HIGH') {
          riskProbability = Math.min(Math.max((prediction - 250) / 150 * 30 + 70, 70), 100); // 70-100% for HIGH
        } else if (normalizedRiskLevel === 'MEDIUM') {
          riskProbability = Math.min(Math.max((prediction - 100) / 150 * 40 + 30, 30), 70); // 30-70% for MEDIUM
        } else {
          riskProbability = Math.min(Math.max(prediction / 100 * 30, 0), 30); // 0-30% for LOW
        }
        
        const finalResult = {
          predicted_crime_count: prediction,
          risk_level: normalizedRiskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
          risk_probability: riskProbability,
          safety_recommendation: this.getSafetyRecommendation(normalizedRiskLevel, locationData)
        };
        
        console.log('Final calculated result:', finalResult);
        return finalResult;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting crime prediction:', error);
      return this.getFallbackPrediction(locationData);
    }
  }

  /**
   * Get crime heatmap data for map visualization
   */
  async getCrimeHeatmap(bounds: google.maps.LatLngBounds): Promise<HeatmapPoint[]> {
    try {
      const response = await fetch(`${this.baseUrl}/crime/heatmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.heatmapData : [];
    } catch (error) {
      console.error('Error getting crime heatmap:', error);
      return [];
    }
  }

  /**
   * Alias for getCrimeHeatmap to match frontend expectations
   */
  async getSafetyHeatmapData(bounds: google.maps.LatLngBounds): Promise<HeatmapPoint[]> {
    return this.getCrimeHeatmap(bounds);
  }

  /**
   * Analyze crime risk along a route
   */
  async analyzeRoute(routePoints: LocationData[]): Promise<RouteAnalysis[]> {
    try {
      const response = await fetch(`${this.baseUrl}/crime/route-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ route_points: routePoints }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.routeAnalysis : [];
    } catch (error) {
      console.error('Error analyzing route:', error);
      return [];
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const result = await response.json();
      return result.status === 'healthy' && result.model_loaded;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Fallback prediction when API is not available
   */
  private getFallbackPrediction(locationData: LocationData): CrimePrediction {
    const hour = locationData.hour || new Date().getHours();
    const isNight = hour >= 20 || hour <= 6;
    const hasCCTV = locationData.cctv_present || false;
    const goodLighting = locationData.lighting === 'Good';
    const policeNearby = (locationData.police_distance_km || 5) < 2;

    // Simple heuristic-based fallback
    let riskProbability = 20; // Base risk
    if (isNight) riskProbability += 15;
    if (!hasCCTV) riskProbability += 10;
    if (!goodLighting) riskProbability += 10;
    if (!policeNearby) riskProbability += 5;

    const riskLevel = riskProbability > 50 ? 'HIGH' : riskProbability > 30 ? 'MEDIUM' : 'LOW';

    return {
      predicted_crime_count: Math.round(riskProbability * 2),
      risk_level: riskLevel,
      risk_probability: Math.min(riskProbability, 100),
      safety_recommendation: this.getFallbackRecommendation(riskLevel, locationData),
    };
  }

  private getFallbackRecommendation(riskLevel: string, locationData: LocationData): string {
    const recommendations = [];
    
    if (riskLevel === 'HIGH') {
      recommendations.push('🚨 AVOID this area - High crime risk!');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('⚠️ Exercise caution - Medium risk area');
    } else {
      recommendations.push('✅ Relatively safe area');
    }

    if (!locationData.cctv_present) {
      recommendations.push('📹 No CCTV detected - Stay alert');
    }

    if (locationData.lighting === 'Poor') {
      recommendations.push('💡 Poor lighting - Avoid after dark');
    }

    if ((locationData.police_distance_km || 5) > 3) {
      recommendations.push('👮 Police station far - Emergency response may be slow');
    }

    return recommendations.join(' | ');
  }

  /**
   * Generate safety recommendations based on risk level and location data
   */
  getSafetyRecommendation(riskLevel: string, locationData: LocationData): string {
    const recommendations: string[] = [];
    
    if (riskLevel === 'HIGH') {
      recommendations.push('🚨 AVOID this area - High crime risk!');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('⚠️ Exercise caution - Medium risk area');
    } else {
      recommendations.push('✅ Relatively safe area');
    }
    
    if (locationData.cctv_present === false) {
      recommendations.push('📹 No CCTV detected - Stay alert');
    }
    
    if (locationData.lighting === 'Poor') {
      recommendations.push('💡 Poor lighting - Avoid after dark');
    }
    
    if ((locationData.police_distance_km || 5) > 3) {
      recommendations.push('👮 Police station far - Emergency response may be slow');
    }
    
    return recommendations.join(' | ');
  }

  /**
   * Get current time-based safety factors
   */
  getCurrentSafetyFactors(): Partial<LocationData> {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    const dayOfWeek = now.getDay();

    return {
      hour,
      month,
      day_of_week: dayOfWeek,
    };
  }

  /**
   * Convert Google Maps LatLng to LocationData
   */
  convertLatLngToLocationData(
    latLng: google.maps.LatLng, 
    additionalData: Partial<LocationData> = {}
  ): LocationData {
    return {
      latitude: latLng.lat(),
      longitude: latLng.lng(),
      ...this.getCurrentSafetyFactors(),
      ...additionalData,
    };
  }

  /**
   * Get risk color for UI display
   */
  getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH': return '#ef4444'; // red-500
      case 'MEDIUM': return '#f59e0b'; // amber-500
      case 'LOW': return '#10b981'; // emerald-500
      default: return '#6b7280'; // gray-500
    }
  }

  /**
   * Get risk icon for UI display
   */
  getRiskIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH': return '🚨';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return '✅';
      default: return '❓';
    }
  }
}

export const crimePredictionService = new CrimePredictionService();
export default crimePredictionService;