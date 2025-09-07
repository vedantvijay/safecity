#!/bin/bash

# Start the Crime Prediction API Server
echo "🚀 Starting Crime Prediction API Server..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment
source crime_analysis_env/bin/activate

# Check if models exist
if [ ! -d "models" ] || [ ! -f "models/crime_regressor.pkl" ]; then
    echo "❌ No trained models found! Training models first..."
    python3 ml_model.py
fi

# Start Flask API server
echo "🌐 Starting API server on http://localhost:8000"
python3 api_server.py
