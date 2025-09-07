#!/bin/bash

# Quick script to run the crime analysis

echo "🚀 Starting Crime Prediction Analysis..."

# Check if virtual environment exists
if [ ! -d "crime_analysis_env" ]; then
    echo "Creating virtual environment..."
    python3 -m venv crime_analysis_env
    source crime_analysis_env/bin/activate
    pip install pandas numpy scikit-learn matplotlib seaborn
else
    echo "Activating existing virtual environment..."
    source crime_analysis_env/bin/activate
fi

# Run the analysis
echo "Running analysis..."
python3 cpaa_demo.py

echo "✅ Analysis complete!"
