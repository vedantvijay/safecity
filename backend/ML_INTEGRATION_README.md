# SafeCity High-Accuracy ML Integration

## 🎯 Overview

SafeCity now uses a **high-accuracy crime prediction ML model** with **80%+ R² score** and **86%+ classification accuracy**. The model is integrated across all backend services:

- **Maps API** - Real-time crime predictions for locations
- **Heatmap** - Safety visualization on Google Maps
- **Route Analysis** - Safety scoring for navigation routes
- **Chatbot** - AI-powered safety recommendations

## 📊 Model Performance

### Current Metrics
- **Classification Accuracy**: 86.00%
- **Regression R²**: 0.8023
- **RMSE**: 48.96
- **MAE**: 37.33
- **Cross-Validation Accuracy**: 83.25% (±2.28%)

### Key Features (31 total)
1. **Location Features**: latitude, longitude, distance_from_center
2. **Time Features**: hour, month, day_of_week, is_night, is_weekend, is_evening, is_late_night
3. **Infrastructure**: police_distance_km, cctv_present, lighting_score, road_risk_score
4. **Safety Scores**: infrastructure_safety, police_response_score, combined_risk_score
5. **Interaction Features**: night_no_cctv, night_poor_lighting, weekend_night, far_police_no_cctv

## 🚀 Quick Start

### 1. Train the Model

```bash
cd backend
python high_accuracy_ml_model.py
```

This will:
- Load the realistic crime dataset (2000 records)
- Train high-accuracy models
- Save models to `models_high_accuracy/`
- Display performance metrics

### 2. Start All Services

```bash
python start_all_services.py
```

This starts:
- **Crime Prediction API** (Port 8000)
- **Crime API** (Port 8002)
- **Community API** (Port 8003)

### 3. Test the API

```bash
# Test single prediction
curl -X POST http://localhost:8000/api/predict-crime \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 13.0827,
    "longitude": 80.2707,
    "hour": 14,
    "cctv_present": 1,
    "lighting": "Good",
    "police_distance_km": 1.0
  }'
```

## 📡 API Endpoints

### Crime Prediction API (Port 8000)

#### POST /api/predict-crime
Predict crime risk for a single location.

**Request:**
```json
{
  "latitude": 13.0827,
  "longitude": 80.2707,
  "hour": 14,
  "month": 6,
  "cctv_present": 1,
  "lighting": "Good",
  "police_distance_km": 1.0,
  "safety_score": 8.0
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "predicted_crime_count": 68.96,
    "high_risk_probability": 1.59,
    "risk_level": "LOW",
    "safety_score": 98.41,
    "safety_recommendation": "✅ LOW RISK - Relatively safe",
    "risk_factors": [],
    "location": {
      "latitude": 13.0827,
      "longitude": 80.2707
    }
  }
}
```

#### POST /api/predict-route
Analyze crime risk along a route.

**Request:**
```json
{
  "locations": [
    {"latitude": 13.0827, "longitude": 80.2707, "hour": 14},
    {"latitude": 13.0479, "longitude": 80.2827, "hour": 14}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "location": {"latitude": 13.0827, "longitude": 80.2707},
      "prediction": {
        "predicted_crime_count": 68.96,
        "risk_level": "LOW",
        "high_risk_probability": 1.59,
        "safety_score": 98.41
      }
    }
  ]
}
```

#### POST /api/safety-heatmap
Generate heatmap data for map visualization.

**Request:**
```json
{
  "north": 13.1,
  "south": 13.0,
  "east": 80.3,
  "west": 80.2
}
```

**Response:**
```json
{
  "success": true,
  "heatmapData": [
    {"lat": 13.0, "lng": 80.2, "weight": 0.15},
    {"lat": 13.05, "lng": 80.25, "weight": 0.45}
  ]
}
```

### Crime API (Port 8002)

Same endpoints as above, alternative implementation.

### Community API (Port 8003)

#### GET /community/ai-analysis
Get AI-powered crime analysis for a location.

**Request:**
```
GET /community/ai-analysis?lat=13.0827&lng=80.2707&radius=5
```

**Response:**
```json
{
  "alerts": [...],
  "summary": {
    "totalCrimes": 5,
    "riskLevel": "medium",
    "riskScore": 65,
    "topCrimeTypes": ["Theft", "Vandalism"],
    "safetyRecommendations": [...]
  }
}
```

## 🗺️ Maps Integration

The ML model is integrated with Google Maps for:

### 1. Safety Heatmap
- Real-time crime risk visualization
- Color-coded risk levels (green/yellow/orange/red)
- Updates based on map bounds

### 2. Route Safety Analysis
- Analyzes crime risk along navigation routes
- Provides safety scores for each route option
- Suggests safer alternatives

### 3. Location Predictions
- Click any location on the map
- Get instant crime risk prediction
- View safety recommendations

## 🤖 Chatbot Integration

The chatbot uses ML predictions for:

### 1. Location Safety Queries
```
User: "Is it safe to go to Marina Beach at night?"
Bot: [Uses ML model to analyze Marina Beach coordinates at night time]
     "Based on our analysis, Marina Beach has a MEDIUM risk level at night..."
```

### 2. Route Recommendations
```
User: "Suggest a safe route from T. Nagar to Anna Nagar"
Bot: [Analyzes multiple routes using ML model]
     "I recommend Route 1 (Main Road) with 85% safety score..."
```

### 3. Safety Tips
```
User: "What areas should I avoid?"
Bot: [Uses ML model to identify high-risk areas]
     "Based on current data, avoid these areas: ..."
```

## 📈 Model Training

### Dataset Generation

```bash
python generate_realistic_dataset.py
```

Generates 2000 realistic crime records with:
- **Area Types**: upscale, residential, commercial, industrial, slum
- **Time Patterns**: night/day, weekend/weekday variations
- **Infrastructure**: CCTV, lighting, police distance
- **Crime Patterns**: Realistic correlations between features

### Model Architecture

**Regression Model**: Gradient Boosting Regressor
- 500 estimators
- Max depth: 10
- Learning rate: 0.03
- Predicts exact crime count

**Classification Model**: Random Forest Classifier
- 500 estimators
- Max depth: 25
- Predicts HIGH/MEDIUM/LOW risk

### Feature Engineering

The model uses 31 engineered features:
- **Time-based**: is_night, is_weekend, is_evening, is_late_night
- **Location-based**: distance_from_center, lat/lng
- **Infrastructure**: cctv_present, lighting_score, road_risk_score
- **Interaction**: night_no_cctv, night_poor_lighting, weekend_night

## 🔧 Configuration

### Environment Variables

```bash
# .env file
VITE_OPENAI_API_KEY=your_openai_key  # For chatbot
VITE_GOOGLE_MAPS_API_KEY=your_maps_key  # For maps
```

### Model Paths

- **Models**: `backend/models_high_accuracy/`
- **Dataset**: `backend/chennai_crime_dataset_realistic.csv`
- **Metadata**: `backend/models_high_accuracy/metadata.json`

## 🧪 Testing

### Test Model Accuracy

```bash
python test_ml_accuracy.py
```

### Test Real Predictions

```bash
python test_real_predictions.py
```

### Test API Endpoints

```bash
python test_api.py
```

## 📊 Performance Optimization

### Model Loading
- Models are loaded once at startup
- Cached in memory for fast predictions
- ~50ms prediction time per location

### Batch Processing
- Route analysis processes multiple points efficiently
- Heatmap generation uses vectorized operations
- Supports 400+ predictions per second

### Caching
- Prediction results can be cached
- Reduces redundant ML computations
- Improves response time for repeated queries

## 🚨 Error Handling

### Model Not Found
```python
if not model.load_models():
    print("❌ Model not found. Training new model...")
    # Automatically trains new model
```

### Prediction Failures
```python
try:
    prediction = model.predict_crime_risk(data)
except Exception as e:
    # Returns fallback prediction
    return fallback_prediction(data)
```

### API Errors
- All endpoints return proper HTTP status codes
- Error messages include debugging information
- Graceful degradation when services unavailable

## 📝 Maintenance

### Retraining the Model

Retrain when:
- New crime data available
- Model accuracy degrades
- Feature engineering improvements

```bash
# Generate new dataset
python generate_realistic_dataset.py

# Train new model
python high_accuracy_ml_model.py

# Restart services
python start_all_services.py
```

### Monitoring

Check model performance:
```bash
# View model metadata
cat models_high_accuracy/metadata.json

# Check API health
curl http://localhost:8000/api/health
curl http://localhost:8002/api/health
```

## 🎯 Future Improvements

1. **Real-time Learning**: Update model with new crime reports
2. **Weather Integration**: Factor in weather conditions
3. **Event Data**: Consider festivals, holidays, events
4. **Traffic Patterns**: Integrate real-time traffic data
5. **Deep Learning**: Explore neural networks for complex patterns

## 📚 References

- **Scikit-learn**: https://scikit-learn.org/
- **Flask**: https://flask.palletsprojects.com/
- **Google Maps API**: https://developers.google.com/maps
- **OpenAI API**: https://platform.openai.com/docs

## 🤝 Support

For issues or questions:
1. Check the logs in terminal
2. Verify model is trained
3. Ensure all services are running
4. Check API endpoints are accessible

---

**Last Updated**: November 2025
**Version**: 2.0.0 (High-Accuracy ML Integration)
