import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_COMMUNITY_API_URL || 'http://localhost:8003';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface CommunityStats {
  communityMembers: number;
  safetyRating: number;
  activeAlerts: number;
  crimeRateChange: number;
}

export interface Alert {
  id: number;
  title: string;
  location: string;
  timeAgo: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Discussion {
  id: number;
  title: string;
  author: string;
  category: string;
  replies: number;
  timeAgo: string;
  createdAt: string;
  updatedAt: string;
  content?: string;
}

export interface CreateDiscussionRequest {
  title: string;
  content: string;
  category: string;
  author: string;
}

export interface DiscussionDetail {
  id: number;
  title: string;
  author: string;
  category: string;
  replies: Reply[];
  timeAgo: string;
  createdAt: string;
  updatedAt: string;
  content: string;
}

export interface Reply {
  id: number;
  content: string;
  author: string;
  timeAgo: string;
  createdAt: string;
}

// API Functions
export const communityApi = {
  // Get community statistics
  getStats: async (): Promise<CommunityStats> => {
    const response = await api.get('/community/stats');
    return response.data;
  },

  // Get neighborhood alerts
  getAlerts: async (): Promise<Alert[]> => {
    const response = await api.get('/community/alerts');
    return response.data;
  },

  // Get discussions
  getDiscussions: async (): Promise<Discussion[]> => {
    const response = await api.get('/community/discussions');
    return response.data;
  },

  // Get discussion detail
  getDiscussionDetail: async (id: number): Promise<DiscussionDetail> => {
    const response = await api.get(`/community/discussions/${id}`);
    return response.data;
  },

  // Create new discussion
  createDiscussion: async (data: CreateDiscussionRequest): Promise<Discussion> => {
    const response = await api.post('/community/discussions', data);
    return response.data;
  },

  // Add reply to discussion
  addReply: async (discussionId: number, content: string, author: string): Promise<Reply> => {
    const response = await api.post(`/community/discussions/${discussionId}/replies`, {
      content,
      author,
    });
    return response.data;
  },

  // Report incident
  reportIncident: async (data: {
    title: string;
    description: string;
    location: string;
    severity: 'low' | 'medium' | 'high';
    reporter: string;
  }): Promise<Alert> => {
    const response = await api.post('/community/incidents', data);
    return response.data;
  },

  // Get location-based crime alerts
  getLocationAlerts: async (latitude: number, longitude: number, radius?: number): Promise<Alert[]> => {
    const response = await api.get(`/community/location-alerts?lat=${latitude}&lng=${longitude}&radius=${radius || 5}`);
    return response.data;
  },

  // Get AI-analyzed crime data for location
  getAICrimeAnalysis: async (latitude: number, longitude: number, radius?: number): Promise<{
    alerts: Alert[];
    summary: {
      totalCrimes: number;
      riskLevel: 'low' | 'medium' | 'high';
      riskScore: number;
      topCrimeTypes: string[];
      safetyRecommendations: string[];
      timePatterns?: any;
      aiConfidence?: number;
    };
  }> => {
    const response = await api.get(`/community/ai-analysis?lat=${latitude}&lng=${longitude}&radius=${radius || 5}`);
    return response.data;
  },

  // Analyze route safety between two points using ChatGPT API
  analyzeRoute: async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<{
    route: {
      start: { lat: number; lng: number };
      end: { lat: number; lng: number };
      midpoint: { lat: number; lng: number };
    };
    safety: {
      overallScore: number;
      riskLevel: 'low' | 'medium' | 'high';
      incidentsCount: number;
      recommendations: string[];
      alternativeRoutes?: string[];
    };
    recentIncidents: Array<{
      type: string;
      location: string;
      time: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    databaseIncidents: Alert[];
    timeAnalysis: {
      morning: { risk: string; score: number };
      afternoon: { risk: string; score: number };
      evening: { risk: string; score: number };
      night: { risk: string; score: number };
    };
    userComments: Array<{
      id?: number;
      author: string;
      comment: string;
      rating: number;
      timeAgo: string;
      createdAt?: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      suggests_alternative?: boolean;
    }>;
    aiConfidence: number;
    source: string;
  }> => {
    console.log('API: analyzeRoute called with:', { startLat, startLng, endLat, endLng });
    
    try {
      const response = await api.post('/community/route-analysis', {
        startLat,
        startLng,
        endLat,
        endLng
      });
      
      console.log('API: analyzeRoute response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: analyzeRoute error:', error);
      throw error;
    }
  },

  // Create incident with location data
  createIncident: async (data: {
    title: string;
    description: string;
    location: string;
    severity: 'low' | 'medium' | 'high';
    reporter: string;
    latitude?: number;
    longitude?: number;
    category?: string;
  }): Promise<Alert> => {
    const response = await api.post('/community/incidents', data);
    return response.data;
  },

  // Post a comment about a route
  postRouteComment: async (data: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    author: string;
    comment: string;
    rating: number;
  }): Promise<{
    id: number;
    author: string;
    comment: string;
    rating: number;
    timeAgo: string;
    createdAt: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }> => {
    const response = await api.post('/community/route-comments', data);
    return response.data;
  },
};

export default communityApi;
