# -*- coding: utf-8 -*-
"""CPAA.ipynb - Crime Prediction and Analysis Algorithm

Fixed version of the original Colab notebook for local execution.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

print("🚀 Starting CPAA - Crime Prediction and Analysis Algorithm")
print("=" * 60)

# Load dataset
print("📊 Loading Chennai Crime Dataset...")
try:
    df = pd.read_csv('chennai_crime_dataset.csv', skiprows=1)  # Skip extra header row
    print(f"✅ Dataset loaded successfully! Shape: {df.shape}")
except FileNotFoundError:
    print("❌ Dataset file 'chennai_crime_dataset.csv' not found!")
    exit(1)

print(f"📋 Columns: {list(df.columns)}")
print(f"📊 Data types:\n{df.dtypes}")

# Data preprocessing
print("\n🔧 Data Preprocessing...")

# Handle missing values
print("🔍 Checking for missing values...")
missing_values = df.isnull().sum()
print(f"Missing values:\n{missing_values[missing_values > 0]}")

# Fill missing values
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
df['hour_of_day'] = df['reported_datetime'].dt.hour
df['day_of_week'] = df['reported_datetime'].dt.dayofweek
df['month'] = df['reported_datetime'].dt.month

# Drop columns that are identifiers or not useful for modeling
cols_to_drop = ['crime_id', 'reported_datetime', 'road_name', 'road_segment_id', 
                'affected_route_id', 'affected_segments', 'sanitized_description']

# Only drop columns that exist
cols_to_drop = [col for col in cols_to_drop if col in df.columns]
df = df.drop(columns=cols_to_drop)

print(f"✅ Columns dropped: {cols_to_drop}")
print(f"📊 Remaining columns: {list(df.columns)}")

# Identify categorical and numerical columns
categorical_cols = df.select_dtypes(include='object').columns.tolist()
numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()

print(f"📊 Categorical columns: {categorical_cols}")
print(f"📊 Numerical columns: {numerical_cols}")

# Apply label encoding to categorical features (more efficient than one-hot)
print("\n🏷️ Applying label encoding to categorical features...")
label_encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    label_encoders[col] = le
    print(f"✅ Encoded {col}: {len(le.classes_)} unique values")

# Apply StandardScaler to numerical features AFTER encoding (excluding target variable)
print("\n📏 Applying StandardScaler to numerical features...")
# Remove target variable from numerical columns for scaling
numerical_cols_for_scaling = [col for col in numerical_cols if col != 'crime_count_6mo']
scaler = StandardScaler()
df[numerical_cols_for_scaling] = scaler.fit_transform(df[numerical_cols_for_scaling])
print(f"✅ Scaled {len(numerical_cols_for_scaling)} numerical columns (excluding target)")

print(f"\n📊 Final dataset shape: {df.shape}")
print(f"📊 Final columns: {list(df.columns)}")

# Display sample of processed data
print("\n📋 Sample of processed data:")
print(df.head())

# Model Training Section
print("\n🤖 MODEL TRAINING")
print("=" * 40)

# Define features (X) and target (y)
# Assuming 'crime_count_6mo' is the target variable
if 'crime_count_6mo' in df.columns:
    X = df.drop('crime_count_6mo', axis=1)
    y = df['crime_count_6mo']
    
    print(f"📊 Features shape: {X.shape}")
    print(f"📊 Target shape: {y.shape}")

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"✅ Training set shape: {X_train.shape}")
    print(f"✅ Testing set shape: {X_test.shape}")

    # Linear Regression Model
    print("\n📈 Training Linear Regression Model...")
    lr_model = LinearRegression()
    lr_model.fit(X_train, y_train)

    # Make predictions
    y_pred = lr_model.predict(X_test)

    # Evaluate the model
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)

    print(f"📊 Linear Regression Results:")
    print(f"   Mean Squared Error (MSE): {mse:.4f}")
    print(f"   Root Mean Squared Error (RMSE): {rmse:.4f}")
    print(f"   R-squared (R2): {r2:.4f}")
    print(f"   Mean Absolute Error (MAE): {mae:.4f}")

    # Random Forest Regressor
    print("\n🌲 Training Random Forest Regressor...")
    rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_regressor.fit(X_train, y_train)

    y_pred_rf = rf_regressor.predict(X_test)

    mse_rf = mean_squared_error(y_test, y_pred_rf)
    rmse_rf = np.sqrt(mse_rf)
    r2_rf = r2_score(y_test, y_pred_rf)
    mae_rf = mean_absolute_error(y_test, y_pred_rf)

    print(f"📊 Random Forest Regressor Results:")
    print(f"   Mean Squared Error (MSE): {mse_rf:.4f}")
    print(f"   Root Mean Squared Error (RMSE): {rmse_rf:.4f}")
    print(f"   R-squared (R2): {r2_rf:.4f}")
    print(f"   Mean Absolute Error (MAE): {mae_rf:.4f}")

    # Feature Importance
    print("\n🎯 Feature Importance (Random Forest):")
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': rf_regressor.feature_importances_
    }).sort_values('importance', ascending=False)

    print(feature_importance.head(10))

else:
    print("❌ Target column 'crime_count_6mo' not found!")
    print(f"Available columns: {list(df.columns)}")

# Classification Model
print("\n🎯 CLASSIFICATION MODEL")
print("=" * 40)

if 'crime_count_6mo' in df.columns:
    # Create classification target
    threshold = df['crime_count_6mo'].median()
    df['crime_level'] = df['crime_count_6mo'].apply(lambda x: 'High Crime' if x > threshold else 'Low Crime')
    
    print(f"📊 Crime Level Distribution:")
    print(df['crime_level'].value_counts())
    
    # Prepare data for classification
    X_cls = df.drop(['crime_count_6mo', 'crime_level'], axis=1)
    y_cls = df['crime_level']
    
    X_train_cls, X_test_cls, y_train_cls, y_test_cls = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    
    # Logistic Regression
    print("\n📊 Training Logistic Regression Classifier...")
    lr_classifier = LogisticRegression(random_state=42, max_iter=1000)
    lr_classifier.fit(X_train_cls, y_train_cls)
    
    y_pred_cls = lr_classifier.predict(X_test_cls)
    
    accuracy = accuracy_score(y_test_cls, y_pred_cls)
    precision = precision_score(y_test_cls, y_pred_cls, average='weighted')
    recall = recall_score(y_test_cls, y_pred_cls, average='weighted')
    f1 = f1_score(y_test_cls, y_pred_cls, average='weighted')
    
    print(f"📊 Logistic Regression Classification Results:")
    print(f"   Accuracy: {accuracy:.4f}")
    print(f"   Precision: {precision:.4f}")
    print(f"   Recall: {recall:.4f}")
    print(f"   F1-Score: {f1:.4f}")
    
    # Random Forest Classifier
    print("\n🌲 Training Random Forest Classifier...")
    rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_classifier.fit(X_train_cls, y_train_cls)
    
    y_pred_rf_cls = rf_classifier.predict(X_test_cls)
    
    accuracy_rf = accuracy_score(y_test_cls, y_pred_rf_cls)
    precision_rf = precision_score(y_test_cls, y_pred_rf_cls, average='weighted')
    recall_rf = recall_score(y_test_cls, y_pred_rf_cls, average='weighted')
    f1_rf = f1_score(y_test_cls, y_pred_rf_cls, average='weighted')
    
    print(f"📊 Random Forest Classification Results:")
    print(f"   Accuracy: {accuracy_rf:.4f}")
    print(f"   Precision: {precision_rf:.4f}")
    print(f"   Recall: {recall_rf:.4f}")
    print(f"   F1-Score: {f1_rf:.4f}")
    
    # Save the trained models
    print("\n💾 Saving trained models...")
    os.makedirs('models', exist_ok=True)
    
    # Save the best regression model (Random Forest)
    joblib.dump(rf_regressor, 'models/crime_model.pkl')
    print("✅ Saved Random Forest Regressor model")
    
    # Save the scaler (only for numerical features)
    joblib.dump(scaler, 'models/scaler.pkl')
    print("✅ Saved StandardScaler")
    
    # Save label encoders
    joblib.dump(label_encoders, 'models/label_encoders.pkl')
    print("✅ Saved Label Encoders")
    
    # Save feature columns
    joblib.dump(X.columns.tolist(), 'models/feature_columns.pkl')
    print("✅ Saved Feature Columns")
    
    # Save numerical columns for scaler (excluding target variable)
    joblib.dump(numerical_cols_for_scaling, 'models/numerical_columns.pkl')
    print("✅ Saved Numerical Columns (excluding target)")
    
    print("🎯 All models saved successfully!")

# Crime Analysis
print("\n📊 CRIME ANALYSIS")
print("=" * 40)

# Load original data for analysis
df_original = pd.read_csv('chennai_crime_dataset.csv', skiprows=1)

print("🔍 Crime Type Analysis:")
crime_types = df_original['crime_type'].value_counts()
print(crime_types.head(10))

print("\n⏰ Time-based Analysis:")
df_original['reported_datetime'] = pd.to_datetime(df_original['reported_datetime'])
df_original['hour'] = df_original['reported_datetime'].dt.hour
df_original['day_of_week'] = df_original['reported_datetime'].dt.day_name()

print("Crimes by hour:")
hourly_crimes = df_original['hour'].value_counts().sort_index()
print(hourly_crimes)

print("\nCrimes by day of week:")
daily_crimes = df_original['day_of_week'].value_counts()
print(daily_crimes)

print("\n📍 Location Analysis:")
jurisdictions = df_original['jurisdiction'].value_counts()
print(jurisdictions)

print("\n🎯 SUMMARY")
print("=" * 40)
print("✅ CPAA - Crime Prediction and Analysis Algorithm completed successfully!")
print("📊 Models trained:")
print("   - Linear Regression (Regression)")
print("   - Random Forest Regressor (Regression)")
print("   - Logistic Regression (Classification)")
print("   - Random Forest Classifier (Classification)")
print("📈 Analysis completed:")
print("   - Crime type distribution")
print("   - Time-based patterns")
print("   - Location analysis")
print("   - Feature importance")
print("\n🚀 Your ML model is ready for crime prediction!")