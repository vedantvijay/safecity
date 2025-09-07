#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from ml_model import ChennaiCrimeMLModel
import json

def predict_location_safety():
    """Interactive crime prediction tool"""
    print("🤖 CHENNAI CRIME PREDICTION MODEL")
    print("=" * 50)
    
    # Load the trained model
    model = ChennaiCrimeMLModel()
    if not model.load_models():
        print("❌ No trained model found! Run 'python3 ml_model.py' first to train.")
        return
    
    print("✅ Model loaded successfully!")
    print("\n📍 Enter location details for crime prediction:")
    print("-" * 40)
    
    # Get user input
    try:
        lat = float(input("Latitude (e.g., 13.0827): ") or "13.0827")
        lng = float(input("Longitude (e.g., 80.2707): ") or "80.2707")
        hour = int(input("Hour of day (0-23): ") or "14")
        month = int(input("Month (1-12): ") or "6")
        
        print("\n🔧 Additional safety factors:")
        cctv = input("CCTV present? (y/n): ").lower() == 'y'
        lighting = input("Lighting quality (Good/Poor): ") or "Good"
        police_dist = float(input("Distance to police station (km): ") or "2.0")
        safety_score = float(input("Safety score (1-10): ") or "5.0")
        
        # Prepare location data
        location_data = {
            'latitude': lat,
            'longitude': lng,
            'hour': hour,
            'month': month,
            'cctv_present': 1 if cctv else 0,
            'lighting': lighting,
            'police_distance_km': police_dist,
            'safety_score': safety_score
        }
        
        # Get prediction
        print("\n🎯 ANALYZING LOCATION...")
        result = model.predict_crime_risk(location_data)
        
        # Display results
        print("\n" + "="*50)
        print("🚨 CRIME RISK PREDICTION RESULTS")
        print("="*50)
        print(f"📍 Location: {lat}, {lng}")
        print(f"⏰ Time: {hour}:00, Month {month}")
        print(f"📊 Predicted Crime Count: {result['predicted_crime_count']}")
        print(f"🎯 High Risk Probability: {result['high_risk_probability']}%")
        print(f"⚠️ Risk Level: {result['high_risk_probability']}%")
        print(f"💡 Recommendation: {result['safety_recommendation']}")
        print("="*50)
        
        # Save result
        with open('prediction_result.json', 'w') as f:
            json.dump({
                'location': location_data,
                'prediction': result
            }, f, indent=2, default=str)
        print("💾 Result saved to 'prediction_result.json'")
        
    except ValueError:
        print("❌ Invalid input! Please enter valid numbers.")
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")

def batch_predict():
    """Predict for multiple locations at once"""
    print("🤖 BATCH CRIME PREDICTION")
    print("=" * 30)
    
    model = ChennaiCrimeMLModel()
    if not model.load_models():
        print("❌ No trained model found!")
        return
    
    # Sample locations in Chennai
    locations = [
        {
            'name': 'Marina Beach',
            'latitude': 13.0479, 'longitude': 80.2827,
            'hour': 18, 'month': 6, 'cctv_present': 1,
            'lighting': 'Good', 'police_distance_km': 0.5,
            'safety_score': 7.0
        },
        {
            'name': 'T. Nagar Market',
            'latitude': 13.0418, 'longitude': 80.2341,
            'hour': 20, 'month': 12, 'cctv_present': 0,
            'lighting': 'Poor', 'police_distance_km': 2.0,
            'safety_score': 4.0
        },
        {
            'name': 'Chennai Central',
            'latitude': 13.0827, 'longitude': 80.2707,
            'hour': 22, 'month': 3, 'cctv_present': 1,
            'lighting': 'Good', 'police_distance_km': 0.2,
            'safety_score': 6.0
        }
    ]
    
    print("📍 Predicting for sample Chennai locations:")
    print("-" * 40)
    
    results = []
    for loc in locations:
        result = model.predict_crime_risk(loc)
        results.append({
            'location': loc,
            'prediction': result
        })
        
        print(f"\n🏢 {loc['name']}:")
        print(f"   Risk Level: {result['risk_level']}")
        print(f"   Crime Probability: {result['high_risk_probability']}%")
        print(f"   Recommendation: {result['safety_recommendation']}")
    
    # Save batch results
    with open('batch_predictions.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n💾 Batch results saved to 'batch_predictions.json'")

if __name__ == "__main__":
    print("Choose prediction mode:")
    print("1. Single location prediction")
    print("2. Batch prediction (sample locations)")
    
    choice = input("\nEnter choice (1/2): ").strip()
    
    if choice == "1":
        predict_location_safety()
    elif choice == "2":
        batch_predict()
    else:
        print("❌ Invalid choice!")
