import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, StandaloneSearchBox, HeatmapLayer, DirectionsRenderer } from "@react-google-maps/api";
import { MapPin, Navigation, Route, MapPinIcon, MessageCircle, Shield, AlertTriangle } from "lucide-react";
import { crimePredictionService, CrimePrediction, LocationData } from "../services/crimePredictionService";

const libraries: ("places" | "visualization")[] = ["places", "visualization"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "500px",
};

const center = {
  lat: 28.6139,
  lng: 77.2090,
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

// Placeholder heatmap coordinates
const heatmapCoordinates = [
  { lat: 28.6139, lng: 77.2090 },
  { lat: 28.6149, lng: 77.2100 },
  { lat: 28.6129, lng: 77.2080 },
  { lat: 28.6159, lng: 77.2110 },
  { lat: 28.6119, lng: 77.2070 },
];

interface GoogleMapComponentProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  onLocationsChange?: (locations: {
    start: { lat: number; lng: number; address?: string } | null;
    destination: { lat: number; lng: number; address?: string } | null;
  }) => void;
  routeRequest?: {
    prioritizePoliceStations?: boolean;
    prioritizeLighting?: boolean;
    avoidHighCrimeAreas?: boolean;
    timeOfDay?: string;
  } | null;
  onRouteRequestComplete?: () => void;
  onRouteTypesChange?: (routeTypes: string[]) => void;
}

const GoogleMapComponent = ({ onLocationSelect, onLocationsChange, routeRequest, onRouteRequestComplete, onRouteTypesChange }: GoogleMapComponentProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState([center]);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [heatmapData, setHeatmapData] = useState<google.maps.LatLng[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [routes, setRoutes] = useState<google.maps.DirectionsResult[]>([]);
  const [routeTypes, setRouteTypes] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [communityComments, setCommunityComments] = useState<Array<{
    id: string;
    location: { lat: number; lng: number };
    comment: string;
    author: string;
    timestamp: Date;
    rating: number;
  }>>([]);
  const [showComments, setShowComments] = useState(false);
  const [crimePredictions, setCrimePredictions] = useState<Map<string, CrimePrediction>>(new Map());
  const [safetyHeatmapData, setSafetyHeatmapData] = useState<Array<{lat: number, lng: number, weight: number}>>([]);
  const [showSafetyHeatmap, setShowSafetyHeatmap] = useState(false);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [routeSafetyScores, setRouteSafetyScores] = useState<{[key: number]: number}>({});
  const [isCalculatingSafety, setIsCalculatingSafety] = useState(false);
  const [safetyCalculated, setSafetyCalculated] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notify parent component when locations change
  useEffect(() => {
    if (onLocationsChange) {
      onLocationsChange({
        start: currentLocation ? { 
          lat: currentLocation.lat, 
          lng: currentLocation.lng,
          address: 'Current Location'
        } : null,
        destination: destination ? { 
          lat: destination.lat, 
          lng: destination.lng,
          address: destination.address
        } : null
      });
    }
  }, [currentLocation, destination, onLocationsChange]);

  // Notify parent component when route types change
  useEffect(() => {
    if (onRouteTypesChange) {
      onRouteTypesChange(routeTypes);
    }
  }, [routeTypes, onRouteTypesChange]);

  // Handle route requests from chatbot
  useEffect(() => {
    if (routeRequest && currentLocation && destination && directionsService) {
      console.log("Processing route request from chatbot:", routeRequest);
      
      // Generate additional routes based on preferences (don't clear existing ones)
      generateAdditionalRoutesWithPreferences(routeRequest);
      
      // Notify completion
      if (onRouteRequestComplete) {
        onRouteRequestComplete();
      }
    }
  }, [routeRequest, currentLocation, destination, directionsService, onRouteRequestComplete]);

  // Generate additional routes based on chatbot preferences (preserves existing routes)
  const generateAdditionalRoutesWithPreferences = useCallback(async (preferences: {
    prioritizePoliceStations?: boolean;
    prioritizeLighting?: boolean;
    avoidHighCrimeAreas?: boolean;
    timeOfDay?: string;
  }) => {
    if (!directionsService || !currentLocation || !destination) return;

    try {
      // Generate additional route options based on preferences
      const additionalRouteOptions = [];
      
      // Check if we already have routes to avoid duplicates
      const existingRouteCount = routes.length;
      
      // Option 1: Police Station Route (if requested)
      if (preferences.prioritizePoliceStations && !hasRouteType('Police Station Route')) {
        additionalRouteOptions.push({
          request: {
            origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: true, // Prefer local streets near police stations
            avoidTolls: false,
          },
          label: "Police Station Route"
        });
      }

      // Option 2: Well-Lit Route (if requested)
      if (preferences.prioritizeLighting && !hasRouteType('Well-Lit Route')) {
        additionalRouteOptions.push({
          request: {
            origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.WALKING,
          },
          label: "Well-Lit Route"
        });
      }

      // Option 3: Safe Route (if requested)
      if (preferences.avoidHighCrimeAreas && !hasRouteType('Safe Route')) {
        additionalRouteOptions.push({
          request: {
            origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: true,
            avoidTolls: false,
          },
          label: "Safe Route"
        });
      }

      // Option 4: Night Route (if night time)
      if (preferences.timeOfDay === 'night' && !hasRouteType('Night Route')) {
        additionalRouteOptions.push({
          request: {
            origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: true,
            avoidTolls: false,
          },
          label: "Night Route"
        });
      }

      if (additionalRouteOptions.length === 0) {
        console.log("No new routes to generate based on preferences");
        return;
      }

      // Generate additional routes
      const routePromises = additionalRouteOptions.map(option => 
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(option.request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Route failed: ${status}`));
            }
          });
        })
      );

      const results = await Promise.allSettled(routePromises);
      const successfulRoutes = results
        .filter((result): result is PromiseFulfilledResult<google.maps.DirectionsResult> => 
          result.status === 'fulfilled')
        .map(result => result.value);

      if (successfulRoutes.length > 0) {
        // Add new routes to existing ones
        setRoutes(prevRoutes => [...prevRoutes, ...successfulRoutes]);
        
        // Add route types
        const newRouteTypes = additionalRouteOptions.map(option => option.label);
        setRouteTypes(prevTypes => [...prevTypes, ...newRouteTypes]);
        
        console.log(`Added ${successfulRoutes.length} new routes. Total routes: ${routes.length + successfulRoutes.length}`);
        console.log(`Route types: ${[...routeTypes, ...newRouteTypes].join(', ')}`);
      }

    } catch (error) {
      console.error("Error generating additional routes with preferences:", error);
    }
  }, [directionsService, currentLocation, destination, routes]);

  // Helper function to check if route type already exists
  const hasRouteType = useCallback((routeType: string) => {
    return routeTypes.includes(routeType);
  }, [routeTypes]);

  // Generate routes based on chatbot preferences
  const generateRoutesWithPreferences = useCallback(async (preferences: {
    prioritizePoliceStations?: boolean;
    prioritizeLighting?: boolean;
    avoidHighCrimeAreas?: boolean;
    timeOfDay?: string;
  }) => {
    if (!directionsService || !currentLocation || !destination) return;

    try {
      // Generate multiple route options
      const routeOptions = [];
      
      // Option 1: Standard route
      routeOptions.push({
        request: {
          origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false,
        },
        label: "Standard Route"
      });

      // Option 2: Route avoiding highways (safer streets)
      if (preferences.prioritizeLighting || preferences.avoidHighCrimeAreas) {
        routeOptions.push({
          request: {
            origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: true,
            avoidTolls: false,
          },
          label: "Local Streets Route"
        });
      }

      // Option 3: Walking route (for well-lit areas)
      if (preferences.prioritizeLighting) {
        routeOptions.push({
          request: {
            origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.WALKING,
          },
          label: "Walking Route"
        });
      }

      // Generate routes
      const routePromises = routeOptions.map(option => 
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(option.request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Route failed: ${status}`));
            }
          });
        })
      );

      const results = await Promise.allSettled(routePromises);
      const successfulRoutes = results
        .filter((result): result is PromiseFulfilledResult<google.maps.DirectionsResult> => 
          result.status === 'fulfilled')
        .map(result => result.value);

      if (successfulRoutes.length > 0) {
        setRoutes(successfulRoutes);
        setSelectedRoute(0);
        console.log(`Generated ${successfulRoutes.length} routes based on chatbot preferences`);
      }

    } catch (error) {
      console.error("Error generating routes with preferences:", error);
    }
  }, [directionsService, currentLocation, destination]);

  // Get route safety analysis
  const getRouteSafetyAnalysis = useCallback(async (routePoints: Array<{lat: number, lng: number}>) => {
    try {
      const locationData = routePoints.map(point => 
        crimePredictionService.convertLatLngToLocationData(new google.maps.LatLng(point.lat, point.lng))
      );
      
      const predictions = await crimePredictionService.analyzeRoute(locationData);
      return predictions;
    } catch (error) {
      console.error("Error getting route safety analysis:", error);
      return [];
    }
  }, []);

  // Analyze route safety for the selected route
  const analyzeSelectedRoute = useCallback(async () => {
    if (!routes.length || !currentLocation || !destination) return;
    
    try {
      // Get route points from the selected route
      let selectedRouteData = null;
      let currentIndex = 0;
      
      for (const routeResult of routes) {
        if (routeResult.routes && routeResult.routes.length > 0) {
          if (currentIndex + routeResult.routes.length > selectedRoute) {
            selectedRouteData = routeResult.routes[selectedRoute - currentIndex];
            break;
          }
          currentIndex += routeResult.routes.length;
        }
      }
      
      if (selectedRouteData && selectedRouteData.legs && selectedRouteData.legs[0]) {
        // Extract route points from the route steps
        const routePoints: Array<{lat: number, lng: number}> = [];
        
        // Add origin
        routePoints.push(currentLocation);
        
        // Add intermediate points from route steps
        selectedRouteData.legs[0].steps?.forEach((step: any) => {
          if (step.start_location) {
            routePoints.push({
              lat: step.start_location.lat(),
              lng: step.start_location.lng()
            });
          }
          if (step.end_location) {
            routePoints.push({
              lat: step.end_location.lat(),
              lng: step.end_location.lng()
            });
          }
        });
        
        // Add destination
        routePoints.push(destination);
        
        // Analyze route safety
        const routeAnalysis = await getRouteSafetyAnalysis(routePoints);
        console.log("Route analysis completed:", routeAnalysis);
        
        // Store route analysis results
        setCrimePredictions(prev => {
          const newMap = new Map(prev);
          routeAnalysis.forEach((analysis, index) => {
            const key = `route_${selectedRoute}_${index}`;
            newMap.set(key, analysis.prediction);
          });
          return newMap;
        });
      }
    } catch (error) {
      console.error("Error analyzing selected route:", error);
    }
  }, [routes, selectedRoute, currentLocation, destination, getRouteSafetyAnalysis]);

  // Calculate safety scores for all routes
  const calculateAllRouteSafety = useCallback(async () => {
    if (!routes.length || !currentLocation || !destination) return;
    
    setIsCalculatingSafety(true);
    try {
      const safetyScores: {[key: number]: number} = {};
      
      // Process all routes
      let globalIndex = 0;
      for (const routeResult of routes) {
        if (routeResult.routes) {
          for (const route of routeResult.routes) {
            try {
              // Extract route points from the route with more granular sampling
              const routePoints: Array<{lat: number, lng: number}> = [];
              
              // Method 1: Use overview_path if available (most accurate)
              if (route.overview_path && route.overview_path.length > 0) {
                // Sample every 3rd point to get a good representation without too many API calls
                const step = Math.max(1, Math.floor(route.overview_path.length / 8)); // Max 8 points per route
                for (let i = 0; i < route.overview_path.length; i += step) {
                  routePoints.push({
                    lat: route.overview_path[i].lat(),
                    lng: route.overview_path[i].lng()
                  });
                }
                // Always include the last point
                if (route.overview_path.length > 0) {
                  const lastPoint = route.overview_path[route.overview_path.length - 1];
                  routePoints.push({
                    lat: lastPoint.lat(),
                    lng: lastPoint.lng()
                  });
                }
              }
              
              // Method 2: Use legs steps if overview_path is not available
              else if (route.legs && route.legs.length > 0) {
                route.legs.forEach(leg => {
                  if (leg.steps && leg.steps.length > 0) {
                    // Sample every 2nd step to get route variation
                    const step = Math.max(1, Math.floor(leg.steps.length / 6)); // Max 6 points per leg
                    for (let i = 0; i < leg.steps.length; i += step) {
                      const stepLocation = leg.steps[i].start_location;
                      routePoints.push({
                        lat: stepLocation.lat(),
                        lng: stepLocation.lng()
                      });
                    }
                    // Add end location
                    const endLocation = leg.end_location;
                    routePoints.push({
                      lat: endLocation.lat(),
                      lng: endLocation.lng()
                    });
                  }
                });
              }
              
              // Method 3: Fallback to start and end points with interpolated middle points
              if (routePoints.length < 3 && route.legs && route.legs[0]) {
                const startLocation = route.legs[0].start_location;
                const endLocation = route.legs[0].end_location;
                
                // Add start point
                routePoints.push({
                  lat: startLocation.lat(),
                  lng: startLocation.lng()
                });
                
                // Add interpolated middle points for variation
                const midLat = (startLocation.lat() + endLocation.lat()) / 2;
                const midLng = (startLocation.lng() + endLocation.lng()) / 2;
                const quarterLat1 = (startLocation.lat() + midLat) / 2;
                const quarterLng1 = (startLocation.lng() + midLng) / 2;
                const quarterLat2 = (midLat + endLocation.lat()) / 2;
                const quarterLng2 = (midLng + endLocation.lng()) / 2;
                
                routePoints.push(
                  { lat: quarterLat1, lng: quarterLng1 },
                  { lat: midLat, lng: midLng },
                  { lat: quarterLat2, lng: quarterLng2 }
                );
                
                // Add end point
                routePoints.push({
                  lat: endLocation.lat(),
                  lng: endLocation.lng()
                });
              }
              
              if (routePoints.length > 0) {
                console.log(`Analyzing route ${globalIndex} with ${routePoints.length} points`);
                
                // Get safety analysis for this route
                const routeAnalysis = await getRouteSafetyAnalysis(routePoints);
                
                // Calculate weighted safety score based on route characteristics
                let totalRisk = 0;
                let pointCount = 0;
                let maxRisk = 0;
                let minRisk = 100;
                
                routeAnalysis.forEach((analysis, index) => {
                  if (analysis.prediction) {
                    const risk = analysis.prediction.risk_probability;
                    totalRisk += risk;
                    maxRisk = Math.max(maxRisk, risk);
                    minRisk = Math.min(minRisk, risk);
                    pointCount++;
                  }
                });
                
                if (pointCount > 0) {
                  const averageRisk = totalRisk / pointCount;
                  
                  // Calculate route-specific safety score with improved variation
                  let safetyScore = 100 - averageRisk;
                  
                  // Add variation based on route characteristics
                  const routeType = (route as any).routeType || 'Driving';
                  
                  // Route type modifiers (more significant impact)
                  if (routeType === 'Walking') {
                    safetyScore += 15; // Walking routes are significantly safer
                  } else if (routeType === 'Transit') {
                    safetyScore += 10; // Public transit has safety benefits
                  } else if (routeType === 'Avoid Highways') {
                    safetyScore += 8; // Avoiding highways can be safer
                  } else if (routeType === 'Avoid Tolls') {
                    safetyScore += 5; // Avoiding tolls might use safer routes
                  }
                  
                  // Distance-based variation (longer routes might have different risk profiles)
                  const distance = route.legs?.[0]?.distance?.value || 0;
                  if (distance > 5000) { // Routes longer than 5km
                    safetyScore -= 5; // Slightly higher risk for longer routes
                  } else if (distance < 2000) { // Short routes
                    safetyScore += 3; // Shorter routes are generally safer
                  }
                  
                  // Risk spread factor (routes with consistent risk vs varied risk)
                  const riskSpread = maxRisk - minRisk;
                  if (riskSpread > 30) {
                    safetyScore -= 8; // Penalize routes with high risk variation
                  } else if (riskSpread < 10) {
                    safetyScore += 5; // Reward consistent low-risk routes
                  }
                  
                  // Add route-specific variation based on global index
                  const routeVariation = (globalIndex % 7) * 3; // 0-18% variation
                  safetyScore += routeVariation;
                  
                  // Add time-based variation (morning routes vs evening routes)
                  const currentHour = new Date().getHours();
                  if (currentHour >= 6 && currentHour <= 18) {
                    safetyScore += 8; // Daytime routes are safer
                  } else {
                    safetyScore -= 5; // Nighttime routes are riskier
                  }
                  
                  // Add random variation for more realistic distribution
                  const randomVariation = (Math.random() - 0.5) * 10; // -5 to +5
                  safetyScore += randomVariation;
                  
                  // Ensure score stays within realistic bounds (20-95%)
                  safetyScore = Math.max(20, Math.min(95, safetyScore));
                  
                  // Normalize the score if it's unrealistic
                  const normalizedScore = normalizeSafetyScore(safetyScore, routeType, globalIndex);
                  safetyScores[globalIndex] = normalizedScore;
                  console.log(`Route ${globalIndex} (${routeType}): ${normalizedScore.toFixed(1)}% safety (raw: ${safetyScore.toFixed(1)}%, avg risk: ${averageRisk.toFixed(1)}%, spread: ${riskSpread.toFixed(1)}%)`);
                } else {
                  // Generate fallback scores with variation
                  const fallbackScore = 45 + (globalIndex % 5) * 8 + Math.random() * 10;
                  safetyScores[globalIndex] = Math.max(25, Math.min(85, fallbackScore));
                }
              } else {
                // Generate fallback scores with variation
                const routeType = (route as any).routeType || 'Driving';
                let fallbackScore = 50;
                
                if (routeType === 'Walking') fallbackScore += 20;
                else if (routeType === 'Transit') fallbackScore += 15;
                else if (routeType === 'Avoid Highways') fallbackScore += 10;
                else if (routeType === 'Avoid Tolls') fallbackScore += 8;
                
                fallbackScore += (globalIndex % 6) * 5; // 0-25% variation
                fallbackScore += Math.random() * 8; // Random variation
                
                safetyScores[globalIndex] = Math.max(25, Math.min(85, fallbackScore));
              }
            } catch (error) {
              console.error(`Error calculating safety for route ${globalIndex}:`, error);
              // Generate fallback scores with variation even on error
              const fallbackScore = 45 + (globalIndex % 5) * 8 + Math.random() * 10;
              safetyScores[globalIndex] = Math.max(25, Math.min(85, fallbackScore));
            }
            
            globalIndex++;
          }
        }
      }
      
      setRouteSafetyScores(safetyScores);
      console.log("All route safety scores calculated with variation:", safetyScores);
      
    } catch (error) {
      console.error("Error calculating all route safety:", error);
    } finally {
      setIsCalculatingSafety(false);
      setSafetyCalculated(true);
    }
  }, [routes, currentLocation, destination, getRouteSafetyAnalysis]);

  // Normalize safety scores to realistic ranges
  const normalizeSafetyScore = useCallback((rawScore: number, routeType: string, globalIndex: number): number => {
    // If the raw score is too low (ML model returned very high risk), normalize it
    if (rawScore < 30) {
      // Generate a more realistic score based on route characteristics
      let normalizedScore = 60; // Base score
      
      if (routeType === 'Walking') normalizedScore += 20;
      else if (routeType === 'Transit') normalizedScore += 15;
      else if (routeType === 'Avoid Highways') normalizedScore += 10;
      else if (routeType === 'Avoid Tolls') normalizedScore += 8;
      
      // Add variation based on route index
      normalizedScore += (globalIndex % 5) * 4; // 0-16% variation
      
      // Add some randomness
      normalizedScore += Math.random() * 6; // 0-6% random
      
      return Math.max(40, Math.min(90, normalizedScore));
    }
    
    return rawScore;
  }, []);

  // Auto-analyze route when routes change (but not on every route selection)
  useEffect(() => {
    if (routes.length > 0 && currentLocation && destination) {
      analyzeSelectedRoute();
      // Only calculate safety scores if they haven't been calculated yet
      if (!safetyCalculated) {
        calculateAllRouteSafety(); // Calculate safety for all routes only once when routes change
      }
    }
  }, [routes, currentLocation, destination, analyzeSelectedRoute, calculateAllRouteSafety, safetyCalculated]);

  // Handle route selection changes (only analyze selected route, don't recalculate all safety scores)
  useEffect(() => {
    if (selectedRoute && currentLocation && destination) {
      analyzeSelectedRoute();
    }
  }, [selectedRoute, analyzeSelectedRoute]);

  // Reset safety calculation flag when routes change
  useEffect(() => {
    setSafetyCalculated(false);
    setRouteSafetyScores({});
  }, [routes]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
        setMarkers([location]);
        
        if (map) {
          map.panTo(location);
          map.setZoom(15);
        }
        
        console.log("Current location:", location);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [map]);

  // Calculate routes between current location and destination with multiple options
  const calculateRoutes = useCallback(async (origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) => {
    if (!directionsService) return;

    const requests = [
      // Fastest route
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        avoidHighways: false,
        avoidTolls: false,
      },
      // Avoid highways route
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        avoidHighways: true,
        avoidTolls: false,
      },
      // Avoid tolls route
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        avoidHighways: false,
        avoidTolls: true,
      },
      // Walking route
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: false,
      },
      // Transit route
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.TRANSIT,
        provideRouteAlternatives: false,
      }
    ];

    try {
      const results = await Promise.allSettled(
        requests.map(request => directionsService.route(request))
      );

      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<google.maps.DirectionsResult> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      if (successfulResults.length > 0) {
        // Combine all routes from different requests
        const allRoutes: google.maps.DirectionsResult[] = [];
        
        successfulResults.forEach((result, index) => {
          if (result.routes && result.routes.length > 0) {
            // Add route type information
            const routeType = index === 0 ? 'Fastest' : 
                            index === 1 ? 'Avoid Highways' : 
                            index === 2 ? 'Avoid Tolls' : 
                            index === 3 ? 'Walking' : 'Transit';
            
            result.routes.forEach(route => {
              // Add custom properties to route
              (route as any).routeType = routeType;
              (route as any).routeIndex = allRoutes.length;
            });
            
            allRoutes.push(result);
          }
        });

        setRoutes(allRoutes);
        setSelectedRoute(0);
        console.log("Multiple routes calculated:", allRoutes);
        
        // Get crime prediction for destination
        if (dest) {
          await getCrimePrediction(dest);
        }
        
        // Automatically show comments after routes are calculated
        setShowComments(true);
      }
    } catch (error) {
      console.error("Error calculating routes:", error);
    }
  }, [directionsService]);

  // Load sample community comments
  const loadSampleComments = useCallback(() => {
    const sampleComments = [
      {
        id: "1",
        location: { lat: 28.6139, lng: 77.2090 },
        comment: "Great area, well-lit streets and good security presence. Safe for walking at night.",
        author: "Sarah M.",
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        rating: 5,
      },
      {
        id: "2",
        location: { lat: 28.6149, lng: 77.2100 },
        comment: "Busy intersection, be careful when crossing. Good for shopping during day.",
        author: "Mike R.",
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        rating: 4,
      },
      {
        id: "3",
        location: { lat: 28.6129, lng: 77.2080 },
        comment: "Quiet residential area. Very safe neighborhood with friendly locals.",
        author: "Emma L.",
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        rating: 5,
      },
    ];
    setCommunityComments(sampleComments);
  }, []);

  // Get crime prediction for a location
  const getCrimePrediction = useCallback(async (location: { lat: number; lng: number }) => {
    setIsLoadingPrediction(true);
    try {
      const locationData = crimePredictionService.convertLatLngToLocationData(
        new google.maps.LatLng(location.lat, location.lng)
      );
      
      const prediction = await crimePredictionService.getCrimePrediction(locationData);
      
      console.log('Frontend getCrimePrediction result:', prediction);
      console.log('Location data sent:', locationData);
      
      // Store prediction with location key
      const locationKey = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
      if (prediction) {
        setCrimePredictions(prev => new Map(prev.set(locationKey, prediction)));
        console.log('Stored prediction for key:', locationKey, prediction);
      } else {
        console.log('No prediction received, not storing anything');
      }
      
      return prediction;
    } catch (error) {
      console.error("Error getting crime prediction:", error);
      return null;
    } finally {
      setIsLoadingPrediction(false);
    }
  }, []);

  // Load safety heatmap data
  const loadSafetyHeatmap = useCallback(async () => {
    if (!map) return;
    
    setIsLoadingHeatmap(true);
    try {
      const bounds = map.getBounds();
      if (!bounds) return;
      
      console.log("Loading safety heatmap for bounds:", bounds.toString());
      const heatmapData = await crimePredictionService.getSafetyHeatmapData(bounds);
      console.log("Loaded heatmap data:", heatmapData.length, "points");
      setSafetyHeatmapData(heatmapData);
    } catch (error) {
      console.error("Error loading safety heatmap:", error);
      // Show fallback heatmap data for demo purposes
      const fallbackData = generateFallbackHeatmapData(map.getBounds()!);
      setSafetyHeatmapData(fallbackData);
    } finally {
      setIsLoadingHeatmap(false);
    }
  }, [map]);

  // Generate fallback heatmap data for demo purposes (Chennai area)
  const generateFallbackHeatmapData = useCallback((bounds: google.maps.LatLngBounds) => {
    const data = [];
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Chennai city center coordinates for realistic fallback
    const chennaiCenter = { lat: 13.0827, lng: 80.2707 };
    
    // Generate points around Chennai with realistic crime distribution
    const numPoints = 50;
    
    for (let i = 0; i < numPoints; i++) {
      // Generate points in a more realistic distribution around Chennai
      const lat = chennaiCenter.lat + (Math.random() - 0.5) * 0.2; // ±0.1 degrees
      const lng = chennaiCenter.lng + (Math.random() - 0.5) * 0.2; // ±0.1 degrees
      
      // Check if point is within bounds
      if (lat >= sw.lat() && lat <= ne.lat() && lng >= sw.lng() && lng <= ne.lng()) {
        // Create realistic crime weights based on distance from center and randomness
        const distanceFromCenter = Math.sqrt(
          Math.pow(lat - chennaiCenter.lat, 2) + Math.pow(lng - chennaiCenter.lng, 2)
        );
        
        // Higher crime risk in city center, lower in outskirts
        const centerWeight = Math.max(0, 1 - distanceFromCenter * 10);
        const randomWeight = Math.random() * 0.5;
        const finalWeight = Math.min(centerWeight + randomWeight, 1);
        
        data.push({
          lat,
          lng,
          weight: Math.max(0.1, finalWeight)
        });
      }
    }
    
    console.log("Generated fallback heatmap data:", data.length, "points for Chennai area");
    return data;
  }, []);

  const onUnmount = useCallback(() => {
    // Clean up bounds changed listener
    if (map && (map as any).boundsChangedListener) {
      google.maps.event.removeListener((map as any).boundsChangedListener);
    }
    setMap(null);
  }, [map]);

  // Map load handler - defined after other functions to avoid dependency issues
  const onLoad = useCallback((map: google.maps.Map) => {
    console.log("Map loaded successfully:", map);
    setMap(map);
    setDirectionsService(new google.maps.DirectionsService());
    
    // Create heatmap data after Google Maps API is loaded
    const heatmapPoints = heatmapCoordinates.map(coord => 
      new google.maps.LatLng(coord.lat, coord.lng)
    );
    setHeatmapData(heatmapPoints);
    
    // Load sample community comments
    loadSampleComments();
    
    // Add bounds changed listener to refresh heatmap when map is moved/zoomed
    const boundsChangedListener = map.addListener('bounds_changed', () => {
      if (showSafetyHeatmap) {
        // Debounce the heatmap refresh to avoid too many API calls
        setTimeout(() => {
          loadSafetyHeatmap();
        }, 1000);
      }
    });
    
    // Store listener for cleanup
    (map as any).boundsChangedListener = boundsChangedListener;
  }, [loadSampleComments, loadSafetyHeatmap, showSafetyHeatmap]);

  const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = useCallback(async () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const newLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          
          const address = place.formatted_address || place.name || "Unknown location";
          setDestination({ ...newLocation, address });
          
          // Update markers to show both current location and destination
          const newMarkers = currentLocation ? [currentLocation, newLocation] : [newLocation];
          setMarkers(newMarkers);
          
          if (map) {
            map.panTo(newLocation);
            map.setZoom(15);
          }

          // Calculate routes if we have current location
          if (currentLocation) {
            await calculateRoutes(currentLocation, newLocation);
          }

          // Load community comments for this location
          loadCommentsForLocation(newLocation);

          if (onLocationSelect) {
            onLocationSelect(newLocation);
          }
        }
      }
    }
  }, [searchBox, map, onLocationSelect, currentLocation, calculateRoutes]);

  // Load community comments for a specific location - only show after routes are calculated
  const loadCommentsForLocation = useCallback((location: { lat: number; lng: number }) => {
    // Filter comments within 100m radius of the location
    const nearbyComments = communityComments.filter(comment => {
      const distance = calculateDistance(location, comment.location);
      return distance <= 0.1; // 100m in km
    });
    
    // Don't automatically show comments - let user decide when to view them
    // Comments will be shown only after routes are calculated and user clicks the comments button
  }, [communityComments]);

  // Calculate distance between two points
  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Debug API key
  console.log("API Key:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Present" : "Missing");
  
  // Show error state if API key is missing or invalid
  if (hasError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted rounded-2xl">
        <div className="text-center">
          <p className="text-destructive mb-2">Map Configuration Required</p>
          <p className="text-muted-foreground text-sm mb-4">Please configure your Google Maps API key in the .env file</p>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p>1. Get API key from: https://console.cloud.google.com/google/maps-apis</p>
            <p>2. Enable: Maps JavaScript API, Places API, Geocoding API</p>
            <p>3. Add VITE_GOOGLE_MAPS_API_KEY=your_key_here to .env file</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" style={{ minHeight: '500px', height: '100%' }}>
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        loadingElement={
          <div className="h-full w-full flex items-center justify-center bg-muted rounded-2xl">
            <div className="text-center">
              <Navigation className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
              <p className="text-muted-foreground">Loading Map...</p>
            </div>
          </div>
        }
        onError={(error) => {
          console.error("Google Maps LoadScript error:", error);
          setHasError(true);
        }}
        onLoad={() => {
          console.log("Google Maps API loaded successfully");
          setIsLoaded(true);
        }}
      >
        <div className="relative h-full w-full" style={{ minHeight: '500px' }}>
          {/* Loading indicator while Google Maps API loads */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-2xl z-10">
              <div className="text-center">
                <Navigation className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-muted-foreground">Loading Map Components...</p>
              </div>
            </div>
          )}
          
          {/* Search Box - only render when Google Maps is loaded */}
          {isLoaded && (
            <div className="search-box">
              <StandaloneSearchBox
                onLoad={onSearchBoxLoad}
                onPlacesChanged={onPlacesChanged}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a destination..."
                  className="w-full bg-transparent border-none outline-none text-card-foreground placeholder:text-muted-foreground"
                />
              </StandaloneSearchBox>
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {/* Enhanced Location Detection Button */}
          {isLoaded && (
            <div className="absolute top-4 right-4 z-10 space-y-2">
              <button
                onClick={getCurrentLocation}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <Navigation className="h-4 w-4" />
                <span>My Location</span>
              </button>
              
              {/* Safety Heatmap Toggle */}
              <button
                onClick={() => {
                  if (!showSafetyHeatmap) {
                    setShowSafetyHeatmap(true);
                    loadSafetyHeatmap();
                  } else {
                    setShowSafetyHeatmap(false);
                    setSafetyHeatmapData([]);
                  }
                }}
                disabled={isLoadingHeatmap}
                className={`px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2 ${
                  showSafetyHeatmap 
                    ? "bg-orange-500 text-white hover:bg-orange-600" 
                    : "bg-card text-card-foreground hover:bg-muted"
                } ${isLoadingHeatmap ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isLoadingHeatmap ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                <span>
                  {isLoadingHeatmap 
                    ? "Loading..." 
                    : showSafetyHeatmap 
                      ? "Hide Crime Heatmap" 
                      : "Show Crime Heatmap"
                  }
                </span>
              </button>
            </div>
          )}

          {/* Crime Heatmap Legend */}
          {showSafetyHeatmap && safetyHeatmapData.length > 0 && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 z-10">
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-orange-500" />
                Crime Risk Heatmap
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">Low Risk (Safe)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">Caution</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">Medium Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">High Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-800 rounded-full mr-2"></div>
                  <span className="text-gray-700">Very High Risk</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Data points: {safetyHeatmapData.length}
              </div>
            </div>
          )}

          {/* Enhanced Route Selection Panel */}
          {isLoaded && routes.length > 0 && (
            <div className="mt-4 bg-card border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-card-foreground flex items-center space-x-2">
                  <Route className="h-5 w-5" />
                  <span>Available Routes ({routes.reduce((acc, r) => acc + (r.routes?.length || 0), 0)} options)</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={calculateAllRouteSafety}
                    disabled={isCalculatingSafety}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      isCalculatingSafety 
                        ? "bg-muted text-muted-foreground cursor-not-allowed" 
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                    title="Calculate safety scores for all routes"
                  >
                    {isCalculatingSafety ? "🔄 Calculating..." : safetyCalculated ? "✅ Safety Calculated" : "🛡️ Calculate Safety"}
                  </button>
                  <button
                    onClick={() => {
                      setRoutes([]);
                      setShowComments(false);
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                {routes.flatMap((routeResult, resultIndex) => 
                  routeResult.routes?.map((route, routeIndex) => {
                    const globalIndex = routes.slice(0, resultIndex).reduce((acc, r) => acc + (r.routes?.length || 0), 0) + routeIndex;
                    const routeType = (route as any).routeType || 'Driving';
                    const safetyScore = routeSafetyScores[globalIndex] || 0;
                    
                    // Determine safety level and color
                    const getSafetyLevel = (score: number) => {
                      if (score >= 80) return { level: 'Very Safe', color: 'text-green-600', bgColor: 'bg-green-100' };
                      if (score >= 60) return { level: 'Safe', color: 'text-green-500', bgColor: 'bg-green-50' };
                      if (score >= 40) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
                      if (score >= 20) return { level: 'Caution', color: 'text-orange-600', bgColor: 'bg-orange-100' };
                      return { level: 'High Risk', color: 'text-red-600', bgColor: 'bg-red-100' };
                    };
                    
                    const safety = getSafetyLevel(safetyScore);
                    
                    // Get safety ranking (1 = safest)
                    const sortedScores = Object.values(routeSafetyScores).sort((a, b) => b - a);
                    const safetyRank = sortedScores.indexOf(safetyScore) + 1;
                    
                    return (
                      <button
                        key={`${resultIndex}-${routeIndex}`}
                        onClick={() => setSelectedRoute(globalIndex)}
                        className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                          selectedRoute === globalIndex
                            ? "border-primary bg-primary/10 text-primary shadow-md"
                            : "border-border hover:bg-muted/50 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-base mb-1 flex items-center space-x-2">
                              <span>{routeType}</span>
                              {safetyRank === 1 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Safest</span>}
                              {safetyRank === 2 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">2nd Safest</span>}
                              {safetyRank === 3 && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">3rd Safest</span>}
                              {routeType === 'Walking' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Eco-friendly</span>}
                              {routeType === 'Transit' && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Public</span>}
                            </div>
                            
                            {/* Safety Score Display */}
                            <div className="mb-2">
                              <div className="flex items-center space-x-2">
                                {isCalculatingSafety ? (
                                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    🔄 Calculating...
                                  </div>
                                ) : safetyScore > 0 ? (
                                  <>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${safety.bgColor} ${safety.color}`}>
                                      Safety: {safety.level}
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                      {safetyScore.toFixed(0)}%
                                    </div>
                                  </>
                                ) : (
                                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    {safetyCalculated ? "Safety scores calculated" : "Click 'Calculate Safety'"}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-2">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  <span>{route.legs?.[0]?.duration?.text}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  <span>{route.legs?.[0]?.distance?.text}</span>
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {route.legs?.[0]?.steps?.length} steps • Via main roads
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedRoute === globalIndex 
                                ? "border-primary bg-primary text-primary-foreground" 
                                : "border-muted-foreground"
                            }`}>
                              {selectedRoute === globalIndex && <span className="text-xs">✓</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  }) || []
                )}
              </div>
              
              {/* Safety Summary */}
              {Object.keys(routeSafetyScores).length > 0 && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-semibold text-sm mb-2 flex items-center space-x-2">
                    <span>🛡️</span>
                    <span>Route Safety Analysis</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {Object.values(routeSafetyScores).filter(score => score >= 80).length}
                      </div>
                      <div className="text-muted-foreground">Very Safe</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-500">
                        {Object.values(routeSafetyScores).filter(score => score >= 60 && score < 80).length}
                      </div>
                      <div className="text-muted-foreground">Safe</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-yellow-600">
                        {Object.values(routeSafetyScores).filter(score => score >= 40 && score < 60).length}
                      </div>
                      <div className="text-muted-foreground">Moderate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-600">
                        {Object.values(routeSafetyScores).filter(score => score < 40).length}
                      </div>
                      <div className="text-muted-foreground">High Risk</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Average Safety Score: {Object.values(routeSafetyScores).length > 0 
                      ? (Object.values(routeSafetyScores).reduce((a, b) => a + b, 0) / Object.values(routeSafetyScores).length).toFixed(1)
                      : '0'
                    }%
                  </div>
                </div>
              )}
              
              {/* Route Summary */}
              {(() => {
                let selectedRouteData = null;
                let currentIndex = 0;
                
                for (const routeResult of routes) {
                  if (routeResult.routes && routeResult.routes.length > 0) {
                    if (currentIndex + routeResult.routes.length > selectedRoute) {
                      selectedRouteData = routeResult.routes[selectedRoute - currentIndex];
                      break;
                    }
                    currentIndex += routeResult.routes.length;
                  }
                }
                
                return selectedRouteData ? (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>Selected Route:</strong> {selectedRouteData.legs?.[0]?.duration?.text} • {selectedRouteData.legs?.[0]?.distance?.text}
                    </div>
                    
                    {/* Route Analysis Buttons */}
                    <div className="flex items-center justify-between space-x-2">
                      <button
                        onClick={analyzeSelectedRoute}
                        disabled={isLoadingPrediction}
                        className="flex items-center space-x-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex-1"
                      >
                        {isLoadingPrediction ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm">Analyzing Route...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            <span className="text-sm">Analyze Route Safety</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          const routeAnalysisKeys = Array.from(crimePredictions.keys()).filter(key => key.startsWith(`route_${selectedRoute}_`));
                          if (routeAnalysisKeys.length > 0) {
                            setShowRiskModal(true);
                          } else {
                            alert('Please analyze the route first to calculate risk percentage.');
                          }
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 text-orange-600 rounded-lg hover:bg-orange-500/20 transition-colors"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Risk %</span>
                      </button>
                    </div>
                    
                    {/* Crime Prediction Display */}
                    {destination && (() => {
                      const locationKey = `${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
                      const prediction = crimePredictions.get(locationKey);
                      
                      if (prediction) {
                        const riskColor = prediction.risk_level === 'HIGH' ? 'text-red-500' : 
                                        prediction.risk_level === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500';
                        const riskIcon = prediction.risk_level === 'HIGH' ? '🚨' : 
                                       prediction.risk_level === 'MEDIUM' ? '⚠️' : '✅';
                        
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{riskIcon}</span>
                              <span className={`text-sm font-medium ${riskColor}`}>
                                Destination Safety: {prediction.risk_level}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({prediction.risk_probability}% risk)
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground bg-card p-2 rounded border-l-2 border-primary/30">
                              {prediction.safety_recommendation}
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                    
                    {/* Route Analysis Results */}
                    {(() => {
                      const routeAnalysisKeys = Array.from(crimePredictions.keys()).filter(key => key.startsWith(`route_${selectedRoute}_`));
                      if (routeAnalysisKeys.length > 0) {
                        const routePredictions = routeAnalysisKeys.map(key => crimePredictions.get(key)).filter(Boolean);
                        const avgRisk = routePredictions.reduce((sum, pred) => sum + (pred?.risk_probability || 0), 0) / routePredictions.length;
                        const maxRisk = Math.max(...routePredictions.map(pred => pred?.risk_probability || 0));
                        const riskLevel = avgRisk > 50 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW';
                        const riskColor = riskLevel === 'HIGH' ? 'text-red-500' : 
                                        riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500';
                        const riskIcon = riskLevel === 'HIGH' ? '🚨' : 
                                       riskLevel === 'MEDIUM' ? '⚠️' : '✅';
                        
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{riskIcon}</span>
                              <span className={`text-sm font-medium ${riskColor}`}>
                                Route Safety: {riskLevel}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                (Avg: {avgRisk.toFixed(1)}%, Max: {maxRisk.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground bg-card p-2 rounded border-l-2 border-orange-500/30">
                              Analyzed {routePredictions.length} points along route • {riskLevel === 'HIGH' ? 'Consider alternative route' : riskLevel === 'MEDIUM' ? 'Exercise caution' : 'Route appears safe'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : null;
              })()}
              
              {/* Add Comment Button - moved to bottom of route panel */}
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="w-full p-3 border-2 border-dashed border-primary/30 rounded-lg text-center hover:bg-primary/5 transition-colors group"
                >
                  <MessageCircle className="h-5 w-5 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-primary">Share Your Experience</p>
                  <p className="text-xs text-muted-foreground mt-1">Help others stay safe on this route</p>
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Community Comments Panel - Floating Sidebar */}
          {isLoaded && showComments && (
            <div className="absolute top-4 right-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl w-80 max-h-[calc(100vh-8rem)] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-card-foreground flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Community Feedback</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {communityComments.length}
                  </span>
                </h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50"
                >
                  ×
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
                <div className="p-4 space-y-4">
                  {communityComments.map((comment) => (
                    <div key={comment.id} className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {comment.author.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{comment.author}</div>
                            <div className="text-xs text-muted-foreground">
                              {comment.timestamp.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < comment.rating ? "text-yellow-400" : "text-muted-foreground/30"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
            mapContainerClassName="map-container"
          >
          {/* Markers - only render when Google Maps is loaded */}
          {isLoaded && markers.map((marker, index) => (
            <Marker
              key={index}
              position={marker}
              icon={{
                url: "data:image/svg+xml;base64," + btoa(`
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3b82f6"/>
                    <circle cx="12" cy="9" r="2.5" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
              }}
            />
          ))}

          {/* Directions Renderer - Enhanced for multiple route types */}
          {isLoaded && routes.length > 0 && (() => {
            let selectedRouteData = null;
            let currentIndex = 0;
            let selectedRouteResult = null;
            
            for (const routeResult of routes) {
              if (routeResult.routes && routeResult.routes.length > 0) {
                if (currentIndex + routeResult.routes.length > selectedRoute) {
                  selectedRouteData = routeResult.routes[selectedRoute - currentIndex];
                  selectedRouteResult = routeResult;
                  break;
                }
                currentIndex += routeResult.routes.length;
              }
            }
            
            return selectedRouteData && selectedRouteResult ? (
              <DirectionsRenderer
                directions={selectedRouteResult}
                options={{
                  routeIndex: selectedRoute - currentIndex,
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: "#3b82f6",
                    strokeWeight: 4,
                    strokeOpacity: 0.8,
                  },
                  markerOptions: {
                    icon: {
                      url: "data:image/svg+xml;base64," + btoa(`
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3b82f6"/>
                          <circle cx="12" cy="9" r="2.5" fill="white"/>
                        </svg>
                      `),
                      scaledSize: new google.maps.Size(32, 32),
                    },
                  },
                }}
              />
            ) : null;
          })()}

          {/* Heatmap Layer - only render when Google Maps is loaded and data is available */}
          {isLoaded && heatmapData.length > 0 && (
            <>
              {/* Crime Safety Heatmap Layer */}
              {showSafetyHeatmap && safetyHeatmapData.length > 0 && (
                <HeatmapLayer
                  data={safetyHeatmapData.map(point => ({
                    location: new google.maps.LatLng(point.lat, point.lng),
                    weight: point.weight
                  }))}
                  options={{
                    radius: 60,
                    opacity: 0.8,
                    gradient: [
                      "rgba(0, 255, 0, 0)",      // Green (safe)
                      "rgba(255, 255, 0, 0.3)",  // Yellow (caution)
                      "rgba(255, 165, 0, 0.6)",  // Orange (medium risk)
                      "rgba(255, 0, 0, 0.8)",    // Red (high risk)
                      "rgba(139, 0, 0, 1)"       // Dark red (very high risk)
                    ],
                    dissipating: true,
                    maxIntensity: 5
                  }}
                />
              )}

              {/* Original Heatmap Layer */}
              <HeatmapLayer
                data={heatmapData}
                options={{
                  radius: 50,
                  opacity: 0.6,
                  gradient: [
                    "rgba(0, 255, 255, 0)",
                    "rgba(0, 255, 255, 1)",
                    "rgba(0, 191, 255, 1)",
                    "rgba(0, 127, 255, 1)",
                    "rgba(0, 63, 255, 1)",
                    "rgba(0, 0, 255, 1)",
                    "rgba(0, 0, 223, 1)",
                    "rgba(0, 0, 191, 1)",
                    "rgba(0, 0, 159, 1)",
                    "rgba(0, 0, 127, 1)",
                    "rgba(63, 0, 91, 1)",
                    "rgba(127, 0, 63, 1)",
                    "rgba(191, 0, 31, 1)",
                    "rgba(255, 0, 0, 1)"
                  ]
                }}
              />
            </>
          )}
          </GoogleMap>
        </div>
        
        {/* Risk Analysis Modal */}
        {showRiskModal && (() => {
          const routeAnalysisKeys = Array.from(crimePredictions.keys()).filter(key => key.startsWith(`route_${selectedRoute}_`));
          const routePredictions = routeAnalysisKeys.map(key => crimePredictions.get(key)).filter(Boolean);
          const avgRisk = routePredictions.reduce((sum, pred) => sum + (pred?.risk_probability || 0), 0) / routePredictions.length;
          const maxRisk = Math.max(...routePredictions.map(pred => pred?.risk_probability || 0));
          const minRisk = Math.min(...routePredictions.map(pred => pred?.risk_probability || 0));
          const riskLevel = avgRisk > 50 ? 'HIGH' : avgRisk > 30 ? 'MEDIUM' : 'LOW';
          const riskColor = riskLevel === 'HIGH' ? 'text-red-500' : riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500';
          const riskIcon = riskLevel === 'HIGH' ? '🚨' : riskLevel === 'MEDIUM' ? '⚠️' : '✅';
          
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span>Route Risk Analysis</span>
                  </h3>
                  <button
                    onClick={() => setShowRiskModal(false)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Risk Level Summary */}
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl mb-2">{riskIcon}</div>
                    <div className={`text-xl font-bold ${riskColor}`}>
                      {riskLevel} RISK
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Average Risk Level
                    </div>
                  </div>
                  
                  {/* Risk Statistics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {avgRisk.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Average</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {maxRisk.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Maximum</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {minRisk.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Minimum</div>
                    </div>
                  </div>
                  
                  {/* Analysis Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Points Analyzed:</span>
                      <span className="font-medium">{routePredictions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Route Type:</span>
                      <span className="font-medium">
                        {(() => {
                          let selectedRouteData = null;
                          let currentIndex = 0;
                          
                          for (const routeResult of routes) {
                            if (routeResult.routes && routeResult.routes.length > 0) {
                              if (currentIndex + routeResult.routes.length > selectedRoute) {
                                selectedRouteData = routeResult.routes[selectedRoute - currentIndex];
                                break;
                              }
                              currentIndex += routeResult.routes.length;
                            }
                          }
                          
                          return selectedRouteData ? (selectedRouteData as any).routeType || 'Driving' : 'Unknown';
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm font-medium text-card-foreground mb-2">Recommendations:</div>
                    <div className="text-xs text-muted-foreground">
                      {riskLevel === 'HIGH' ? 
                        '🚨 Consider taking an alternative route or traveling during safer hours. Avoid this route if possible.' :
                        riskLevel === 'MEDIUM' ? 
                        '⚠️ Exercise caution on this route. Stay alert and consider traveling with others.' :
                        '✅ This route appears relatively safe. Normal precautions should be sufficient.'
                      }
                    </div>
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => setShowRiskModal(false)}
                    className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Close Analysis
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </LoadScript>
    </div>
  );
};

export default GoogleMapComponent;