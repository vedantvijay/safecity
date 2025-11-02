from flask import Flask, request, jsonify
from flask_cors import CORS
from simple_high_accuracy_model import SimpleCrimeModel
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# === Initialize Simple High-Accuracy ML Model ===
model = SimpleCrimeModel()


@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "🚀 Crime Prediction API is running"})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "message": "Crime Prediction API is running",
        "model_loaded": True
    })

@app.route("/api/crime/predict", methods=["POST"])
def predict():
    """Predict crime risk using high-accuracy ML model"""
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "No input data received. Send JSON body"}), 400

        # Use high-accuracy model for prediction
        prediction_result = model.predict_crime_risk(data)
        
        if not prediction_result:
            return jsonify({"success": False, "error": "Model prediction failed"}), 500

        return jsonify({
            "success": True,
            "prediction": prediction_result['predicted_crime_count'],
            "risk_level": prediction_result['risk_level'],
            "high_risk_probability": prediction_result['high_risk_probability'],
            "safety_score": prediction_result['safety_score'],
            "safety_recommendation": prediction_result['safety_recommendation'],
            "risk_factors": prediction_result.get('risk_factors', [])
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/crime/heatmap", methods=["POST"])
def get_heatmap_data():
    """Get crime heatmap data for map bounds using high-accuracy ML model"""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['north', 'south', 'east', 'west']):
            return jsonify({"error": "Map bounds (north, south, east, west) are required"}), 400
        
        heatmap_data = []
        
        # Generate grid points within bounds
        lat_step = (data['north'] - data['south']) / 20  # 20x20 grid
        lng_step = (data['east'] - data['west']) / 20
        
        for i in range(21):
            for j in range(21):
                lat = data['south'] + (i * lat_step)
                lng = data['west'] + (j * lng_step)
                
                # Create location data for prediction
                location_data = {
                    'latitude': lat,
                    'longitude': lng,
                    'hour': 12,  # Default to noon
                    'month': 6,  # Default to June
                    'day_of_week': 1,
                    'police_distance_km': 2.0,
                    'cctv_present': 0,
                    'lighting': 'Good',
                    'safety_score': 5.0
                }
                
                try:
                    # Use high-accuracy model for prediction
                    prediction_result = model.predict_crime_risk(location_data)
                    
                    if prediction_result:
                        # Convert risk probability to weight (0-1)
                        weight = prediction_result['high_risk_probability'] / 100
                        
                        heatmap_data.append({
                            'lat': lat,
                            'lng': lng,
                            'weight': weight
                        })
                except:
                    # Skip points that fail prediction
                    continue
        
        print(f"Generated {len(heatmap_data)} heatmap points using high-accuracy model")
        
        return jsonify({
            'success': True,
            'heatmapData': heatmap_data
        })
        
    except Exception as e:
        print(f"Error in heatmap endpoint: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/crime/route-analysis", methods=["POST"])
def analyze_route():
    """Analyze crime risk along a route using high-accuracy ML model"""
    try:
        data = request.get_json()
        if not data or 'route_points' not in data:
            return jsonify({"error": "Route points are required"}), 400
        
        route_analysis = []
        for point in data['route_points']:
            try:
                # Use high-accuracy model for prediction
                prediction_result = model.predict_crime_risk(point)
                
                if prediction_result:
                    route_analysis.append({
                        'location': point,
                        'prediction': {
                            'predicted_crime_count': prediction_result['predicted_crime_count'],
                            'risk_level': prediction_result['risk_level'],
                            'high_risk_probability': prediction_result['high_risk_probability'],
                            'safety_score': prediction_result['safety_score'],
                            'safety_recommendation': prediction_result['safety_recommendation'],
                            'risk_factors': prediction_result.get('risk_factors', [])
                        }
                    })
            except:
                # Skip points that fail prediction
                continue
        
        return jsonify({
            'success': True,
            'routeAnalysis': route_analysis
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Load the simple high-accuracy model on startup
    print("🤖 Loading Simple High-Accuracy Model...")
    if model.load_models():
        print("✅ Model loaded successfully!")
        if model.model_metadata:
            print(f"📊 Performance:")
            print(f"   Accuracy: {model.model_metadata['classification']['accuracy']*100:.2f}%")
            print(f"   R²: {model.model_metadata['regression']['r2']:.4f}")
    else:
        print("❌ Model not found. Training now...")
        import subprocess
        subprocess.run([sys.executable, 'simple_high_accuracy_model.py'])
        if not model.load_models():
            print("❌ Failed to load model!")
            exit(1)
    
    print("🚀 Starting Crime API (Port 8002)...")
    app.run(host="0.0.0.0", port=8002, debug=True)
