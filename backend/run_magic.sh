#!/bin/bash

# 🪄 Magical Crime Analysis Runner
echo "🪄 Starting Magical Chennai Crime Analysis..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment and run analysis
source crime_analysis_env/bin/activate && python3 magical_analysis.py

echo "✅ Analysis complete!"
