import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Phone, Settings, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { emailService } from "@/services/emailService";

interface EmergencyContact {
  name: string;
  email: string;
  relationship: string;
}

const SOSButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "SafeCity User",
    email: "snehasachan3107@gmail.com"
  });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      name: "Sneha Sachan",
      email: "snehasachan3107@gmail.com",
      relationship: "Emergency Contact"
    },
    {
      name: "Emergency Contact 2", 
      email: "emergency2@example.com",
      relationship: "Friend"
    }
  ]);
  const [isSending, setIsSending] = useState(false);

  const handleSOS = async () => {
    if (isSending) return;
    
    setIsPressed(true);
    setIsSending(true);
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Send SOS alerts to all emergency contacts
            const result = await emailService.sendSOSAlertToMultipleContacts(
              {
                name: userInfo.name,
                email: userInfo.email,
                location: { latitude, longitude }
              },
              emergencyContacts
            );

            if (result.success > 0) {
              toast.success("🚨 SOS ALERT SENT", {
                description: `Emergency alerts sent to ${result.success} contact(s)! Your location has been shared.`,
                duration: 10000,
              });
            } else {
              toast.error("🚨 SOS ALERT FAILED", {
                description: "Failed to send email alerts. Please call 911 directly!",
                duration: 10000,
              });
            }

            console.log("SOS Alert sent:", {
              timestamp: new Date().toISOString(),
              location: { latitude, longitude },
              contactsNotified: result.success,
              contactsFailed: result.failed
            });
          } catch (error) {
            console.error("SOS Alert error:", error);
            toast.error("🚨 SOS ALERT ERROR", {
              description: "Failed to send alerts. Please call 911 directly!",
              duration: 10000,
            });
          } finally {
            setIsSending(false);
            setTimeout(() => {
              setIsPressed(false);
            }, 3000);
          }
        },
        async (error) => {
          console.error("Location error:", error);
          
          try {
            // Send SOS without location
            const result = await emailService.sendSOSAlertToMultipleContacts(
              {
                name: userInfo.name,
                email: userInfo.email,
                location: { latitude: 0, longitude: 0 }
              },
              emergencyContacts
            );

            if (result.success > 0) {
              toast.warning("🚨 SOS ALERT SENT", {
                description: `Emergency alerts sent to ${result.success} contact(s)! Location unavailable.`,
                duration: 10000,
              });
            } else {
              toast.error("🚨 SOS ALERT FAILED", {
                description: "Failed to send email alerts. Please call 911 directly!",
                duration: 10000,
              });
            }
          } catch (emailError) {
            console.error("Email error:", emailError);
            toast.error("🚨 SOS ALERT ERROR", {
              description: "Failed to send alerts. Please call 911 directly!",
              duration: 10000,
            });
          } finally {
            setIsSending(false);
            setTimeout(() => {
              setIsPressed(false);
            }, 3000);
          }
        }
      );
    } else {
      toast.error("🚨 SOS ALERT FAILED", {
        description: "Location services unavailable. Please call 911 directly!",
        duration: 10000,
      });
      setIsSending(false);
      setTimeout(() => {
        setIsPressed(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="bg-card border border-border rounded-xl p-4 shadow-lg w-80 max-w-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>SOS Settings</span>
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>

          {/* User Information */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1 block">
                Your Name
              </label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1 block">
                Your Email
              </label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                placeholder="Enter your email"
              />
            </div>

            {/* Emergency Contacts */}
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Emergency Contacts
              </label>
              <div className="space-y-2">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => {
                          const newContacts = [...emergencyContacts];
                          newContacts[index].name = e.target.value;
                          setEmergencyContacts(newContacts);
                        }}
                        className="flex-1 px-2 py-1 bg-input border border-border rounded text-sm text-foreground"
                        placeholder="Contact name"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => {
                          const newContacts = [...emergencyContacts];
                          newContacts[index].email = e.target.value;
                          setEmergencyContacts(newContacts);
                        }}
                        className="flex-1 px-2 py-1 bg-input border border-border rounded text-sm text-foreground"
                        placeholder="Contact email"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              💡 Make sure to configure your EmailJS settings in the .env file for email alerts to work.
            </div>
          </div>
        </motion.div>
      )}

      {/* SOS Button */}
      <div className="flex space-x-2">
        {/* Settings Button */}
        <motion.button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-muted text-muted-foreground p-3 rounded-full shadow-lg hover:bg-muted/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="h-4 w-4" />
        </motion.button>

        {/* Main SOS Button */}
        <motion.button
          onClick={handleSOS}
          disabled={isPressed || isSending}
          className={`sos-button ${isPressed ? "animate-pulse-glow" : ""}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 1 }}
          animate={isPressed ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center">
            {isPressed || isSending ? (
              <Phone className="h-6 w-6 mb-1" />
            ) : (
              <AlertTriangle className="h-6 w-6 mb-1" />
            )}
            <span className="text-xs font-bold">
              {isSending ? "SENDING..." : isPressed ? "CALLING..." : "SOS"}
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default SOSButton;