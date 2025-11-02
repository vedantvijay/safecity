#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive ML Model Analysis and Improvement
Analyzes current model performance and suggests improvements
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import Ridge, Lasso
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    mean_squared_error, r2_score, mean_absolute_error,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns
from ml_model import ChennaiCrimeMLModel

def analyze_dataset():
    """Analyze the dataset for quality and patterns"""
    print("=" * 80)
    print("📊 DATASET ANALYSIS")
    print("=" * 80)
    
    df = pd.read_csv('chennai_crime_dataset.csv', skiprows=1)
    
    print(f"\n📈 Dataset Shape: {df.shape}")
    print(f"   Rows: {len(df)}")
    print(f"   Columns: {len(df.columns)}")
    
    print(f"\n📋 Column Names:")
    for i, col in enumerate(df.columns, 1):
        print(f"   {i}. {col}")
    
    print(f"\n🔍 Data Types:")
    print(df.dtypes)
    
    print(f"\n❓ Missing Values:")
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(missing[missing > 0])
    else:
        print("   ✅ No missing values!")
    
    print(f"\n📊 Crime Type Distribution:")
    crime_counts = df['crime_type'].value_counts()
    for crime, count in crime_counts.head(10).items():
        print(f"   {crime}: {count} ({count/len(df)*100:.1f}%)")
    
    print(f"\n📊 Target Variable (crime_count_6mo) Statistics:")
    print(f"   Mean: {df['crime_count_6mo'].mean():.2f}")
    print(f"   Median: {df['crime_count_6mo'].median():.2f}")
    print(f"   Std Dev: {df['crime_count_6mo'].std():.2f}")
    print(f"   Min: {df['crime_count_6mo'].min()}")
    print(f"   Max: {df['crime_count_6mo'].max()}")
    print(f"   Range: {df['crime_count_6mo'].max() - df['crime_count_6mo'].min()}")
    
    print(f"\n📊 Lighting Conditions:")
    print(df['lighting'].value_counts())
    
    print(f"\n📊 CCTV Coverage:")
    print(df['cctv_present'].value_counts())
    
    print(f"\n📊 Severity Levels:")
    print(df['severity_level'].value_counts())
    
    return df

def compare_models(X_train, X_test, y_train, y_test):
    """Compare different regression models"""
    print("\n" + "=" * 80)
    print("🤖 COMPARING DIFFERENT ML MODELS")
    print("=" * 80)
    
    models = {
        'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
        'Random Forest (200 trees)': RandomForestRegressor(n_estimators=200, random_state=42),
        'Random Forest (Deep)': RandomForestRegressor(n_estimators=100, max_depth=20, random_state=42),
        'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
        'Ridge Regression': Ridge(alpha=1.0),
        'Lasso Regression': Lasso(alpha=1.0)
    }
    
    results = []
    
    for name, model in models.items():
        print(f"\n🔄 Training {name}...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Cross-validation score
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
        cv_mean = cv_scores.mean()
        cv_std = cv_scores.std()
        
        results.append({
            'Model': name,
            'RMSE': rmse,
            'MAE': mae,
            'R²': r2,
            'CV R² Mean': cv_mean,
            'CV R² Std': cv_std
        })
        
        print(f"   RMSE: {rmse:.4f}")
        print(f"   MAE: {mae:.4f}")
        print(f"   R²: {r2:.4f}")
        print(f"   CV R² (5-fold): {cv_mean:.4f} (+/- {cv_std:.4f})")
    
    results_df = pd.DataFrame(results)
    print("\n" + "=" * 80)
    print("📊 MODEL COMPARISON SUMMARY")
    print("=" * 80)
    print(results_df.to_string(index=False))
    
    best_model = results_df.loc[results_df['R²'].idxmax()]
    print(f"\n🏆 BEST MODEL: {best_model['Model']}")
    print(f"   R² Score: {best_model['R²']:.4f}")
    print(f"   RMSE: {best_model['RMSE']:.4f}")
    
    return results_df

def analyze_feature_importance(model, feature_names):
    """Analyze and visualize feature importance"""
    print("\n" + "=" * 80)
    print("🔍 FEATURE IMPORTANCE ANALYSIS")
    print("=" * 80)
    
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        print("\n📊 Top 15 Most Important Features:")
        for i in range(min(15, len(feature_names))):
            idx = indices[i]
            print(f"   {i+1}. {feature_names[idx]}: {importances[idx]:.4f}")
        
        # Identify potentially problematic features
        print("\n⚠️ POTENTIAL ISSUES:")
        
        # Check if crime_count_6mo is being used as a feature (data leakage)
        if 'crime_count_6mo' in feature_names:
            crime_idx = feature_names.index('crime_count_6mo')
            if importances[crime_idx] > 0.5:
                print(f"   🚨 DATA LEAKAGE DETECTED!")
                print(f"   'crime_count_6mo' has {importances[crime_idx]:.2%} importance")
                print(f"   This is the TARGET variable - should NOT be a feature!")
                print(f"   This explains the unrealistically high accuracy!")
        
        # Check for other high-importance features
        for idx in indices[:5]:
            if importances[idx] > 0.3:
                print(f"   ⚠️ {feature_names[idx]} has very high importance ({importances[idx]:.2%})")
                print(f"      Consider if this feature would be available at prediction time")

def test_realistic_scenario(model):
    """Test model with realistic new data (no target leakage)"""
    print("\n" + "=" * 80)
    print("🧪 TESTING WITH REALISTIC NEW DATA (No Target Leakage)")
    print("=" * 80)
    
    # Create test scenarios WITHOUT crime_count_6mo
    scenarios = [
        {
            'name': 'Safe Residential Area - Daytime',
            'data': {
                'latitude': 13.0827, 'longitude': 80.2707,
                'hour': 14, 'month': 6, 'day_of_week': 1,
                'police_distance_km': 0.5, 'cctv_present': 1,
                'eyewitness_reports': 0, 'victims_count': 1,
                'community_reports': 0, 'safety_score': 8.0,
                'proximity_to_route_km': 0.1,
                'lighting': 'Good', 'road_type': 'Main road',
                'crime_type': 'theft'
            },
            'expected_risk': 'LOW'
        },
        {
            'name': 'High Risk Area - Night, Poor Lighting',
            'data': {
                'latitude': 13.0827, 'longitude': 80.2707,
                'hour': 23, 'month': 12, 'day_of_week': 5,
                'police_distance_km': 5.0, 'cctv_present': 0,
                'eyewitness_reports': 0, 'victims_count': 1,
                'community_reports': 0, 'safety_score': 2.0,
                'proximity_to_route_km': 2.0,
                'lighting': 'Dark', 'road_type': 'Alley',
                'crime_type': 'robbery'
            },
            'expected_risk': 'HIGH'
        }
    ]
    
    for scenario in scenarios:
        print(f"\n📍 {scenario['name']}")
        print("-" * 80)
        
        # Remove crime_count_6mo if it exists
        test_data = scenario['data'].copy()
        if 'crime_count_6mo' in test_data:
            del test_data['crime_count_6mo']
        
        result = model.predict_crime_risk(test_data)
        
        print(f"   Expected Risk: {scenario['expected_risk']}")
        print(f"   Predicted Risk: {result['risk_level']}")
        print(f"   Risk Probability: {result['high_risk_probability']}%")
        print(f"   Predicted Crime Count: {result['predicted_crime_count']}")
        
        if result['risk_level'] == scenario['expected_risk']:
            print(f"   ✅ Prediction matches expectation!")
        else:
            print(f"   ❌ Prediction does NOT match expectation!")

def main():
    """Main analysis function"""
    print("=" * 80)
    print("🔬 COMPREHENSIVE ML MODEL ANALYSIS")
    print("=" * 80)
    
    # 1. Analyze dataset
    df = analyze_dataset()
    
    # 2. Load and prepare model
    model = ChennaiCrimeMLModel()
    df_processed = model.load_and_preprocess_data('chennai_crime_dataset.csv')
    
    # 3. Check for data leakage
    print("\n" + "=" * 80)
    print("🔍 CHECKING FOR DATA LEAKAGE")
    print("=" * 80)
    print(f"\nFeatures being used: {len(model.feature_columns)}")
    print(f"Feature list: {model.feature_columns}")
    
    if 'crime_count_6mo' in model.feature_columns:
        print("\n🚨 CRITICAL ISSUE FOUND!")
        print("   'crime_count_6mo' is being used as BOTH:")
        print("   1. A FEATURE (input)")
        print("   2. The TARGET (output)")
        print("\n   This is DATA LEAKAGE - the model is 'cheating'!")
        print("   It's using the answer to predict the answer!")
        print("\n   This explains the 99.99% accuracy - it's not real!")
    
    # 4. Prepare data properly (without target leakage)
    print("\n" + "=" * 80)
    print("🔧 PREPARING DATA CORRECTLY (Removing Target Leakage)")
    print("=" * 80)
    
    # Remove crime_count_6mo from features if it exists
    feature_cols = [col for col in model.feature_columns if col != 'crime_count_6mo']
    print(f"\nCorrected features: {len(feature_cols)}")
    
    X = df_processed[feature_cols].fillna(0)
    y_regression = df_processed['crime_count_6mo']
    y_classification = (df_processed['crime_count_6mo'] > df_processed['crime_count_6mo'].median()).astype(int)
    
    # Split data
    X_train, X_test, y_train_reg, y_test_reg = train_test_split(
        X, y_regression, test_size=0.2, random_state=42
    )
    _, _, y_train_cls, y_test_cls = train_test_split(
        X, y_classification, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 5. Compare different models
    results_df = compare_models(X_train_scaled, X_test_scaled, y_train_reg, y_test_reg)
    
    # 6. Train best model and analyze
    print("\n" + "=" * 80)
    print("🎯 TRAINING FINAL MODEL (Without Data Leakage)")
    print("=" * 80)
    
    final_model = RandomForestRegressor(n_estimators=200, max_depth=20, random_state=42)
    final_model.fit(X_train_scaled, y_train_reg)
    
    y_pred = final_model.predict(X_test_scaled)
    
    print(f"\n📊 FINAL MODEL PERFORMANCE:")
    print(f"   RMSE: {np.sqrt(mean_squared_error(y_test_reg, y_pred)):.4f}")
    print(f"   MAE: {mean_absolute_error(y_test_reg, y_pred):.4f}")
    print(f"   R²: {r2_score(y_test_reg, y_pred):.4f}")
    
    # 7. Feature importance
    analyze_feature_importance(final_model, feature_cols)
    
    # 8. Test realistic scenarios
    test_realistic_scenario(model)
    
    # 9. Recommendations
    print("\n" + "=" * 80)
    print("💡 RECOMMENDATIONS FOR IMPROVEMENT")
    print("=" * 80)
    print("""
1. 🚨 FIX DATA LEAKAGE:
   - Remove 'crime_count_6mo' from feature list
   - This is the target variable and should NOT be used as input
   
2. 📊 IMPROVE FEATURE ENGINEERING:
   - Add time-based features (is_weekend, is_night, season)
   - Create interaction features (lighting × hour, cctv × police_distance)
   - Add neighborhood crime statistics (without target leakage)
   
3. 🎯 COLLECT MORE RELEVANT DATA:
   - Historical crime patterns (aggregated, not individual counts)
   - Demographic information
   - Economic indicators
   - Event data (festivals, holidays)
   
4. 🔧 MODEL IMPROVEMENTS:
   - Use ensemble methods (stacking, blending)
   - Hyperparameter tuning with GridSearchCV
   - Try deep learning models for complex patterns
   
5. ✅ VALIDATION:
   - Use time-based cross-validation (train on past, test on future)
   - Test on completely new areas
   - Monitor model drift over time
   
6. 📈 REALISTIC EXPECTATIONS:
   - Crime prediction is inherently difficult
   - Expect R² scores of 0.3-0.6 for real-world data
   - Focus on relative risk (high/medium/low) rather than exact counts
    """)
    
    print("\n" + "=" * 80)
    print("✅ ANALYSIS COMPLETE!")
    print("=" * 80)

if __name__ == "__main__":
    main()
