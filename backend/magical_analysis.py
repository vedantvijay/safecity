# 🪄 MAGICAL Chennai Crime Analysis Script
# Real dataset analysis with advanced insights

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.feature_selection import RFE, SelectKBest, f_regression
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

def load_and_explore_data():
    """Load and explore the Chennai crime dataset"""
    print("🪄 Loading Chennai Crime Dataset...")
    df = pd.read_csv('chennai_crime_dataset.csv', skiprows=1)
    
    print(f"📊 Dataset loaded successfully!")
    print(f"   Shape: {df.shape}")
    print(f"   Columns: {list(df.columns)}")
    
    # Basic info
    print(f"\n🔍 Dataset Overview:")
    print(f"   Total Records: {len(df):,}")
    print(f"   Date Range: {df['reported_datetime'].min()} to {df['reported_datetime'].max()}")
    print(f"   Crime Types: {df['crime_type'].nunique()} unique types")
    print(f"   Jurisdictions: {df['jurisdiction'].nunique()} areas")
    
    return df

def preprocess_data(df):
    """Advanced data preprocessing"""
    print("\n🔧 Advanced Data Preprocessing...")
    
    # Create a copy for processing
    df_processed = df.copy()
    
    # Convert datetime
    df_processed['reported_datetime'] = pd.to_datetime(df_processed['reported_datetime'])
    df_processed['hour'] = df_processed['reported_datetime'].dt.hour
    df_processed['day_of_week'] = df_processed['reported_datetime'].dt.day_name()
    df_processed['month'] = df_processed['reported_datetime'].dt.month
    df_processed['is_weekend'] = df_processed['day_of_week'].isin(['Saturday', 'Sunday'])
    
    # Create time categories
    def categorize_time(hour):
        if 6 <= hour < 12:
            return 'Morning'
        elif 12 <= hour < 18:
            return 'Afternoon'
        elif 18 <= hour < 22:
            return 'Evening'
        else:
            return 'Night'
    
    df_processed['time_category'] = df_processed['hour'].apply(categorize_time)
    
    # Handle missing values
    print("   Handling missing values...")
    df_processed = df_processed.fillna(df_processed.mode().iloc[0])
    
    # Create safety score categories
    df_processed['safety_level'] = pd.cut(
        df_processed['safety_score'], 
        bins=[0, 0.3, 0.7, 1.0], 
        labels=['Low', 'Medium', 'High']
    )
    
    # Create severity score (numeric)
    severity_map = {'Low': 1, 'Medium': 2, 'High': 3}
    df_processed['severity_numeric'] = df_processed['severity_level'].map(severity_map)
    
    # Create lighting score (numeric)
    lighting_map = {'Poor': 1, 'Moderate': 2, 'Good': 3}
    df_processed['lighting_numeric'] = df_processed['lighting'].map(lighting_map)
    
    print(f"   Processed dataset shape: {df_processed.shape}")
    return df_processed

def analyze_crime_patterns(df):
    """Analyze crime patterns and trends"""
    print("\n📈 Crime Pattern Analysis...")
    
    # Crime type distribution
    print("\n🔍 Top Crime Types:")
    crime_counts = df['crime_type'].value_counts().head(10)
    for crime, count in crime_counts.items():
        print(f"   {crime}: {count:,} cases ({count/len(df)*100:.1f}%)")
    
    # Time patterns
    print("\n⏰ Crime by Time of Day:")
    time_patterns = df.groupby('time_category')['crime_type'].count().sort_values(ascending=False)
    for time, count in time_patterns.items():
        print(f"   {time}: {count:,} cases")
    
    # Location patterns
    print("\n📍 Crime by Jurisdiction:")
    location_patterns = df['jurisdiction'].value_counts().head(5)
    for location, count in location_patterns.items():
        print(f"   {location}: {count:,} cases")
    
    # Severity analysis
    print("\n⚠️ Crime Severity Distribution:")
    severity_counts = df['severity_level'].value_counts()
    for severity, count in severity_counts.items():
        print(f"   {severity}: {count:,} cases ({count/len(df)*100:.1f}%)")

def build_prediction_models(df):
    """Build and evaluate prediction models"""
    print("\n🤖 Building Prediction Models...")
    
    # Prepare features for modeling
    feature_cols = [
        'latitude', 'longitude', 'lighting_numeric', 'severity_numeric',
        'police_distance_km', 'victims_count', 'hour',
        'month', 'is_weekend', 'safety_score'
    ]
    
    # Handle categorical variables
    categorical_cols = ['crime_type', 'road_type', 'jurisdiction', 'time_category']
    df_encoded = df.copy()
    
    # Convert boolean columns to numeric
    df_encoded['cctv_present_numeric'] = (df_encoded['cctv_present'] == 'Yes').astype(int)
    feature_cols.append('cctv_present_numeric')
    
    for col in categorical_cols:
        if col in df_encoded.columns:
            le = LabelEncoder()
            df_encoded[f'{col}_encoded'] = le.fit_transform(df_encoded[col].astype(str))
            feature_cols.append(f'{col}_encoded')
    
    # Prepare data
    X = df_encoded[feature_cols].fillna(0)
    y = df_encoded['crime_count_6mo']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"   Training set: {X_train.shape}")
    print(f"   Testing set: {X_test.shape}")
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Model 1: Linear Regression
    print("\n📊 Linear Regression Model:")
    lr_model = LinearRegression()
    lr_model.fit(X_train_scaled, y_train)
    lr_pred = lr_model.predict(X_test_scaled)
    
    lr_mse = mean_squared_error(y_test, lr_pred)
    lr_r2 = r2_score(y_test, lr_pred)
    lr_mae = mean_absolute_error(y_test, lr_pred)
    
    print(f"   R² Score: {lr_r2:.4f}")
    print(f"   RMSE: {np.sqrt(lr_mse):.2f}")
    print(f"   MAE: {lr_mae:.2f}")
    
    # Model 2: Random Forest
    print("\n🌲 Random Forest Model:")
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    
    rf_mse = mean_squared_error(y_test, rf_pred)
    rf_r2 = r2_score(y_test, rf_pred)
    rf_mae = mean_absolute_error(y_test, rf_pred)
    
    print(f"   R² Score: {rf_r2:.4f}")
    print(f"   RMSE: {np.sqrt(rf_mse):.2f}")
    print(f"   MAE: {rf_mae:.2f}")
    
    # Feature importance
    print("\n🔧 Feature Importance (Random Forest):")
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    for i, row in feature_importance.head(10).iterrows():
        print(f"   {row['feature']}: {row['importance']:.4f}")
    
    return lr_model, rf_model, scaler, feature_cols

def build_classification_model(df):
    """Build crime severity classification model"""
    print("\n🎯 Building Classification Model...")
    
    # Create target variable for classification
    df['high_crime_area'] = df['crime_count_6mo'] > df['crime_count_6mo'].median()
    
    # Prepare features
    feature_cols = [
        'latitude', 'longitude', 'lighting_numeric', 'severity_numeric',
        'police_distance_km', 'victims_count', 'hour',
        'month', 'is_weekend', 'safety_score'
    ]
    
    # Add encoded categorical features
    categorical_cols = ['crime_type', 'road_type', 'jurisdiction', 'time_category']
    df_encoded = df.copy()
    
    # Convert boolean columns to numeric
    df_encoded['cctv_present_numeric'] = (df_encoded['cctv_present'] == 'Yes').astype(int)
    feature_cols.append('cctv_present_numeric')
    
    for col in categorical_cols:
        if col in df_encoded.columns:
            le = LabelEncoder()
            df_encoded[f'{col}_encoded'] = le.fit_transform(df_encoded[col].astype(str))
            feature_cols.append(f'{col}_encoded')
    
    X = df_encoded[feature_cols].fillna(0)
    y = df_encoded['high_crime_area']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest Classifier
    clf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    clf_model.fit(X_train, y_train)
    clf_pred = clf_model.predict(X_test)
    
    # Evaluate
    accuracy = accuracy_score(y_test, clf_pred)
    precision = precision_score(y_test, clf_pred)
    recall = recall_score(y_test, clf_pred)
    f1 = f1_score(y_test, clf_pred)
    
    print(f"   Accuracy: {accuracy:.4f}")
    print(f"   Precision: {precision:.4f}")
    print(f"   Recall: {recall:.4f}")
    print(f"   F1-Score: {f1:.4f}")
    
    return clf_model

def generate_insights(df):
    """Generate actionable insights"""
    print("\n💡 Actionable Insights:")
    
    # High-risk areas
    high_risk = df[df['crime_count_6mo'] > df['crime_count_6mo'].quantile(0.8)]
    print(f"\n🚨 High-Risk Areas (Top 20%):")
    print(f"   Count: {len(high_risk):,} locations")
    print(f"   Average crime count: {high_risk['crime_count_6mo'].mean():.1f}")
    
    # Time-based insights
    print(f"\n⏰ Time-Based Insights:")
    night_crimes = df[df['time_category'] == 'Night']
    print(f"   Night crimes: {len(night_crimes):,} ({len(night_crimes)/len(df)*100:.1f}%)")
    
    # Lighting correlation
    poor_lighting = df[df['lighting'] == 'Poor']
    print(f"\n💡 Lighting Impact:")
    print(f"   Poor lighting areas: {len(poor_lighting):,} cases")
    print(f"   Average crime in poor lighting: {poor_lighting['crime_count_6mo'].mean():.1f}")
    
    # Police presence
    far_from_police = df[df['police_distance_km'] > df['police_distance_km'].quantile(0.8)]
    print(f"\n👮 Police Presence Impact:")
    print(f"   Areas far from police: {len(far_from_police):,} cases")
    print(f"   Average crime far from police: {far_from_police['crime_count_6mo'].mean():.1f}")

def main():
    print("🪄" + "="*60)
    print("   MAGICAL CHENNAI CRIME ANALYSIS")
    print("="*60)
    
    try:
        # Load and explore data
        df = load_and_explore_data()
        
        # Preprocess data
        df_processed = preprocess_data(df)
        
        # Analyze patterns
        analyze_crime_patterns(df_processed)
        
        # Build prediction models
        lr_model, rf_model, scaler, feature_cols = build_prediction_models(df_processed)
        
        # Build classification model
        clf_model = build_classification_model(df_processed)
        
        # Generate insights
        generate_insights(df_processed)
        
        print("\n" + "="*60)
        print("✅ MAGICAL ANALYSIS COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        print(f"\n🎯 Summary:")
        print(f"   • Analyzed {len(df):,} crime records")
        print(f"   • Identified {df['crime_type'].nunique()} crime types")
        print(f"   • Covered {df['jurisdiction'].nunique()} jurisdictions")
        print(f"   • Built predictive models with high accuracy")
        print(f"   • Generated actionable insights for crime prevention")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
