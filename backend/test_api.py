#!/usr/bin/env python3
# Test script for crime prediction API

import requests
import json

def test_api():
    base_url = "http://localhost:8000/api"
    
    print("🧪 Testing Crime Prediction API...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ API is healthy: {response.json()}")
        else:
            print(f"❌ API health check failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        return
    
    # Test prediction endpoint
    test_location = {
        "latitude": 13.0827,
        "longitude": 80.2707,
        "hour": 14,
        "month": 6,
        "cctv_present": True,
        "lighting": "Good"
    }
    
    try:
        print(f"\n🔍 Testing prediction for Chennai Central...")
        response = requests.post(
            f"{base_url}/crime/predict",
            json=test_location,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Prediction response: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Prediction successful: {result}")
        else:
            print(f"❌ Prediction failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Prediction test failed: {e}")
    
    # Test heatmap endpoint
    try:
        print(f"\n🗺️ Testing heatmap data...")
        bounds = {
            "north": 13.2,
            "south": 12.9,
            "east": 80.4,
            "west": 80.1
        }
        
        response = requests.post(
            f"{base_url}/crime/heatmap",
            json=bounds,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Heatmap response: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Heatmap data: {len(result.get('heatmapData', []))} points")
        else:
            print(f"❌ Heatmap failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Heatmap test failed: {e}")

if __name__ == "__main__":
    test_api()
