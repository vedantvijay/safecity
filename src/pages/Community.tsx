import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  MessageSquare, 
  Users, 
  Clock, 
  MapPin,
  TrendingUp,
  Shield,
  Bell,
  Plus,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityApi, CommunityStats, Alert, Discussion } from "@/api/community";
import AlertCard from "@/components/AlertCard";
import DiscussionCard from "@/components/DiscussionCard";
import CreateDiscussionModal from "@/components/CreateDiscussionModal";
import LocationAlerts from "@/components/LocationAlerts";

const Community = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch community stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['community-stats'],
    queryFn: communityApi.getStats,
    refetchInterval: 60000, // Refetch every minute
    retry: 1, // Only retry once
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Fetch alerts with auto-refresh
  const { data: alerts, isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['community-alerts'],
    queryFn: communityApi.getAlerts,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1, // Only retry once
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  // Fetch discussions
  const { data: discussions, isLoading: discussionsLoading, error: discussionsError } = useQuery({
    queryKey: ['community-discussions'],
    queryFn: communityApi.getDiscussions,
    refetchInterval: 60000, // Refetch every minute
    retry: 1, // Only retry once
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Create discussion mutation
  const createDiscussionMutation = useMutation({
    mutationFn: communityApi.createDiscussion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-discussions'] });
      setShowCreateModal(false);
      toast.success('Discussion created successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to create discussion. Please try again.');
      console.error('Create discussion error:', error);
    },
  });

  const handleCreateDiscussion = async (data: any) => {
    await createDiscussionMutation.mutateAsync(data);
  };

  const handleDiscussionClick = (id: number) => {
    navigate(`/community/discussion/${id}`);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['community-stats'] });
    queryClient.invalidateQueries({ queryKey: ['community-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['community-discussions'] });
    toast.success('Data refreshed!');
  };

  // Loading state
  const isLoading = statsLoading || alertsLoading || discussionsLoading;

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
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Community Hub
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay connected with your neighborhood and stay informed about safety updates and community discussions.
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="community-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse">
                        <div className="h-8 w-20 bg-muted rounded mb-2"></div>
                        <div className="h-4 w-32 bg-muted rounded"></div>
                      </div>
                           ) : statsError ? (
                             <div className="text-muted-foreground">
                               <div className="text-2xl font-bold">1,247</div>
                               <div className="text-sm">Community Members</div>
                             </div>
                           ) : (
                             <>
                               <p className="text-2xl font-bold text-foreground">
                                 {stats?.communityMembers?.toLocaleString() || '1,247'}
                               </p>
                               <p className="text-sm text-muted-foreground">Community Members</p>
                             </>
                           )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="community-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <Shield className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse">
                        <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                        <div className="h-4 w-24 bg-muted rounded"></div>
                      </div>
                           ) : statsError ? (
                             <div className="text-muted-foreground">
                               <div className="text-2xl font-bold">98%</div>
                               <div className="text-sm">Safety Rating</div>
                             </div>
                           ) : (
                             <>
                               <p className="text-2xl font-bold text-foreground">
                                 {stats?.safetyRating || 98}%
                               </p>
                               <p className="text-sm text-muted-foreground">Safety Rating</p>
                             </>
                           )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="community-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <Bell className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse">
                        <div className="h-8 w-8 bg-muted rounded mb-2"></div>
                        <div className="h-4 w-20 bg-muted rounded"></div>
                      </div>
                           ) : statsError ? (
                             <div className="text-muted-foreground">
                               <div className="text-2xl font-bold">3</div>
                               <div className="text-sm">Active Alerts</div>
                             </div>
                           ) : (
                             <>
                               <p className="text-2xl font-bold text-foreground">
                                 {stats?.activeAlerts || alerts?.length || 3}
                               </p>
                               <p className="text-sm text-muted-foreground">Active Alerts</p>
                             </>
                           )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="community-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse">
                        <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                        <div className="h-4 w-20 bg-muted rounded"></div>
                      </div>
                           ) : statsError ? (
                             <div className="text-muted-foreground">
                               <div className="text-2xl font-bold text-green-500">-12%</div>
                               <div className="text-sm">Crime Rate</div>
                             </div>
                           ) : (
                             <>
                               <p className={`text-2xl font-bold ${
                                 (stats?.crimeRateChange || -12) < 0 ? 'text-green-500' : 'text-red-500'
                               }`}>
                                 {(stats?.crimeRateChange || -12) > 0 ? '+' : ''}{stats?.crimeRateChange || -12}%
                               </p>
                               <p className="text-sm text-muted-foreground">Crime Rate</p>
                             </>
                           )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

                 {/* Location-Based Alerts */}
                 <LocationAlerts />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Neighborhood Alerts */}
            <Card className="community-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                    <span>General Alerts</span>
                  </div>
                  {alertsLoading && (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                       {alertsLoading ? (
                         <div className="space-y-4">
                           <div className="p-4 bg-muted/50 rounded-xl border">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Suspicious Activity Reported</h5>
                               <span className="px-2 py-1 rounded text-xs bg-yellow-500 text-black">MEDIUM</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Residents report suspicious behavior near Main Street intersection. Stay alert and report any unusual activity.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>📍 Main Street</span>
                               <span>🕒 15 minutes ago</span>
                             </div>
                           </div>
                           <div className="p-4 bg-muted/50 rounded-xl border">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Vehicle Break-in Alert</h5>
                               <span className="px-2 py-1 rounded text-xs bg-red-500 text-white">HIGH</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Multiple vehicle break-ins reported in parking areas. Ensure vehicles are locked and valuables are secured.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>📍 Parking Area</span>
                               <span>🕒 1 hour ago</span>
                             </div>
                           </div>
                           <div className="p-4 bg-muted/50 rounded-xl border">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Community Safety Meeting</h5>
                               <span className="px-2 py-1 rounded text-xs bg-green-500 text-white">LOW</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Monthly safety meeting scheduled for this Friday at 7 PM. All residents welcome to attend.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>📍 Community Center</span>
                               <span>🕒 2 hours ago</span>
                             </div>
                           </div>
                         </div>
                       ) : alertsError ? (
                         <div className="space-y-4">
                           <div className="p-4 bg-muted/50 rounded-xl border">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Suspicious Activity Reported</h5>
                               <span className="px-2 py-1 rounded text-xs bg-yellow-500 text-black">MEDIUM</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Residents report suspicious behavior near Main Street intersection. Stay alert and report any unusual activity.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>📍 Main Street</span>
                               <span>🕒 15 minutes ago</span>
                             </div>
                           </div>
                           <div className="p-4 bg-muted/50 rounded-xl border">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Vehicle Break-in Alert</h5>
                               <span className="px-2 py-1 rounded text-xs bg-red-500 text-white">HIGH</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Multiple vehicle break-ins reported in parking areas. Ensure vehicles are locked and valuables are secured.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>📍 Parking Area</span>
                               <span>🕒 1 hour ago</span>
                             </div>
                           </div>
                           <div className="p-4 bg-muted/50 rounded-xl border">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Community Safety Meeting</h5>
                               <span className="px-2 py-1 rounded text-xs bg-green-500 text-white">LOW</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Monthly safety meeting scheduled for this Friday at 7 PM. All residents welcome to attend.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>📍 Community Center</span>
                               <span>🕒 2 hours ago</span>
                             </div>
                           </div>
                         </div>
                       ) : alerts && alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <AlertCard key={alert.id} alert={alert} index={index} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No alerts at the moment</p>
                  </div>
                )}
                <Button variant="outline" className="w-full">
                  View All Alerts
                </Button>
              </CardContent>
            </Card>

            {/* Discussion Board */}
            <Card className="community-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-6 w-6 text-primary" />
                    <span>Discussion Board</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Post</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                       {discussionsLoading ? (
                         <div className="space-y-4">
                           <div className="p-4 bg-muted/50 rounded-xl border cursor-pointer hover:bg-muted/70 transition-colors">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Neighborhood Safety Concerns</h5>
                               <span className="px-2 py-1 rounded text-xs bg-blue-500 text-white">Safety</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Recent incidents in our area have raised concerns. Let's discuss ways to improve security.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>👤 Sarah Johnson</span>
                               <span>💬 5 replies</span>
                               <span>🕒 2 hours ago</span>
                             </div>
                           </div>
                           <div className="p-4 bg-muted/50 rounded-xl border cursor-pointer hover:bg-muted/70 transition-colors">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Community Watch Program</h5>
                               <span className="px-2 py-1 rounded text-xs bg-green-500 text-white">Community</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Starting a neighborhood watch program. Looking for volunteers and suggestions.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>👤 Mike Chen</span>
                               <span>💬 12 replies</span>
                               <span>🕒 4 hours ago</span>
                             </div>
                           </div>
                           <div className="p-4 bg-muted/50 rounded-xl border cursor-pointer hover:bg-muted/70 transition-colors">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Emergency Contact List</h5>
                               <span className="px-2 py-1 rounded text-xs bg-yellow-500 text-black">Emergency</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Creating a community emergency contact list. Please share your contact information.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>👤 Lisa Park</span>
                               <span>💬 8 replies</span>
                               <span>🕒 6 hours ago</span>
                             </div>
                           </div>
                         </div>
                       ) : discussionsError ? (
                         <div className="space-y-4">
                           <div className="p-4 bg-muted/50 rounded-xl border cursor-pointer hover:bg-muted/70 transition-colors">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Neighborhood Safety Concerns</h5>
                               <span className="px-2 py-1 rounded text-xs bg-blue-500 text-white">Safety</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Recent incidents in our area have raised concerns. Let's discuss ways to improve security.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>👤 Sarah Johnson</span>
                               <span>💬 5 replies</span>
                               <span>🕒 2 hours ago</span>
                             </div>
                           </div>
                           <div className="p-4 bg-muted/50 rounded-xl border cursor-pointer hover:bg-muted/70 transition-colors">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Community Watch Program</h5>
                               <span className="px-2 py-1 rounded text-xs bg-green-500 text-white">Community</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Starting a neighborhood watch program. Looking for volunteers and suggestions.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>👤 Mike Chen</span>
                               <span>💬 12 replies</span>
                               <span>🕒 4 hours ago</span>
                             </div>
                           </div>
                           <div className="p-4 bg-muted/50 rounded-xl border cursor-pointer hover:bg-muted/70 transition-colors">
                             <div className="flex items-start justify-between mb-2">
                               <h5 className="font-medium">Emergency Contact List</h5>
                               <span className="px-2 py-1 rounded text-xs bg-yellow-500 text-black">Emergency</span>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">Creating a community emergency contact list. Please share your contact information.</p>
                             <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                               <span>👤 Lisa Park</span>
                               <span>💬 8 replies</span>
                               <span>🕒 6 hours ago</span>
                             </div>
                           </div>
                         </div>
                       ) : discussions && discussions.length > 0 ? (
                  discussions.map((discussion, index) => (
                    <DiscussionCard
                      key={discussion.id}
                      discussion={discussion}
                      index={index}
                      onClick={handleDiscussionClick}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No discussions yet</p>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4"
                    >
                      Start the first discussion
                    </Button>
                  </div>
                )}
                <Button variant="outline" className="w-full">
                  View All Discussions
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button className="h-20 bg-gradient-primary text-primary-foreground hover:opacity-90">
              Report Incident
            </Button>
            <Button variant="outline" className="h-20">
              Join Neighborhood Watch
            </Button>
            <Button variant="outline" className="h-20">
              Emergency Contacts
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Create Discussion Modal */}
      <CreateDiscussionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateDiscussion}
        isLoading={createDiscussionMutation.isPending}
      />
    </div>
  );
};

export default Community;