import emailjs from '@emailjs/browser';

interface SOSAlertData {
  userName: string;
  userEmail: string;
  emergencyContact: string;
  emergencyEmail: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    formattedAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  timestamp: string;
  message: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
    screenResolution: string;
    batteryLevel?: number;
    connectionType?: string;
  };
  emergencyContext: {
    urgencyLevel: 'HIGH' | 'CRITICAL' | 'EMERGENCY';
    incidentType?: string;
    additionalNotes?: string;
    lastKnownActivity?: string;
  };
}

class EmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;

  constructor() {
    // EmailJS configuration - you'll need to set these up
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id';
    this.templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id';
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';
    
    // Initialize EmailJS
    emailjs.init(this.publicKey);
  }

  // Get detailed device and context information
  getDeviceInfo(): {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
    screenResolution: string;
    batteryLevel?: number;
    connectionType?: string;
  } {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || 'Unknown';
    const language = navigator.language || 'Unknown';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const screenResolution = `${screen.width}x${screen.height}`;
    
    // Get battery level if available
    let batteryLevel: number | undefined;
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryLevel = Math.round(battery.level * 100);
      });
    }
    
    // Get connection type if available
    let connectionType: string | undefined;
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connectionType = connection.effectiveType || connection.type || 'Unknown';
    }
    
    return {
      userAgent,
      platform,
      language,
      timezone,
      screenResolution,
      batteryLevel,
      connectionType
    };
  }

  // Get detailed timestamp information
  getDetailedTimestamp(): {
    timestamp: string;
    utcTime: string;
    localTime: string;
    timezone: string;
    unixTimestamp: number;
    dayOfWeek: string;
    dateFormatted: string;
  } {
    const now = new Date();
    const utcTime = now.toISOString();
    const localTime = now.toLocaleString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const unixTimestamp = Math.floor(now.getTime() / 1000);
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateFormatted = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return {
      timestamp: `${dayOfWeek}, ${dateFormatted} at ${now.toLocaleTimeString()}`,
      utcTime,
      localTime,
      timezone,
      unixTimestamp,
      dayOfWeek,
      dateFormatted
    };
  }

  // Reverse geocoding to get exact address from coordinates
  async getExactLocation(latitude: number, longitude: number): Promise<{
    address?: string;
    formattedAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }> {
    try {
      // Use Google Geocoding API for reverse geocoding
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        // Extract address components
        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';
        
        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });
        
        return {
          address: result.formatted_address,
          formattedAddress: result.formatted_address,
          city,
          state,
          country,
          postalCode
        };
      } else {
        console.warn('Reverse geocoding failed:', data.status);
        return {
          address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          formattedAddress: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        };
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        formattedAddress: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      };
    }
  }

  async sendSOSAlert(data: SOSAlertData): Promise<boolean> {
    try {
      // Get detailed location information
      const locationDetails = await this.getExactLocation(data.location.latitude, data.location.longitude);
      
      // Get detailed timestamp information
      const timeInfo = this.getDetailedTimestamp();
      
      // Prepare template parameters with comprehensive information
      const templateParams = {
        to_email: data.emergencyEmail,
        to_name: data.emergencyContact,
        from_name: data.userName,
        from_email: data.userEmail,
        
        // Location details
        location_lat: data.location.latitude.toFixed(6),
        location_lng: data.location.longitude.toFixed(6),
        location_address: locationDetails.formattedAddress || data.location.address || 'Location not available',
        location_city: locationDetails.city || 'Unknown',
        location_state: locationDetails.state || 'Unknown',
        location_country: locationDetails.country || 'Unknown',
        location_postal_code: locationDetails.postalCode || 'Unknown',
        
        // Time details
        timestamp: timeInfo.timestamp,
        utc_time: timeInfo.utcTime,
        local_time: timeInfo.localTime,
        timezone: timeInfo.timezone,
        unix_timestamp: timeInfo.unixTimestamp,
        day_of_week: timeInfo.dayOfWeek,
        date_formatted: timeInfo.dateFormatted,
        
        // Device information
        device_platform: data.deviceInfo.platform,
        device_language: data.deviceInfo.language,
        device_timezone: data.deviceInfo.timezone,
        screen_resolution: data.deviceInfo.screenResolution,
        battery_level: data.deviceInfo.batteryLevel || 'Unknown',
        connection_type: data.deviceInfo.connectionType || 'Unknown',
        user_agent: data.deviceInfo.userAgent,
        
        // Emergency context
        urgency_level: data.emergencyContext.urgencyLevel,
        incident_type: data.emergencyContext.incidentType || 'General Emergency',
        additional_notes: data.emergencyContext.additionalNotes || 'No additional information provided',
        last_known_activity: data.emergencyContext.lastKnownActivity || 'SOS button activated',
        
        // Basic info
        message: data.message,
        google_maps_link: `https://www.google.com/maps?q=${data.location.latitude},${data.location.longitude}`,
        
        emergency_instructions: `
🚨 EMERGENCY ALERT - IMMEDIATE ACTION REQUIRED 🚨

This is an automated emergency alert from SafeCity.

👤 PERSON IN DISTRESS: ${data.userName}
📧 CONTACT: ${data.userEmail}
⏰ TIME: ${timeInfo.timestamp}
🌍 TIMEZONE: ${timeInfo.timezone}
📅 DATE: ${timeInfo.dateFormatted}
🕐 UTC TIME: ${timeInfo.utcTime}

📍 EXACT LOCATION DETAILS:
Address: ${locationDetails.formattedAddress || 'Address not available'}
City: ${locationDetails.city || 'Unknown'}
State/Province: ${locationDetails.state || 'Unknown'}
Country: ${locationDetails.country || 'Unknown'}
Postal Code: ${locationDetails.postalCode || 'Unknown'}

📍 GPS COORDINATES:
Latitude: ${data.location.latitude.toFixed(6)}
Longitude: ${data.location.longitude.toFixed(6)}

📱 DEVICE INFORMATION:
Platform: ${data.deviceInfo.platform}
Language: ${data.deviceInfo.language}
Screen Resolution: ${data.deviceInfo.screenResolution}
Battery Level: ${data.deviceInfo.batteryLevel ? data.deviceInfo.batteryLevel + '%' : 'Unknown'}
Connection: ${data.deviceInfo.connectionType || 'Unknown'}

🚨 EMERGENCY CONTEXT:
Urgency Level: ${data.emergencyContext.urgencyLevel}
Incident Type: ${data.emergencyContext.incidentType || 'General Emergency'}
Last Known Activity: ${data.emergencyContext.lastKnownActivity || 'SOS button activated'}
Additional Notes: ${data.emergencyContext.additionalNotes || 'No additional information provided'}

🗺️ GOOGLE MAPS LINK:
https://www.google.com/maps?q=${data.location.latitude},${data.location.longitude}

🚨 IMMEDIATE ACTIONS REQUIRED:
1. Call 100 or local emergency services immediately
2. Provide the exact address and coordinates to emergency responders
3. Share the Google Maps link for precise location
4. If possible, try to contact the person directly at ${data.userEmail}
5. Keep this email as evidence for emergency services
6. Note the device information for tracking purposes

⚠️ IMPORTANT: This is a real emergency alert. Please take immediate action.

This alert was automatically generated by the SafeCity safety app.
        `.trim()
      };

      // Send email using EmailJS
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      console.log('SOS Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send SOS email:', error);
      return false;
    }
  }

  async sendSOSAlertToMultipleContacts(
    userData: {
      name: string;
      email: string;
      location: { latitude: number; longitude: number; address?: string };
    },
    emergencyContacts: Array<{
      name: string;
      email: string;
      relationship: string;
    }>
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    // Get detailed location information once for all contacts
    const locationDetails = await this.getExactLocation(userData.location.latitude, userData.location.longitude);
    
    // Get device information once for all contacts
    const deviceInfo = this.getDeviceInfo();
    
    // Enhanced location data with detailed information
    const enhancedLocation = {
      ...userData.location,
      ...locationDetails
    };

    // Send to each emergency contact
    for (const contact of emergencyContacts) {
      const sosData: SOSAlertData = {
        userName: userData.name,
        userEmail: userData.email,
        emergencyContact: contact.name,
        emergencyEmail: contact.email,
        location: enhancedLocation,
        timestamp: new Date().toLocaleString(),
        message: `Emergency alert from ${userData.name}. Please help immediately!`,
        deviceInfo,
        emergencyContext: {
          urgencyLevel: 'EMERGENCY',
          incidentType: 'SOS Button Activated',
          additionalNotes: `Emergency contact: ${contact.relationship}`,
          lastKnownActivity: 'SOS button activated by user'
        }
      };

      const success = await this.sendSOSAlert(sosData);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount };
  }

  // Fallback method using a simple fetch to a backend service
  async sendSOSAlertFallback(data: SOSAlertData): Promise<boolean> {
    try {
      // This would typically call your own backend service
      // For demo purposes, we'll simulate an API call
      const response = await fetch('/api/sos-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type: 'SOS_ALERT',
          priority: 'HIGH',
          source: 'SafeCity_App'
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Fallback SOS alert failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
