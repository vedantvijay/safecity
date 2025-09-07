#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os

class ChennaiCrimeMLModel:
    def __init__(self):
        self.regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.is_trained = False
        
    def load_and_preprocess_data(self, csv_path):
        """Load and preprocess the crime dataset"""
        print("🔄 Loading dataset...")
        df = pd.read_csv(csv_path, skiprows=1)
        
        # Handle missing values
        df = df.fillna({
            'lighting': 'Unknown',
            'road_type': 'Unknown', 
            'victims_age_group': 'Unknown',
            'victims_gender': 'Unknown',
            'severity_level': 'Low',
            'case_status': 'Open',
            'primary_evidence': 'None',
            'jurisdiction': 'Unknown',
            'reported_by': 'Public',
            'community_reports': 0,
            'safety_score': 5.0
        })
        
        # Convert cctv_present to numeric
        df['cctv_present'] = df['cctv_present'].map({'Yes': 1, 'No': 0}).fillna(0)
        
        # Extract time features
        df['reported_datetime'] = pd.to_datetime(df['reported_datetime'])
        df['hour'] = df['reported_datetime'].dt.hour
        df['month'] = df['reported_datetime'].dt.month
        df['day_of_week'] = df['reported_datetime'].dt.dayofweek
        
        # Encode categorical variables
        categorical_columns = ['crime_type', 'lighting', 'road_type', 'victims_age_group', 
                             'victims_gender', 'severity_level', 'jurisdiction']
        
        for col in categorical_columns:
            if col in df.columns:
                le = LabelEncoder()
                df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
        
        # Select features for ML
        self.feature_columns = [
            'latitude', 'longitude', 'hour', 'month', 'day_of_week',
            'crime_count_6mo', 'police_distance_km', 'cctv_present',
            'eyewitness_reports', 'victims_count', 'community_reports',
            'safety_score', 'proximity_to_route_km'
        ]
        
        # Add encoded categorical features
        for col in categorical_columns:
            if f'{col}_encoded' in df.columns:
                self.feature_columns.append(f'{col}_encoded')
        
        print(f"✅ Dataset preprocessed. Features: {len(self.feature_columns)}")
        return df
        
    def train_models(self, df):
        """Train the ML models"""
        print("🤖 Training ML models...")
        
        # Prepare features and targets
        X = df[self.feature_columns].fillna(0)
        y_regression = df['crime_count_6mo']  # Predict crime count
        y_classification = (df['crime_count_6mo'] > df['crime_count_6mo'].median()).astype(int)  # High/Low crime
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train_reg, y_test_reg = train_test_split(
            X_scaled, y_regression, test_size=0.2, random_state=42
        )
        _, _, y_train_cls, y_test_cls = train_test_split(
            X_scaled, y_classification, test_size=0.2, random_state=42
        )
        
        # Train regression model
        self.regressor.fit(X_train, y_train_reg)
        
        # Train classification model  
        self.classifier.fit(X_train, y_train_cls)
        
        self.is_trained = True
        print("✅ Models trained successfully!")
        
        # Save models
        self.save_models()
        
    def save_models(self):
        """Save trained models"""
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.regressor, 'models/crime_regressor.pkl')
        joblib.dump(self.classifier, 'models/crime_classifier.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        joblib.dump(self.label_encoders, 'models/label_encoders.pkl')
        joblib.dump(self.feature_columns, 'models/feature_columns.pkl')
        print("💾 Models saved to 'models/' directory")
        
    def load_models(self):
        """Load pre-trained models"""
        try:
            self.regressor = joblib.load('models/crime_regressor.pkl')
            self.classifier = joblib.load('models/crime_classifier.pkl')
            self.scaler = joblib.load('models/scaler.pkl')
            self.label_encoders = joblib.load('models/label_encoders.pkl')
            self.feature_columns = joblib.load('models/feature_columns.pkl')
            self.is_trained = True
            print("✅ Models loaded successfully!")
            return True
        except FileNotFoundError:
            print("❌ No pre-trained models found. Train first!")
            return False
    
    def predict_crime_risk(self, location_data):
        """Predict crime risk for a given location"""
        if not self.is_trained:
            print("❌ Model not trained! Train first.")
            return None
            
        # Prepare input data
        input_data = {}
        
        # Required fields with defaults
        defaults = {
            'latitude': 13.0827, 'longitude': 80.2707,  # Chennai center
            'hour': 12, 'month': 6, 'day_of_week': 1,
            'crime_count_6mo': 0, 'police_distance_km': 2.0,
            'cctv_present': 0, 'eyewitness_reports': 0,
            'victims_count': 1, 'community_reports': 0,
            'safety_score': 5.0, 'proximity_to_route_km': 0.5,
            'crime_type': 'theft', 'lighting': 'Good',
            'road_type': 'Main Road', 'victims_age_group': 'Adult',
            'victims_gender': 'Male', 'severity_level': 'Low',
            'jurisdiction': 'Chennai Central'
        }
        
        # Use provided data or defaults
        for key, default_value in defaults.items():
            input_data[key] = location_data.get(key, default_value)
        
        # Encode categorical variables
        for col, encoder in self.label_encoders.items():
            try:
                input_data[f'{col}_encoded'] = encoder.transform([str(input_data[col])])[0]
            except ValueError:
                # Use most common value if not found
                input_data[f'{col}_encoded'] = 0
        
        # Create feature vector
        feature_vector = []
        for col in self.feature_columns:
            feature_vector.append(input_data.get(col, 0))
        
        # Scale and predict
        X_scaled = self.scaler.transform([feature_vector])
        
        # Get predictions
        crime_count_pred = self.regressor.predict(X_scaled)[0]
        crime_risk_prob = self.classifier.predict_proba(X_scaled)[0]
        
        return {
            'predicted_crime_count': round(crime_count_pred, 2),
            'high_risk_probability': round(crime_risk_prob[1] * 100, 2),
            'risk_level': 'HIGH' if crime_risk_prob[1] > 0.6 else 'MEDIUM' if crime_risk_prob[1] > 0.4 else 'LOW',
            'safety_recommendation': self.get_safety_recommendation(crime_risk_prob[1], input_data)
        }
    
    def get_safety_recommendation(self, risk_prob, location_data):
        """Generate safety recommendations based on risk"""
        recommendations = []
        
        if risk_prob > 0.6:
            recommendations.append("🚨 AVOID this area - High crime risk!")
        elif risk_prob > 0.4:
            recommendations.append("⚠️ Exercise caution - Medium risk area")
        else:
            recommendations.append("✅ Relatively safe area")
            
        if location_data.get('cctv_present', 0) == 0:
            recommendations.append("📹 No CCTV detected - Stay alert")
            
        if location_data.get('lighting') == 'Poor':
            recommendations.append("💡 Poor lighting - Avoid after dark")
            
        if location_data.get('police_distance_km', 0) > 3:
            recommendations.append("👮 Police station far - Emergency response may be slow")
            
        return " | ".join(recommendations)

def main():
    """Main function to train and test the model"""
    print("🤖 CHENNAI CRIME ML MODEL")
    print("=" * 50)
    
    # Initialize model
    model = ChennaiCrimeMLModel()
    
    # Check if models exist
    if not model.load_models():
        # Train new models
        csv_path = 'chennai_crime_dataset.csv'
        if not os.path.exists(csv_path):
            print(f"❌ Dataset file '{csv_path}' not found!")
            return
            
        df = model.load_and_preprocess_data(csv_path)
        model.train_models(df)
    
    # Test predictions
    print("\n🎯 TESTING PREDICTIONS:")
    print("-" * 30)
    
    # Test case 1: Safe area
    safe_location = {
        'latitude': 13.0827, 'longitude': 80.2707,
        'hour': 14, 'month': 6, 'cctv_present': 1,
        'lighting': 'Good', 'police_distance_km': 1.0,
        'safety_score': 8.0
    }
    
    result1 = model.predict_crime_risk(safe_location)
    print(f"📍 Safe Area Prediction: {result1}")
    
    # Test case 2: Risky area
    risky_location = {
        'latitude': 13.0827, 'longitude': 80.2707,
        'hour': 22, 'month': 12, 'cctv_present': 0,
        'lighting': 'Poor', 'police_distance_km': 5.0,
        'safety_score': 2.0
    }
    
    result2 = model.predict_crime_risk(risky_location)
    print(f"📍 Risky Area Prediction: {result2}")
    
    print("\n✅ ML Model ready for use!")
    print("💡 Use model.predict_crime_risk(location_data) for predictions")

if __name__ == "__main__":
    main()
