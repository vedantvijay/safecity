import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  MessageSquare, 
  Users, 
  Clock, 
  MapPin,
  TrendingUp,
  Shield,
  Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Community = () => {
  const alerts = [
    {
      id: 1,
      title: "Suspicious Activity Reported",
      location: "Downtown Mall Parking",
      time: "15 minutes ago",
      severity: "medium",
      description: "Multiple residents reported suspicious individuals near the parking area."
    },
    {
      id: 2,
      title: "Traffic Accident",
      location: "Main Street & 5th Ave",
      time: "1 hour ago",
      severity: "high",
      description: "Minor traffic accident causing delays. Emergency services on scene."
    },
    {
      id: 3,
      title: "Power Outage",
      location: "Riverside District",
      time: "2 hours ago",
      severity: "low",
      description: "Planned maintenance causing temporary power outage."
    }
  ];

  const discussions = [
    {
      id: 1,
      title: "Neighborhood Watch Meeting",
      author: "Sarah Johnson",
      replies: 12,
      time: "3 hours ago",
      category: "Community"
    },
    {
      id: 2,
      title: "New Security Camera Installation",
      author: "Mike Chen",
      replies: 8,
      time: "5 hours ago",
      category: "Safety"
    },
    {
      id: 3,
      title: "Emergency Contact List Update",
      author: "Lisa Rodriguez",
      replies: 15,
      time: "1 day ago",
      category: "Information"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive";
      case "medium": return "bg-warning-yellow text-black";
      case "low": return "bg-success-green";
      default: return "bg-muted";
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
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Community Hub
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay connected with your neighborhood and stay informed about safety updates and community discussions.
            </p>
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
                    <p className="text-2xl font-bold text-foreground">1,247</p>
                    <p className="text-sm text-muted-foreground">Community Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="community-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-success-green/10 rounded-xl">
                    <Shield className="h-6 w-6 text-success-green" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">98%</p>
                    <p className="text-sm text-muted-foreground">Safety Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="community-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-warning-yellow/10 rounded-xl">
                    <Bell className="h-6 w-6 text-warning-yellow" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">3</p>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="community-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-destructive/10 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">-12%</p>
                    <p className="text-sm text-muted-foreground">Crime Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Neighborhood Alerts */}
            <Card className="community-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-6 w-6 text-warning-yellow" />
                  <span>Neighborhood Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: alert.id * 0.1 }}
                    className="p-4 bg-muted/50 rounded-xl border border-border hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{alert.title}</h3>
                      <Badge className={`${getSeverityColor(alert.severity)} text-xs`}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{alert.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{alert.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </motion.div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Alerts
                </Button>
              </CardContent>
            </Card>

            {/* Discussion Board */}
            <Card className="community-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <span>Discussion Board</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {discussions.map((discussion) => (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: discussion.id * 0.1 }}
                    className="p-4 bg-muted/50 rounded-xl border border-border hover:bg-muted/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                        {discussion.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {discussion.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>by {discussion.author}</span>
                      <div className="flex items-center space-x-4">
                        <span>{discussion.replies} replies</span>
                        <span>{discussion.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
    </div>
  );
};

export default Community;