#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Real-world prediction testing using actual dataset records
"""

import pandas as pd
import numpy as np
from ml_model import ChennaiCrimeMLModel
import random

def test_real_predictions():
    """Test predictions on real data from the dataset"""
    print("=" * 70)
    print("🧪 TESTING ML MODEL WITH REAL CHENNAI CRIME DATA")
    print("=" * 70)
    
    # Initialize and load model
    model = ChennaiCrimeMLModel()
    
    # Load dataset
    print("\n📊 Loading dataset...")
    df = pd.read_csv('chennai_crime_dataset.csv', skiprows=1)
    print(f"✅ Loaded {len(df)} crime records")
    
    # Load pre-trained model
    if model.load_models():
        print("✅ Pre-trained model loaded")
    else:
        print("⚠️ Training new model...")
        df_processed = model.load_and_preprocess_data('chennai_crime_dataset.csv')
        model.train_models(df_processed)
    
    # Sample random records from dataset
    print("\n" + "=" * 70)
    print("🎯 TESTING WITH RANDOM REAL CRIME RECORDS")
    print("=" * 70)
    
    sample_size = 10
    sample_records = df.sample(n=sample_size, random_state=42)
    
    correct_predictions = 0
    total_predictions = 0
    
    for idx, record in sample_records.iterrows():
        print(f"\n📍 Record #{idx + 1}")
        print("-" * 70)
        
        # Prepare location data from record
        location_data = {
            'latitude': record.get('latitude', 13.0827),
            'longitude': record.get('longitude', 80.2707),
            'hour': pd.to_datetime(record['reported_datetime']).hour if 'reported_datetime' in record else 12,
            'month': pd.to_datetime(record['reported_datetime']).month if 'reported_datetime' in record else 6,
            'crime_count_6mo': record.get('crime_count_6mo', 0),
            'police_distance_km': record.get('police_distance_km', 2.0),
            'cctv_present': 1 if record.get('cctv_present') == 'Yes' else 0,
            'eyewitness_reports': record.get('eyewitness_reports', 0),
            'victims_count': record.get('victims_count', 1),
            'community_reports': record.get('community_reports', 0),
            'safety_score': record.get('safety_score', 5.0),
            'proximity_to_route_km': record.get('proximity_to_route_km', 0.5),
            'crime_type': record.get('crime_type', 'theft'),
            'lighting': record.get('lighting', 'Good'),
            'road_type': record.get('road_type', 'Main Road'),
            'victims_age_group': record.get('victims_age_group', 'Adult'),
            'victims_gender': record.get('victims_gender', 'Male'),
            'severity_level': record.get('severity_level', 'Low'),
            'jurisdiction': record.get('jurisdiction', 'Chennai Central')
        }
        
        # Display actual data
        print(f"   Crime Type: {record.get('crime_type', 'N/A')}")
        print(f"   Location: ({location_data['latitude']:.4f}, {location_data['longitude']:.4f})")
        print(f"   Time: Hour {location_data['hour']}, Month {location_data['month']}")
        print(f"   Actual Crime Count (6mo): {location_data['crime_count_6mo']}")
        print(f"   CCTV: {'Yes' if location_data['cctv_present'] else 'No'}")
        print(f"   Lighting: {location_data['lighting']}")
        print(f"   Safety Score: {location_data['safety_score']}")
        
        # Get prediction
        result = model.predict_crime_risk(location_data)
        
        print(f"\n   🤖 MODEL PREDICTION:")
        print(f"   Predicted Crime Count: {result['predicted_crime_count']}")
        print(f"   High Risk Probability: {result['high_risk_probability']}%")
        print(f"   Risk Level: {result['risk_level']}")
        
        # Calculate accuracy
        actual_count = location_data['crime_count_6mo']
        predicted_count = result['predicted_crime_count']
        error = abs(actual_count - predicted_count)
        error_percentage = (error / max(actual_count, 1)) * 100
        
        print(f"\n   📊 ACCURACY:")
        print(f"   Prediction Error: {error:.2f} crimes")
        print(f"   Error Percentage: {error_percentage:.2f}%")
        
        # Consider prediction correct if within 20% error
        if error_percentage <= 20:
            correct_predictions += 1
            print(f"   ✅ GOOD PREDICTION (within 20% error)")
        else:
            print(f"   ⚠️ NEEDS IMPROVEMENT (>{20}% error)")
        
        total_predictions += 1
    
    # Overall accuracy
    print("\n" + "=" * 70)
    print("📊 OVERALL RESULTS")
    print("=" * 70)
    accuracy = (correct_predictions / total_predictions) * 100
    print(f"✅ Predictions within 20% error: {correct_predictions}/{total_predictions}")
    print(f"✅ Practical Accuracy: {accuracy:.2f}%")
    
    # Test specific scenarios
    print("\n" + "=" * 70)
    print("🧪 TESTING SPECIFIC CHENNAI LOCATIONS")
    print("=" * 70)
    
    chennai_locations = [
        {
            'name': 'T. Nagar (High Traffic Commercial)',
            'data': {
                'latitude': 13.0418, 'longitude': 80.2341,
                'hour': 18, 'cctv_present': 1, 'lighting': 'Good',
                'police_distance_km': 1.5, 'safety_score': 6.0
            }
        },
        {
            'name': 'Marina Beach (Tourist Area)',
            'data': {
                'latitude': 13.0499, 'longitude': 80.2824,
                'hour': 20, 'cctv_present': 1, 'lighting': 'Moderate',
                'police_distance_km': 2.0, 'safety_score': 7.0
            }
        },
        {
            'name': 'Koyambedu (Bus Terminal Area)',
            'data': {
                'latitude': 13.0719, 'longitude': 80.1948,
                'hour': 22, 'cctv_present': 0, 'lighting': 'Poor',
                'police_distance_km': 3.0, 'safety_score': 4.0
            }
        },
        {
            'name': 'Anna Nagar (Residential)',
            'data': {
                'latitude': 13.0850, 'longitude': 80.2101,
                'hour': 14, 'cctv_present': 1, 'lighting': 'Good',
                'police_distance_km': 1.0, 'safety_score': 8.0
            }
        }
    ]
    
    for location in chennai_locations:
        print(f"\n📍 {location['name']}")
        print("-" * 70)
        result = model.predict_crime_risk(location['data'])
        print(f"   Predicted Crime Count: {result['predicted_crime_count']}")
        print(f"   High Risk Probability: {result['high_risk_probability']}%")
        print(f"   Risk Level: {result['risk_level']}")
        print(f"   💡 {result['safety_recommendation']}")
    
    print("\n" + "=" * 70)
    print("✅ Testing Complete!")
    print("=" * 70)

if __name__ == "__main__":
    test_real_predictions()
