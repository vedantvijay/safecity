from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# === Load Models and Preprocessing Files ===
MODEL_PATH = 'models/crime_model.pkl'
SCALER_PATH = 'models/scaler.pkl'
ENCODERS_PATH = 'models/label_encoders.pkl'
FEATURES_PATH = 'models/feature_columns.pkl'
NUM_COLS_PATH = 'models/numerical_columns.pkl'

required_files = [MODEL_PATH, SCALER_PATH, ENCODERS_PATH, FEATURES_PATH, NUM_COLS_PATH]
for f in required_files:
    if not os.path.exists(f):
        raise FileNotFoundError(f"❌ Missing required file: {f}")

# Load objects
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoders = joblib.load(ENCODERS_PATH)
feature_columns = joblib.load(FEATURES_PATH)
numerical_cols = joblib.load(NUM_COLS_PATH)


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
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "No input data received. Send JSON body"}), 400

        input_df = pd.DataFrame([data])

        # Apply label encoding
        for col, le in label_encoders.items():
            if col in input_df.columns:
                try:
                    input_df[col] = le.transform(input_df[col].astype(str))
                except ValueError:
                    input_df[col] = le.transform([le.classes_[-1]])[0]
            else:
                input_df[col] = 0

        # Ensure all required columns exist
        for col in feature_columns:
            if col not in input_df.columns:
                input_df[col] = 0

        input_df = input_df[feature_columns]

        # Scale
        input_df[numerical_cols] = scaler.transform(input_df[numerical_cols])

        # Predict
        prediction = model.predict(input_df)[0]

        # --- Risk classification ---
        if prediction < 100:
            risk = "Low"
        elif prediction < 250:
            risk = "Medium"
        else:
            risk = "High"

        return jsonify({
            "success": True,
            "prediction": float(prediction),
            "risk_level": risk
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/crime/heatmap", methods=["POST"])
def get_heatmap_data():
    """Get crime heatmap data for map bounds using real Chennai crime dataset"""
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['north', 'south', 'east', 'west']):
            return jsonify({"error": "Map bounds (north, south, east, west) are required"}), 400
        
        # Load Chennai crime dataset
        try:
            df = pd.read_csv('chennai_crime_dataset.csv', skiprows=1)  # Skip the first row which is a description
            print(f"Loaded Chennai dataset with {len(df)} records")
            print(f"Dataset columns: {list(df.columns)}")
        except Exception as e:
            print(f"Error loading Chennai dataset: {e}")
            return jsonify({"error": "Could not load Chennai crime dataset"}), 500
        
        # Filter crimes within map bounds
        bounds_filter = (
            (df['latitude'] >= data['south']) & 
            (df['latitude'] <= data['north']) & 
            (df['longitude'] >= data['west']) & 
            (df['longitude'] <= data['east'])
        )
        filtered_df = df[bounds_filter]
        
        print(f"Found {len(filtered_df)} crimes within bounds")
        
        # If no crimes in bounds, generate some sample points
        if len(filtered_df) == 0:
            print("No crimes in bounds, generating sample points")
            heatmap_data = []
            lat_step = (data['north'] - data['south']) / 10
            lng_step = (data['east'] - data['west']) / 10
            
            for i in range(11):
                for j in range(11):
                    lat = data['south'] + (i * lat_step)
                    lng = data['west'] + (j * lng_step)
                    
                    # Create location data for prediction
                    location_data = {
                        'latitude': lat,
                        'longitude': lng,
                        'hour': 12,
                        'month': 6,
                        'day_of_week': 1,
                        'police_distance_km': 2.0,
                        'cctv_present': 0,
                        'lighting': 'Good',
                        'safety_score': 5.0
                    }
                    
                    # Make prediction
                    try:
                        input_df = pd.DataFrame([location_data])
                        
                        # Apply label encoding
                        for col, le in label_encoders.items():
                            if col in input_df.columns:
                                try:
                                    input_df[col] = le.transform(input_df[col].astype(str))
                                except ValueError:
                                    input_df[col] = le.transform([le.classes_[-1]])[0]
                            else:
                                input_df[col] = 0
                        
                        # Ensure all required columns exist
                        for col in feature_columns:
                            if col not in input_df.columns:
                                input_df[col] = 0
                        
                        input_df = input_df[feature_columns]
                        input_df[numerical_cols] = scaler.transform(input_df[numerical_cols])
                        
                        prediction = model.predict(input_df)[0]
                        weight = min(max(prediction / 200, 0), 1)  # Normalize to 0-1
                        
                        heatmap_data.append({
                            'lat': lat,
                            'lng': lng,
                            'weight': weight
                        })
                    except:
                        # Skip points that fail prediction
                        continue
        else:
            # Use real crime locations from dataset
            heatmap_data = []
            
            # Group nearby crimes to avoid overcrowding
            for _, crime in filtered_df.iterrows():
                try:
                    # Create location data for prediction using actual crime data
                    location_data = {
                        'latitude': crime['latitude'],
                        'longitude': crime['longitude'],
                        'hour': pd.to_datetime(crime['reported_datetime']).hour if 'reported_datetime' in crime else 12,
                        'month': pd.to_datetime(crime['reported_datetime']).month if 'reported_datetime' in crime else 6,
                        'day_of_week': pd.to_datetime(crime['reported_datetime']).dayofweek if 'reported_datetime' in crime else 1,
                        'police_distance_km': crime.get('police_distance_km', 2.0),
                        'cctv_present': 1 if crime.get('cctv_present', 'No') == 'Yes' else 0,
                        'lighting': crime.get('lighting', 'Good'),
                        'safety_score': crime.get('safety_score', 5.0)
                    }
                    
                    # Make prediction
                    input_df = pd.DataFrame([location_data])
                    
                    # Apply label encoding
                    for col, le in label_encoders.items():
                        if col in input_df.columns:
                            try:
                                input_df[col] = le.transform(input_df[col].astype(str))
                            except ValueError:
                                input_df[col] = le.transform([le.classes_[-1]])[0]
                        else:
                            input_df[col] = 0
                    
                    # Ensure all required columns exist
                    for col in feature_columns:
                        if col not in input_df.columns:
                            input_df[col] = 0
                    
                    input_df = input_df[feature_columns]
                    input_df[numerical_cols] = scaler.transform(input_df[numerical_cols])
                    
                    prediction = model.predict(input_df)[0]
                    
                    # Calculate weight based on crime severity and frequency
                    base_weight = min(max(prediction / 200, 0), 1)
                    
                    # Adjust weight based on crime type severity
                    severity_multiplier = 1.0
                    if 'severity_level' in crime:
                        if crime['severity_level'] == 'High':
                            severity_multiplier = 1.5
                        elif crime['severity_level'] == 'Medium':
                            severity_multiplier = 1.2
                    
                    # Adjust weight based on crime count in area
                    crime_count_multiplier = 1.0
                    if 'crime_count_6mo' in crime:
                        crime_count_multiplier = min(1 + (crime['crime_count_6mo'] / 1000), 2.0)
                    
                    final_weight = min(base_weight * severity_multiplier * crime_count_multiplier, 1.0)
                    
                    heatmap_data.append({
                        'lat': crime['latitude'],
                        'lng': crime['longitude'],
                        'weight': final_weight
                    })
                    
                except Exception as e:
                    print(f"Error processing crime {crime.get('crime_id', 'unknown')}: {e}")
                    continue
        
        print(f"Generated {len(heatmap_data)} heatmap points")
        
        return jsonify({
            'success': True,
            'heatmapData': heatmap_data
        })
        
    except Exception as e:
        print(f"Error in heatmap endpoint: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/crime/route-analysis", methods=["POST"])
def analyze_route():
    """Analyze crime risk along a route"""
    try:
        data = request.get_json()
        if not data or 'route_points' not in data:
            return jsonify({"error": "Route points are required"}), 400
        
        route_analysis = []
        for point in data['route_points']:
            try:
                # Make prediction for each point
                input_df = pd.DataFrame([point])
                
                # Apply label encoding
                for col, le in label_encoders.items():
                    if col in input_df.columns:
                        try:
                            input_df[col] = le.transform(input_df[col].astype(str))
                        except ValueError:
                            input_df[col] = le.transform([le.classes_[-1]])[0]
                    else:
                        input_df[col] = 0
                
                # Ensure all required columns exist
                for col in feature_columns:
                    if col not in input_df.columns:
                        input_df[col] = 0
                
                input_df = input_df[feature_columns]
                input_df[numerical_cols] = scaler.transform(input_df[numerical_cols])
                
                prediction = model.predict(input_df)[0]
                
                # Convert to risk level
                risk_level = 'LOW' if prediction < 100 else 'MEDIUM' if prediction < 250 else 'HIGH'
                
                route_analysis.append({
                    'location': point,
                    'prediction': {
                        'predicted_crime_count': float(prediction),
                        'risk_level': risk_level,
                        'risk_probability': min(max(prediction / 200 * 100, 0), 100)
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
    app.run(host="0.0.0.0", port=8002, debug=True)
