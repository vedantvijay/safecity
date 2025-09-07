#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify
from flask_cors import CORS
from ml_model import ChennaiCrimeMLModel
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize the ML model
model = ChennaiCrimeMLModel()

@app.route('/api/predict-crime', methods=['POST'])
def predict_crime():
    """Predict crime risk for a single location"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'latitude' not in data or 'longitude' not in data:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        # Get prediction
        prediction = model.predict_crime_risk(data)
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'location': {
                'latitude': data['latitude'],
                'longitude': data['longitude']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict-route', methods=['POST'])
def predict_route():
    """Predict crime risk for multiple locations (route analysis)"""
    try:
        data = request.get_json()
        
        if not data or 'locations' not in data:
            return jsonify({'error': 'Locations array is required'}), 400
        
        locations = data['locations']
        predictions = []
        
        for location in locations:
            prediction = model.predict_crime_risk(location)
            predictions.append({
                'location': location,
                'prediction': prediction
            })
        
        return jsonify({
            'success': True,
            'predictions': predictions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/safety-heatmap', methods=['POST'])
def safety_heatmap():
    """Generate safety heatmap data for map visualization"""
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['north', 'south', 'east', 'west']):
            return jsonify({'error': 'Map bounds (north, south, east, west) are required'}), 400
        
        # Generate grid points within bounds
        heatmap_data = generate_heatmap_data(
            data['north'], data['south'], 
            data['east'], data['west']
        )
        
        return jsonify({
            'success': True,
            'heatmapData': heatmap_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_heatmap_data(north, south, east, west):
    """Generate safety heatmap data for the given bounds"""
    heatmap_points = []
    
    # Create a grid of points
    lat_step = (north - south) / 20  # 20 points vertically
    lng_step = (east - west) / 20    # 20 points horizontally
    
    for i in range(21):
        for j in range(21):
            lat = south + (i * lat_step)
            lng = west + (j * lng_step)
            
            # Get prediction for this point
            location_data = {
                'latitude': lat,
                'longitude': lng,
                'hour': 12,  # Default to noon
                'month': 6,  # Default to June
                'cctv_present': 0,
                'lighting': 'Good',
                'police_distance_km': 2.0,
                'safety_score': 5.0
            }
            
            try:
                prediction = model.predict_crime_risk(location_data)
                
                # Convert risk probability to weight (0-1)
                weight = prediction['high_risk_probability'] / 100
                
                heatmap_points.append({
                    'lat': lat,
                    'lng': lng,
                    'weight': weight
                })
            except:
                # Skip points that fail prediction
                continue
    
    return heatmap_points

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model.is_trained,
        'message': 'Crime Prediction API is running'
    })

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    return jsonify({
        'model_trained': model.is_trained,
        'feature_count': len(model.feature_columns) if model.is_trained else 0,
        'features': model.feature_columns if model.is_trained else []
    })

if __name__ == '__main__':
    # Load the trained model on startup
    print("🤖 Loading Crime Prediction Model...")
    if model.load_models():
        print("✅ Model loaded successfully!")
    else:
        print("❌ Failed to load model. Make sure to train it first with 'python3 ml_model.py'")
        exit(1)
    
    print("🚀 Starting Crime Prediction API server...")
    app.run(host='0.0.0.0', port=8000, debug=True)
