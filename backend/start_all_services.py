#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Start all SafeCity backend services
"""

import subprocess
import sys
import time
import os

def check_model_exists():
    """Check if high-accuracy model exists"""
    model_path = 'models_high_accuracy/crime_regressor.pkl'
    if not os.path.exists(model_path):
        print("❌ High-accuracy model not found!")
        print("   Training model now...")
        try:
            subprocess.run([sys.executable, 'high_accuracy_ml_model.py'], check=True)
            print("✅ Model trained successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to train model!")
            return False
    else:
        print("✅ High-accuracy model found!")
    return True

def start_service(name, script, port):
    """Start a backend service"""
    print(f"\n🚀 Starting {name} on port {port}...")
    try:
        process = subprocess.Popen(
            [sys.executable, script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        time.sleep(2)  # Give it time to start
        
        if process.poll() is None:
            print(f"✅ {name} started successfully (PID: {process.pid})")
            return process
        else:
            print(f"❌ {name} failed to start")
            return None
    except Exception as e:
        print(f"❌ Error starting {name}: {e}")
        return None

def main():
    """Main function to start all services"""
    print("=" * 70)
    print("🚀 SAFECITY BACKEND SERVICES STARTUP")
    print("=" * 70)
    
    # Check if model exists
    if not check_model_exists():
        print("\n❌ Cannot start services without trained model!")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("📊 STARTING BACKEND SERVICES")
    print("=" * 70)
    
    services = []
    
    # Start Crime Prediction API (Port 8000)
    process1 = start_service("Crime Prediction API", "api_server.py", 8000)
    if process1:
        services.append(("Crime Prediction API", process1))
    
    # Start Crime API (Port 8002)
    process2 = start_service("Crime API", "crime_api.py", 8002)
    if process2:
        services.append(("Crime API", process2))
    
    # Start Community API (Port 8003)
    process3 = start_service("Community API", "enhanced_community_api.py", 8003)
    if process3:
        services.append(("Community API", process3))
    
    print("\n" + "=" * 70)
    print("✅ ALL SERVICES STARTED")
    print("=" * 70)
    print("\n📍 Available Services:")
    print("   🔹 Crime Prediction API: http://localhost:8000")
    print("   🔹 Crime API: http://localhost:8002")
    print("   🔹 Community API: http://localhost:8003")
    print("\n📊 API Endpoints:")
    print("   POST /api/predict-crime - Single location prediction")
    print("   POST /api/predict-route - Route safety analysis")
    print("   POST /api/safety-heatmap - Heatmap data")
    print("   POST /api/crime/predict - Crime prediction")
    print("   POST /api/crime/heatmap - Crime heatmap")
    print("   POST /api/crime/route-analysis - Route analysis")
    print("   GET  /community/stats - Community statistics")
    print("   GET  /community/alerts - Community alerts")
    print("   GET  /community/ai-analysis - AI crime analysis")
    print("\n💡 Press Ctrl+C to stop all services")
    print("=" * 70)
    
    try:
        # Keep services running
        while True:
            time.sleep(1)
            # Check if any service died
            for name, process in services:
                if process.poll() is not None:
                    print(f"\n⚠️ {name} stopped unexpectedly!")
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping all services...")
        for name, process in services:
            print(f"   Stopping {name}...")
            process.terminate()
            process.wait()
        print("✅ All services stopped!")
        print("=" * 70)

if __name__ == "__main__":
    main()
