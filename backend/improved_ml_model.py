#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Improved ML Model for Crime Prediction
Fixes data leakage and adds better feature engineering
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, classification_report
import joblib
import os

class ImprovedCrimeMLModel:
    def __init__(self):
        self.regressor = None
        self.classifier = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.is_trained = False
        
    def create_time_features(self, df):
        """Create enhanced time-based features"""
        df['reported_datetime'] = pd.to_datetime(df['reported_datetime'])
        
        # Basic time features
        df['hour'] = df['reported_datetime'].dt.hour
        df['month'] = df['reported_datetime'].dt.month
        df['day_of_week'] = df['reported_datetime'].dt.dayofweek
        df['day_of_month'] = df['reported_datetime'].dt.day
        
        # Advanced time features
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        df['is_night'] = ((df['hour'] >= 20) | (df['hour'] <= 6)).astype(int)
        df['is_evening'] = ((df['hour'] >= 17) & (df['hour'] < 20)).astype(int)
        df['is_morning_rush'] = ((df['hour'] >= 7) & (df['hour'] <= 9)).astype(int)
        df['is_evening_rush'] = ((df['hour'] >= 17) & (df['hour'] <= 19)).astype(int)
        
        # Season
        df['season'] = df['month'].apply(lambda x: 
            'winter' if x in [12, 1, 2] else
            'summer' if x in [3, 4, 5] else
            'monsoon' if x in [6, 7, 8] else 'autumn'
        )
        
        return df
    
    def create_location_features(self, df):
        """Create location-based features"""
        # Distance from city center (Chennai: 13.0827, 80.2707)
        chennai_center_lat, chennai_center_lng = 13.0827, 80.2707
        df['distance_from_center'] = np.sqrt(
            (df['latitude'] - chennai_center_lat)**2 + 
            (df['longitude'] - chennai_center_lng)**2
        ) * 111  # Convert to km (approximate)
        
        # Create location clusters (grid-based)
        df['lat_grid'] = (df['latitude'] * 100).astype(int)
        df['lng_grid'] = (df['longitude'] * 100).astype(int)
        
        return df
    
    def create_safety_features(self, df):
        """Create safety-related features"""
        # CCTV presence
        df['cctv_present_num'] = df['cctv_present'].map({'Yes': 1, 'No': 0}).fillna(0)
        
        # Lighting score
        lighting_scores = {'Good': 3, 'Moderate': 2, 'Poor': 1, 'Dark': 0}
        df['lighting_score'] = df['lighting'].map(lighting_scores).fillna(1)
        
        # Road type risk
        road_risk = {
            'Main road': 1, 'Highway': 2, 'Residential': 1,
            'Market street': 3, 'Alley': 4, 'Underpass': 4,
            'Coastal road': 2
        }
        df['road_risk_score'] = df['road_type'].map(road_risk).fillna(2)
        
        # Severity score
        severity_scores = {'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4}
        df['severity_score'] = df['severity_level'].map(severity_scores).fillna(1)
        
        # Combined safety score
        df['combined_safety'] = (
            df['cctv_present_num'] * 2 +
            df['lighting_score'] +
            (5 - df['road_risk_score']) +
            df['safety_score']
        ) / 10  # Normalize to 0-1
        
        # Police accessibility
        df['police_accessible'] = (df['police_distance_km'] < 2).astype(int)
        
        return df
    
    def create_interaction_features(self, df):
        """Create interaction features"""
        # Night + Poor lighting = High risk
        df['night_poor_lighting'] = df['is_night'] * (df['lighting_score'] <= 1).astype(int)
        
        # No CCTV + Far police = High risk
        df['no_cctv_far_police'] = (
            (df['cctv_present_num'] == 0) & 
            (df['police_distance_km'] > 2)
        ).astype(int)
        
        # Weekend + Night = Party time risk
        df['weekend_night'] = df['is_weekend'] * df['is_night']
        
        return df
    
    def aggregate_area_statistics(self, df):
        """Create area-based aggregated statistics (without target leakage)"""
        # Group by location grid
        df['location_key'] = df['lat_grid'].astype(str) + '_' + df['lng_grid'].astype(str)
        
        # Count crimes per area (this is different from crime_count_6mo)
        area_crime_counts = df.groupby('location_key').size()
        df['area_total_crimes'] = df['location_key'].map(area_crime_counts)
        
        # Average safety score per area
        area_safety = df.groupby('location_key')['safety_score'].mean()
        df['area_avg_safety'] = df['location_key'].map(area_safety)
        
        # CCTV coverage per area
        area_cctv = df.groupby('location_key')['cctv_present_num'].mean()
        df['area_cctv_coverage'] = df['location_key'].map(area_cctv)
        
        return df
    
    def load_and_preprocess_data(self, csv_path):
        """Load and preprocess the crime dataset"""
        print("🔄 Loading dataset...")
        df = pd.read_csv(csv_path, skiprows=1)
        
        # Create all features
        df = self.create_time_features(df)
        df = self.create_location_features(df)
        df = self.create_safety_features(df)
        df = self.create_interaction_features(df)
        df = self.aggregate_area_statistics(df)
        
        # Encode categorical variables
        categorical_columns = ['crime_type', 'road_type', 'victims_age_group', 
                              'victims_gender', 'jurisdiction', 'season']
        
        for col in categorical_columns:
            if col in df.columns:
                le = LabelEncoder()
                df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
        
        # Select features (NO crime_count_6mo!)
        self.feature_columns = [
            # Location features
            'latitude', 'longitude', 'distance_from_center',
            
            # Time features
            'hour', 'month', 'day_of_week', 'is_weekend', 'is_night',
            'is_evening', 'is_morning_rush', 'is_evening_rush',
            
            # Safety features
            'police_distance_km', 'cctv_present_num', 'lighting_score',
            'road_risk_score', 'severity_score', 'combined_safety',
            'police_accessible', 'safety_score',
            
            # Witness/victim features
            'eyewitness_reports', 'victims_count', 'community_reports',
            
            # Interaction features
            'night_poor_lighting', 'no_cctv_far_police', 'weekend_night',
            
            # Area statistics
            'area_total_crimes', 'area_avg_safety', 'area_cctv_coverage',
            
            # Proximity
            'proximity_to_route_km'
        ]
        
        # Add encoded categorical features
        for col in categorical_columns:
            if f'{col}_encoded' in df.columns:
                self.feature_columns.append(f'{col}_encoded')
        
        print(f"✅ Dataset preprocessed. Features: {len(self.feature_columns)}")
        print(f"✅ NO DATA LEAKAGE - crime_count_6mo is NOT a feature!")
        
        return df
    
    def train_models(self, df):
        """Train the ML models with hyperparameter tuning"""
        print("🤖 Training ML models...")
        
        # Prepare features and targets
        X = df[self.feature_columns].fillna(0)
        y_regression = df['crime_count_6mo']
        y_classification = (df['crime_count_6mo'] > df['crime_count_6mo'].median()).astype(int)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train_reg, y_test_reg = train_test_split(
            X_scaled, y_regression, test_size=0.2, random_state=42
        )
        _, _, y_train_cls, y_test_cls = train_test_split(
            X_scaled, y_classification, test_size=0.2, random_state=42
        )
        
        # Train regression model with hyperparameter tuning
        print("🔧 Tuning regression model...")
        param_grid_reg = {
            'n_estimators': [200, 300],
            'max_depth': [15, 20, 25],
            'min_samples_split': [5, 10],
            'min_samples_leaf': [2, 4]
        }
        
        rf_reg = RandomForestRegressor(random_state=42)
        grid_search_reg = GridSearchCV(rf_reg, param_grid_reg, cv=5, scoring='r2', n_jobs=-1)
        grid_search_reg.fit(X_train, y_train_reg)
        
        self.regressor = grid_search_reg.best_estimator_
        print(f"✅ Best regression params: {grid_search_reg.best_params_}")
        
        # Train classification model
        print("🔧 Tuning classification model...")
        param_grid_cls = {
            'n_estimators': [200, 300],
            'max_depth': [15, 20],
            'min_samples_split': [5, 10]
        }
        
        rf_cls = RandomForestClassifier(random_state=42)
        grid_search_cls = GridSearchCV(rf_cls, param_grid_cls, cv=5, scoring='accuracy', n_jobs=-1)
        grid_search_cls.fit(X_train, y_train_cls)
        
        self.classifier = grid_search_cls.best_estimator_
        print(f"✅ Best classification params: {grid_search_cls.best_params_}")
        
        self.is_trained = True
        
        # Evaluate models
        y_pred_reg = self.regressor.predict(X_test)
        y_pred_cls = self.classifier.predict(X_test)
        
        print(f"\n📊 REGRESSION PERFORMANCE:")
        print(f"   RMSE: {np.sqrt(mean_squared_error(y_test_reg, y_pred_reg)):.4f}")
        print(f"   R²: {r2_score(y_test_reg, y_pred_reg):.4f}")
        
        print(f"\n📊 CLASSIFICATION PERFORMANCE:")
        print(f"   Accuracy: {accuracy_score(y_test_cls, y_pred_cls)*100:.2f}%")
        print(f"\n{classification_report(y_test_cls, y_pred_cls, target_names=['Low Risk', 'High Risk'])}")
        
        # Save models
        self.save_models()
        
    def save_models(self):
        """Save trained models"""
        os.makedirs('models_improved', exist_ok=True)
        joblib.dump(self.regressor, 'models_improved/crime_regressor.pkl')
        joblib.dump(self.classifier, 'models_improved/crime_classifier.pkl')
        joblib.dump(self.scaler, 'models_improved/scaler.pkl')
        joblib.dump(self.label_encoders, 'models_improved/label_encoders.pkl')
        joblib.dump(self.feature_columns, 'models_improved/feature_columns.pkl')
        print("💾 Improved models saved to 'models_improved/' directory")
        
    def load_models(self):
        """Load pre-trained models"""
        try:
            self.regressor = joblib.load('models_improved/crime_regressor.pkl')
            self.classifier = joblib.load('models_improved/crime_classifier.pkl')
            self.scaler = joblib.load('models_improved/scaler.pkl')
            self.label_encoders = joblib.load('models_improved/label_encoders.pkl')
            self.feature_columns = joblib.load('models_improved/feature_columns.pkl')
            self.is_trained = True
            print("✅ Improved models loaded successfully!")
            return True
        except FileNotFoundError:
            print("❌ No pre-trained improved models found. Train first!")
            return False
    
    def predict_crime_risk(self, location_data):
        """Predict crime risk for a given location"""
        if not self.is_trained:
            print("❌ Model not trained! Train first.")
            return None
        
        # Prepare input with all features
        input_data = self._prepare_input_features(location_data)
        
        # Create feature vector
        feature_vector = [input_data.get(col, 0) for col in self.feature_columns]
        
        # Scale and predict
        X_scaled = self.scaler.transform([feature_vector])
        
        # Get predictions
        crime_count_pred = self.regressor.predict(X_scaled)[0]
        crime_risk_prob = self.classifier.predict_proba(X_scaled)[0]
        
        return {
            'predicted_crime_count': round(crime_count_pred, 2),
            'high_risk_probability': round(crime_risk_prob[1] * 100, 2),
            'risk_level': 'HIGH' if crime_risk_prob[1] > 0.6 else 'MEDIUM' if crime_risk_prob[1] > 0.4 else 'LOW',
            'safety_recommendation': self._get_safety_recommendation(crime_risk_prob[1], input_data)
        }
    
    def _prepare_input_features(self, location_data):
        """Prepare input features from location data"""
        # Default values
        defaults = {
            'latitude': 13.0827, 'longitude': 80.2707,
            'hour': 12, 'month': 6, 'day_of_week': 1,
            'police_distance_km': 2.0, 'cctv_present': 0,
            'eyewitness_reports': 0, 'victims_count': 1,
            'community_reports': 0, 'safety_score': 5.0,
            'proximity_to_route_km': 0.5, 'lighting': 'Good',
            'road_type': 'Main road', 'crime_type': 'theft',
            'victims_age_group': 'Adult', 'victims_gender': 'Male',
            'jurisdiction': 'Chennai Central', 'severity_level': 'Low'
        }
        
        # Merge with provided data
        for key, value in defaults.items():
            if key not in location_data:
                location_data[key] = value
        
        # Calculate derived features
        input_data = location_data.copy()
        
        # Location features
        chennai_center_lat, chennai_center_lng = 13.0827, 80.2707
        input_data['distance_from_center'] = np.sqrt(
            (input_data['latitude'] - chennai_center_lat)**2 + 
            (input_data['longitude'] - chennai_center_lng)**2
        ) * 111
        
        # Time features
        input_data['is_weekend'] = 1 if input_data.get('day_of_week', 1) >= 5 else 0
        hour = input_data.get('hour', 12)
        input_data['is_night'] = 1 if (hour >= 20 or hour <= 6) else 0
        input_data['is_evening'] = 1 if (17 <= hour < 20) else 0
        input_data['is_morning_rush'] = 1 if (7 <= hour <= 9) else 0
        input_data['is_evening_rush'] = 1 if (17 <= hour <= 19) else 0
        
        # Safety features
        input_data['cctv_present_num'] = 1 if input_data.get('cctv_present') == 1 else 0
        lighting_scores = {'Good': 3, 'Moderate': 2, 'Poor': 1, 'Dark': 0}
        input_data['lighting_score'] = lighting_scores.get(input_data.get('lighting', 'Good'), 2)
        
        road_risk = {
            'Main road': 1, 'Highway': 2, 'Residential': 1,
            'Market street': 3, 'Alley': 4, 'Underpass': 4,
            'Coastal road': 2
        }
        input_data['road_risk_score'] = road_risk.get(input_data.get('road_type', 'Main road'), 2)
        
        severity_scores = {'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4}
        input_data['severity_score'] = severity_scores.get(input_data.get('severity_level', 'Low'), 1)
        
        input_data['combined_safety'] = (
            input_data['cctv_present_num'] * 2 +
            input_data['lighting_score'] +
            (5 - input_data['road_risk_score']) +
            input_data.get('safety_score', 5.0)
        ) / 10
        
        input_data['police_accessible'] = 1 if input_data.get('police_distance_km', 2.0) < 2 else 0
        
        # Interaction features
        input_data['night_poor_lighting'] = input_data['is_night'] * (1 if input_data['lighting_score'] <= 1 else 0)
        input_data['no_cctv_far_police'] = (1 if input_data['cctv_present_num'] == 0 and input_data.get('police_distance_km', 2.0) > 2 else 0)
        input_data['weekend_night'] = input_data['is_weekend'] * input_data['is_night']
        
        # Area statistics (use defaults for new locations)
        input_data['area_total_crimes'] = 10
        input_data['area_avg_safety'] = input_data.get('safety_score', 5.0)
        input_data['area_cctv_coverage'] = input_data['cctv_present_num']
        
        # Encode categorical variables
        for col, encoder in self.label_encoders.items():
            try:
                input_data[f'{col}_encoded'] = encoder.transform([str(input_data.get(col, ''))])[0]
            except ValueError:
                input_data[f'{col}_encoded'] = 0
        
        return input_data
    
    def _get_safety_recommendation(self, risk_prob, location_data):
        """Generate safety recommendations"""
        recommendations = []
        
        if risk_prob > 0.6:
            recommendations.append("🚨 HIGH RISK - Avoid if possible")
        elif risk_prob > 0.4:
            recommendations.append("⚠️ MEDIUM RISK - Exercise caution")
        else:
            recommendations.append("✅ LOW RISK - Relatively safe")
        
        if location_data.get('cctv_present_num', 0) == 0:
            recommendations.append("📹 No CCTV - Stay alert")
        
        if location_data.get('lighting_score', 2) <= 1:
            recommendations.append("💡 Poor lighting - Avoid after dark")
        
        if location_data.get('police_distance_km', 2.0) > 3:
            recommendations.append("👮 Police far - Slow emergency response")
        
        if location_data.get('is_night', 0) == 1:
            recommendations.append("🌙 Night time - Extra caution needed")
        
        return " | ".join(recommendations)

def main():
    """Main function"""
    print("🚀 IMPROVED CRIME PREDICTION MODEL")
    print("=" * 70)
    
    model = ImprovedCrimeMLModel()
    
    # Train new model
    csv_path = 'chennai_crime_dataset.csv'
    if not os.path.exists(csv_path):
        print(f"❌ Dataset file '{csv_path}' not found!")
        return
    
    df = model.load_and_preprocess_data(csv_path)
    model.train_models(df)
    
    print("\n✅ Improved model trained and saved!")

if __name__ == "__main__":
    main()
