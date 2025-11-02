#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ML Model Accuracy Testing Script
Tests the crime prediction model with various scenarios and calculates accuracy metrics
"""

import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import joblib
import os
from ml_model import ChennaiCrimeMLModel

def test_model_accuracy():
    """Test the ML model accuracy with the dataset"""
    print("=" * 60)
    print("🧪 CHENNAI CRIME ML MODEL - ACCURACY TESTING")
    print("=" * 60)
    
    # Initialize model
    model = ChennaiCrimeMLModel()
    
    # Load dataset
    csv_path = 'chennai_crime_dataset.csv'
    if not os.path.exists(csv_path):
        print(f"❌ Dataset file '{csv_path}' not found!")
        return
    
    print("\n📊 Loading and preprocessing dataset...")
    df = model.load_and_preprocess_data(csv_path)
    print(f"✅ Dataset loaded: {len(df)} records")
    
    # Prepare features and targets
    X = df[model.feature_columns].fillna(0)
    y_regression = df['crime_count_6mo']
    y_classification = (df['crime_count_6mo'] > df['crime_count_6mo'].median()).astype(int)
    
    # Split data
    X_train, X_test, y_train_reg, y_test_reg = train_test_split(
        X, y_regression, test_size=0.2, random_state=42
    )
    _, _, y_train_cls, y_test_cls = train_test_split(
        X, y_classification, test_size=0.2, random_state=42
    )
    
    print(f"📊 Training set: {len(X_train)} records")
    print(f"📊 Test set: {len(X_test)} records")
    
    # Train models
    print("\n🤖 Training models...")
    X_train_scaled = model.scaler.fit_transform(X_train)
    X_test_scaled = model.scaler.transform(X_test)
    
    model.regressor.fit(X_train_scaled, y_train_reg)
    model.classifier.fit(X_train_scaled, y_train_cls)
    model.is_trained = True
    
    # Save models
    model.save_models()
    
    # Test Regression Model
    print("\n" + "=" * 60)
    print("📈 REGRESSION MODEL (Crime Count Prediction)")
    print("=" * 60)
    
    y_pred_reg = model.regressor.predict(X_test_scaled)
    
    mse = mean_squared_error(y_test_reg, y_pred_reg)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test_reg, y_pred_reg)
    mae = np.mean(np.abs(y_test_reg - y_pred_reg))
    
    print(f"📊 Mean Squared Error (MSE): {mse:.4f}")
    print(f"📊 Root Mean Squared Error (RMSE): {rmse:.4f}")
    print(f"📊 Mean Absolute Error (MAE): {mae:.4f}")
    print(f"📊 R² Score: {r2:.4f}")
    print(f"📊 Model explains {r2*100:.2f}% of variance in crime counts")
    
    # Test Classification Model
    print("\n" + "=" * 60)
    print("🎯 CLASSIFICATION MODEL (High/Low Risk)")
    print("=" * 60)
    
    y_pred_cls = model.classifier.predict(X_test_scaled)
    y_pred_proba = model.classifier.predict_proba(X_test_scaled)
    
    accuracy = accuracy_score(y_test_cls, y_pred_cls)
    precision = precision_score(y_test_cls, y_pred_cls, average='binary')
    recall = recall_score(y_test_cls, y_pred_cls, average='binary')
    f1 = f1_score(y_test_cls, y_pred_cls, average='binary')
    
    print(f"📊 Accuracy: {accuracy*100:.2f}%")
    print(f"📊 Precision: {precision*100:.2f}%")
    print(f"📊 Recall: {recall*100:.2f}%")
    print(f"📊 F1 Score: {f1*100:.2f}%")
    
    # Feature Importance
    print("\n" + "=" * 60)
    print("🔍 TOP 10 MOST IMPORTANT FEATURES")
    print("=" * 60)
    
    feature_importance = model.classifier.feature_importances_
    feature_names = model.feature_columns
    
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': feature_importance
    }).sort_values('importance', ascending=False)
    
    for idx, row in importance_df.head(10).iterrows():
        print(f"📌 {row['feature']}: {row['importance']:.4f}")
    
    # Test with sample scenarios
    print("\n" + "=" * 60)
    print("🧪 TESTING SAMPLE SCENARIOS")
    print("=" * 60)
    
    test_scenarios = [
        {
            'name': 'Safe Area - Daytime, Good Lighting, CCTV',
            'data': {
                'latitude': 13.0827, 'longitude': 80.2707,
                'hour': 14, 'month': 6, 'cctv_present': 1,
                'lighting': 'Good', 'police_distance_km': 1.0,
                'safety_score': 8.0, 'crime_count_6mo': 2
            }
        },
        {
            'name': 'Risky Area - Night, Poor Lighting, No CCTV',
            'data': {
                'latitude': 13.0827, 'longitude': 80.2707,
                'hour': 22, 'month': 12, 'cctv_present': 0,
                'lighting': 'Poor', 'police_distance_km': 5.0,
                'safety_score': 2.0, 'crime_count_6mo': 15
            }
        },
        {
            'name': 'Medium Risk - Evening, Moderate Lighting',
            'data': {
                'latitude': 13.0827, 'longitude': 80.2707,
                'hour': 18, 'month': 8, 'cctv_present': 1,
                'lighting': 'Moderate', 'police_distance_km': 2.5,
                'safety_score': 5.0, 'crime_count_6mo': 7
            }
        },
        {
            'name': 'High Crime History Area',
            'data': {
                'latitude': 13.0827, 'longitude': 80.2707,
                'hour': 20, 'month': 11, 'cctv_present': 0,
                'lighting': 'Poor', 'police_distance_km': 4.0,
                'safety_score': 3.0, 'crime_count_6mo': 20
            }
        }
    ]
    
    for scenario in test_scenarios:
        print(f"\n📍 {scenario['name']}")
        print("-" * 60)
        result = model.predict_crime_risk(scenario['data'])
        print(f"   Predicted Crime Count: {result['predicted_crime_count']}")
        print(f"   High Risk Probability: {result['high_risk_probability']}%")
        print(f"   Risk Level: {result['risk_level']}")
        print(f"   Recommendation: {result['safety_recommendation']}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"✅ Classification Accuracy: {accuracy*100:.2f}%")
    print(f"✅ Regression R² Score: {r2:.4f}")
    print(f"✅ Model is {'GOOD' if accuracy > 0.75 else 'NEEDS IMPROVEMENT'}")
    print(f"✅ Prediction Error (RMSE): {rmse:.2f} crimes")
    print("\n💾 Models saved and ready for API use!")
    print("=" * 60)

if __name__ == "__main__":
    test_model_accuracy()
