import { useState } from "react";
import { motion } from "framer-motion";
import GoogleMapComponent from "@/components/GoogleMap";
import SimpleChatbot from "@/components/SimpleChatbot";
import SOSButton from "@/components/SOSButton";

const MapPage = () => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLocations, setMapLocations] = useState<{
    start: { lat: number; lng: number; address?: string } | null;
    destination: { lat: number; lng: number; address?: string } | null;
  }>({
    start: null,
    destination: null
  });

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    console.log("Location selected:", location);
  };

  const handleMapLocationsChange = (locations: {
    start: { lat: number; lng: number; address?: string } | null;
    destination: { lat: number; lng: number; address?: string } | null;
  }) => {
    setMapLocations(locations);
    console.log("Map locations updated:", locations);
  };

  const [routeTypes, setRouteTypes] = useState<string[]>([]);

  const handleRouteTypesChange = (types: string[]) => {
    setRouteTypes(types);
    console.log("Route types updated:", types);
  };

  const [routeRequest, setRouteRequest] = useState<{
    prioritizePoliceStations?: boolean;
    prioritizeLighting?: boolean;
    avoidHighCrimeAreas?: boolean;
    timeOfDay?: string;
  } | null>(null);

  const handleRouteRequest = (routePreferences: {
    prioritizePoliceStations?: boolean;
    prioritizeLighting?: boolean;
    avoidHighCrimeAreas?: boolean;
    timeOfDay?: string;
  }) => {
    console.log("Route request from chatbot:", routePreferences);
    setRouteRequest(routePreferences);
  };

  return (
    <div className="h-screen bg-background">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              SafeCity Map
            </h1>
            <p className="text-muted-foreground">
              Monitor your area, get real-time safety updates, and access emergency services.
            </p>
          </div>

          {/* Map and Chat Layout */}
          <div className="h-[calc(100%-120px)] grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2 relative h-full min-h-[500px]">
              <GoogleMapComponent 
                onLocationSelect={handleLocationSelect} 
                onLocationsChange={handleMapLocationsChange}
                routeRequest={routeRequest}
                onRouteRequestComplete={() => setRouteRequest(null)}
                onRouteTypesChange={handleRouteTypesChange}
              />
              
              {/* Location Info Overlay */}
              {selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-4 bg-card border border-border rounded-xl p-4 shadow-lg max-w-sm"
                >
                  <h3 className="font-semibold text-card-foreground mb-2">
                    Selected Location
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Latitude: {selectedLocation.lat.toFixed(6)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Longitude: {selectedLocation.lng.toFixed(6)}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Chat Section */}
            <div className="lg:col-span-1 min-h-[400px] lg:min-h-full">
              <SimpleChatbot 
                mapLocations={mapLocations} 
                onRouteRequest={handleRouteRequest}
                routeTypes={routeTypes}
              />
            </div>
          </div>

          {/* SOS Button */}
          <SOSButton />
        </motion.div>
      </div>
    </div>
  );
};

export default MapPage;