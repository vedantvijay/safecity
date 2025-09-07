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
    };
  }> => {
    const response = await api.get(`/community/ai-analysis?lat=${latitude}&lng=${longitude}&radius=${radius || 5}`);
    return response.data;
  },
};

export default communityApi;
