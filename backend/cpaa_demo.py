# Crime Prediction Analysis Script - Demo Version
# This version works without requiring the specific dataset

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.feature_selection import RFE
import warnings
warnings.filterwarnings('ignore')

def create_sample_dataset():
    """Create a sample crime dataset for demonstration"""
    np.random.seed(42)
    n_samples = 1000
    
    # Generate sample data
    data = {
        'crime_id': range(1, n_samples + 1),
        'latitude': np.random.uniform(12.8, 13.2, n_samples),
        'longitude': np.random.uniform(80.0, 80.3, n_samples),
        'population_density': np.random.uniform(1000, 10000, n_samples),
        'unemployment_rate': np.random.uniform(2, 15, n_samples),
        'poverty_rate': np.random.uniform(5, 25, n_samples),
        'police_stations_count': np.random.randint(0, 5, n_samples),
        'street_lighting_score': np.random.uniform(1, 10, n_samples),
        'area_type': np.random.choice(['Residential', 'Commercial', 'Industrial', 'Mixed'], n_samples),
        'time_of_day': np.random.choice(['Morning', 'Afternoon', 'Evening', 'Night'], n_samples),
        'day_of_week': np.random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], n_samples),
        'month': np.random.randint(1, 13, n_samples),
        'weather_condition': np.random.choice(['Clear', 'Cloudy', 'Rainy', 'Foggy'], n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Create target variable based on other features
    crime_score = (
        df['population_density'] * 0.3 +
        df['unemployment_rate'] * 0.4 +
        df['poverty_rate'] * 0.3 +
        (10 - df['street_lighting_score']) * 0.2 +
        (5 - df['police_stations_count']) * 0.1 +
        np.random.normal(0, 2, n_samples)  # Add some noise
    )
    
    df['crime_count_6mo'] = np.maximum(0, crime_score).astype(int)
    
    return df

def main():
    print("🚀 Starting Crime Prediction Analysis...")
    print("📊 Using sample dataset for demonstration")
    
    try:
        # Create sample dataset
        print("Creating sample dataset...")
        df = create_sample_dataset()
        print(f"Sample dataset created successfully. Shape: {df.shape}")
        
        # Display basic info
        print("\nDataset Info:")
        print(df.info())
        print("\nFirst few rows:")
        print(df.head())
        
        # Data preprocessing
        print("\nStarting data preprocessing...")
        
        # Drop columns that are identifiers or not useful for modeling
        cols_to_drop = ['crime_id']
        df = df.drop(columns=cols_to_drop)
        print(f"After dropping columns. Shape: {df.shape}")
        
        # Handle missing values
        print("\nMissing values:")
        print(df.isnull().sum())
        
        # Apply one-hot encoding to categorical features
        categorical_cols = df.select_dtypes(include='object').columns
        print(f"Categorical columns: {list(categorical_cols)}")
        
        if len(categorical_cols) > 0:
            df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
        else:
            df_encoded = df.copy()
        
        # Apply StandardScaler to numerical features
        numerical_cols = df_encoded.select_dtypes(include=['int64', 'float64']).columns
        print(f"Numerical columns: {list(numerical_cols)}")
        
        if len(numerical_cols) > 0:
            scaler = StandardScaler()
            df_encoded[numerical_cols] = scaler.fit_transform(df_encoded[numerical_cols])
        
        print(f"Final encoded dataset shape: {df_encoded.shape}")
        print("\nEncoded dataset head:")
        print(df_encoded.head())
        
        # Check if target variable exists
        target_col = 'crime_count_6mo'
        print(f"Using '{target_col}' as target variable")
        
        # Regression Analysis
        print("\n" + "="*60)
        print("🔍 REGRESSION ANALYSIS")
        print("="*60)
        
        # Define features (X) and target (y)
        X = df_encoded.drop(target_col, axis=1)
        y = df_encoded[target_col]
        
        # Split data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print(f"Training set shape: {X_train.shape}")
        print(f"Testing set shape: {X_test.shape}")
        
        # Initialize and train the Linear Regression model
        model = LinearRegression()
        model.fit(X_train, y_train)
        
        # Make predictions on the test set
        y_pred = model.predict(X_test)
        
        # Evaluate the model
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        
        print(f"\n📈 Regression Results:")
        print(f"Mean Squared Error (MSE): {mse:.4f}")
        print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
        print(f"R-squared (R2): {r2:.4f}")
        print(f"Mean Absolute Error (MAE): {mae:.4f}")
        
        # Classification Analysis
        print("\n" + "="*60)
        print("🎯 CLASSIFICATION ANALYSIS")
        print("="*60)
        
        # Create categorical target variable
        threshold = df_encoded[target_col].median()
        df_encoded['crime_level'] = df_encoded[target_col].apply(
            lambda x: 'High Crime' if x > threshold else 'Low Crime'
        )
        
        print(f"Crime level distribution:")
        print(df_encoded['crime_level'].value_counts())
        print(f"Threshold used: {threshold:.2f}")
        
        # Re-prepare data for classification
        X_class = df_encoded.drop([target_col, 'crime_level'], axis=1)
        y_class = df_encoded['crime_level']
        
        # Split data for classification
        X_train_class, X_test_class, y_train_class, y_test_class = train_test_split(
            X_class, y_class, test_size=0.2, random_state=42
        )
        
        # Train classification model
        clf_model = LogisticRegression(random_state=42, max_iter=1000)
        clf_model.fit(X_train_class, y_train_class)
        
        # Make predictions
        y_pred_class = clf_model.predict(X_test_class)
        
        # Calculate classification metrics
        accuracy = accuracy_score(y_test_class, y_pred_class)
        precision = precision_score(y_test_class, y_pred_class, pos_label='High Crime')
        recall = recall_score(y_test_class, y_pred_class, pos_label='High Crime')
        f1 = f1_score(y_test_class, y_pred_class, pos_label='High Crime')
        
        print(f"\n📊 Classification Results:")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1-score: {f1:.4f}")
        
        # Feature Selection
        print("\n" + "="*60)
        print("🔧 FEATURE SELECTION")
        print("="*60)
        
        # Use RFE for feature selection
        n_features = min(10, X_train_class.shape[1])
        rfe = RFE(estimator=LogisticRegression(random_state=42, max_iter=1000), n_features_to_select=n_features)
        rfe.fit(X_train_class, y_train_class)
        
        selected_features = X_train_class.columns[rfe.support_]
        print(f"Selected top {n_features} features using RFE:")
        for i, feature in enumerate(selected_features, 1):
            print(f"{i:2d}. {feature}")
        
        # Feature importance
        print(f"\nFeature importance scores:")
        feature_importance = pd.DataFrame({
            'feature': X_train_class.columns,
            'importance': rfe.ranking_
        }).sort_values('importance')
        
        for i, row in feature_importance.head(10).iterrows():
            print(f"{row['importance']:2d}. {row['feature']}")
        
        print("\n" + "="*60)
        print("✅ ANALYSIS COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\n💡 Key Insights:")
        print(f"• Model can predict crime counts with R² = {r2:.3f}")
        print(f"• Classification accuracy: {accuracy:.1%}")
        print(f"• Most important features identified")
        print(f"• Dataset processed: {df.shape[0]} records, {df.shape[1]} features")
        
    except Exception as e:
        print(f"❌ An error occurred: {str(e)}")
        print("Please check your environment and try again.")

if __name__ == "__main__":
    main()
