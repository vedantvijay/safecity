#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import joblib
import numpy as np

def test_prediction():
    print("🔍 Testing prediction with saved models...")
    
    try:
        # Load models
        model = joblib.load('models/crime_model.pkl')
        scaler = joblib.load('models/scaler.pkl')
        label_encoders = joblib.load('models/label_encoders.pkl')
        feature_columns = joblib.load('models/feature_columns.pkl')
        
        print(f"✅ Models loaded successfully")
        print(f"📊 Feature columns: {feature_columns}")
        print(f"📊 Number of features: {len(feature_columns)}")
        
        # Test data
        location_data = {
            'latitude': 13.0827,
            'longitude': 80.2707,
            'hour': 14
        }
        
        print(f"🔍 Testing with: {location_data}")
        
        # Prepare input data with defaults
        input_data = {
            'latitude': location_data.get('latitude', 13.0827),
            'longitude': location_data.get('longitude', 80.2707),
            'hour_of_day': location_data.get('hour', 12),
            'month': location_data.get('month', 6),
            'day_of_week': location_data.get('day_of_week', 1),
            'police_distance_km': location_data.get('police_distance_km', 2.0),
            'cctv_present': location_data.get('cctv_present', 0),
            'eyewitness_reports': location_data.get('eyewitness_reports', 0),
            'victims_count': location_data.get('victims_count', 1),
            'community_reports': location_data.get('community_reports', 0),
            'safety_score': location_data.get('safety_score', 5.0),
            'proximity_to_route_km': location_data.get('proximity_to_route_km', 0.5),
            'crime_type': location_data.get('crime_type', 'theft'),
            'lighting': location_data.get('lighting', 'Good'),
            'road_type': location_data.get('road_type', 'Main Road'),
            'victims_age_group': location_data.get('victims_age_group', 'Adult'),
            'victims_gender': location_data.get('victims_gender', 'Male'),
            'severity_level': location_data.get('severity_level', 'Low'),
            'case_status': location_data.get('case_status', 'Open'),
            'primary_evidence': location_data.get('primary_evidence', 'None'),
            'jurisdiction': location_data.get('jurisdiction', 'Chennai Central'),
            'reported_by': location_data.get('reported_by', 'Public'),
            'crime_types_in_area': location_data.get('crime_types_in_area', 'theft,robbery')
        }
        
        print(f"📊 Input data prepared: {input_data}")
        
        # Encode categorical variables
        for col, encoder in label_encoders.items():
            try:
                input_data[col] = encoder.transform([str(input_data[col])])[0]
                print(f"✅ Encoded {col}: {input_data[col]}")
            except ValueError as e:
                print(f"⚠️ Encoding error for {col}: {e}, using default 0")
                input_data[col] = 0
        
        # Create feature vector
        feature_vector = []
        for col in feature_columns:
            feature_vector.append(input_data.get(col, 0))
        
        print(f"🔢 Feature vector length: {len(feature_vector)}")
        print(f"🔢 Feature vector: {feature_vector}")
        
        # Scale and predict
        X_scaled = scaler.transform([feature_vector])
        print(f"📏 Scaled features shape: {X_scaled.shape}")
        
        prediction = model.predict(X_scaled)[0]
        print(f"🎯 Raw prediction: {prediction}")
        
        # Convert to risk level
        risk_level = 'LOW' if prediction < 50 else 'MEDIUM' if prediction < 100 else 'HIGH'
        risk_probability = min(max(prediction / 200 * 100, 0), 100)
        
        result = {
            'predicted_crime_count': round(prediction, 2),
            'risk_level': risk_level,
            'risk_probability': round(risk_probability, 2)
        }
        
        print(f"✅ Final prediction result: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_prediction()
