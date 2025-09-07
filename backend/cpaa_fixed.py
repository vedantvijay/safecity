# Crime Prediction Analysis Script
# Fixed version for running locally

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

def main():
    print("Starting Crime Prediction Analysis...")
    
    try:
        # Load dataset
        print("Loading dataset...")
        df = pd.read_csv('chennai_crime_dataset.csv')
        print(f"Dataset loaded successfully. Shape: {df.shape}")
        
        # Display basic info
        print("\nDataset Info:")
        print(df.info())
        print("\nFirst few rows:")
        print(df.head())
        
        # Data preprocessing
        print("\nStarting data preprocessing...")
        
        # Drop columns that are identifiers or not useful for modeling
        cols_to_drop = ['crime_id', 'reported_datetime', 'road_name', 'road_segment_id', 
                       'affected_route_id', 'affected_segments', 'sanitized_description']
        
        # Only drop columns that exist
        cols_to_drop = [col for col in cols_to_drop if col in df.columns]
        df = df.drop(columns=cols_to_drop)
        print(f"After dropping columns. Shape: {df.shape}")
        
        # Handle missing values
        print("\nMissing values:")
        print(df.isnull().sum())
        
        # Fill missing values
        df = df.fillna(df.mean(numeric_only=True))
        df = df.fillna(df.mode().iloc[0])
        
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
        if 'crime_count_6mo' not in df_encoded.columns:
            print("Warning: 'crime_count_6mo' column not found. Using first numerical column as target.")
            target_col = df_encoded.select_dtypes(include=['int64', 'float64']).columns[0]
        else:
            target_col = 'crime_count_6mo'
        
        print(f"Using '{target_col}' as target variable")
        
        # Regression Analysis
        print("\n" + "="*50)
        print("REGRESSION ANALYSIS")
        print("="*50)
        
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
        
        print(f"\nRegression Results:")
        print(f"Mean Squared Error (MSE): {mse:.4f}")
        print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
        print(f"R-squared (R2): {r2:.4f}")
        print(f"Mean Absolute Error (MAE): {mae:.4f}")
        
        # Classification Analysis
        print("\n" + "="*50)
        print("CLASSIFICATION ANALYSIS")
        print("="*50)
        
        # Create categorical target variable
        threshold = df_encoded[target_col].median()
        df_encoded['crime_level'] = df_encoded[target_col].apply(
            lambda x: 'High Crime' if x > threshold else 'Low Crime'
        )
        
        print(f"Crime level distribution:")
        print(df_encoded['crime_level'].value_counts())
        
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
        
        print(f"\nClassification Results:")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1-score: {f1:.4f}")
        
        # Feature Selection
        print("\n" + "="*50)
        print("FEATURE SELECTION")
        print("="*50)
        
        # Use RFE for feature selection
        rfe = RFE(estimator=LogisticRegression(random_state=42, max_iter=1000), n_features_to_select=min(10, X_train_class.shape[1]))
        rfe.fit(X_train_class, y_train_class)
        
        selected_features = X_train_class.columns[rfe.support_]
        print(f"Selected features using RFE:")
        print(list(selected_features))
        
        print("\n" + "="*50)
        print("ANALYSIS COMPLETED SUCCESSFULLY!")
        print("="*50)
        
    except FileNotFoundError:
        print("Error: 'chennai_crime_dataset.csv' file not found.")
        print("Please make sure the dataset file is in the same directory as this script.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        print("Please check your dataset and try again.")

if __name__ == "__main__":
    main()
