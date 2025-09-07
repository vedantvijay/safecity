import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, StandaloneSearchBox, HeatmapLayer, DirectionsRenderer } from "@react-google-maps/api";
import { MapPin, Navigation, Route, MapPinIcon, MessageCircle, Shield, AlertTriangle, Eye } from "lucide-react";
import { crimePredictionService, CrimePrediction, LocationData, HeatmapPoint } from "../services/crimePredictionService";

const libraries: ("places" | "visualization")[] = ["places", "visualization"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "500px",
};

const center = {
  lat: 13.0827, // Chennai coordinates
  lng: 80.2707,
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

interface GoogleMapComponentProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

const GoogleMapComponent = ({ onLocationSelect }: GoogleMapComponentProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState([center]);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [routes, setRoutes] = useState<google.maps.DirectionsResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  
  // Crime prediction states
  const [crimePredictions, setCrimePredictions] = useState<Map<string, CrimePrediction>>(new Map());
  const [crimeHeatmapData, setCrimeHeatmapData] = useState<HeatmapPoint[]>([]);
  const [showCrimeHeatmap, setShowCrimeHeatmap] = useState(false);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState<any[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get crime prediction for a location
  const getCrimePrediction = useCallback(async (location: { lat: number; lng: number }) => {
    setIsLoadingPrediction(true);
    try {
      console.log('Getting crime prediction for location:', location);
      
      const locationData = crimePredictionService.convertLatLngToLocationData(
        new google.maps.LatLng(location.lat, location.lng)
      );
      
      console.log('Location data for prediction:', locationData);
      
      const prediction = await crimePredictionService.getCrimePrediction(locationData);
      
      console.log('Crime prediction result:', prediction);
      
      const locationKey = `${location.lat},${location.lng}`;
      setCrimePredictions(prev => new Map(prev).set(locationKey, prediction));
      
    } catch (error) {
      console.error('Error getting crime prediction:', error);
    } finally {
      setIsLoadingPrediction(false);
    }
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log("Map loaded successfully:", map);
    setMap(map);
    setDirectionsService(new google.maps.DirectionsService());
    
    // Load crime heatmap data when map loads
    loadCrimeHeatmap();
  }, []);

  // Load crime heatmap data
  const loadCrimeHeatmap = useCallback(async () => {
    if (!map) return;
    
    try {
      const bounds = map.getBounds();
      if (!bounds) return;
      
      const heatmapData = await crimePredictionService.getCrimeHeatmap(bounds);
      setCrimeHeatmapData(heatmapData);
    } catch (error) {
      console.error("Error loading crime heatmap:", error);
    }
  }, [map]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    console.log('📍 Getting current location...');
    
    if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        console.log('✅ Current location obtained:', location);
        setCurrentLocation(location);
        setMarkers([location]);
        
        if (map) {
          map.panTo(location);
          map.setZoom(15);
          console.log('🗺️ Map updated to current location');
        }
        
        // Get crime prediction for current location
        console.log('🚨 Starting crime prediction for current location...');
        getCrimePrediction(location);
      },
      (error) => {
        console.error("❌ Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [map, getCrimePrediction]);

  // Calculate routes with crime analysis
  const calculateRoutes = useCallback(async (origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) => {
    if (!directionsService) {
      console.log('Directions service not available');
      return;
    }

    console.log('Calculating routes from:', origin, 'to:', dest);

    const requests = [
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        avoidHighways: false,
        avoidTolls: false,
      },
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        avoidHighways: true,
        avoidTolls: false,
      },
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: false,
      },
    ];

    try {
      console.log('Sending route requests...');
      const results = await Promise.allSettled(requests.map(request => directionsService.route(request)));
      const successfulResults = results.filter((result): result is PromiseFulfilledResult<google.maps.DirectionsResult> => result.status === 'fulfilled').map(result => result.value);
      
      console.log('Route calculation results:', successfulResults.length, 'successful');
      
      if (successfulResults.length > 0) {
        const allRoutes: google.maps.DirectionsResult[] = [];
        successfulResults.forEach((result, index) => {
          if (result.routes && result.routes.length > 0) {
            const routeType = index === 0 ? 'Fastest' : index === 1 ? 'Avoid Highways' : 'Walking';
            result.routes.forEach(route => { 
              (route as any).routeType = routeType; 
              (route as any).routeIndex = allRoutes.length; 
            });
            allRoutes.push(result);
          }
        });

        console.log('Setting routes:', allRoutes.length);
        setRoutes(allRoutes);
        setSelectedRoute(0);
        
        // Analyze route for crime risk
        if (allRoutes.length > 0) {
          await analyzeRouteForCrime(allRoutes[0]);
        }
        
        // Get crime prediction for destination
        if (dest) {
          console.log('Getting crime prediction for destination...');
          await getCrimePrediction(dest);
        }
      } else {
        console.log('No successful route calculations');
      }
    } catch (error) {
      console.error("Error calculating routes:", error);
    }
  }, [directionsService, getCrimePrediction]);

  // Analyze route for crime risk
  const analyzeRouteForCrime = useCallback(async (routeResult: google.maps.DirectionsResult) => {
    if (!routeResult.routes || routeResult.routes.length === 0) return;
    
    const route = routeResult.routes[0];
    if (!route.legs || route.legs.length === 0) return;
    
    // Sample points along the route for analysis
    const routePoints: LocationData[] = [];
    const leg = route.legs[0];
    
    if (leg.steps) {
      leg.steps.forEach((step, index) => {
        if (index % 3 === 0 && step.start_location) { // Sample every 3rd step
          routePoints.push({
            latitude: step.start_location.lat(),
            longitude: step.start_location.lng(),
            hour: new Date().getHours(),
            month: new Date().getMonth() + 1,
          });
        }
      });
    }
    
    try {
      const analysis = await crimePredictionService.analyzeRoute(routePoints);
      setRouteAnalysis(analysis);
    } catch (error) {
      console.error("Error analyzing route:", error);
    }
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = useCallback(() => {
    console.log('🔍 Place search triggered');
    
    if (!searchBox) {
      console.log('❌ Search box not available');
      return;
    }

    const places = searchBox.getPlaces();
    console.log('📍 Places found:', places.length);
    
    if (places && places.length > 0) {
      const place = places[0];
      const location = {
        lat: place.geometry?.location?.lat() || 0,
        lng: place.geometry?.location?.lng() || 0,
        address: place.formatted_address || "",
      };

      console.log('🎯 Selected destination:', location);
      setDestination(location);
      setMarkers([location]);

      if (map) {
        map.panTo(location);
        map.setZoom(15);
        console.log('🗺️ Map updated to destination');
      }

      // Get crime prediction for destination
      console.log('🚨 Starting crime prediction for destination...');
      getCrimePrediction(location);

      // Calculate routes if current location is available
      if (currentLocation) {
        console.log('🛣️ Calculating routes from current location to destination...');
        calculateRoutes(currentLocation, location);
      } else {
        console.log('⚠️ No current location available for route calculation');
      }

      if (onLocationSelect) {
        onLocationSelect(location);
      }
    } else {
      console.log('❌ No places found');
    }
  }, [searchBox, map, currentLocation, calculateRoutes, getCrimePrediction, onLocationSelect]);

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
          
          {/* Search Box */}
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

          {/* Control Buttons */}
          {isLoaded && (
            <div className="absolute top-4 right-4 z-10 space-y-2">
              <button
                onClick={getCurrentLocation}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <Navigation className="h-4 w-4" />
                <span>My Location</span>
              </button>
              
              {/* Crime Heatmap Toggle */}
              <button
                onClick={() => {
                  setShowCrimeHeatmap(!showCrimeHeatmap);
                  if (!showCrimeHeatmap) {
                    loadCrimeHeatmap();
                  }
                }}
                className={`px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2 ${
                  showCrimeHeatmap 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "bg-card text-card-foreground hover:bg-muted"
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>{showCrimeHeatmap ? "Hide Crime" : "Show Crime"}</span>
              </button>
            </div>
          )}

          {/* Google Map */}
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
          >
            {/* Crime Heatmap Layer */}
            {showCrimeHeatmap && crimeHeatmapData.length > 0 && (
              <HeatmapLayer
                data={crimeHeatmapData.map(point => ({
                  location: new google.maps.LatLng(point.lat, point.lng),
                  weight: point.weight
                }))}
                options={{
                  radius: 30,
                  opacity: 0.7,
                  gradient: [
                    "rgba(16, 185, 129, 0)",      // Green (safe)
                    "rgba(245, 158, 11, 0.5)",    // Yellow (medium)
                    "rgba(239, 68, 68, 1)",       // Red (danger)
                  ],
                }}
              />
            )}

            {/* Crime Risk Markers */}
            {Array.from(crimePredictions.entries()).map(([locationKey, prediction]) => {
              const [lat, lng] = locationKey.split(',').map(Number);
              const riskColor = crimePredictionService.getRiskColor(prediction.risk_level);
              const riskIcon = crimePredictionService.getRiskIcon(prediction.risk_level);
              
              return (
                <Marker
                  key={locationKey}
                  position={{ lat, lng }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: riskColor,
                    fillOpacity: 0.8,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }}
                  title={`${riskIcon} ${prediction.risk_level} Risk (${prediction.risk_probability}%)`}
                />
              );
            })}

            {/* Route Directions */}
            {routes.length > 0 && (() => {
              let currentIndex = 0;
              for (const routeResult of routes) {
                if (selectedRoute >= currentIndex && selectedRoute < currentIndex + routeResult.routes.length) {
                  return (
                    <DirectionsRenderer
                      key={`route-${selectedRoute}`}
                      directions={routeResult}
                      options={{
                        routeIndex: selectedRoute - currentIndex,
                        suppressMarkers: false,
                        polylineOptions: {
                          strokeColor: "#3b82f6",
                          strokeWeight: 4,
                          strokeOpacity: 0.8,
                        },
                      }}
                    />
                  );
                }
                currentIndex += routeResult.routes.length;
              }
              return null;
            })()}
          </GoogleMap>
                    const globalIndex = routes.slice(0, resultIndex).reduce((acc, r) => acc + (r.routes?.length || 0), 0) + routeIndex;
                    const routeType = (route as any).routeType || 'Driving';
                    
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
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-sm">{routeType}</span>
                              {routeType === 'Fastest' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Fastest
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>Duration: {route.legs?.[0]?.duration?.text}</div>
                              <div>Distance: {route.legs?.[0]?.distance?.text}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Route Summary with Crime Analysis */}
              {(() => {
                let currentIndex = 0;
                for (const routeResult of routes) {
                  if (selectedRoute >= currentIndex && selectedRoute < currentIndex + routeResult.routes.length) {
                    const selectedRouteData = routeResult.routes[selectedRoute - currentIndex];
                    return (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
                        <div className="text-sm text-muted-foreground">
                          <strong>Selected Route:</strong> {selectedRouteData.legs?.[0]?.duration?.text} • {selectedRouteData.legs?.[0]?.distance?.text}
                        </div>
                        
                        {/* Crime Analysis for Route */}
                        {routeAnalysis.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-card-foreground">Route Safety Analysis:</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {routeAnalysis.slice(0, 4).map((analysis, index) => (
                                <div key={index} className="text-xs bg-card p-2 rounded border">
                                  <div className="flex items-center space-x-1">
                                    <span>{crimePredictionService.getRiskIcon(analysis.prediction.risk_level)}</span>
                                    <span className={`font-medium ${
                                      analysis.prediction.risk_level === 'HIGH' ? 'text-red-500' :
                                      analysis.prediction.risk_level === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                                    }`}>
                                      {analysis.prediction.risk_level}
                                    </span>
                                    <span className="text-muted-foreground">
                                      ({analysis.prediction.risk_probability}%)
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Destination Crime Prediction */}
                        {destination && (() => {
                          const locationKey = `${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
                          const prediction = crimePredictions.get(locationKey);
                          
                          if (isLoadingPrediction) {
                            return (
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                <span>Analyzing destination safety...</span>
                              </div>
                            );
                          }
                          
                          if (prediction) {
                            const riskColor = crimePredictionService.getRiskColor(prediction.risk_level);
                            const riskIcon = crimePredictionService.getRiskIcon(prediction.risk_level);
                            
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{riskIcon}</span>
                                  <span className={`text-sm font-medium`} style={{ color: riskColor }}>
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
                      </div>
                    );
                  }
                  currentIndex += routeResult.routes.length;
                }
                return null;
              })()}
            </div>
          )}
          </GoogleMap>
        </div>
      </LoadScript>

      {/* Route Selection Panel - Below Map */}
      {isLoaded && routes.length > 0 && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Route Options</h3>
            <div className="flex items-center space-x-2">
              <Route className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{routes.length} routes found</span>
              <button 
                onClick={() => setRoutes([])}
                className="ml-4 p-1 hover:bg-muted rounded-full transition-colors"
                title="Close routes"
              >
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {routes.flatMap((routeResult, resultIndex) => 
              routeResult.routes?.map((route, routeIndex) => {
                const globalIndex = routes.slice(0, resultIndex).reduce((acc, r) => acc + (r.routes?.length || 0), 0) + routeIndex;
                const routeType = (route as any).routeType || 'Driving';
                
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
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-sm">{routeType}</span>
                          {routeType === 'Fastest' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Fastest
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Duration: {route.legs?.[0]?.duration?.text}</div>
                          <div>Distance: {route.legs?.[0]?.distance?.text}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Route Summary with Crime Analysis */}
          {(() => {
            let currentIndex = 0;
            for (const routeResult of routes) {
              if (selectedRoute >= currentIndex && selectedRoute < currentIndex + routeResult.routes.length) {
                const selectedRouteData = routeResult.routes[selectedRoute - currentIndex];
                return (
                  <div key="route-summary" className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>Selected Route:</strong> {selectedRouteData.legs?.[0]?.duration?.text} • {selectedRouteData.legs?.[0]?.distance?.text}
                    </div>
                    
                    {/* Crime Analysis for Selected Route */}
                    {destination && (() => {
                      const locationKey = `${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
                      const prediction = crimePredictions[locationKey];
                      
                      if (!prediction) {
                        return (
                          <div className="text-xs text-muted-foreground">
                            Analyzing route safety...
                          </div>
                        );
                      }
                      
                      if (prediction) {
                        const riskColor = crimePredictionService.getRiskColor(prediction.risk_level);
                        const riskIcon = crimePredictionService.getRiskIcon(prediction.risk_level);
                        
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{riskIcon}</span>
                              <span className={`text-sm font-medium`} style={{ color: riskColor }}>
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
                  </div>
                );
              }
              currentIndex += routeResult.routes.length;
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;
