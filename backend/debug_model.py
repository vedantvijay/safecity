#!/usr/bin/env python3
# Debug script for crime prediction

import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

def test_model_loading():
    print("🧪 Testing model loading...")
    
    try:
        # Load model components
        model = joblib.load('models/crime_model.pkl')
        scaler = joblib.load('models/scaler.pkl')
        label_encoders = joblib.load('models/label_encoders.pkl')
        feature_columns = joblib.load('models/feature_columns.pkl')
        
        print(f"✅ Model loaded: {type(model)}")
        print(f"✅ Scaler loaded: {type(scaler)}")
        print(f"✅ Label encoders: {len(label_encoders)} encoders")
        print(f"✅ Feature columns: {len(feature_columns)} columns")
        print(f"📊 Feature columns: {feature_columns}")
        
        # Test prediction
        print("\n🔍 Testing prediction...")
        
        # Prepare test data
        test_data = {
            'latitude': 13.0827,
            'longitude': 80.2707,
            'hour_of_day': 14,
            'month': 6,
            'day_of_week': 1,
            'police_distance_km': 2.0,
            'cctv_present': 0,
            'eyewitness_reports': 0,
            'victims_count': 1,
            'community_reports': 0,
            'safety_score': 5.0,
            'proximity_to_route_km': 0.5,
            'crime_type': 'theft',
            'lighting': 'Good',
            'road_type': 'Main Road',
            'victims_age_group': 'Adult',
            'victims_gender': 'Male',
            'severity_level': 'Low',
            'case_status': 'Open',
            'primary_evidence': 'None',
            'jurisdiction': 'Chennai Central',
            'reported_by': 'Public',
            'crime_types_in_area': 'theft,robbery'
        }
        
        print(f"📊 Test data: {test_data}")
        
        # Encode categorical variables
        for col, encoder in label_encoders.items():
            try:
                test_data[col] = encoder.transform([str(test_data[col])])[0]
                print(f"✅ Encoded {col}: {test_data[col]}")
            except ValueError as e:
                print(f"❌ Encoding error for {col}: {e}")
                test_data[col] = 0
        
        # Create feature vector
        feature_vector = []
        for col in feature_columns:
            feature_vector.append(test_data.get(col, 0))
        
        print(f"🔢 Feature vector length: {len(feature_vector)}")
        print(f"🔢 Feature vector: {feature_vector[:10]}... (first 10)")
        
        # Scale and predict
        X_scaled = scaler.transform([feature_vector])
        prediction = model.predict(X_scaled)[0]
        
        print(f"🎯 Prediction result: {prediction}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_model_loading()
