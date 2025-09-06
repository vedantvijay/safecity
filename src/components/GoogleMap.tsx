import { useState, useCallback, useRef } from "react";
import { GoogleMap, LoadScript, Marker, StandaloneSearchBox, HeatmapLayer } from "@react-google-maps/api";
import { MapPin, Navigation } from "lucide-react";

const libraries: ("places" | "visualization")[] = ["places", "visualization"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
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

// Placeholder heatmap data
const heatmapData = [
  new google.maps.LatLng(28.6139, 77.2090),
  new google.maps.LatLng(28.6149, 77.2100),
  new google.maps.LatLng(28.6129, 77.2080),
  new google.maps.LatLng(28.6159, 77.2110),
  new google.maps.LatLng(28.6119, 77.2070),
];

interface GoogleMapComponentProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

const GoogleMapComponent = ({ onLocationSelect }: GoogleMapComponentProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState([center]);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = useCallback(() => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const newLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          
          setMarkers([newLocation]);
          
          if (map) {
            map.panTo(newLocation);
            map.setZoom(15);
          }

          if (onLocationSelect) {
            onLocationSelect(newLocation);
          }
        }
      }
    }
  }, [searchBox, map, onLocationSelect]);

  return (
    <LoadScript
      googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY"
      libraries={libraries}
      loadingElement={
        <div className="h-full w-full flex items-center justify-center bg-muted rounded-2xl">
          <div className="text-center">
            <Navigation className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading Map...</p>
          </div>
        </div>
      }
    >
      <div className="relative h-full w-full">
        {/* Search Box */}
        <div className="search-box">
          <StandaloneSearchBox
            onLoad={onSearchBoxLoad}
            onPlacesChanged={onPlacesChanged}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location..."
              className="w-full bg-transparent border-none outline-none text-card-foreground placeholder:text-muted-foreground"
            />
          </StandaloneSearchBox>
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

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
          {/* Markers */}
          {markers.map((marker, index) => (
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

          {/* Heatmap Layer */}
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
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default GoogleMapComponent;