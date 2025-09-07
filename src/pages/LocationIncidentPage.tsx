import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Users, 
  TrendingUp,
  Brain,
  RefreshCw,
  Route,
  Target,
  Zap,
  MessageSquare,
  Star,
  Send,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/api/community';
import { toast } from 'sonner';
import { openAIService } from '@/services/openai';

interface LocationIncidentPageProps {
  currentLocation?: { lat: number; lng: number };
  destinationLocation?: { lat: number; lng: number };
}

const LocationIncidentPage: React.FC<LocationIncidentPageProps> = ({ 
  currentLocation, 
  destinationLocation 
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string } | null>(currentLocation || null);
  const [destination, setDestination] = useState<{ lat: number; lng: number; name?: string } | null>(destinationLocation || null);
  const [startCity, setStartCity] = useState<string>('');
  const [endCity, setEndCity] = useState<string>('');
  const [routeAnalysis, setRouteAnalysis] = useState<any>(null);
  const [isAnalyzingRoute, setIsAnalyzingRoute] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentData, setCommentData] = useState({
    author: '',
    comment: '',
    rating: 5
  });

  // Function to geocode city name to coordinates
  const geocodeCity = async (cityName: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    try {
      // Use a free geocoding service (Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1&countrycodes=in`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].display_name.split(',')[0] // Get city name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Get current location if not provided
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'Current Location'
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get your location');
        }
      );
    }
  }, [userLocation]);

  // Fetch location-based incidents
  const { data: locationIncidents, isLoading: incidentsLoading, refetch: refetchIncidents } = useQuery({
    queryKey: ['location-incidents', userLocation?.lat, userLocation?.lng],
    queryFn: () => userLocation ? communityApi.getLocationAlerts(userLocation.lat, userLocation.lng, 5) : Promise.resolve([]),
    enabled: !!userLocation,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch AI analysis
  const { data: aiAnalysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['ai-analysis', userLocation?.lat, userLocation?.lng],
    queryFn: () => userLocation ? communityApi.getAICrimeAnalysis(userLocation.lat, userLocation.lng, 5) : Promise.resolve(null),
    enabled: !!userLocation,
    refetchInterval: 60000, // Refetch every minute
  });

  // Create incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: communityApi.createIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-analysis'] });
      toast.success('Incident reported successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to report incident. Please try again.');
      console.error('Create incident error:', error);
    },
  });

  // Post comment mutation
  const postCommentMutation = useMutation({
    mutationFn: communityApi.postRouteComment,
    onSuccess: () => {
      setCommentData({ author: '', comment: '', rating: 5 });
      setShowCommentForm(false);
      toast.success('Comment posted successfully!');
      // Refresh route analysis to show new comment
      if (userLocation && destination) {
        analyzeRoute();
      }
    },
    onError: (error: any) => {
      toast.error('Failed to post comment. Please try again.');
      console.error('Post comment error:', error);
    },
  });

  const handleSetStartCity = async () => {
    if (!startCity.trim()) {
      toast.error('Please enter a city name');
      return;
    }

    const coords = await geocodeCity(startCity.trim());
    if (coords) {
      setUserLocation(coords);
      toast.success(`Location set to ${coords.name}`);
    } else {
      toast.error('City not found. Please try a different name.');
    }
  };

  const handleSetEndCity = async () => {
    if (!endCity.trim()) {
      toast.error('Please enter a city name');
      return;
    }

    const coords = await geocodeCity(endCity.trim());
    if (coords) {
      setDestination(coords);
      toast.success(`Destination set to ${coords.name}`);
    } else {
      toast.error('City not found. Please try a different name.');
    }
  };

  // Analyze route between current location and destination
  const analyzeRoute = async () => {
    if (!userLocation || !destination) {
      toast.error('Both current location and destination are required');
      return;
    }

    console.log('Starting route analysis with:', {
      userLocation,
      destination,
      startLat: userLocation.lat,
      startLng: userLocation.lng,
      endLat: destination.lat,
      endLng: destination.lng
    });

    setIsAnalyzingRoute(true);
    try {
      const analysis = await communityApi.analyzeRoute(
        userLocation.lat, userLocation.lng,
        destination.lat, destination.lng
      );
      
      console.log('Route analysis successful:', analysis);
      setRouteAnalysis(analysis);

      // Get AI insights about the route
      try {
        const insights = await openAIService.sendMessage([{
          role: 'user',
          content: `Analyze this route safety data and provide specific recommendations:
          
          Route Safety Score: ${analysis.safety.overallScore}/100
          Risk Level: ${analysis.safety.riskLevel}
          Total Incidents: ${analysis.safety.incidentsCount}
          Recent Incidents: ${analysis.recentIncidents.map(inc => `${inc.type} (${inc.severity})`).join(', ')}
          Time Analysis: ${Object.entries(analysis.timeAnalysis).map(([time, data]) => `${time}: ${data.risk} risk`).join(', ')}
          Recommendations: ${analysis.safety.recommendations.join(', ')}
          
          Provide 3-4 specific, actionable safety tips for this route based on the incident patterns and time analysis.`
        }]);
        setAiInsights(insights);
      } catch (aiError) {
        console.log('AI insights failed:', aiError);
        setAiInsights('AI analysis unavailable. Please follow the safety recommendations above.');
      }
    } catch (error: any) {
      console.error('Route analysis error details:', {
        error,
        response: error.response,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Unable to analyze route safety. Please try again later.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
      }
      
      toast.error('Route Analysis Failed', {
        description: errorMessage,
        duration: 8000,
      });
    } finally {
      setIsAnalyzingRoute(false);
    }
  };

  const handleReportIncident = async (incidentData: any) => {
    if (!userLocation) {
      toast.error('Location is required to report incident');
      return;
    }

    await createIncidentMutation.mutateAsync({
      ...incidentData,
      latitude: userLocation.lat,
      longitude: userLocation.lng
    });
  };

  const handlePostComment = async () => {
    if (!userLocation || !destination) {
      toast.error('Route coordinates are required');
      return;
    }

    if (!commentData.author.trim() || !commentData.comment.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    await postCommentMutation.mutateAsync({
      startLat: userLocation.lat,
      startLng: userLocation.lng,
      endLat: destination.lat,
      endLng: destination.lng,
      author: commentData.author,
      comment: commentData.comment,
      rating: commentData.rating
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/community')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Community</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Location-Based Incidents</h1>
                <p className="text-muted-foreground">Real-time safety analysis for your area</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  refetchIncidents();
                  refetchAnalysis();
                  toast.success('Data refreshed!');
                }}
                disabled={incidentsLoading || analysisLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(incidentsLoading || analysisLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Location Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <span>Route Planning</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start City</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter start city (e.g., Chennai, Delhi)"
                      value={startCity}
                      onChange={(e) => setStartCity(e.target.value)}
                    />
                    <Button onClick={handleSetStartCity} disabled={!startCity.trim()}>
                      Set Start
                    </Button>
                  </div>
                  {userLocation && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      📍 {userLocation.name} ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
                    </div>
                  )}
                </div>
                <div>
                  <Label>Destination City</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter destination city (e.g., Mumbai, Bangalore)"
                      value={endCity}
                      onChange={(e) => setEndCity(e.target.value)}
                    />
                    <Button onClick={handleSetEndCity} disabled={!endCity.trim()}>
                      Set End
                    </Button>
                  </div>
                  {destination && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      🎯 {destination.name} ({destination.lat.toFixed(4)}, {destination.lng.toFixed(4)})
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={analyzeRoute}
                  disabled={!userLocation || !destination || isAnalyzingRoute}
                  size="lg"
                  className="px-8"
                >
                  {isAnalyzingRoute ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Route...
                    </>
                  ) : (
                    <>
                      <Route className="h-4 w-4 mr-2" />
                      Analyze Route Safety
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Location Display */}
          {userLocation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <span>Current Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Latitude</Label>
                    <Input value={userLocation.lat.toFixed(6)} readOnly />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input value={userLocation.lng.toFixed(6)} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Route Analysis Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Route className="h-5 w-5 text-purple-500" />
                <span>Route Safety Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {routeAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Route Safety Overview */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold flex items-center">
                        <Route className="h-5 w-5 mr-2 text-purple-500" />
                        Route Safety Analysis
                      </h3>
                      <Badge className={getRiskBadgeColor(routeAnalysis.safety.riskLevel)}>
                        {routeAnalysis.safety.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {routeAnalysis.safety.overallScore}/100
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {routeAnalysis.safety.incidentsCount} total incidents along route
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      AI Confidence: {routeAnalysis.aiConfidence}% • Source: {routeAnalysis.source}
                    </div>
                  </div>

                  {/* Recent Incidents from ChatGPT */}
                  {routeAnalysis.recentIncidents && routeAnalysis.recentIncidents.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        Recent Incidents Along Route
                        <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                          <Brain className="h-3 w-3 mr-1" />
                          ChatGPT Analysis
                        </Badge>
                      </h4>
                      <div className="space-y-3">
                        {routeAnalysis.recentIncidents.map((incident: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-muted/50 rounded-xl border border-border hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-foreground flex items-center space-x-2">
                                <span className="text-lg">
                                  {incident.severity === 'high' ? '🔴' : 
                                   incident.severity === 'medium' ? '🟡' : '🟢'}
                                </span>
                                <span>{incident.type}</span>
                              </h5>
                              <Badge className={`${getRiskBadgeColor(incident.severity)} text-xs font-medium`}>
                                {incident.severity.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{incident.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{incident.time}</span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {incident.description}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Analysis */}
                  {routeAnalysis.timeAnalysis && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-orange-500" />
                        Time-Based Risk Analysis
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(routeAnalysis.timeAnalysis).map(([time, data]: [string, any]) => (
                          <div key={time} className="p-3 bg-muted/30 rounded-lg text-center">
                            <div className="text-sm font-medium capitalize text-foreground">{time}</div>
                            <div className={`text-lg font-bold ${
                              data.risk === 'high' ? 'text-red-500' :
                              data.risk === 'medium' ? 'text-yellow-500' : 'text-green-500'
                            }`}>
                              {data.score}
                            </div>
                            <div className="text-xs text-muted-foreground">{data.risk} risk</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Safety Recommendations</h4>
                      <ul className="space-y-1 text-sm">
                        {routeAnalysis.safety.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Alternative Routes */}
                    {routeAnalysis.safety.alternativeRoutes && routeAnalysis.safety.alternativeRoutes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Alternative Routes</h4>
                        <ul className="space-y-1 text-sm">
                          {routeAnalysis.safety.alternativeRoutes.map((route: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{route}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* AI Insights */}
                  {aiInsights && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-blue-500" />
                        Additional AI Insights
                      </h4>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {aiInsights}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* User Comments Section */}
                  {routeAnalysis.userComments && routeAnalysis.userComments.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
                          User Comments ({routeAnalysis.userComments.length})
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCommentForm(!showCommentForm)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Add Comment
                        </Button>
                      </h4>

                      {/* Comment Form */}
                      {showCommentForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 p-4 bg-muted/30 rounded-lg border border-border"
                        >
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Your Name</Label>
                                <Input
                                  value={commentData.author}
                                  onChange={(e) => setCommentData(prev => ({ ...prev, author: e.target.value }))}
                                  placeholder="Enter your name..."
                                />
                              </div>
                              <div>
                                <Label>Rating (1-5 stars)</Label>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setCommentData(prev => ({ ...prev, rating: star }))}
                                      className={`p-1 ${star <= commentData.rating ? 'text-yellow-500' : 'text-gray-400'}`}
                                    >
                                      <Star className="h-5 w-5 fill-current" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>Your Comment</Label>
                              <Textarea
                                value={commentData.comment}
                                onChange={(e) => setCommentData(prev => ({ ...prev, comment: e.target.value }))}
                                placeholder="Share your experience with this route..."
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setShowCommentForm(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handlePostComment}
                                disabled={postCommentMutation.isPending || !commentData.author.trim() || !commentData.comment.trim()}
                              >
                                {postCommentMutation.isPending ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Posting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Post Comment
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Comments List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {routeAnalysis.userComments.map((comment: any, index: number) => (
                          <motion.div
                            key={comment.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-lg border ${
                              comment.sentiment === 'negative' 
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                                : comment.sentiment === 'positive'
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                : 'bg-muted/50 border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">{comment.author}</span>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${
                                        star <= comment.rating 
                                          ? 'text-yellow-500 fill-current' 
                                          : 'text-gray-400'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">{comment.timeAgo}</span>
                                {comment.suggests_alternative && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                                    Suggests Alternative
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className={`text-sm leading-relaxed ${
                              comment.sentiment === 'negative' 
                                ? 'text-red-700 dark:text-red-300'
                                : comment.sentiment === 'positive'
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-muted-foreground'
                            }`}>
                              {comment.comment}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis Summary */}
          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <span>AI Safety Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {aiAnalysis.summary.riskScore}/100
                    </div>
                    <div className="text-sm text-muted-foreground">Risk Score</div>
                    <Badge className={`mt-2 ${getRiskBadgeColor(aiAnalysis.summary.riskLevel)}`}>
                      {aiAnalysis.summary.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {aiAnalysis.summary.totalCrimes}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Incidents</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {aiAnalysis.summary.aiConfidence || 85}%
                    </div>
                    <div className="text-sm text-muted-foreground">AI Confidence</div>
                  </div>
                </div>

                {aiAnalysis.summary.safetyRecommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Safety Recommendations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {aiAnalysis.summary.safetyRecommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-green-700 dark:text-green-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Incidents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Recent Incidents in Your Area</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : locationIncidents && locationIncidents.length > 0 ? (
                <div className="space-y-4">
                  {locationIncidents.map((incident: any, index: number) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted/50 rounded-xl border border-border hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground flex items-center space-x-2">
                          <span className="text-lg">
                            {incident.severity === 'high' ? '🔴' : 
                             incident.severity === 'medium' ? '🟡' : '🟢'}
                          </span>
                          <span>{incident.title}</span>
                          {incident.source === 'ai-analysis' && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                              <Brain className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </h3>
                        <Badge className={`${getRiskBadgeColor(incident.severity)} text-xs font-medium`}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{incident.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{incident.timeAgo}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {incident.description}
                      </p>
                      
                      {incident.confidence && (
                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                            <Brain className="h-4 w-4" />
                            <span className="text-sm font-medium">AI Confidence: {incident.confidence}%</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent incidents in your area</p>
                  <p className="text-sm mt-2">This is a good sign! Stay safe and vigilant.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button 
              className="h-20 bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90"
              onClick={() => navigate('/community')}
            >
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Report Incident</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => navigate('/community')}
            >
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Community Watch</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => navigate('/community')}
            >
              <div className="text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Safety Trends</div>
              </div>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LocationIncidentPage;
