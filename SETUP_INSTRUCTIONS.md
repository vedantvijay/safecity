# 🚀 SafeCity - Complete Setup Instructions

## 📋 Overview

SafeCity is a comprehensive urban safety platform with ML-powered crime prediction, real-time community features, and AI-assisted route planning.

**Tech Stack:**
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Python Flask + scikit-learn ML
- Database: SQLite
- APIs: Google Maps, OpenAI (optional), EmailJS (optional)

## 🎯 Quick Start (5 minutes)

```bash
# 1. Clone repository
git clone [REPOSITORY_URL]
cd safecity

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# 5. Train ML model (takes ~10 seconds)
python simple_high_accuracy_model.py

# 6. Start backend (Terminal 1)
python api_server.py

# 7. Start frontend (Terminal 2)
cd ..
npm run dev

# 8. Open browser
# http://localhost:8080
```

## 📦 Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://python.org/)
- **Git** - [Download](https://git-scm.com/)

### Optional (for full features)
- **Google Maps API Key** - [Get Key](https://console.cloud.google.com/)
- **OpenAI API Key** - [Get Key](https://platform.openai.com/)
- **EmailJS Account** - [Sign Up](https://www.emailjs.com/)

## 🔧 Detailed Setup

### Step 1: Clone Repository
```bash
git clone [REPOSITORY_URL]
cd safecity
```

### Step 2: Frontend Setup
```bash
# Install dependencies
npm install

# Verify installation
npm list react vite
```

**Expected output:** Should show React and Vite versions

### Step 3: Backend Setup
```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep -E "flask|scikit-learn|pandas"
```

**Expected output:** Should show Flask, scikit-learn, pandas

### Step 4: Configure Environment Variables

#### Create .env file
```bash
# Copy example file
cp .env.example .env
```

#### Edit .env file
Open `.env` and add your API keys:

```env
# Google Maps (Required for maps)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# OpenAI (Optional - for enhanced AI features)
VITE_OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# EmailJS (Optional - for SOS alerts)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# API URLs (Default - don't change unless needed)
VITE_API_BASE_URL=http://localhost:8000
VITE_COMMUNITY_API_URL=http://localhost:8003
```

### Step 5: Train ML Model
```bash
cd backend

# Generate dataset (takes ~5 seconds)
python generate_high_accuracy_dataset.py

# Train model (takes ~10 seconds)
python simple_high_accuracy_model.py
```

**Expected output:**
```
✅ Generated 5000 high-accuracy crime records
🤖 Training Simple High-Accuracy Models...
📊 PERFORMANCE:
   Regression R²: 0.7390 (73.90%)
   Classification Accuracy: 84.70%
💾 Models saved to 'models_simple/'
✅ Done! Fast and accurate model ready!
```

### Step 6: Start Backend Services

#### Terminal 1 - Crime Prediction API
```bash
cd backend
python api_server.py
```

**Expected output:**
```
🤖 Loading Simple High-Accuracy Model...
✅ Model loaded!
📊 Performance:
   Accuracy: 84.70%
   R²: 0.7390
🚀 Starting Crime Prediction API (Port 8000)...
 * Running on http://127.0.0.1:8000
```

#### Terminal 2 - Community API (Optional)
```bash
cd backend
python enhanced_community_api.py
```

**Expected output:**
```
🚀 Starting Enhanced SafeCity Community API Server...
🌐 Server running on http://localhost:8003
```

### Step 7: Start Frontend
```bash
# Terminal 3 (new terminal)
npm run dev
```

**Expected output:**
```
VITE v5.4.19  ready in 1172 ms
➜  Local:   http://localhost:8080/
➜  Network: http://10.x.x.x:8080/
```

### Step 8: Verify Installation
Open browser and go to: **http://localhost:8080**

You should see:
- ✅ SafeCity homepage
- ✅ Google Maps loaded
- ✅ Navigation menu
- ✅ Chatbot on right side
- ✅ SOS button (bottom right)

## 🧪 Test the Installation

### Test 1: Backend APIs
```bash
# Test Crime API
curl http://localhost:8000/api/health

# Expected: {"status": "healthy", "model_loaded": true}

# Test Community API
curl http://localhost:8003/api/health

# Expected: {"status": "healthy", ...}
```

### Test 2: ML Prediction
```bash
curl -X POST http://localhost:8000/api/predict-crime \
  -H "Content-Type: application/json" \
  -d '{"latitude":13.0827,"longitude":80.2707,"hour":14,"cctv_present":1,"lighting":"Good"}'

# Expected: {"success": true, "prediction": {...}}
```

### Test 3: Frontend Features
1. **Maps**: Should load Google Maps
2. **Search**: Search for "Marina Beach, Chennai"
3. **Chatbot**: Type "Hello" - should respond
4. **Community**: Click Community menu - should load
5. **SOS**: Click SOS button - should show settings

## 🔑 Getting API Keys

### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
4. Create credentials → API Key
5. Copy key to `.env` file

**Cost:** Free tier includes $200/month credit

### OpenAI API Key (Optional)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up / Log in
3. Go to API Keys section
4. Create new secret key
5. Copy key to `.env` file

**Cost:** Pay-as-you-go, ~$0.002 per request

**Note:** App works without OpenAI (uses fallback mode)

### EmailJS Setup (Optional)

1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for free account
3. Add email service (Gmail, Outlook, etc.)
4. Create email template with variables:
   - `{{to_email}}`
   - `{{to_name}}`
   - `{{message}}`
   - `{{location_lat}}`
   - `{{location_lng}}`
5. Copy Service ID, Template ID, Public Key to `.env`

**Cost:** Free tier includes 200 emails/month

**Note:** SOS button works without EmailJS (shows notification)

## 📁 Project Structure

```
safecity/
├── src/                          # Frontend source
│   ├── components/              # React components
│   ├── pages/                   # Page components
│   ├── services/                # API services
│   └── api/                     # API clients
├── backend/                      # Backend source
│   ├── api_server.py           # Main API server
│   ├── enhanced_community_api.py # Community API
│   ├── simple_high_accuracy_model.py # ML model
│   ├── models_simple/          # Trained models
│   └── requirements.txt        # Python dependencies
├── public/                       # Static assets
├── .env                         # Environment variables (create this)
├── .env.example                 # Environment template
├── package.json                 # Node dependencies
└── README.md                    # Project overview
```

## 🚀 Running in Production

### Build Frontend
```bash
npm run build
```

Output: `dist/` folder with optimized files

### Deploy Backend
```bash
# Use production WSGI server
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 api_server:app
```

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_COMMUNITY_API_URL=https://your-community-api-domain.com
```

## 🐛 Troubleshooting

### Issue: "Module not found"
```bash
# Frontend
npm install

# Backend
pip install -r requirements.txt
```

### Issue: "Port already in use"
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID [PID] /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Issue: "Maps not loading"
1. Check Google Maps API key in `.env`
2. Verify API is enabled in Google Cloud Console
3. Check browser console for errors
4. Restart frontend: `npm run dev`

### Issue: "ML model not found"
```bash
cd backend
python simple_high_accuracy_model.py
```

### Issue: "Database error"
```bash
cd backend
rm safecity_community.db
python enhanced_community_api.py
```

## 📚 Documentation

- **README.md** - Project overview
- **DEPLOYMENT_READY.md** - Deployment guide
- **TEST_ALL_FEATURES.md** - Feature testing guide
- **ML_INTEGRATION_README.md** - ML model documentation
- **COMMUNITY_OPENAI_EXPLANATION.md** - Community features explained

## 🎯 Features Overview

### ✅ Core Features (No API keys needed)
- ML crime prediction
- Route safety analysis
- Community discussions
- Incident reporting
- Safety heatmap (with Google Maps)

### 🎯 Enhanced Features (API keys needed)
- Google Maps integration (Google Maps API)
- AI-powered chatbot (OpenAI API)
- SOS email alerts (EmailJS)
- AI content moderation (OpenAI API)

## 💡 Tips

1. **Start Simple**: Get core features working first, add API keys later
2. **Use Fallbacks**: App works without OpenAI/EmailJS
3. **Check Logs**: Look at terminal output for errors
4. **Test APIs**: Use curl to test backend endpoints
5. **Browser Console**: Check F12 console for frontend errors

## 📞 Support

If you encounter issues:
1. Check troubleshooting section above
2. Review documentation files
3. Check terminal logs for errors
4. Verify all dependencies installed
5. Ensure API keys are correct

## ✅ Setup Checklist

- [ ] Node.js installed
- [ ] Python installed
- [ ] Repository cloned
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created and configured
- [ ] ML model trained
- [ ] Backend API running (Port 8000)
- [ ] Community API running (Port 8003) - optional
- [ ] Frontend running (Port 8080)
- [ ] Browser opened to http://localhost:8080
- [ ] Maps loading correctly
- [ ] Chatbot responding
- [ ] All features tested

---

**Setup Complete!** 🎉

Your SafeCity application should now be running successfully!
