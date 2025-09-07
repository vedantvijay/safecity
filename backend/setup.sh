#!/bin/bash

# Crime Prediction Analysis Setup Script

echo "🚀 Setting up Crime Prediction Analysis Environment..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

echo "✅ Python3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ pip3 found"

# Create virtual environment (optional but recommended)
echo "📦 Creating virtual environment..."
python3 -m venv crime_analysis_env

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source crime_analysis_env/bin/activate

# Install dependencies
echo "📚 Installing required packages..."
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To run the analysis:"
echo "1. Make sure you have 'chennai_crime_dataset.csv' in the backend/ directory"
echo "2. Run: python3 cpaa_fixed.py"
echo ""
echo "To activate the virtual environment in the future:"
echo "source crime_analysis_env/bin/activate"
