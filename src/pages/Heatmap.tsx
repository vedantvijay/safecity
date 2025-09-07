import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, LoadScript, HeatmapLayer, Marker } from '@react-google-maps/api';
import Papa from 'papaparse';
import { Shield, MapPin, AlertTriangle, Eye, EyeOff, Navigation, Locate } from 'lucide-react';

// TypeScript interfaces for strong typing
interface ParsedCrimeData {
  lat: number;
  lng: number;
  weight: number;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

// Map configuration
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px',
};

const chennaiCenter = {
  lat: 13.0827,
  lng: 80.2707,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
};

const libraries: ("visualization")[] = ["visualization"];

// Severity to weight mapping
const severityToWeight = {
  'low': 1,
  'medium': 3,
  'high': 5,
  'Low': 1,
  'Medium': 3,
  'High': 5,
};

// Error Boundary Component
class HeatmapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Heatmap Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading the heatmap. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const HeatmapPage: React.FC = () => {
  const [crimeData, setCrimeData] = useState<ParsedCrimeData[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(chennaiCenter);

  // Filter out points over water/outside Chennai land area
  const isOnLand = useCallback((lat: number, lng: number): boolean => {
    // Chennai land boundaries (tighter to exclude ocean)
    const chennaiBounds = {
      north: 13.20,   // North boundary (Madhavaram)
      south: 12.90,   // South boundary (Chennai South)
      east: 80.30,    // East boundary (well before ocean)
      west: 80.15     // West boundary (Chennai West)
    };
    
    // Check if point is within Chennai land boundaries
    return lat >= chennaiBounds.south && 
           lat <= chennaiBounds.north && 
           lng >= chennaiBounds.west && 
           lng <= chennaiBounds.east;
  }, []);

  // Generate fallback data for Chennai area
  const generateFallbackData = useCallback((): ParsedCrimeData[] => {
    const fallbackData: ParsedCrimeData[] = [];
    
    // Generate realistic crime data around Chennai (FIXED POINTS - no randomness)
    const chennaiAreas = [
      { lat: 13.0827, lng: 80.2707, weight: 5 }, // Chennai Central
      { lat: 13.0067, lng: 80.2206, weight: 4 }, // Chennai South
      { lat: 13.1581, lng: 80.3008, weight: 3 }, // Chennai North
      { lat: 12.9716, lng: 80.2206, weight: 4 }, // Chennai East
      { lat: 13.0827, lng: 80.1706, weight: 2 }, // Chennai West
      // Add more fixed points around Chennai
      { lat: 13.0400, lng: 80.2400, weight: 3 }, // Central-South
      { lat: 13.1200, lng: 80.2500, weight: 2 }, // Central-North
      { lat: 13.0600, lng: 80.2000, weight: 4 }, // West-Central
      { lat: 13.0200, lng: 80.2800, weight: 3 }, // East-South
      { lat: 13.1000, lng: 80.2900, weight: 2 }, // East-North
      { lat: 13.0800, lng: 80.2300, weight: 4 }, // Central-West
      { lat: 13.0500, lng: 80.2600, weight: 3 }, // Central-East
      { lat: 13.1300, lng: 80.2200, weight: 2 }, // North-West
      { lat: 13.0900, lng: 80.3000, weight: 3 }, // North-East
      { lat: 13.0100, lng: 80.2100, weight: 4 }, // South-West
      { lat: 12.9900, lng: 80.2500, weight: 3 }, // South-East
    ];

    // Add main areas
    chennaiAreas.forEach(area => {
      if (isOnLand(area.lat, area.lng)) {
        fallbackData.push(area);
      }
    });

    return fallbackData;
  }, [isOnLand]);

  // Load and parse CSV data
  const loadCrimeData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting to load CSV data...');

      // Try to fetch CSV file
      try {
        const response = await fetch('/chennai_crime_dataset.csv');
        console.log('Fetch response:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        console.log('CSV text length:', csvText.length);

        // Parse CSV with PapaParse
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => {
            return header.replace(/\r?\n/g, '').trim();
          },
          complete: (results) => {
            try {
              console.log('PapaParse results:', results);
              console.log('Parsed rows:', results.data.length);
              
              const parsedData: ParsedCrimeData[] = [];
              
              // Process each row
              results.data.forEach((row: any, index: number) => {
                // Skip rows that don't have proper data structure
                if (!row || typeof row !== 'object') {
                  return;
                }

                // Skip the first row if it's a description
                if (index === 0 && row.latitude && typeof row.latitude === 'string' && 
                    row.latitude.includes('chennai_crime_dataset')) {
                  console.log('Skipping description row');
                  return;
                }

                const latitude = parseFloat(row.latitude);
                const longitude = parseFloat(row.longitude);
                const severity = row.severity_level || row.severity || 'medium';

                // Validate coordinates
                if (!isNaN(latitude) && !isNaN(longitude) && 
                    latitude >= -90 && latitude <= 90 && 
                    longitude >= -180 && longitude <= 180) {
                  
                  // Convert severity to weight
                  const weight = severityToWeight[severity as keyof typeof severityToWeight] || 3;
                  
                  parsedData.push({
                    lat: latitude,
                    lng: longitude,
                    weight: weight,
                  });
                }
              });

              console.log(`Successfully loaded ${parsedData.length} crime points from CSV`);
              
              // Check how many points are on land
              const landPoints = parsedData.filter(point => isOnLand(point.lat, point.lng));
              console.log(`CSV data: ${parsedData.length} total, ${landPoints.length} on land`);
              
              if (parsedData.length === 0) {
                console.log('No valid CSV data found, using fallback');
                setCrimeData(generateFallbackData());
              } else {
                setCrimeData(parsedData);
              }
            } catch (parseError) {
              console.error('Error parsing CSV data:', parseError);
              console.log('Using fallback data due to parse error');
              setCrimeData(generateFallbackData());
            }
          },
          error: (error) => {
            console.error('PapaParse error:', error);
            console.log('Using fallback data due to PapaParse error');
            setCrimeData(generateFallbackData());
          }
        });

      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        console.log('Using fallback data due to fetch error');
        setCrimeData(generateFallbackData());
      }

    } catch (err) {
      console.error('Error loading crime data:', err);
      console.log('Using fallback data due to general error');
      setCrimeData(generateFallbackData());
    } finally {
      setIsLoading(false);
    }
  }, [generateFallbackData]);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setUserLocation(location);
        setMapCenter(location);
        setIsGettingLocation(false);
        console.log('User location obtained:', location);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadCrimeData();
  }, [loadCrimeData]);

  // Handle map load
  const onMapLoad = useCallback(() => {
    setIsLoaded(true);
    console.log('Google Maps loaded successfully');
  }, []);

  // Toggle heatmap visibility
  const toggleHeatmap = useCallback(() => {
    setShowHeatmap(prev => !prev);
  }, []);

  // Convert crime data to Google Maps format
  const heatmapData = useMemo(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) {
      console.log('Heatmap data: Google Maps not loaded yet');
      return [];
    }
    
    // Filter out points over water/outside land
    const landPoints = crimeData.filter(point => {
      const isLand = isOnLand(point.lat, point.lng);
      if (!isLand) {
        console.log(`Filtered out ocean point: ${point.lat}, ${point.lng}`);
      }
      return isLand;
    });
    console.log(`Filtered ${crimeData.length} points to ${landPoints.length} land points`);
    
    const data = landPoints.map(point => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));
    console.log('Heatmap data generated:', data.length, 'points');
    console.log('Sample heatmap point:', data[0]);
    return data;
  }, [crimeData, isLoaded, isOnLand]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Chennai Crime Heatmap
                </h1>
                <p className="text-muted-foreground">
                  Real-time crime data visualization
                </p>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center space-x-3">
              {/* Location Button */}
              <button
                onClick={getUserLocation}
                disabled={isGettingLocation}
                className={`px-4 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2 ${
                  userLocation 
                    ? "bg-blue-500 text-white hover:bg-blue-600" 
                    : "bg-card text-card-foreground hover:bg-muted border border-border"
                } ${isGettingLocation ? "opacity-50 cursor-not-allowed" : ""}`}
                title={userLocation ? "Center on your location" : "Get your current location"}
              >
                {isGettingLocation ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                ) : (
                  <Locate className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {userLocation ? "My Location" : "Get Location"}
                </span>
              </button>

              {/* Toggle Button */}
              <button
                onClick={toggleHeatmap}
                disabled={isLoading || !isLoaded}
                className={`px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2 ${
                  showHeatmap 
                    ? "bg-orange-500 text-white hover:bg-orange-600" 
                    : "bg-card text-card-foreground hover:bg-muted border border-border"
                } ${isLoading || !isLoaded ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {showHeatmap ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {showHeatmap ? "Hide Safety Heatmap" : "Show Safety Heatmap"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Location Error */}
        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <strong>Location Error:</strong> {locationError}
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 mb-4">
          <div className="text-sm">
            <strong>Debug Info:</strong><br/>
            Loading: {isLoading ? 'Yes' : 'No'}<br/>
            Data Points: {crimeData.length}<br/>
            Map Loaded: {isLoaded ? 'Yes' : 'No'}<br/>
            Show Heatmap: {showHeatmap ? 'Yes' : 'No'}<br/>
            Heatmap Data: {heatmapData.length} points<br/>
            User Location: {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'None'}<br/>
            Map Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}<br/>
            Google Maps Available: {typeof google !== 'undefined' ? 'Yes' : 'No'}<br/>
            Google Maps API: {typeof google !== 'undefined' && google.maps ? 'Yes' : 'No'}<br/>
            Sample Data: {crimeData.length > 0 ? `${crimeData[0].lat}, ${crimeData[0].lng} (weight: ${crimeData[0].weight})` : 'None'}<br/>
            Land Points: {crimeData.filter(point => isOnLand(point.lat, point.lng)).length} / {crimeData.length}<br/>
            Chennai Bounds: N:13.20, S:12.90, E:80.30, W:80.15
          </div>
        </div>
      <div className="bg-muted/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Loaded {crimeData.length} crime points
                </span>
              </div>
              
              {showHeatmap && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    Heatmap Active
                  </span>
                </div>
              )}
            </div>

            {/* Legend */}
            {showHeatmap && (
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Low Risk</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-muted-foreground">Medium Risk</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-muted-foreground">High Risk</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading crime data...</p>
          </div>
        </div>
      )}

      {/* Error State - Only show if we have no data at all */}
      {error && crimeData.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={loadCrimeData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      {!isLoading && crimeData.length > 0 && (
        <div className="relative h-[calc(100vh-200px)] min-h-[500px]">
          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
            libraries={libraries}
            onLoad={() => console.log('Google Maps API loaded')}
            onError={(error) => {
              console.error('Google Maps LoadScript error:', error);
              setError('Failed to load Google Maps');
            }}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={userLocation ? 15 : 12}
              onLoad={onMapLoad}
              options={mapOptions}
            >
              {/* Heatmap Layer */}
              {isLoaded && showHeatmap && heatmapData.length > 0 && (
                <>
                  {console.log('Rendering HeatmapLayer with', heatmapData.length, 'points')}
                  <HeatmapLayer
                    data={heatmapData}
                    options={{
                      radius: 30,
                      opacity: 0.6,
                      gradient: [
                        'rgba(0, 255, 0, 0)',      // Green (low risk)
                        'rgba(255, 255, 0, 0.3)',  // Yellow (medium risk)
                        'rgba(255, 165, 0, 0.6)',  // Orange (high risk)
                        'rgba(255, 0, 0, 0.8)',    // Red (very high risk)
                        'rgba(139, 0, 0, 1)'       // Dark red (extreme risk)
                      ],
                      dissipating: true,
                      maxIntensity: 5
                    }}
                  />
                </>
              )}

              {/* User Location Marker */}
              {isLoaded && userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="#FFFFFF" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
                        <circle cx="12" cy="12" r="1" fill="#4285F4"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(24, 24),
                    anchor: new google.maps.Point(12, 12)
                  }}
                  title="Your Location"
                  animation={google.maps.Animation.DROP}
                />
              )}
            </GoogleMap>
          </LoadScript>

          {/* Map Overlay Info */}
          {isLoaded && (
            <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-border">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  Chennai Crime Data
                </h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>📍 Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}</div>
                  <div>📊 Points: {crimeData.length}</div>
                  <div>🎯 Status: {showHeatmap ? 'Active' : 'Hidden'}</div>
                  {userLocation && (
                    <div className="flex items-center space-x-1">
                      <Navigation className="h-3 w-3 text-blue-500" />
                      <span>Your Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback for when map doesn't load */}
      {!isLoading && crimeData.length > 0 && !isLoaded && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Google Maps...</p>
            <p className="text-xs text-muted-foreground mt-2">
              If this takes too long, check your internet connection and Google Maps API key
            </p>
          </div>
        </div>
      )}

      {/* Mobile Responsive Footer */}
      <div className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Data source: Chennai Crime Dataset | Powered by Google Maps
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Radius: 30px</span>
              <span>Opacity: 0.6</span>
              <span>Max Intensity: 5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with error boundary
const HeatmapWithErrorBoundary: React.FC = () => {
  return (
    <HeatmapErrorBoundary>
      <HeatmapPage />
    </HeatmapErrorBoundary>
  );
};

export default HeatmapWithErrorBoundary;
