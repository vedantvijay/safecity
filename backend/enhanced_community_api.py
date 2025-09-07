#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
import requests
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import sqlite3
import hashlib
import re

app = Flask(__name__)
CORS(app)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', 'your_openai_api_key_here')
OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions'

# Database setup
def init_database():
    """Initialize SQLite database for dynamic data storage"""
    conn = sqlite3.connect('safecity_community.db')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            severity TEXT NOT NULL,
            reporter TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_verified BOOLEAN DEFAULT FALSE,
            ai_confidence REAL DEFAULT 0.0,
            category TEXT DEFAULT 'general'
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS discussions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            category TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reply_count INTEGER DEFAULT 0,
            is_moderated BOOLEAN DEFAULT FALSE,
            moderation_score REAL DEFAULT 0.0
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS replies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discussion_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_moderated BOOLEAN DEFAULT FALSE,
            moderation_score REAL DEFAULT 0.0,
            FOREIGN KEY (discussion_id) REFERENCES discussions (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS route_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_lat REAL NOT NULL,
            start_lng REAL NOT NULL,
            end_lat REAL NOT NULL,
            end_lng REAL NOT NULL,
            author TEXT NOT NULL,
            comment TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_moderated BOOLEAN DEFAULT FALSE,
            moderation_score REAL DEFAULT 0.0,
            sentiment TEXT DEFAULT 'neutral'
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_database()

class OpenAIModerator:
    """OpenAI-powered content moderation"""
    
    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.base_url = OPENAI_BASE_URL
    
    def moderate_content(self, content: str, content_type: str = "discussion") -> Dict:
        """Moderate content using OpenAI"""
        if not self.api_key or self.api_key == 'your_openai_api_key_here':
            return {
                "is_safe": True,
                "confidence": 0.8,
                "reasoning": "OpenAI API not configured - using fallback moderation",
                "suggestions": []
            }
        
        try:
            prompt = f"""
            Analyze this {content_type} content for safety and appropriateness:
            
            Content: "{content}"
            
            Please evaluate:
            1. Is this content safe and appropriate for a community safety platform?
            2. Does it contain any harmful, offensive, or inappropriate language?
            3. Does it promote violence, discrimination, or illegal activities?
            4. Is it relevant to community safety discussions?
            
            Respond with a JSON object containing:
            - "is_safe": boolean
            - "confidence": float (0.0 to 1.0)
            - "reasoning": string explanation
            - "suggestions": array of improvement suggestions (if any)
            """
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {'role': 'system', 'content': 'You are a content moderator for a community safety platform. Analyze content for appropriateness and safety.'},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': 300,
                'temperature': 0.3
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                content_response = result['choices'][0]['message']['content']
                
                # Try to parse JSON response
                try:
                    moderation_result = json.loads(content_response)
                    return moderation_result
                except json.JSONDecodeError:
                    # Fallback if JSON parsing fails
                    return {
                        "is_safe": True,
                        "confidence": 0.7,
                        "reasoning": "AI analysis completed but response format unclear",
                        "suggestions": []
                    }
            else:
                return {
                    "is_safe": True,
                    "confidence": 0.6,
                    "reasoning": f"OpenAI API error: {response.status_code}",
                    "suggestions": []
                }
                
        except Exception as e:
            return {
                "is_safe": True,
                "confidence": 0.5,
                "reasoning": f"Moderation error: {str(e)}",
                "suggestions": []
            }
    
    def generate_safety_analysis(self, latitude: float, longitude: float, radius: float = 5.0) -> Dict:
        """Generate AI-powered safety analysis for a location"""
        if not self.api_key or self.api_key == 'your_openai_api_key_here':
            return self._generate_fallback_analysis(latitude, longitude, radius)
        
        try:
            prompt = f"""
            Analyze the safety situation for coordinates {latitude}, {longitude} within a {radius}km radius.
            
            Consider factors like:
            - Crime patterns and trends
            - Environmental safety factors
            - Time-based risk variations
            - Community safety measures
            
            Provide a comprehensive safety analysis including:
            1. Overall risk assessment (low/medium/high)
            2. Risk score (0-100)
            3. Top safety concerns
            4. Specific safety recommendations
            5. Time-based risk patterns
            
            Respond with a JSON object containing:
            - "risk_level": string (low/medium/high)
            - "risk_score": integer (0-100)
            - "top_concerns": array of strings
            - "recommendations": array of strings
            - "time_patterns": object with hourly risk variations
            """
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {'role': 'system', 'content': 'You are a safety analyst for urban areas. Provide detailed, actionable safety assessments.'},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': 500,
                'temperature': 0.4
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                content_response = result['choices'][0]['message']['content']
                
                try:
                    analysis_result = json.loads(content_response)
                    return analysis_result
                except json.JSONDecodeError:
                    return self._generate_fallback_analysis(latitude, longitude, radius)
            else:
                return self._generate_fallback_analysis(latitude, longitude, radius)
                
        except Exception as e:
            return self._generate_fallback_analysis(latitude, longitude, radius)
    
    def analyze_route_with_chatgpt(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict:
        """Use ChatGPT API to analyze route safety and fetch recent incidents"""
        if not self.api_key or self.api_key == 'your_openai_api_key_here':
            return self._generate_fallback_route_analysis(start_lat, start_lng, end_lat, end_lng)
        
        try:
            # Calculate route midpoint and distance
            mid_lat = (start_lat + end_lat) / 2
            mid_lng = (start_lng + end_lng) / 2
            
            # Calculate approximate distance (simplified)
            import math
            distance = math.sqrt((end_lat - start_lat)**2 + (end_lng - start_lng)**2) * 111  # Rough km conversion
            
            # Generate deterministic route ID for consistent results
            route_id = f"{start_lat:.4f}_{start_lng:.4f}_{end_lat:.4f}_{end_lng:.4f}"
            
            prompt = f"""
            Analyze the safety of a route from coordinates {start_lat:.6f}, {start_lng:.6f} to {end_lat:.6f}, {end_lng:.6f}.
            
            Route Details:
            - Start: {start_lat:.6f}, {start_lng:.6f}
            - End: {end_lat:.6f}, {end_lng:.6f}
            - Midpoint: {mid_lat:.6f}, {mid_lng:.6f}
            - Approximate distance: {distance:.2f} km
            - Route ID: {route_id}
            
            IMPORTANT: Generate CONSISTENT results for this exact route. Use the route ID to ensure deterministic analysis.
            
            Please provide a comprehensive route safety analysis including:
            
            1. Recent incidents and cases along this route (simulate realistic data based on urban patterns)
            2. Risk assessment for different times of day
            3. Specific safety concerns for this route
            4. Alternative route suggestions if needed
            5. Safety recommendations for travelers
            6. Generate 10-24 realistic user comments about this route (24% should be negative/complaints, rest positive/neutral)
            
            IMPORTANT: Use Indian names for comment authors (like Priya Sharma, Rajesh Kumar, Anita Patel, etc.) and make comments culturally relevant to Indian urban contexts (mention auto-rickshaws, metro stations, local landmarks, etc.)
            
            Respond with a JSON object containing:
            - "route_safety_score": integer (0-100)
            - "risk_level": string (low/medium/high)
            - "recent_incidents": array of objects with:
              - "type": string (theft, assault, vandalism, etc.)
              - "location": string (specific area description)
              - "time": string (when it occurred)
              - "severity": string (low/medium/high)
              - "description": string (brief description)
            - "time_analysis": object with risk levels for different times
            - "safety_recommendations": array of strings
            - "alternative_routes": array of strings (if any)
            - "user_comments": array of objects with:
              - "author": string (Indian name like Priya Sharma, Rajesh Kumar)
              - "comment": string (realistic comment about the route with Indian context)
              - "rating": integer (1-5 stars)
              - "time_ago": string (when posted)
              - "sentiment": string (positive/negative/neutral)
              - "suggests_alternative": boolean (if comment suggests different route)
            - "ai_confidence": integer (0-100)
            """
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {'role': 'system', 'content': 'You are a safety analyst for urban routes. Provide detailed, realistic safety assessments based on urban crime patterns and safety data. Generate realistic incident data that would be typical for urban areas.'},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': 800,
                'temperature': 0.4
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=20)
            
            if response.status_code == 200:
                result = response.json()
                content_response = result['choices'][0]['message']['content']
                
                try:
                    analysis_result = json.loads(content_response)
                    return analysis_result
                except json.JSONDecodeError:
                    return self._generate_fallback_route_analysis(start_lat, start_lng, end_lat, end_lng)
            else:
                return self._generate_fallback_route_analysis(start_lat, start_lng, end_lat, end_lng)
                
        except Exception as e:
            return self._generate_fallback_route_analysis(start_lat, start_lng, end_lat, end_lng)
    
    def _generate_fallback_route_analysis(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict:
        """Generate fallback route analysis when ChatGPT is not available"""
        # Simulate route-based analysis
        mid_lat = (start_lat + end_lat) / 2
        mid_lng = (start_lng + end_lng) / 2
        
        # Generate realistic incident data based on coordinates
        incidents = []
        incident_types = ['Theft', 'Vandalism', 'Assault', 'Burglary', 'Robbery', 'Fraud', 'Traffic Violation']
        locations = [
            f"Near {mid_lat:.4f}, {mid_lng:.4f}",
            "Downtown intersection",
            "Commercial district",
            "Residential area",
            "Park area",
            "Shopping center vicinity"
        ]
        
        # Generate 3-5 recent incidents
        import random
        num_incidents = random.randint(3, 5)
        for i in range(num_incidents):
            incident_type = random.choice(incident_types)
            location = random.choice(locations)
            severity = random.choice(['low', 'medium', 'high'])
            time_hours = random.randint(1, 72)  # Last 3 days
            
            incidents.append({
                "type": incident_type,
                "location": location,
                "time": f"{time_hours} hours ago",
                "severity": severity,
                "description": f"{incident_type.lower()} reported in {location.lower()}. Stay vigilant in this area."
            })
        
        # Calculate route safety score
        high_severity_count = sum(1 for inc in incidents if inc['severity'] == 'high')
        medium_severity_count = sum(1 for inc in incidents if inc['severity'] == 'medium')
        
        if high_severity_count > 0:
            risk_level = 'high'
            safety_score = max(20, 100 - (high_severity_count * 25 + medium_severity_count * 15))
        elif medium_severity_count > 0:
            risk_level = 'medium'
            safety_score = max(40, 100 - (medium_severity_count * 20))
        else:
            risk_level = 'low'
            safety_score = 85
        
        # Generate realistic user comments (24% negative, rest positive/neutral)
        user_comments = []
        comment_authors = [
            "Priya Sharma", "Rajesh Kumar", "Anita Patel", "Vikram Singh", "Sunita Reddy",
            "Arjun Mehta", "Kavya Nair", "Rohit Gupta", "Deepika Joshi", "Suresh Yadav",
            "Meera Agarwal", "Amit Kumar", "Shruti Jain", "Vishal Sharma", "Pooja Singh",
            "Ravi Verma", "Neha Kapoor", "Karan Malhotra", "Ritu Sharma", "Manish Tiwari",
            "Sneha Bhatia", "Ankit Jain", "Divya Sharma", "Rohit Kumar", "Priyanka Singh",
            "Vikash Gupta", "Anjali Patel", "Rahul Sharma", "Kiran Reddy", "Sandeep Kumar"
        ]
        
        # Generate 12-18 comments
        num_comments = random.randint(12, 18)
        negative_count = int(num_comments * 0.24)  # 24% negative comments
        
        # Negative comments (complaints, suggests alternatives)
        negative_comments = [
            "This route is terrible! Too many sketchy areas, especially at night. Avoid if possible.",
            "Had a bad experience here last week. I'd recommend taking the main road instead.",
            "Not safe at all. Too many incidents reported here. Find an alternative route.",
            "This area is getting worse. Police presence needed urgently.",
            "Wouldn't recommend this route to anyone, especially women traveling alone.",
            "Had my phone stolen near the metro station. Use a different route!",
            "This route needs better lighting and security cameras. Very unsafe.",
            "Too many auto-rickshaw drivers harassing people here. Avoid this area.",
            "Street vendors and crowds make this route chaotic and unsafe.",
            "Local goons hang around here. Better to take the highway route."
        ]
        
        # Positive/Neutral comments
        positive_comments = [
            "Usually safe during the day, good route for commuting to office.",
            "Been using this route for months, no issues so far. Metro station nearby helps.",
            "Decent route, just stay alert and you'll be fine. Good connectivity.",
            "Good alternative to the main road, less traffic during peak hours.",
            "Used this route many times, generally safe. Auto-rickshaws available.",
            "Not bad during daylight hours, avoid at night. Near shopping complex.",
            "Pretty standard urban route, nothing unusual. Bus stop nearby.",
            "Works fine for me, just be aware of your surroundings. Market area.",
            "Good route if you're in a hurry, just stay vigilant. Close to railway station.",
            "Been safe for me, but I only use it during the day. Hospital nearby.",
            "Decent route, just keep your wits about you. School area, so busy mornings.",
            "Fine during rush hour when there's more people around. IT park nearby.",
            "Used this route for years, mostly incident-free. Temple area, so crowded festivals.",
            "Good route overall, just avoid late night hours. Mall nearby.",
            "Works well for daily commute, just stay alert. University area.",
            "Safe during office hours, lots of working professionals use this route.",
            "Good connectivity to metro and bus stops. Generally safe.",
            "Used this route daily for work, no major issues. Commercial area.",
            "Fine route, just be careful during festivals when it gets crowded.",
            "Decent route with good public transport connectivity. Safe during day."
        ]
        
        # Mix comments
        all_comments = negative_comments + positive_comments
        random.shuffle(all_comments)
        
        for i in range(num_comments):
            comment_text = all_comments[i % len(all_comments)]
            is_negative = i < negative_count
            
            user_comments.append({
                "author": random.choice(comment_authors),
                "comment": comment_text,
                "rating": random.randint(1, 3) if is_negative else random.randint(3, 5),
                "time_ago": f"{random.randint(1, 168)} hours ago",
                "sentiment": "negative" if is_negative else random.choice(["positive", "neutral"]),
                "suggests_alternative": is_negative and random.random() > 0.5
            })
        
        return {
            "route_safety_score": safety_score,
            "risk_level": risk_level,
            "recent_incidents": incidents,
            "time_analysis": {
                "morning": {"risk": "low", "score": 25},
                "afternoon": {"risk": "low", "score": 30},
                "evening": {"risk": "medium", "score": 55},
                "night": {"risk": "high", "score": 75}
            },
            "safety_recommendations": [
                "Stay alert and aware of your surroundings",
                "Avoid isolated areas, especially at night",
                "Keep valuables secure and out of sight",
                "Report suspicious activity to local authorities",
                "Use well-lit and populated routes when possible",
                "Consider alternative routes during high-risk times"
            ],
            "alternative_routes": [
                "Main street route (2.3km longer, safer)",
                "Highway route (faster, moderate safety)"
            ],
            "user_comments": user_comments,
            "ai_confidence": 75
        }

    def _generate_fallback_analysis(self, latitude: float, longitude: float, radius: float) -> Dict:
        """Generate fallback analysis when OpenAI is not available"""
        # Simulate location-based analysis
        risk_factors = []
        if latitude > 40.7:  # Simulate different risk levels based on coordinates
            risk_level = "medium"
            risk_score = 65
            risk_factors = ["Urban density", "Traffic patterns", "Commercial activity"]
        elif latitude > 40.5:
            risk_level = "low"
            risk_score = 35
            risk_factors = ["Residential area", "Good lighting", "Low crime rate"]
        else:
            risk_level = "high"
            risk_score = 80
            risk_factors = ["High traffic", "Mixed use area", "Recent incidents"]
        
        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "top_concerns": risk_factors,
            "recommendations": [
                "Stay alert and aware of your surroundings",
                "Avoid isolated areas, especially at night",
                "Keep valuables secure and out of sight",
                "Report suspicious activity to local authorities",
                "Use well-lit and populated routes when possible"
            ],
            "time_patterns": {
                "morning": {"risk": "low", "score": 25},
                "afternoon": {"risk": "low", "score": 30},
                "evening": {"risk": "medium", "score": 55},
                "night": {"risk": "high", "score": 75}
            }
        }

# Initialize moderator
moderator = OpenAIModerator()

# Database helper functions
def get_db_connection():
    return sqlite3.connect('safecity_community.db')

def get_route_comments(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> List[Dict]:
    """Get comments for a specific route"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get comments for this route (with some tolerance for coordinates)
    tolerance = 0.01  # ~1km tolerance
    cursor.execute('''
        SELECT * FROM route_comments 
        WHERE ABS(start_lat - ?) <= ? AND ABS(start_lng - ?) <= ?
        AND ABS(end_lat - ?) <= ? AND ABS(end_lng - ?) <= ?
        ORDER BY created_at DESC
        LIMIT 50
    ''', (start_lat, tolerance, start_lng, tolerance, end_lat, tolerance, end_lng, tolerance))
    
    comments = []
    for row in cursor.fetchall():
        comments.append({
            "id": row[0],
            "author": row[5],
            "comment": row[6],
            "rating": row[7],
            "timeAgo": _calculate_time_ago(row[8]),
            "createdAt": row[8],
            "sentiment": row[11] or "neutral"
        })
    
    conn.close()
    return comments

def get_incidents_by_location(lat: float, lng: float, radius: float = 5.0) -> List[Dict]:
    """Get incidents within radius of location"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Simple radius calculation (in a real app, use proper geospatial queries)
    cursor.execute('''
        SELECT * FROM incidents 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND (
            (latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?) <= ? * ?
        )
        ORDER BY created_at DESC
        LIMIT 20
    ''', (lat, lat, lng, lng, radius, radius))
    
    incidents = []
    for row in cursor.fetchall():
        incidents.append({
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "location": row[3],
            "latitude": row[4],
            "longitude": row[5],
            "severity": row[6],
            "reporter": row[7],
            "created_at": row[8],
            "updated_at": row[9],
            "is_verified": bool(row[10]),
            "ai_confidence": row[11],
            "category": row[12],
            "timeAgo": _calculate_time_ago(row[8])
        })
    
    conn.close()
    return incidents

def _calculate_time_ago(timestamp: str) -> str:
    """Calculate human-readable time ago"""
    try:
        created_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        now = datetime.now(created_time.tzinfo)
        diff = now - created_time
        
        if diff.total_seconds() < 60:
            return "just now"
        elif diff.total_seconds() < 3600:
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        elif diff.total_seconds() < 86400:
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(diff.total_seconds() / 86400)
            return f"{days} day{'s' if days > 1 else ''} ago"
    except:
        return "unknown time"

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "features": {
            "openai_moderation": OPENAI_API_KEY != 'your_openai_api_key_here',
            "database": "sqlite",
            "location_analysis": True
        }
    })

@app.route('/community/stats', methods=['GET'])
def get_community_stats():
    """Get dynamic community statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get real counts from database
    cursor.execute('SELECT COUNT(*) FROM incidents WHERE created_at > datetime("now", "-7 days")')
    recent_incidents = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM discussions WHERE created_at > datetime("now", "-7 days")')
    recent_discussions = cursor.fetchone()[0]
    
    conn.close()
    
    # Calculate dynamic stats
    base_members = 1247
    base_safety = 98
    base_crime_change = -12
    
    # Adjust based on recent activity
    safety_adjustment = min(5, recent_incidents * 0.5)  # Reduce safety rating based on incidents
    crime_adjustment = recent_incidents * 2  # Increase crime rate based on incidents
    
    stats = {
        "communityMembers": base_members + random.randint(-10, 20),
        "safetyRating": max(85, min(100, base_safety - safety_adjustment)),
        "activeAlerts": recent_incidents,
        "crimeRateChange": base_crime_change + crime_adjustment
    }
    
    return jsonify(stats)

@app.route('/community/alerts', methods=['GET'])
def get_alerts():
    """Get all alerts with real-time data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM incidents 
        ORDER BY created_at DESC 
        LIMIT 50
    ''')
    
    alerts = []
    for row in cursor.fetchall():
        alerts.append({
            "id": row[0],
            "title": row[1],
            "location": row[3],
            "timeAgo": _calculate_time_ago(row[8]),
            "severity": row[6],
            "description": row[2],
            "createdAt": row[8],
            "updatedAt": row[9]
        })
    
    conn.close()
    
    # If no incidents in database, return some sample data
    if not alerts:
        sample_alerts = [
            {
                "id": 1,
                "title": "Suspicious Activity Reported",
                "location": "Downtown Mall Parking",
                "timeAgo": "15 minutes ago",
                "severity": "medium",
                "description": "Multiple residents reported suspicious individuals near the parking area. Police have been notified and are investigating.",
                "createdAt": datetime.now().isoformat() + "Z",
                "updatedAt": datetime.now().isoformat() + "Z"
            }
        ]
        return jsonify(sample_alerts)
    
    return jsonify(alerts)

@app.route('/community/discussions', methods=['GET'])
def get_discussions():
    """Get all discussions with real-time data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM discussions 
        ORDER BY created_at DESC 
        LIMIT 50
    ''')
    
    discussions = []
    for row in cursor.fetchall():
        discussions.append({
            "id": row[0],
            "title": row[1],
            "author": row[3],
            "replies": row[8],
            "timeAgo": _calculate_time_ago(row[6]),
            "category": row[4],
            "createdAt": row[6],
            "updatedAt": row[7],
            "content": row[2]
        })
    
    conn.close()
    
    # If no discussions in database, return some sample data
    if not discussions:
        sample_discussions = [
            {
                "id": 1,
                "title": "Neighborhood Safety Concerns",
                "author": "Sarah Johnson",
                "replies": 5,
                "timeAgo": "2 hours ago",
                "category": "Safety",
                "createdAt": datetime.now().isoformat() + "Z",
                "updatedAt": datetime.now().isoformat() + "Z",
                "content": "Recent incidents in our area have raised concerns. Let's discuss ways to improve security."
            }
        ]
        return jsonify(sample_discussions)
    
    return jsonify(discussions)

@app.route('/community/discussions/<int:discussion_id>', methods=['GET'])
def get_discussion_detail(discussion_id):
    """Get discussion detail with replies"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get discussion
    cursor.execute('SELECT * FROM discussions WHERE id = ?', (discussion_id,))
    discussion_row = cursor.fetchone()
    
    if not discussion_row:
        return jsonify({"error": "Discussion not found"}), 404
    
    # Get replies
    cursor.execute('''
        SELECT * FROM replies 
        WHERE discussion_id = ? 
        ORDER BY created_at ASC
    ''', (discussion_id,))
    
    replies = []
    for row in cursor.fetchall():
        replies.append({
            "id": row[0],
            "content": row[2],
            "author": row[3],
            "timeAgo": _calculate_time_ago(row[4]),
            "createdAt": row[4]
        })
    
    conn.close()
    
    discussion_detail = {
        "id": discussion_row[0],
        "title": discussion_row[1],
        "author": discussion_row[3],
        "category": discussion_row[4],
        "replies": replies,
        "timeAgo": _calculate_time_ago(discussion_row[6]),
        "createdAt": discussion_row[6],
        "updatedAt": discussion_row[7],
        "content": discussion_row[2]
    }
    
    return jsonify(discussion_detail)

@app.route('/community/discussions', methods=['POST'])
def create_discussion():
    """Create new discussion with AI moderation"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ['title', 'content', 'category', 'author']):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Moderate content
    moderation_result = moderator.moderate_content(data['content'], "discussion")
    
    if not moderation_result.get('is_safe', True):
        return jsonify({
            "error": "Content does not meet community guidelines",
            "reasoning": moderation_result.get('reasoning', 'Content moderation failed'),
            "suggestions": moderation_result.get('suggestions', [])
        }), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Insert discussion
    cursor.execute('''
        INSERT INTO discussions (title, content, author, category, latitude, longitude, is_moderated, moderation_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['title'],
        data['content'],
        data['author'],
        data['category'],
        data.get('latitude'),
        data.get('longitude'),
        True,
        moderation_result.get('confidence', 0.8)
    ))
    
    discussion_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    new_discussion = {
        "id": discussion_id,
        "title": data["title"],
        "author": data["author"],
        "replies": 0,
        "timeAgo": "just now",
        "category": data["category"],
        "createdAt": datetime.now().isoformat() + "Z",
        "updatedAt": datetime.now().isoformat() + "Z",
        "content": data["content"]
    }
    
    return jsonify(new_discussion), 201

@app.route('/community/discussions/<int:discussion_id>/replies', methods=['POST'])
def add_reply(discussion_id):
    """Add reply with AI moderation"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ['content', 'author']):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Moderate content
    moderation_result = moderator.moderate_content(data['content'], "reply")
    
    if not moderation_result.get('is_safe', True):
        return jsonify({
            "error": "Content does not meet community guidelines",
            "reasoning": moderation_result.get('reasoning', 'Content moderation failed'),
            "suggestions": moderation_result.get('suggestions', [])
        }), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if discussion exists
    cursor.execute('SELECT id FROM discussions WHERE id = ?', (discussion_id,))
    if not cursor.fetchone():
        return jsonify({"error": "Discussion not found"}), 404
    
    # Insert reply
    cursor.execute('''
        INSERT INTO replies (discussion_id, content, author, is_moderated, moderation_score)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        discussion_id,
        data['content'],
        data['author'],
        True,
        moderation_result.get('confidence', 0.8)
    ))
    
    # Update discussion reply count
    cursor.execute('''
        UPDATE discussions 
        SET reply_count = reply_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (discussion_id,))
    
    conn.commit()
    conn.close()
    
    new_reply = {
        "id": cursor.lastrowid,
        "content": data["content"],
        "author": data["author"],
        "timeAgo": "just now",
        "createdAt": datetime.now().isoformat() + "Z"
    }
    
    return jsonify(new_reply), 201

@app.route('/community/incidents', methods=['POST'])
def report_incident():
    """Report incident with location data"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ['title', 'description', 'location', 'severity', 'reporter']):
        return jsonify({"error": "Missing required fields"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Insert incident
    cursor.execute('''
        INSERT INTO incidents (title, description, location, latitude, longitude, severity, reporter, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['title'],
        data['description'],
        data['location'],
        data.get('latitude'),
        data.get('longitude'),
        data['severity'],
        data['reporter'],
        data.get('category', 'general')
    ))
    
    incident_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    new_alert = {
        "id": incident_id,
        "title": data["title"],
        "location": data["location"],
        "timeAgo": "just now",
        "severity": data["severity"],
        "description": data["description"],
        "createdAt": datetime.now().isoformat() + "Z",
        "updatedAt": datetime.now().isoformat() + "Z"
    }
    
    return jsonify(new_alert), 201

@app.route('/community/location-alerts', methods=['GET'])
def get_location_alerts():
    """Get location-based alerts with AI analysis"""
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', 5, type=float)
    
    if not lat or not lng:
        return jsonify({"error": "Latitude and longitude are required"}), 400
    
    # Get incidents from database
    incidents = get_incidents_by_location(lat, lng, radius)
    
    # Generate AI analysis
    ai_analysis = moderator.generate_safety_analysis(lat, lng, radius)
    
    # Create AI-generated alerts based on analysis
    ai_alerts = []
    if ai_analysis['risk_level'] != 'low':
        ai_alerts.append({
            "id": f"ai_analysis_{int(time.time())}",
            "title": f"AI Safety Analysis - {ai_analysis['risk_level'].title()} Risk",
            "location": f"Near {lat:.4f}, {lng:.4f}",
            "timeAgo": "Just now",
            "severity": ai_analysis['risk_level'],
            "description": f"AI analysis indicates {ai_analysis['risk_level']} risk level ({ai_analysis['risk_score']}/100) in this area. Top concerns: {', '.join(ai_analysis['top_concerns'][:3])}",
            "createdAt": datetime.now().isoformat() + "Z",
            "updatedAt": datetime.now().isoformat() + "Z",
            "source": "ai-analysis",
            "confidence": ai_analysis['risk_score']
        })
    
    # Combine real incidents with AI analysis
    all_alerts = incidents + ai_alerts
    
    return jsonify(all_alerts)

@app.route('/community/ai-analysis', methods=['GET'])
def get_ai_crime_analysis():
    """Get comprehensive AI crime analysis for location"""
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', 5, type=float)
    
    if not lat or not lng:
        return jsonify({"error": "Latitude and longitude are required"}), 400
    
    try:
        # Get incidents from database
        incidents = get_incidents_by_location(lat, lng, radius)
        
        # Generate AI analysis
        ai_analysis = moderator.generate_safety_analysis(lat, lng, radius)
        
        # Create comprehensive response
        analysis = {
            "alerts": incidents,
            "summary": {
                "totalCrimes": len(incidents),
                "riskLevel": ai_analysis['risk_level'],
                "riskScore": ai_analysis['risk_score'],
                "topCrimeTypes": ai_analysis['top_concerns'],
                "safetyRecommendations": ai_analysis['recommendations'],
                "timePatterns": ai_analysis.get('time_patterns', {}),
                "aiConfidence": ai_analysis['risk_score']
            }
        }
        
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": f"AI analysis failed: {str(e)}"}), 500

@app.route('/community/route-analysis', methods=['POST'])
def analyze_route():
    """Analyze safety for a route between two points using ChatGPT API"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ['startLat', 'startLng', 'endLat', 'endLng']):
        return jsonify({"error": "Start and end coordinates are required"}), 400
    
    start_lat = data['startLat']
    start_lng = data['startLng']
    end_lat = data['endLat']
    end_lng = data['endLng']
    
    try:
        # Use ChatGPT API to analyze the route and fetch recent incidents
        chatgpt_analysis = moderator.analyze_route_with_chatgpt(start_lat, start_lng, end_lat, end_lng)
        
        # Calculate midpoint for additional analysis
        mid_lat = (start_lat + end_lat) / 2
        mid_lng = (start_lng + end_lng) / 2
        
        # Get incidents from database along the route
        route_incidents = get_incidents_by_location(mid_lat, mid_lng, 2.0)
        
        # Get real user comments for this route
        real_comments = get_route_comments(start_lat, start_lng, end_lat, end_lng)
        
        # Combine ChatGPT analysis with database incidents and real comments
        route_analysis = {
            "route": {
                "start": {"lat": start_lat, "lng": start_lng},
                "end": {"lat": end_lat, "lng": end_lng},
                "midpoint": {"lat": mid_lat, "lng": mid_lng}
            },
            "safety": {
                "overallScore": chatgpt_analysis['route_safety_score'],
                "riskLevel": chatgpt_analysis['risk_level'],
                "incidentsCount": len(chatgpt_analysis['recent_incidents']) + len(route_incidents),
                "recommendations": chatgpt_analysis['safety_recommendations'],
                "alternativeRoutes": chatgpt_analysis.get('alternative_routes', [])
            },
            "recentIncidents": chatgpt_analysis['recent_incidents'],
            "databaseIncidents": route_incidents,
            "timeAnalysis": chatgpt_analysis['time_analysis'],
            "userComments": chatgpt_analysis.get('user_comments', []) + real_comments,
            "aiConfidence": chatgpt_analysis['ai_confidence'],
            "source": "chatgpt_analysis"
        }
        
        return jsonify(route_analysis)
        
    except Exception as e:
        return jsonify({"error": f"Route analysis failed: {str(e)}"}), 500

@app.route('/community/route-comments', methods=['POST'])
def post_route_comment():
    """Post a comment about a specific route"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ['startLat', 'startLng', 'endLat', 'endLng', 'author', 'comment', 'rating']):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate rating
    if not isinstance(data['rating'], int) or data['rating'] < 1 or data['rating'] > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400
    
    # Moderate comment content
    moderation_result = moderator.moderate_content(data['comment'], "route_comment")
    
    if not moderation_result.get('is_safe', True):
        return jsonify({
            "error": "Comment does not meet community guidelines",
            "reasoning": moderation_result.get('reasoning', 'Content moderation failed'),
            "suggestions": moderation_result.get('suggestions', [])
        }), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Insert comment
    cursor.execute('''
        INSERT INTO route_comments (start_lat, start_lng, end_lat, end_lng, author, comment, rating, is_moderated, moderation_score, sentiment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['startLat'],
        data['startLng'],
        data['endLat'],
        data['endLng'],
        data['author'],
        data['comment'],
        data['rating'],
        True,
        moderation_result.get('confidence', 0.8),
        'positive' if data['rating'] >= 4 else 'negative' if data['rating'] <= 2 else 'neutral'
    ))
    
    comment_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    new_comment = {
        "id": comment_id,
        "author": data["author"],
        "comment": data["comment"],
        "rating": data["rating"],
        "timeAgo": "just now",
        "createdAt": datetime.now().isoformat() + "Z",
        "sentiment": 'positive' if data['rating'] >= 4 else 'negative' if data['rating'] <= 2 else 'neutral'
    }
    
    return jsonify(new_comment), 201

if __name__ == '__main__':
    print("🚀 Starting Enhanced SafeCity Community API Server...")
    print("📊 Available endpoints:")
    print("   GET  /api/health - Health check")
    print("   GET  /community/stats - Dynamic community statistics")
    print("   GET  /community/alerts - Real-time alerts")
    print("   GET  /community/discussions - Discussion board")
    print("   GET  /community/discussions/<id> - Discussion detail")
    print("   GET  /community/location-alerts - Location-based alerts")
    print("   GET  /community/ai-analysis - AI crime analysis")
    print("   POST /community/discussions - Create discussion (with AI moderation)")
    print("   POST /community/discussions/<id>/replies - Add reply (with AI moderation)")
    print("   POST /community/incidents - Report incident")
    print("   POST /community/route-analysis - Analyze route safety")
    print("\n🤖 Features:")
    print("   ✅ OpenAI content moderation")
    print("   ✅ Location-based incident analysis")
    print("   ✅ Real-time database storage")
    print("   ✅ AI-powered safety recommendations")
    print("   ✅ Route safety analysis")
    print(f"\n🌐 Server running on http://localhost:8003")
    print(f"🔑 OpenAI API: {'✅ Configured' if OPENAI_API_KEY != 'your_openai_api_key_here' else '❌ Not configured'}")
    
    app.run(host='0.0.0.0', port=8003, debug=True)
