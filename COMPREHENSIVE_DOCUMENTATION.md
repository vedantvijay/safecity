# SafeCity Project - Comprehensive Documentation

## Overview
SafeCity is a comprehensive urban safety platform that combines machine learning crime prediction, real-time community alerts, route safety analysis, and emergency response features. The project consists of a React frontend and Python Flask backend with integrated AI services.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: Vite + React 18
- **UI Library**: shadcn/ui components with Tailwind CSS
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Notifications**: Sonner toast notifications

### Backend (Python Flask)
- **Framework**: Flask with CORS support
- **Database**: SQLite for persistent storage
- **ML Models**: scikit-learn (Random Forest, Linear Regression, Logistic Regression)
- **AI Integration**: OpenAI GPT-3.5-turbo for content moderation and analysis
- **Data Processing**: pandas, numpy for data manipulation

### External Services
- **OpenAI API**: Content moderation, route analysis, summarization
- **Google Maps API**: Location services and mapping
- **EmailJS**: Emergency contact notifications
- **Nominatim**: Geocoding service for city name to coordinates

## Key Features

### 1. Route Safety Analysis
- **Deterministic Analysis**: Route-specific incident generation using route ID
- **AI-Powered Insights**: ChatGPT integration for realistic incident simulation
- **Indian Context**: Culturally relevant comments and local infrastructure references
- **Real-time Comments**: User-generated route feedback with AI moderation
- **Time-based Risk Assessment**: Different risk levels for various times of day

### 2. Community Hub
- **Location-based Alerts**: Dynamic incident fetching based on user location
- **AI Analysis Summary**: Risk scores, incident counts, and safety recommendations
- **Real-time Updates**: Auto-refreshing data with configurable intervals
- **Manual Location Override**: City name input with geocoding
- **Discussion Board**: Community posts with AI content moderation

### 3. Emergency SOS System
- **Dynamic Contacts**: Add/edit emergency contacts with name, phone, email, relationship
- **Location Sharing**: Automatic GPS location sharing during emergencies
- **Email Notifications**: Multi-contact email alerts via EmailJS
- **Persistent Storage**: LocalStorage for contact management
- **User Information**: Configurable user details for emergency context

### 4. Machine Learning Integration
- **Crime Prediction**: Multiple ML models for different prediction tasks
- **Model Training**: Automated training pipeline with data preprocessing
- **Batch Predictions**: Efficient bulk prediction processing
- **Health Monitoring**: Model status and performance tracking

## API Endpoints

### Community API (`/community/`)
- `GET /stats` - Community statistics
- `GET /alerts` - General alerts
- `GET /location-alerts` - Location-based alerts
- `GET /ai-analysis` - AI crime analysis for location
- `GET /discussions` - Community discussions
- `POST /discussions` - Create discussion (with AI moderation)
- `POST /route-analysis` - Analyze route safety
- `POST /route-comments` - Post route comments
- `POST /incidents` - Report incidents

### ML API (`/api/`)
- `GET /health` - Service health check
- `POST /predict-crime` - Crime prediction
- `POST /predict-route` - Route safety prediction
- `GET /safety-heatmap` - Safety heatmap data
- `GET /model-info` - Model information

## Data Models

### Emergency Contact
```typescript
interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}
```

### Route Analysis
```typescript
interface RouteAnalysis {
  route: {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
    midpoint: { lat: number; lng: number };
  };
  safety: {
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    incidentsCount: number;
    recommendations: string[];
    alternativeRoutes?: string[];
  };
  recentIncidents: Array<{
    type: string;
    location: string;
    time: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  userComments: Array<{
    author: string;
    comment: string;
    rating: number;
    timeAgo: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    suggests_alternative?: boolean;
  }>;
}
```

### Community Stats
```typescript
interface CommunityStats {
  communityMembers: number;
  safetyRating: number;
  activeAlerts: number;
  crimeRateChange: number;
}
```

## Environment Configuration

### Required Environment Variables
```bash
# OpenAI API
VITE_OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# EmailJS
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# API URLs
VITE_COMMUNITY_API_URL=http://localhost:8003
```

## Database Schema

### Tables
- `discussions` - Community discussion posts
- `replies` - Discussion replies
- `incidents` - Reported incidents
- `route_comments` - User route comments
- `alerts` - System alerts

### Key Fields
- Location coordinates (lat, lng)
- Timestamps for temporal analysis
- Moderation scores for AI content filtering
- Sentiment analysis for user feedback

## Deployment

### Development Setup
1. **Backend Setup**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python3 enhanced_community_api.py
   ```

2. **Frontend Setup**:
   ```bash
   npm install
   npm run dev
   ```

3. **ML Model Training**:
   ```bash
   cd backend
   python3 cpaa.py
   ```

### Production Considerations
- Configure proper CORS settings
- Set up HTTPS for production
- Implement rate limiting for API endpoints
- Add database connection pooling
- Set up monitoring and logging

## Security Features

### Content Moderation
- AI-powered content filtering using OpenAI
- Automatic flagging of inappropriate content
- Confidence scoring for moderation decisions
- Fallback mechanisms when AI is unavailable

### Data Privacy
- Local storage for user preferences
- No persistent storage of sensitive location data
- Secure API key management
- CORS protection for API endpoints

## Performance Optimizations

### Frontend
- React Query for efficient data fetching and caching
- Lazy loading for route components
- Optimized re-renders with proper dependency arrays
- Image optimization and compression

### Backend
- Database indexing for location-based queries
- Caching for frequently accessed data
- Efficient ML model loading and prediction
- Connection pooling for database operations

## Error Handling

### Frontend Error Handling
- Comprehensive try-catch blocks
- User-friendly error messages
- Fallback UI components
- Loading states for all async operations

### Backend Error Handling
- Structured error responses
- Logging for debugging
- Graceful degradation when services are unavailable
- Input validation and sanitization

## Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- API endpoint testing
- ML model validation
- Utility function testing

### Integration Tests
- End-to-end user workflows
- API integration testing
- Database operation testing
- External service mocking

## Monitoring and Analytics

### Key Metrics
- API response times
- Error rates
- User engagement metrics
- ML model accuracy
- Emergency alert success rates

### Logging
- Structured logging with timestamps
- Error tracking and alerting
- Performance monitoring
- User action tracking (privacy-compliant)

## Future Enhancements

### Planned Features
- Real-time notifications
- Mobile app development
- Advanced ML models
- Integration with local police APIs
- Community moderation tools
- Multi-language support

### Technical Improvements
- Microservices architecture
- Real-time WebSocket connections
- Advanced caching strategies
- Machine learning model versioning
- Automated testing pipeline

## Troubleshooting

### Common Issues
1. **OpenAI API Key Not Working**: Check environment variables and API key validity
2. **Location Services Failing**: Ensure HTTPS in production and proper permissions
3. **Email Notifications Not Sending**: Verify EmailJS configuration
4. **ML Models Not Loading**: Run model training script first
5. **CORS Errors**: Check backend CORS configuration

### Debug Mode
- Enable debug logging in backend
- Use browser developer tools for frontend debugging
- Check network requests for API issues
- Monitor console logs for error messages

## Contributing

### Code Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Comprehensive error handling
- Detailed code comments
- Unit tests for new features

### Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description
5. Code review and testing
6. Merge to main branch

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

---

*Last updated: September 2025*
*Version: 2.0.0*
