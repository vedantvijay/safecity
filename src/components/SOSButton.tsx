import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Phone } from "lucide-react";
import { toast } from "sonner";

const SOSButton = () => {
  const [isPressed, setIsPressed] = useState(false);

  const handleSOS = () => {
    setIsPressed(true);
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Simulate SOS functionality
          toast.error("🚨 SOS ACTIVATED", {
            description: `Emergency alert sent! Your location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) has been shared with emergency contacts and local authorities.`,
            duration: 10000,
          });

          console.log("SOS Alert sent:", {
            timestamp: new Date().toISOString(),
            location: { latitude, longitude },
            message: "Emergency assistance requested"
          });
        },
        (error) => {
          toast.error("🚨 SOS ACTIVATED", {
            description: "Emergency alert sent! Location services unavailable, but your request has been logged.",
            duration: 10000,
          });
          
          console.log("SOS Alert sent (no location):", {
            timestamp: new Date().toISOString(),
            error: error.message,
            message: "Emergency assistance requested"
          });
        }
      );
    } else {
      toast.error("🚨 SOS ACTIVATED", {
        description: "Emergency alert sent! Your request has been logged with emergency services.",
        duration: 10000,
      });
    }

    // Reset button state after animation
    setTimeout(() => {
      setIsPressed(false);
    }, 3000);
  };

  return (
    <motion.button
      onClick={handleSOS}
      disabled={isPressed}
      className={`sos-button ${isPressed ? "animate-pulse-glow" : ""}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 1 }}
      animate={isPressed ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center">
        {isPressed ? (
          <Phone className="h-6 w-6 mb-1" />
        ) : (
          <AlertTriangle className="h-6 w-6 mb-1" />
        )}
        <span className="text-xs font-bold">
          {isPressed ? "CALLING..." : "SOS"}
        </span>
      </div>
    </motion.button>
  );
};

export default SOSButton;