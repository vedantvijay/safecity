#!/bin/bash

# Enhanced SafeCity Startup Script
echo "🚀 Starting Enhanced SafeCity Application..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check required ports
echo "🔍 Checking port availability..."
check_port 8003  # Enhanced Community API
check_port 8000  # ML API Server
check_port 8083  # Frontend (Vite)

# Start Enhanced Community API Server
echo "🌐 Starting Enhanced Community API Server..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Install additional dependencies for enhanced API
echo "📦 Installing enhanced API dependencies..."
pip install sqlite3 requests > /dev/null 2>&1 || echo "⚠️  Some dependencies may already be installed"

# Start the enhanced community API
echo "🚀 Starting Enhanced Community API on port 8003..."
python3 enhanced_community_api.py &
COMMUNITY_API_PID=$!

# Wait a moment for the API to start
sleep 3

# Check if the API started successfully
if curl -s http://localhost:8003/api/health > /dev/null; then
    echo "✅ Enhanced Community API is running on http://localhost:8003"
else
    echo "❌ Failed to start Enhanced Community API"
    kill $COMMUNITY_API_PID 2>/dev/null
    exit 1
fi

# Start ML API Server (if models exist)
if [ -f "models/crime_model.pkl" ]; then
    echo "🤖 Starting ML API Server..."
    python3 api_server.py &
    ML_API_PID=$!
    sleep 2
    
    if curl -s http://localhost:8000/api/health > /dev/null; then
        echo "✅ ML API Server is running on http://localhost:8000"
    else
        echo "⚠️  ML API Server failed to start (models may need training)"
    fi
else
    echo "⚠️  ML models not found. Run 'python3 ml_model.py' to train models first."
fi

# Go back to project root and start frontend
cd ..

# Start Frontend
echo "🎨 Starting React Frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

echo ""
echo "🎉 Enhanced SafeCity Application Started Successfully!"
echo ""
echo "📱 Frontend: http://localhost:8083"
echo "🌐 Enhanced Community API: http://localhost:8003"
echo "🤖 ML API Server: http://localhost:8000"
echo ""
echo "✨ New Features Available:"
echo "   • Real-time location-based incident analysis"
echo "   • AI-powered content moderation"
echo "   • Dynamic community discussions with location context"
echo "   • Route safety analysis between two points"
echo "   • Enhanced Create Post feature with location"
echo "   • Real-time data updates"
echo ""
echo "🔧 To stop all services, press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $COMMUNITY_API_PID 2>/dev/null
    kill $ML_API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait
