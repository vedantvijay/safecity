# 🚀 CPAA ML Model Integration Guide

## 📋 **Integration Overview**

This guide provides the complete integration between your CPAA ML model (`cpaa.py`) and Google Maps frontend for real-time crime prediction and visualization.

## 🔧 **Backend Setup**

### 1. Install Dependencies
```bash
cd backend
source crime_analysis_env/bin/activate
pip install flask flask-cors joblib
```

### 2. Start the Crime Prediction API
```bash
python3 crime_api.py
```
**API runs on:** `http://localhost:8000`

### 3. API Endpoints Available:
- `POST /api/crime/predict` - Single location prediction
- `POST /api/crime/heatmap` - Heatmap data for map bounds
- `POST /api/crime/route-analysis` - Route safety analysis
- `GET /api/health` - API health check

## 🎨 **Frontend Integration**

### 1. Replace Your Existing GoogleMap Component
```typescript
// In your MapPage.tsx or wherever you use GoogleMap
import CrimeMap from '../components/CrimeMap';

// Replace <GoogleMapComponent /> with:
<CrimeMap onLocationSelect={(location) => console.log('Selected:', location)} />
```

### 2. Environment Variables
Ensure your `.env` file has:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. API Configuration
The service automatically detects environment:
- **Development**: `http://localhost:8000/api`
- **Production**: Update `baseUrl` in `crimePredictionService.ts`

## 🎯 **Features Implemented**

### ✅ **Crime Hotspots Display**
- **Color-coded markers** based on risk level
- **Real-time predictions** for any location
- **Risk indicators**: 🚨 HIGH, ⚠️ MEDIUM, ✅ LOW

### ✅ **Crime Heatmap Overlay**
- **Visual heatmap** showing crime density
- **Toggle button** to show/hide crime zones
- **Color gradient**: Green (safe) → Yellow (medium) → Red (danger)

### ✅ **Route Analysis**
- **Multi-route options** with safety analysis
- **Real-time crime prediction** along routes
- **Safety recommendations** for each route segment

### ✅ **Dynamic Predictions**
- **Current location** analysis
- **Destination** crime risk assessment
- **Time-based** predictions (hour, day, month)

## 🚀 **How to Test**

### 1. Start Backend API
```bash
cd backend
source crime_analysis_env/bin/activate
python3 crime_api.py
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Features
1. **Open** `http://localhost:8081/map`
2. **Click** "My Location" to get current position
3. **Search** for a destination
4. **Toggle** "Show Crime" to see heatmap
5. **Select** different routes to see safety analysis
6. **View** crime predictions in route panel

## 📊 **API Usage Examples**

### Single Location Prediction
```javascript
const prediction = await crimePredictionService.getCrimePrediction({
  latitude: 13.0827,
  longitude: 80.2707,
  hour: 14,
  month: 6,
  cctv_present: true,
  lighting: 'Good'
});
```

### Heatmap Data
```javascript
const bounds = map.getBounds();
const heatmapData = await crimePredictionService.getCrimeHeatmap(bounds);
```

### Route Analysis
```javascript
const routePoints = [
  { latitude: 13.0827, longitude: 80.2707 },
  { latitude: 13.0479, longitude: 80.2827 }
];
const analysis = await crimePredictionService.analyzeRoute(routePoints);
```

## 🎨 **UI Components**

### Crime Risk Colors
- **HIGH Risk**: Red (`#ef4444`) with 🚨 icon
- **MEDIUM Risk**: Yellow (`#f59e0b`) with ⚠️ icon  
- **LOW Risk**: Green (`#10b981`) with ✅ icon

### Heatmap Gradient
- **Safe Areas**: Transparent green
- **Medium Risk**: Semi-transparent yellow
- **High Risk**: Solid red

## 🔧 **Customization**

### Modify Risk Thresholds
In `crime_api.py`, adjust the risk level calculation:
```python
risk_level = 'LOW' if prediction < 50 else 'MEDIUM' if prediction < 100 else 'HIGH'
```

### Add More Features
In `crimePredictionService.ts`, extend the service with additional methods:
```typescript
async getCrimeTrends(timeRange: string): Promise<CrimeTrend[]> {
  // Implementation
}
```

### Customize UI
In `CrimeMap.tsx`, modify the marker icons, colors, or layout as needed.

## 🚨 **Troubleshooting**

### API Connection Issues
1. **Check** if backend is running on port 8000
2. **Verify** CORS is enabled in Flask app
3. **Test** API endpoints with curl or Postman

### Map Not Loading
1. **Verify** Google Maps API key is correct
2. **Check** API key has required permissions
3. **Ensure** environment variables are loaded

### Predictions Not Working
1. **Check** if ML model is trained (`models/` folder exists)
2. **Verify** dataset file is present
3. **Check** console for error messages

## 📈 **Performance Optimization**

### Caching Predictions
```typescript
// Cache predictions to avoid repeated API calls
const predictionCache = new Map<string, CrimePrediction>();
```

### Batch Processing
```typescript
// Process multiple locations at once
const batchPredictions = await Promise.all(
  locations.map(loc => crimePredictionService.getCrimePrediction(loc))
);
```

## 🎉 **Success!**

Your CPAA ML model is now fully integrated with Google Maps! Users can:

✅ **See crime hotspots** with color-coded markers  
✅ **View crime heatmaps** with visual risk zones  
✅ **Analyze route safety** with real-time predictions  
✅ **Get safety recommendations** for any location  
✅ **Make informed decisions** about travel routes  

**The integration is complete and ready for production use!** 🚀✨
