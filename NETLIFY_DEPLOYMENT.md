# Netlify Deployment Guide for SafeCity

## 🚀 Complete Netlify Setup

### 1. Environment Variables Configuration

**In your Netlify dashboard:**

1. Go to **Site Settings** → **Environment Variables**
2. Add these variables:

```
VITE_GOOGLE_MAPS_API_KEY = your_google_maps_api_key_here
VITE_OPENAI_API_KEY = your_openai_api_key_here
VITE_EMAILJS_SERVICE_ID = your_emailjs_service_id_here
VITE_EMAILJS_TEMPLATE_ID = your_emailjs_template_id_here
VITE_EMAILJS_PUBLIC_KEY = your_emailjs_public_key_here
```

### 2. Build Settings

**In Netlify dashboard:**
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `18`

### 3. Files Added for SPA Routing

✅ **`public/_redirects`** - Handles client-side routing  
✅ **`netlify.toml`** - Netlify configuration  

### 4. Deploy Steps

1. **Push to GitHub** (if using Git integration)
2. **Or upload `dist/` folder** manually
3. **Configure environment variables**
4. **Deploy**

### 5. Test Your Deployment

After deployment, test these URLs:
- `https://your-site.netlify.app/` (Home)
- `https://your-site.netlify.app/map` (Map page)
- `https://your-site.netlify.app/community` (Community)
- `https://your-site.netlify.app/login` (Login)

All should work without 404 errors!

## 🔍 Troubleshooting

**If you still get 404s:**
1. Check that `_redirects` file is in your `dist/` folder
2. Verify `netlify.toml` is in your project root
3. Ensure environment variables are set
4. Check Netlify build logs for errors

**If map doesn't load:**
1. Verify Google Maps API key is set
2. Check browser console for errors
3. Ensure APIs are enabled in Google Cloud Console

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] `_redirects` file created
- [ ] `netlify.toml` created
- [ ] Project built successfully
- [ ] All features tested locally
