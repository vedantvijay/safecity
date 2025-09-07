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

  const handleRouteSuggestion = async (query: string): Promise<string> => {
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
      const isRouteQuery = inputValue.toLowerCase().includes('route') && 
                          (inputValue.toLowerCase().includes('police') || 
                           inputValue.toLowerCase().includes('safe') ||
                           inputValue.toLowerCase().includes('light'));
      
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