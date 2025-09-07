from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import time
import requests
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Mock data
COMMUNITY_STATS = {
    "communityMembers": 1247,
    "safetyRating": 98,
    "activeAlerts": 3,
    "crimeRateChange": -12
}

ALERTS_DATA = [
    {
        "id": 1,
        "title": "Suspicious Activity Reported",
        "location": "Downtown Mall Parking",
        "timeAgo": "15 minutes ago",
        "severity": "medium",
        "description": "Multiple residents reported suspicious individuals near the parking area. Police have been notified and are investigating.",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "title": "Traffic Accident",
        "location": "Main Street & 5th Ave",
        "timeAgo": "1 hour ago",
        "severity": "high",
        "description": "Minor traffic accident causing delays. Emergency services on scene. Please avoid the area if possible.",
        "createdAt": "2024-01-15T09:45:00Z",
        "updatedAt": "2024-01-15T09:45:00Z"
    },
    {
        "id": 3,
        "title": "Power Outage",
        "location": "Riverside District",
        "timeAgo": "2 hours ago",
        "severity": "low",
        "description": "Planned maintenance causing temporary power outage. Expected to be resolved within 2 hours.",
        "createdAt": "2024-01-15T08:30:00Z",
        "updatedAt": "2024-01-15T08:30:00Z"
    },
    {
        "id": 4,
        "title": "Community Safety Meeting",
        "location": "Community Center",
        "timeAgo": "3 hours ago",
        "severity": "low",
        "description": "Monthly safety meeting scheduled for tomorrow at 7 PM. All residents welcome to attend.",
        "createdAt": "2024-01-15T07:30:00Z",
        "updatedAt": "2024-01-15T07:30:00Z"
    }
]

DISCUSSIONS_DATA = [
    {
        "id": 1,
        "title": "Neighborhood Watch Meeting",
        "author": "Sarah Johnson",
        "replies": 12,
        "timeAgo": "3 hours ago",
        "category": "Community",
        "createdAt": "2024-01-15T07:30:00Z",
        "updatedAt": "2024-01-15T07:30:00Z",
        "content": "Hello neighbors! I wanted to remind everyone about our monthly neighborhood watch meeting this Thursday at 7 PM in the community center. We'll be discussing recent safety updates and planning our next patrol schedule. Please bring any concerns or suggestions you might have. Looking forward to seeing everyone there!"
    },
    {
        "id": 2,
        "title": "New Security Camera Installation",
        "author": "Mike Chen",
        "replies": 8,
        "timeAgo": "5 hours ago",
        "category": "Safety",
        "createdAt": "2024-01-15T05:30:00Z",
        "updatedAt": "2024-01-15T05:30:00Z",
        "content": "Great news! The new security cameras have been installed at the main entrance and parking lot. The system includes night vision and motion detection. All footage is stored securely and can be accessed by authorized personnel. This should significantly improve our neighborhood security."
    },
    {
        "id": 3,
        "title": "Emergency Contact List Update",
        "author": "Lisa Rodriguez",
        "replies": 15,
        "timeAgo": "1 day ago",
        "category": "Information",
        "createdAt": "2024-01-14T10:30:00Z",
        "updatedAt": "2024-01-14T10:30:00Z",
        "content": "Please update your emergency contact information if you haven't already. We're compiling a comprehensive list for the neighborhood watch program. This will help us respond more effectively in case of emergencies. You can update your information through the community portal or contact me directly."
    },
    {
        "id": 4,
        "title": "Street Light Maintenance",
        "author": "David Kim",
        "replies": 6,
        "timeAgo": "2 days ago",
        "category": "General",
        "createdAt": "2024-01-13T14:20:00Z",
        "updatedAt": "2024-01-13T14:20:00Z",
        "content": "The city has scheduled street light maintenance for next week. Some lights may be temporarily out of service during the day. The work should be completed by Friday. If you notice any lights that remain out after the scheduled maintenance, please report them to the city maintenance department."
    }
]

# Store for new discussions and replies
discussions_store = DISCUSSIONS_DATA.copy()
replies_store = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/community/stats', methods=['GET'])
def get_community_stats():
    # Simulate some dynamic changes
    stats = COMMUNITY_STATS.copy()
    stats["communityMembers"] += random.randint(-5, 10)
    stats["safetyRating"] = max(85, min(100, stats["safetyRating"] + random.randint(-2, 2)))
    stats["activeAlerts"] = len(ALERTS_DATA)
    stats["crimeRateChange"] += random.randint(-2, 2)
    
    return jsonify(stats)

@app.route('/community/alerts', methods=['GET'])
def get_alerts():
    # Simulate dynamic time updates
    alerts = []
    for alert in ALERTS_DATA:
        alert_copy = alert.copy()
        # Update timeAgo based on actual time
        created_time = datetime.fromisoformat(alert["createdAt"].replace('Z', '+00:00'))
        now = datetime.now(created_time.tzinfo)
        diff = now - created_time
        
        if diff.total_seconds() < 3600:  # Less than 1 hour
            minutes = int(diff.total_seconds() / 60)
            alert_copy["timeAgo"] = f"{minutes} minutes ago"
        elif diff.total_seconds() < 86400:  # Less than 1 day
            hours = int(diff.total_seconds() / 3600)
            alert_copy["timeAgo"] = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(diff.total_seconds() / 86400)
            alert_copy["timeAgo"] = f"{days} day{'s' if days > 1 else ''} ago"
        
        alerts.append(alert_copy)
    
    return jsonify(alerts)

@app.route('/community/discussions', methods=['GET'])
def get_discussions():
    # Simulate dynamic time updates
    discussions = []
    for discussion in discussions_store:
        discussion_copy = discussion.copy()
        # Update timeAgo based on actual time
        created_time = datetime.fromisoformat(discussion["createdAt"].replace('Z', '+00:00'))
        now = datetime.now(created_time.tzinfo)
        diff = now - created_time
        
        if diff.total_seconds() < 3600:  # Less than 1 hour
            minutes = int(diff.total_seconds() / 60)
            discussion_copy["timeAgo"] = f"{minutes} minutes ago"
        elif diff.total_seconds() < 86400:  # Less than 1 day
            hours = int(diff.total_seconds() / 3600)
            discussion_copy["timeAgo"] = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(diff.total_seconds() / 86400)
            discussion_copy["timeAgo"] = f"{days} day{'s' if days > 1 else ''} ago"
        
        discussions.append(discussion_copy)
    
    return jsonify(discussions)

@app.route('/community/discussions/<int:discussion_id>', methods=['GET'])
def get_discussion_detail(discussion_id):
    discussion = next((d for d in discussions_store if d["id"] == discussion_id), None)
    if not discussion:
        return jsonify({"error": "Discussion not found"}), 404
    
    # Get replies for this discussion
    replies = replies_store.get(discussion_id, [])
    
    # Update timeAgo for discussion
    created_time = datetime.fromisoformat(discussion["createdAt"].replace('Z', '+00:00'))
    now = datetime.now(created_time.tzinfo)
    diff = now - created_time
    
    if diff.total_seconds() < 3600:
        minutes = int(diff.total_seconds() / 60)
        discussion["timeAgo"] = f"{minutes} minutes ago"
    elif diff.total_seconds() < 86400:
        hours = int(diff.total_seconds() / 3600)
        discussion["timeAgo"] = f"{hours} hour{'s' if hours > 1 else ''} ago"
    else:
        days = int(diff.total_seconds() / 86400)
        discussion["timeAgo"] = f"{days} day{'s' if days > 1 else ''} ago"
    
    # Update timeAgo for replies
    for reply in replies:
        created_time = datetime.fromisoformat(reply["createdAt"].replace('Z', '+00:00'))
        now = datetime.now(created_time.tzinfo)
        diff = now - created_time
        
        if diff.total_seconds() < 3600:
            minutes = int(diff.total_seconds() / 60)
            reply["timeAgo"] = f"{minutes} minutes ago"
        elif diff.total_seconds() < 86400:
            hours = int(diff.total_seconds() / 3600)
            reply["timeAgo"] = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(diff.total_seconds() / 86400)
            reply["timeAgo"] = f"{days} day{'s' if days > 1 else ''} ago"
    
    discussion_detail = discussion.copy()
    discussion_detail["replies"] = replies
    
    return jsonify(discussion_detail)

@app.route('/community/discussions', methods=['POST'])
def create_discussion():
    data = request.get_json()
    
    if not data or not all(key in data for key in ['title', 'content', 'category', 'author']):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_discussion = {
        "id": max([d["id"] for d in discussions_store]) + 1,
        "title": data["title"],
        "author": data["author"],
        "replies": 0,
        "timeAgo": "just now",
        "category": data["category"],
        "createdAt": datetime.now().isoformat() + "Z",
        "updatedAt": datetime.now().isoformat() + "Z",
        "content": data["content"]
    }
    
    discussions_store.append(new_discussion)
    return jsonify(new_discussion), 201

@app.route('/community/discussions/<int:discussion_id>/replies', methods=['POST'])
def add_reply(discussion_id):
    data = request.get_json()
    
    if not data or not all(key in data for key in ['content', 'author']):
        return jsonify({"error": "Missing required fields"}), 400
    
    discussion = next((d for d in discussions_store if d["id"] == discussion_id), None)
    if not discussion:
        return jsonify({"error": "Discussion not found"}), 404
    
    if discussion_id not in replies_store:
        replies_store[discussion_id] = []
    
    new_reply = {
        "id": len(replies_store[discussion_id]) + 1,
        "content": data["content"],
        "author": data["author"],
        "timeAgo": "just now",
        "createdAt": datetime.now().isoformat() + "Z"
    }
    
    replies_store[discussion_id].append(new_reply)
    
    # Update discussion reply count
    discussion["replies"] = len(replies_store[discussion_id])
    discussion["updatedAt"] = datetime.now().isoformat() + "Z"
    
    return jsonify(new_reply), 201

@app.route('/community/incidents', methods=['POST'])
def report_incident():
    data = request.get_json()
    
    if not data or not all(key in data for key in ['title', 'description', 'location', 'severity', 'reporter']):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_alert = {
        "id": max([a["id"] for a in ALERTS_DATA]) + 1,
        "title": data["title"],
        "location": data["location"],
        "timeAgo": "just now",
        "severity": data["severity"],
        "description": data["description"],
        "createdAt": datetime.now().isoformat() + "Z",
        "updatedAt": datetime.now().isoformat() + "Z"
    }
    
    ALERTS_DATA.append(new_alert)
    return jsonify(new_alert), 201

def generate_ai_location_alerts(lat, lng, radius):
    """Generate AI-based location alerts"""
    # Simulate AI-generated alerts based on location
    crime_types = ['Theft', 'Vandalism', 'Assault', 'Burglary', 'Robbery', 'Fraud']
    locations = [
        f"Near {lat:.4f}, {lng:.4f}",
        f"Within {radius}km radius",
        "Downtown area",
        "Commercial district",
        "Residential area",
        "Park area"
    ]
    
    alerts = []
    num_alerts = random.randint(2, 5)
    
    for i in range(num_alerts):
        crime_type = random.choice(crime_types)
        location = random.choice(locations)
        severity = random.choice(['low', 'medium', 'high'])
        
        alert = {
            "id": f"ai_location_{int(time.time())}_{i}",
            "title": f"{crime_type} Incident Reported",
            "location": location,
            "timeAgo": f"{random.randint(5, 180)} minutes ago",
            "severity": severity,
            "description": f"AI analysis detected potential {crime_type.lower()} activity in the {location.lower()}. Stay vigilant and report any suspicious behavior.",
            "createdAt": datetime.now().isoformat() + "Z",
            "updatedAt": datetime.now().isoformat() + "Z",
            "source": "ai-analysis",
            "confidence": random.randint(70, 95)
        }
        alerts.append(alert)
    
    return alerts

def generate_ai_crime_analysis(lat, lng, radius):
    """Generate comprehensive AI crime analysis"""
    # Simulate AI analysis
    total_crimes = random.randint(3, 8)
    
    # Generate alerts
    alerts = generate_ai_location_alerts(lat, lng, radius)
    
    # Calculate risk level
    high_severity_count = sum(1 for alert in alerts if alert['severity'] == 'high')
    medium_severity_count = sum(1 for alert in alerts if alert['severity'] == 'medium')
    
    if high_severity_count > 0:
        risk_level = 'high'
        risk_score = 80 + (high_severity_count * 10)
    elif medium_severity_count > 0:
        risk_level = 'medium'
        risk_score = 40 + (medium_severity_count * 15)
    else:
        risk_level = 'low'
        risk_score = 20 + (len(alerts) * 5)
    
    risk_score = min(risk_score, 100)
    
    # Get top crime types
    crime_types = [alert['title'].split()[0] for alert in alerts]
    top_crime_types = list(set(crime_types))[:3]
    
    # Generate safety recommendations
    safety_recommendations = [
        "Stay alert and aware of your surroundings",
        "Avoid isolated areas, especially at night",
        "Keep valuables secure and out of sight",
        "Report suspicious activity to local authorities",
        "Use well-lit and populated routes when possible"
    ]
    
    if risk_level == 'high':
        safety_recommendations.extend([
            "Consider alternative routes if possible",
            "Travel in groups when possible",
            "Keep emergency contacts readily available"
        ])
    
    return {
        "alerts": alerts,
        "summary": {
            "totalCrimes": total_crimes,
            "riskLevel": risk_level,
            "riskScore": risk_score,
            "topCrimeTypes": top_crime_types,
            "safetyRecommendations": safety_recommendations[:5]
        }
    }

@app.route('/community/location-alerts', methods=['GET'])
def get_location_alerts():
    """Get alerts for a specific location"""
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', 5, type=float)
    
    if not lat or not lng:
        return jsonify({"error": "Latitude and longitude are required"}), 400
    
    # Filter alerts within radius (simplified distance calculation)
    location_alerts = []
    for alert in ALERTS_DATA:
        # Add some randomness to simulate location-based filtering
        if random.random() < 0.3:  # 30% chance of being in the area
            location_alerts.append(alert)
    
    # Add some AI-generated alerts based on location
    ai_alerts = generate_ai_location_alerts(lat, lng, radius)
    location_alerts.extend(ai_alerts)
    
    return jsonify(location_alerts)

@app.route('/community/ai-analysis', methods=['GET'])
def get_ai_crime_analysis():
    """Get AI-analyzed crime data for a location"""
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', 5, type=float)
    
    if not lat or not lng:
        return jsonify({"error": "Latitude and longitude are required"}), 400
    
    try:
        # Generate AI analysis
        analysis = generate_ai_crime_analysis(lat, lng, radius)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": f"AI analysis failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Community API Server...")
    print("📊 Available endpoints:")
    print("   GET  /api/health - Health check")
    print("   GET  /community/stats - Community statistics")
    print("   GET  /community/alerts - Neighborhood alerts")
    print("   GET  /community/discussions - Discussion board")
    print("   GET  /community/discussions/<id> - Discussion detail")
    print("   GET  /community/location-alerts - Location-based alerts")
    print("   GET  /community/ai-analysis - AI crime analysis")
    print("   POST /community/discussions - Create discussion")
    print("   POST /community/discussions/<id>/replies - Add reply")
    print("   POST /community/incidents - Report incident")
    print("\n🌐 Server running on http://localhost:8003")
    app.run(host='0.0.0.0', port=8003, debug=True)
ho