import axios from 'axios';

// Base API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface CrimeAlert {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  crimeType: string;
  timeAgo: string;
  source: 'ai-analysis' | 'user-report' | 'official';
  confidence: number;
  recommendations: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

interface CrimeAnalysisRequest {
  location: LocationData;
  radius?: number; // in kilometers
  timeRange?: '24h' | '7d' | '30d' | 'all';
}

interface CrimeAnalysisResponse {
  alerts: CrimeAlert[];
  summary: {
    totalCrimes: number;
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number;
    topCrimeTypes: string[];
    safetyRecommendations: string[];
  };
}

class LocationCrimeService {
  private openaiApiKey: string;
  private googleApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not found. Please check your environment variables.');
    }
    if (!this.googleApiKey) {
      throw new Error('Google Maps API key not found. Please check your environment variables.');
    }
  }

  /**
   * Get reverse geocoding information for coordinates
   */
  private async getLocationInfo(lat: number, lng: number): Promise<LocationData> {
    try {
      const response = await axios.get(GOOGLE_GEOCODING_API_URL, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.googleApiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const addressComponents = result.address_components;
        
        let city = '';
        let state = '';
        let country = '';
        
        for (const component of addressComponents) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (component.types.includes('country')) {
            country = component.long_name;
          }
        }

        return {
          latitude: lat,
          longitude: lng,
          address: result.formatted_address,
          city,
          state,
          country,
        };
      }
      
      return {
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
    }
  }

  /**
   * Use ChatGPT to analyze crime patterns and generate alerts
   */
  private async analyzeCrimeWithAI(location: LocationData, radius: number = 5): Promise<CrimeAlert[]> {
    try {
      const prompt = `You are a crime analysis expert. Analyze the crime situation for the location: ${location.address || `${location.latitude}, ${location.longitude}`} in ${location.city || 'the area'}, ${location.state || ''} ${location.country || ''}.

Please provide a realistic analysis of potential crime patterns and incidents within a ${radius}km radius. Consider:

1. Common crime types in urban areas (theft, vandalism, assault, etc.)
2. Time-based patterns (day/night, weekday/weekend)
3. Location-specific factors (commercial areas, residential, parks, etc.)
4. Recent trends and patterns

Generate 3-5 realistic crime alerts with:
- Specific incident descriptions
- Severity levels (low/medium/high)
- Crime types
- Safety recommendations
- Confidence scores (0-100)

Format your response as a JSON array of crime alerts. Each alert should have:
{
  "title": "Brief incident title",
  "description": "Detailed description of the incident",
  "location": "Specific location within the area",
  "severity": "low/medium/high",
  "crimeType": "Type of crime",
  "confidence": 85,
  "recommendations": ["Safety tip 1", "Safety tip 2"]
}

Be realistic and helpful. Focus on actionable safety information.`;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional crime analyst providing accurate, helpful safety information. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      
      // Try to parse JSON from the response
      try {
        const alerts = JSON.parse(content);
        if (Array.isArray(alerts)) {
          return alerts.map((alert, index) => ({
            id: `ai_${Date.now()}_${index}`,
            title: alert.title || 'Crime Incident',
            description: alert.description || 'No description available',
            location: alert.location || location.address || 'Unknown location',
            severity: alert.severity || 'medium',
            crimeType: alert.crimeType || 'Unknown',
            timeAgo: this.getRandomTimeAgo(),
            source: 'ai-analysis' as const,
            confidence: alert.confidence || 75,
            recommendations: alert.recommendations || ['Stay alert and aware of your surroundings'],
            coordinates: {
              lat: location.latitude + (Math.random() - 0.5) * 0.01, // Add some randomness
              lng: location.longitude + (Math.random() - 0.5) * 0.01,
            },
            createdAt: new Date().toISOString(),
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
      }

      // Fallback: create a generic alert if JSON parsing fails
      return [{
        id: `ai_${Date.now()}_0`,
        title: 'AI Crime Analysis Available',
        description: 'Crime analysis completed for your area. Stay vigilant and follow safety guidelines.',
        location: location.address || 'Your current location',
        severity: 'medium' as const,
        crimeType: 'General Safety',
        timeAgo: 'just now',
        source: 'ai-analysis' as const,
        confidence: 80,
        recommendations: [
          'Stay alert and aware of your surroundings',
          'Avoid isolated areas, especially at night',
          'Keep valuables secure and out of sight',
          'Report suspicious activity to local authorities'
        ],
        coordinates: {
          lat: location.latitude,
          lng: location.longitude,
        },
        createdAt: new Date().toISOString(),
      }];

    } catch (error) {
      console.error('AI Crime Analysis Error:', error);
      throw new Error('Failed to analyze crime data with AI');
    }
  }

  /**
   * Generate random time ago for realistic timestamps
   */
  private getRandomTimeAgo(): string {
    const times = [
      '5 minutes ago',
      '15 minutes ago',
      '30 minutes ago',
      '1 hour ago',
      '2 hours ago',
      '3 hours ago',
      '6 hours ago',
      '12 hours ago',
      '1 day ago',
      '2 days ago',
      '3 days ago',
    ];
    return times[Math.floor(Math.random() * times.length)];
  }

  /**
   * Analyze crime for a specific location
   */
  async analyzeLocationCrime(request: CrimeAnalysisRequest): Promise<CrimeAnalysisResponse> {
    try {
      // Get detailed location information
      const locationInfo = await this.getLocationInfo(request.location.latitude, request.location.longitude);
      
      // Analyze crime with AI
      const alerts = await this.analyzeCrimeWithAI(locationInfo, request.radius || 5);
      
      // Generate summary
      const summary = this.generateSummary(alerts);
      
      return {
        alerts,
        summary,
      };
    } catch (error) {
      console.error('Location crime analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate summary from alerts
   */
  private generateSummary(alerts: CrimeAlert[]) {
    const totalCrimes = alerts.length;
    const severityCounts = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let riskScore = 0;
    
    if (severityCounts.high > 0) {
      riskLevel = 'high';
      riskScore = 80 + (severityCounts.high * 10);
    } else if (severityCounts.medium > 0) {
      riskLevel = 'medium';
      riskScore = 40 + (severityCounts.medium * 15);
    } else {
      riskScore = 20 + (severityCounts.low * 5);
    }

    // Get top crime types
    const crimeTypes = alerts.map(alert => alert.crimeType);
    const topCrimeTypes = [...new Set(crimeTypes)].slice(0, 3);

    // Generate safety recommendations
    const allRecommendations = alerts.flatMap(alert => alert.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 5);

    return {
      totalCrimes,
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      topCrimeTypes,
      safetyRecommendations: uniqueRecommendations.length > 0 ? uniqueRecommendations : [
        'Stay alert and aware of your surroundings',
        'Avoid isolated areas, especially at night',
        'Keep valuables secure and out of sight',
        'Report suspicious activity to local authorities',
        'Use well-lit and populated routes when possible'
      ],
    };
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          try {
            const locationInfo = await this.getLocationInfo(location.latitude, location.longitude);
            resolve(locationInfo);
          } catch (error) {
            resolve(location); // Return basic location if geocoding fails
          }
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }
}

export const locationCrimeService = new LocationCrimeService();
export type { LocationData, CrimeAlert, CrimeAnalysisRequest, CrimeAnalysisResponse };
