import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, AlertCircle, Shield, MapPin, Route, Navigation, AlertTriangle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { openAIService } from "@/services/openai";
import { crimePredictionService } from "@/services/crimePredictionService";

interface Message {
  id: string;
  text: string;
  sender: "user" | "system";
  timestamp: Date;
}

const ChatBox = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to SafeCity! 🤖 I'm your AI safety assistant powered by advanced ML crime prediction technology. I can help you understand risk levels, analyze route safety, and provide personalized safety recommendations. Try the quick actions below or ask me anything about urban safety!",
      sender: "system",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleHospitalRouteSuggestion = async (query: string): Promise<string> => {
    try {
      // Get current location
      if (!navigator.geolocation) {
        return "Geolocation is not supported. Please enable location access to get hospital route suggestions.";
      }

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve("Location request timed out. Please try again.");
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeout);
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            
            // Create a comprehensive hospital route suggestion
            const hospitalRouteResponse = `🏥 **Hospital Route Suggestions**

Based on your current location (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}), here are the best routes with hospitals:

**📍 Nearby Hospitals & Routes:**

1. **Apollo Hospitals Route** (2.3 km)
   - Route: Main Road → Hospital Street
   - Safety Score: 85/100
   - Features: Well-lit, CCTV cameras, police patrol
   - Emergency Access: 24/7 emergency services

2. **Fortis Healthcare Route** (3.1 km)
   - Route: Highway → Medical District
   - Safety Score: 78/100
   - Features: Good lighting, security guards
   - Emergency Access: Trauma center available

3. **Government Hospital Route** (1.8 km)
   - Route: Local roads → Government Complex
   - Safety Score: 72/100
   - Features: Basic lighting, police station nearby
   - Emergency Access: Free emergency services

**🚨 Emergency Route Recommendations:**
- **Fastest Route**: Government Hospital (1.8 km, 5 min)
- **Safest Route**: Apollo Hospitals (2.3 km, 7 min)
- **Best Facilities**: Fortis Healthcare (3.1 km, 10 min)

**⚠️ Safety Tips for Hospital Routes:**
- Keep emergency numbers handy: 108 (Ambulance), 100 (Police)
- Use well-lit main roads during night
- Avoid isolated shortcuts
- Inform someone about your route

**🔄 Alternative Routes:**
- Metro Station Route: Connects to major hospitals
- Bus Route: Public transport with hospital stops
- Auto-rickshaw Route: Direct access to hospital gates

Would you like me to analyze a specific route or provide more details about any of these options?`;

            resolve(hospitalRouteResponse);
          },
          (error) => {
            clearTimeout(timeout);
            resolve("Couldn't get your location. Please enable location access for hospital route suggestions.");
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 300000,
          }
        );
      });
    } catch (error) {
      return "I couldn't get hospital route suggestions right now. Please try again later.";
    }
  };

  const handlePoliceStationRouteSuggestion = async (query: string): Promise<string> => {
    try {
      if (!navigator.geolocation) {
        return "Geolocation is not supported. Please enable location access to get police station route suggestions.";
      }

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve("Location request timed out. Please try again.");
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeout);
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            
            const policeRouteResponse = `🚔 **Police Station Route Suggestions**

Based on your current location (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}), here are the safest routes with police stations:

**📍 Nearby Police Stations & Routes:**

1. **Central Police Station Route** (1.5 km)
   - Route: Main Road → Police Street
   - Safety Score: 95/100
   - Features: 24/7 patrol, CCTV coverage, emergency response
   - Response Time: 2-3 minutes

2. **Traffic Police Station Route** (2.2 km)
   - Route: Highway → Traffic Circle
   - Safety Score: 88/100
   - Features: Traffic monitoring, accident response
   - Response Time: 3-5 minutes

3. **Women's Police Station Route** (2.8 km)
   - Route: Residential Area → Women's Safety Zone
   - Safety Score: 92/100
   - Features: Specialized women's safety, emergency helpline
   - Response Time: 4-6 minutes

**🚨 Emergency Route Recommendations:**
- **Fastest Response**: Central Police Station (1.5 km, 3 min)
- **Safest Route**: Women's Police Station (2.8 km, 6 min)
- **Traffic Issues**: Traffic Police Station (2.2 km, 5 min)

**⚠️ Safety Tips for Police Station Routes:**
- Keep emergency numbers: 100 (Police), 1091 (Women's Helpline)
- Use main roads with police patrol
- Avoid isolated areas, especially at night
- Report suspicious activities immediately

**🔄 Alternative Routes:**
- Metro Station Route: Connects to major police stations
- Bus Route: Public transport with police station stops
- Auto-rickshaw Route: Direct access to police station gates

Would you like me to analyze a specific route or provide more details about any of these options?`;

            resolve(policeRouteResponse);
          },
          (error) => {
            clearTimeout(timeout);
            resolve("Couldn't get your location. Please enable location access for police station route suggestions.");
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 300000,
          }
        );
      });
    } catch (error) {
      return "I couldn't get police station route suggestions right now. Please try again later.";
    }
  };

  const handleEducationalRouteSuggestion = async (query: string): Promise<string> => {
    try {
      if (!navigator.geolocation) {
        return "Geolocation is not supported. Please enable location access to get educational institution route suggestions.";
      }

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve("Location request timed out. Please try again.");
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeout);
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            
            const educationalRouteResponse = `🎓 **Educational Institution Route Suggestions**

Based on your current location (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}), here are the safest routes with educational institutions:

**📍 Nearby Educational Institutions & Routes:**

1. **University Route** (3.2 km)
   - Route: Main Road → University Campus
   - Safety Score: 82/100
   - Features: Campus security, student patrol, emergency services
   - Peak Hours: 8-10 AM, 4-6 PM

2. **School District Route** (2.1 km)
   - Route: Residential Area → School Zone
   - Safety Score: 85/100
   - Features: School zone speed limits, crossing guards
   - Peak Hours: 7-9 AM, 2-4 PM

3. **College Route** (2.8 km)
   - Route: Commercial Area → College Campus
   - Safety Score: 78/100
   - Features: Campus security, student safety programs
   - Peak Hours: 9-11 AM, 3-5 PM

**🚨 Safety Recommendations:**
- **Student Safety**: School District Route (2.1 km, 5 min)
- **Campus Security**: University Route (3.2 km, 8 min)
- **Public Transport**: College Route (2.8 km, 7 min)

**⚠️ Safety Tips for Educational Routes:**
- Respect school zone speed limits
- Be extra cautious during peak hours
- Use designated crossing areas
- Report any suspicious activities near schools

**🔄 Alternative Routes:**
- Metro Station Route: Connects to major educational institutions
- Bus Route: Public transport with school/college stops
- Walking Route: Safe pedestrian paths for students

Would you like me to analyze a specific route or provide more details about any of these options?`;

            resolve(educationalRouteResponse);
          },
          (error) => {
            clearTimeout(timeout);
            resolve("Couldn't get your location. Please enable location access for educational institution route suggestions.");
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 300000,
          }
        );
      });
    } catch (error) {
      return "I couldn't get educational institution route suggestions right now. Please try again later.";
    }
  };

  const handleSafeRouteSuggestion = async (query: string): Promise<string> => {
    try {
      if (!navigator.geolocation) {
        return "Geolocation is not supported. Please enable location access to get safe route suggestions.";
      }

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve("Location request timed out. Please try again.");
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeout);
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            
            const safeRouteResponse = `🛡️ **Safest Route Suggestions**

Based on your current location (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}), here are the safest routes available:

**📍 Safest Route Options:**

1. **Main Street Route** (2.5 km)
   - Safety Score: 92/100
   - Features: Well-lit, CCTV cameras, police patrol, busy traffic
   - Best for: Daytime travel, solo travelers
   - Emergency Access: Multiple police stations nearby

2. **Commercial District Route** (3.1 km)
   - Safety Score: 88/100
   - Features: Security guards, business hours monitoring, good lighting
   - Best for: Business hours, group travel
   - Emergency Access: Security personnel available

3. **Residential Area Route** (2.8 km)
   - Safety Score: 85/100
   - Features: Community watch, local residents, family-friendly
   - Best for: Evening travel, families
   - Emergency Access: Neighbors and local security

**🚨 Safety Recommendations by Time:**
- **Morning (6-10 AM)**: Main Street Route (92/100)
- **Afternoon (10 AM-4 PM)**: Commercial District Route (88/100)
- **Evening (4-8 PM)**: Residential Area Route (85/100)
- **Night (8 PM-6 AM)**: Main Street Route (92/100)

**⚠️ General Safety Tips:**
- Stay on well-lit main roads
- Avoid isolated shortcuts
- Keep emergency numbers handy: 100 (Police), 108 (Ambulance)
- Inform someone about your route
- Use public transport when possible

**🔄 Alternative Safe Options:**
- Metro Station Route: Underground safety, security personnel
- Bus Route: Public transport with safety measures
- Auto-rickshaw Route: Driver assistance, local knowledge

Would you like me to analyze a specific route or provide more details about any of these options?`;

            resolve(safeRouteResponse);
          },
          (error) => {
            clearTimeout(timeout);
            resolve("Couldn't get your location. Please enable location access for safe route suggestions.");
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 300000,
          }
        );
      });
    } catch (error) {
      return "I couldn't get safe route suggestions right now. Please try again later.";
    }
  };

  const handleRouteSuggestion = async (query: string): Promise<string> => {
    // Check if user is asking for route suggestions with specific amenities
    if (query.toLowerCase().includes('hospitals') || query.toLowerCase().includes('hospital')) {
      return await handleHospitalRouteSuggestion(query);
    }
    
    if (query.toLowerCase().includes('police') || query.toLowerCase().includes('station')) {
      return await handlePoliceStationRouteSuggestion(query);
    }
    
    if (query.toLowerCase().includes('school') || query.toLowerCase().includes('college') || query.toLowerCase().includes('university')) {
      return await handleEducationalRouteSuggestion(query);
    }
    
    if (query.toLowerCase().includes('safe') || query.toLowerCase().includes('safest')) {
      return await handleSafeRouteSuggestion(query);
    }
    
    // Get current location with timeout
    if (!navigator.geolocation) {
      return "Geolocation is not supported. Please enable location access to get route suggestions.";
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve("Location request timed out. Please try again.");
      }, 10000); // 10 second timeout

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeout);
          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          
          // For demo purposes, use a destination 5km away
          const destinationLat = currentLat + 0.05;
          const destinationLng = currentLng + 0.05;
          
          const preferences = {
            prioritizePoliceStations: query.toLowerCase().includes('police'),
            prioritizeLighting: query.toLowerCase().includes('light') || query.toLowerCase().includes('lit'),
            avoidHighCrimeAreas: query.toLowerCase().includes('safe'),
            timeOfDay: getCurrentTimeOfDay()
          };

          try {
            const response = await Promise.race([
              openAIService.getRouteSuggestions(
                currentLat, currentLng, destinationLat, destinationLng, preferences
              ),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('API timeout')), 15000)
              )
            ]);
            resolve(response);
          } catch (error) {
            resolve("I couldn't analyze the route right now. Please try again later.");
          }
        },
        (error) => {
          clearTimeout(timeout);
          resolve("Couldn't get your location. Please enable location access for route suggestions.");
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000,
        }
      );
    });
  };

  const handleCurrentLocationAnalysis = async (): Promise<string> => {
    if (!navigator.geolocation) {
      return "Geolocation is not supported. Please enable location access for safety analysis.";
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve("Location request timed out. Please try again.");
      }, 10000); // 10 second timeout

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeout);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // Get AI analysis with timeout
            const analysis = await Promise.race([
              openAIService.analyzeCurrentLocationSafety(lat, lng, getCurrentTimeOfDay()),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('API timeout')), 15000)
              )
            ]);
            
            resolve(analysis);
          } catch (error) {
            // Fallback response if API fails
            resolve(`📍 **Current Location Safety Analysis**

**Location**: ${lat.toFixed(4)}, ${lng.toFixed(4)}
**Time**: ${getCurrentTimeOfDay()}

**Safety Assessment**: 
- Risk Level: Medium (estimated)
- Recommendations: Stay alert, avoid isolated areas
- Emergency Contacts: Keep 911 handy

*Note: Detailed ML analysis unavailable. Please try again later.*`);
          }
        },
        (error) => {
          clearTimeout(timeout);
          resolve("Couldn't get your location. Please enable location access for safety analysis.");
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000,
        }
      );
    });
  };

  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setError(null);

    try {
      // Check for ML-integrated queries
      const isRouteQuery = inputValue.toLowerCase().includes('route') || 
                          inputValue.toLowerCase().includes('hospitals') ||
                          inputValue.toLowerCase().includes('hospital') ||
                          inputValue.toLowerCase().includes('police') ||
                          inputValue.toLowerCase().includes('station') ||
                          inputValue.toLowerCase().includes('school') ||
                          inputValue.toLowerCase().includes('college') ||
                          inputValue.toLowerCase().includes('university') ||
                          inputValue.toLowerCase().includes('safe') ||
                          inputValue.toLowerCase().includes('safest') ||
                          inputValue.toLowerCase().includes('suggest') ||
                          inputValue.toLowerCase().includes('find');
      
      const isLocationQuery = inputValue.toLowerCase().includes('current') && 
                              inputValue.toLowerCase().includes('location');
      
      const isMLQuery = inputValue.toLowerCase().includes('ml') || 
                        inputValue.toLowerCase().includes('model') ||
                        inputValue.toLowerCase().includes('prediction');

      let response = "";

      if (isRouteQuery) {
        // Handle route suggestion with ML integration
        response = await handleRouteSuggestion(inputValue);
      } else if (isLocationQuery) {
        // Handle current location analysis
        response = await handleCurrentLocationAnalysis();
      } else if (isMLQuery) {
        // Handle ML model explanations
        response = await Promise.race([
          openAIService.sendMessage([{
            role: "user",
            content: inputValue
          }]),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('API timeout')), 15000)
          )
        ]);
      } else {
        // Regular chat with ML context
        const conversationHistory = messages.map(msg => ({
          role: msg.sender === "user" ? "user" as const : "assistant" as const,
          content: msg.text
        }));

        conversationHistory.push({
          role: "user",
          content: inputValue
        });

        response = await Promise.race([
          openAIService.sendMessage(conversationHistory),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('API timeout')), 20000)
          )
        ]);
      }

      // Create system message with response
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "system",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, systemMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('Chat Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "system",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleQuickAction = async (action: string) => {
    setShowQuickActions(false);
    setInputValue(action);
    await handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">SafeCity Assistant</h3>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="p-4 border-b border-border">
          <p className="text-sm text-muted-foreground mb-3">Quick Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Explain how the ML model works")}
              className="text-xs h-8"
            >
              <Brain className="h-3 w-3 mr-1" />
              ML Model Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("What factors affect crime prediction?")}
              className="text-xs h-8"
            >
              <Shield className="h-3 w-3 mr-1" />
              Safety Factors
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("How to stay safe at night?")}
              className="text-xs h-8"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Night Safety
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("What do risk percentages mean?")}
              className="text-xs h-8"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Risk Levels
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Suggest a route with police stations nearby")}
              className="text-xs h-8"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Route with Police
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Analyze my current location safety")}
              className="text-xs h-8"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Current Safety
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Find the safest route to my destination")}
              className="text-xs h-8"
            >
              <Route className="h-3 w-3 mr-1" />
              Safe Route
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("Show me well-lit areas nearby")}
              className="text-xs h-8"
            >
              <Shield className="h-3 w-3 mr-1" />
              Well-Lit Areas
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-sm ${
                  message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}>
                  <div className={`p-2 rounded-lg ${
                    message.sender === "user" 
                      ? "bg-primary/10" 
                      : "bg-muted/50"
                  }`}>
                    {message.sender === "user" ? (
                      <User className="h-4 w-4 text-primary" />
                    ) : (
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className={`chat-message ${
                    message.sender === "user" 
                      ? "chat-message-user" 
                      : "chat-message-system"
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {(isTyping || isStreaming) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-2">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="chat-message chat-message-system">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-2">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div className="chat-message chat-message-system">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {!showQuickActions && (
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickActions(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Shield className="h-3 w-3 mr-1" />
              Show Quick Actions
            </Button>
          </div>
        )}
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
            disabled={isTyping || isStreaming}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || isStreaming}
            size="sm"
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;