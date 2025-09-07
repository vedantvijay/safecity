interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CrimePredictionData {
  latitude: number;
  longitude: number;
  hour?: number;
  month?: number;
  day_of_week?: number;
  cctv_present?: boolean;
  lighting?: 'Good' | 'Poor' | 'Unknown';
  police_distance_km?: number;
  safety_score?: number;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found. Please check your environment variables.');
    }
  }

  async sendMessage(
    messages: ChatMessage[],
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are SafeCity Assistant, an advanced AI assistant specialized in urban safety and crime prediction. You have access to a sophisticated ML model that analyzes crime patterns and provides real-time safety assessments.

## Your Capabilities:
- **Crime Prediction Analysis**: Explain ML model predictions, risk levels (HIGH/MEDIUM/LOW), and risk percentages
- **Safety Recommendations**: Provide location-specific safety advice based on ML predictions
- **Route Analysis**: Help users understand route safety scores and suggest safer alternatives
- **Emergency Services**: Guide users to appropriate emergency contacts and procedures
- **Safety Education**: Share crime prevention tips and urban safety best practices

## ML Model Knowledge:
- The system uses a Random Forest Regressor trained on Chennai crime data
- Predictions are based on factors like: time of day, location coordinates, CCTV presence, lighting conditions, police proximity
- Risk levels: LOW (0-30%), MEDIUM (30-70%), HIGH (70-100%)
- The model analyzes multiple points along routes to provide comprehensive safety assessments

## Response Guidelines:
- Always prioritize user safety and provide actionable advice
- Explain ML predictions in simple, understandable terms
- Suggest practical safety measures based on risk levels
- For emergencies, always remind users to call local emergency numbers
- Be empathetic and supportive while maintaining professionalism
- Use emojis appropriately to make responses engaging but not overwhelming

## Example Responses:
- "Based on our ML analysis, this area has a HIGH risk level (85%) due to poor lighting and limited CCTV coverage. I recommend avoiding this route after dark and staying in well-lit areas."
- "The route analysis shows MEDIUM risk (45%) with higher risk in the downtown section. Consider taking the alternative route via Main Street which has better lighting and police presence."

Always be helpful, informative, and prioritize user safety. Keep responses concise but comprehensive.`
            },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  async sendStreamingMessage(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are SafeCity Assistant, an advanced AI assistant specialized in urban safety and crime prediction. You have access to a sophisticated ML model that analyzes crime patterns and provides real-time safety assessments.

## Your Capabilities:
- **Crime Prediction Analysis**: Explain ML model predictions, risk levels (HIGH/MEDIUM/LOW), and risk percentages
- **Safety Recommendations**: Provide location-specific safety advice based on ML predictions
- **Route Analysis**: Help users understand route safety scores and suggest safer alternatives
- **Emergency Services**: Guide users to appropriate emergency contacts and procedures
- **Safety Education**: Share crime prevention tips and urban safety best practices

## ML Model Knowledge:
- The system uses a Random Forest Regressor trained on Chennai crime data
- Predictions are based on factors like: time of day, location coordinates, CCTV presence, lighting conditions, police proximity
- Risk levels: LOW (0-30%), MEDIUM (30-70%), HIGH (70-100%)
- The model analyzes multiple points along routes to provide comprehensive safety assessments

## Response Guidelines:
- Always prioritize user safety and provide actionable advice
- Explain ML predictions in simple, understandable terms
- Suggest practical safety measures based on risk levels
- For emergencies, always remind users to call local emergency numbers
- Be empathetic and supportive while maintaining professionalism
- Use emojis appropriately to make responses engaging but not overwhelming

## Example Responses:
- "Based on our ML analysis, this area has a HIGH risk level (85%) due to poor lighting and limited CCTV coverage. I recommend avoiding this route after dark and staying in well-lit areas."
- "The route analysis shows MEDIUM risk (45%) with higher risk in the downtown section. Consider taking the alternative route via Main Street which has better lighting and police presence."

Always be helpful, informative, and prioritize user safety. Keep responses concise but comprehensive.`
            },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      console.error('OpenAI Streaming Error:', error);
      onError(error as Error);
    }
  }

  /**
   * Analyze crime prediction data and provide contextual safety advice
   */
  async analyzeCrimePrediction(
    predictionData: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      riskProbability: number;
      predictedCrimeCount: number;
      location?: string;
      timeOfDay?: string;
    }
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Please analyze this crime prediction data and provide safety advice:

Risk Level: ${predictionData.riskLevel}
Risk Probability: ${predictionData.riskProbability}%
Predicted Crime Count: ${predictionData.predictedCrimeCount}
Location: ${predictionData.location || 'Unknown'}
Time of Day: ${predictionData.timeOfDay || 'Unknown'}

Please provide:
1. A brief explanation of what these numbers mean
2. Specific safety recommendations based on the risk level
3. Practical tips for staying safe in this area
4. When to avoid this location if applicable`
      }
    ];

    return this.sendMessage(messages);
  }

  /**
   * Provide route safety analysis and recommendations
   */
  async analyzeRouteSafety(
    routeData: {
      averageRisk: number;
      maxRisk: number;
      minRisk: number;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      pointsAnalyzed: number;
      routeType: string;
    }
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Please analyze this route safety data and provide recommendations:

Route Type: ${routeData.routeType}
Overall Risk Level: ${routeData.riskLevel}
Average Risk: ${routeData.averageRisk.toFixed(1)}%
Maximum Risk: ${routeData.maxRisk.toFixed(1)}%
Minimum Risk: ${routeData.minRisk.toFixed(1)}%
Points Analyzed: ${routeData.pointsAnalyzed}

Please provide:
1. An assessment of whether this route is safe to take
2. Specific recommendations based on the risk analysis
3. Alternative suggestions if the route is high risk
4. Safety tips for traveling this route`
      }
    ];

    return this.sendMessage(messages);
  }

  /**
   * Get intelligent route suggestions based on ML model predictions and safety factors
   */
  async getRouteSuggestions(startLat: number, startLng: number, endLat: number, endLng: number, preferences: {
    prioritizePoliceStations?: boolean;
    prioritizeLighting?: boolean;
    avoidHighCrimeAreas?: boolean;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  }): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `I need route suggestions from coordinates ${startLat}, ${startLng} to ${endLat}, ${endLng}.

User Preferences:
- Prioritize Police Stations: ${preferences.prioritizePoliceStations ? 'Yes' : 'No'}
- Prioritize Good Lighting: ${preferences.prioritizeLighting ? 'Yes' : 'No'}
- Avoid High Crime Areas: ${preferences.avoidHighCrimeAreas ? 'Yes' : 'No'}
- Time of Day: ${preferences.timeOfDay || 'Not specified'}

Based on our ML model's crime prediction capabilities, please provide:

1. **Route Analysis**: Analyze the safety of different possible routes
2. **Police Station Proximity**: Suggest routes that pass near police stations or patrol areas
3. **Lighting Assessment**: Recommend well-lit routes, especially for evening/night travel
4. **Crime Risk Evaluation**: Use ML model insights to identify safer paths
5. **Alternative Routes**: Provide 2-3 route options with safety scores
6. **Real-time Recommendations**: Suggest the best route based on current conditions

Format your response as a comprehensive route safety analysis with specific recommendations.`
      }
    ];

    return this.sendMessage(messages);
  }

  /**
   * Analyze current location safety and provide immediate recommendations
   */
  async analyzeCurrentLocationSafety(lat: number, lng: number, timeOfDay?: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Analyze the safety of my current location: ${lat}, ${lng}
Time of Day: ${timeOfDay || 'Not specified'}

Using our ML model's crime prediction data, please provide:

1. **Immediate Safety Assessment**: Current risk level and factors
2. **Nearby Safety Resources**: Police stations, emergency services, safe zones
3. **Environmental Factors**: Lighting conditions, visibility, escape routes
4. **Real-time Recommendations**: What to do right now for safety
5. **Route Planning**: Best directions to safer areas if needed

Provide actionable, specific advice based on ML model insights and real-world safety factors.`
      }
    ];

    return this.sendMessage(messages);
  }

  /**
   * Get ML model explanation and safety education
   */
  async explainMLModelInsights(predictionData: any): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Our ML model has provided this crime prediction data: ${JSON.stringify(predictionData)}

Please explain:

1. **What This Means**: Translate the ML model output into plain language
2. **Safety Implications**: How this affects personal safety
3. **Preventive Measures**: Specific actions to take based on these insights
4. **Model Confidence**: How reliable are these predictions
5. **Context Factors**: What environmental/social factors influenced this prediction

Make it educational and actionable for the user.`
      }
    ];

    return this.sendMessage(messages);
  }
}

export const openAIService = new OpenAIService();
