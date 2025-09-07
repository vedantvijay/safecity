# SafeCity Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Build the Project
```bash
npm run build
```

### 2. Configure Environment Variables

**On your hosting platform, add these environment variables:**

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCS9FOUebt88LT6W7uTjd2u9d6LgpRpkJs
VITE_OPENAI_API_KEY=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
VITE_EMAILJS_SERVICE_ID=service_vqddhdh
VITE_EMAILJS_TEMPLATE_ID=template_duu0sn8
VITE_EMAILJS_PUBLIC_KEY=l3-oi62WmJ-1hLHlo
```

### 3. Deploy the `dist/` folder

### 4. Test All Features
- ✅ Map loads correctly
- ✅ SOS button works
- ✅ Chatbot responds
- ✅ Location detection works

## 🛠️ Platform-Specific Instructions

### Vercel
1. Connect your GitHub repository
2. Go to Project Settings → Environment Variables
3. Add all VITE_ variables
4. Deploy

### Netlify
1. Connect your repository
2. Go to Site Settings → Environment Variables
3. Add all VITE_ variables
4. Deploy

### GitHub Pages
1. Use GitHub Actions to build with environment variables
2. Add secrets to repository settings

## 🔍 Troubleshooting

**If map still doesn't work:**
1. Check browser console for errors
2. Verify API keys are correctly set
3. Ensure Google Maps APIs are enabled
4. Check if domain is authorized in Google Cloud Console

**Common Issues:**
- Missing environment variables
- API key restrictions
- CORS issues
- Missing API permissions
