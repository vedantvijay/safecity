# Urban Safe Zone

A modern safety monitoring application with real-time map integration, community features, and emergency services.

## Project info

**URL**: https://lovable.dev/projects/e2d486c4-21bd-499e-a1d4-a774ccb7e8aa

## Features

- 🗺️ Interactive Google Maps with heatmap visualization
- 🔍 Location search and selection
- 💬 Real-time community chat
- 🚨 Emergency SOS button
- 📱 Responsive design for all devices
- 🌙 Dark theme with modern UI

## Google Maps Setup

To enable the map functionality, you need to configure a Google Maps API key:

1. **Get a Google Maps API Key:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API

2. **Configure the API Key:**
   - Copy the `.env` file in the project root
   - Replace `your_google_maps_api_key_here` with your actual API key
   - The file should look like: `VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here`

3. **Restart the development server** after adding the API key

## EmailJS Setup (for SOS Alerts)

To enable email alerts for the SOS button, you need to configure EmailJS:

1. **Create EmailJS Account:**
   - Visit [EmailJS](https://www.emailjs.com/)
   - Sign up for a free account
   - Create a new service (Gmail, Outlook, etc.)

2. **Create Email Template:**
   - Go to Email Templates in your EmailJS dashboard
   - Create a new template with these variables:
     
     **Basic Information:**
     - `{{to_email}}` - Emergency contact email
     - `{{to_name}}` - Emergency contact name
     - `{{from_name}}` - User's name
     - `{{from_email}}` - User's email
     - `{{message}}` - Emergency message
     
     **Location Details:**
     - `{{location_lat}}` - Latitude (6 decimal places)
     - `{{location_lng}}` - Longitude (6 decimal places)
     - `{{location_address}}` - Full formatted address
     - `{{location_city}}` - City name
     - `{{location_state}}` - State/Province
     - `{{location_country}}` - Country
     - `{{location_postal_code}}` - Postal/ZIP code
     - `{{google_maps_link}}` - Google Maps link
     
     **Time Information:**
     - `{{timestamp}}` - Formatted timestamp (e.g., "Monday, January 15, 2024 at 2:30:45 PM")
     - `{{utc_time}}` - UTC timestamp (ISO format)
     - `{{local_time}}` - Local time string
     - `{{timezone}}` - User's timezone
     - `{{unix_timestamp}}` - Unix timestamp
     - `{{day_of_week}}` - Day of the week
     - `{{date_formatted}}` - Formatted date
     
     **Device Information:**
     - `{{device_platform}}` - Operating system/platform
     - `{{device_language}}` - Browser language
     - `{{device_timezone}}` - Device timezone
     - `{{screen_resolution}}` - Screen resolution
     - `{{battery_level}}` - Battery percentage (if available)
     - `{{connection_type}}` - Network connection type
     - `{{user_agent}}` - Browser user agent
     
     **Emergency Context:**
     - `{{urgency_level}}` - Emergency urgency level
     - `{{incident_type}}` - Type of incident
     - `{{additional_notes}}` - Additional information
     - `{{last_known_activity}}` - Last known user activity
     
     **Complete Template:**
     - `{{emergency_instructions}}` - Complete formatted emergency instructions

3. **Configure Environment Variables:**
   - Get your Service ID, Template ID, and Public Key from EmailJS
   - Update the `.env` file with your EmailJS credentials:
     ```
     VITE_EMAILJS_SERVICE_ID=your_service_id
     VITE_EMAILJS_TEMPLATE_ID=your_template_id
     VITE_EMAILJS_PUBLIC_KEY=your_public_key
     ```

4. **Sample Email Template:**
   ```
   Subject: 🚨 EMERGENCY ALERT - {{from_name}} needs immediate help!

   Dear {{to_name}},

   {{emergency_instructions}}

   Best regards,
   SafeCity Emergency System
   ```

   **Enhanced Email Content Includes:**
   - 👤 Person in distress details
   - ⏰ Precise timestamp with timezone
   - 📍 Exact location with full address
   - 📱 Device and technical information
   - 🚨 Emergency context and urgency level
   - 🗺️ Direct Google Maps navigation link
   - 📋 Step-by-step emergency instructions

5. **Test SOS Functionality:**
   - Click the settings button next to the SOS button
   - Configure your name, email, and emergency contacts
   - Test the SOS button (it will send real emails with exact location!)

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e2d486c4-21bd-499e-a1d4-a774ccb7e8aa) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e2d486c4-21bd-499e-a1d4-a774ccb7e8aa) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
