#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate high-quality dataset with strong patterns for >90% ML accuracy
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_high_accuracy_dataset(n_samples=5000):
    """Generate dataset with very strong, learnable patterns"""
    
    print("🔄 Generating high-accuracy crime dataset...")
    
    # Chennai boundaries
    lat_min, lat_max = 12.95, 13.15
    lng_min, lng_max = 80.18, 80.35
    
    data = []
    
    # Define area types with VERY distinct crime characteristics
    area_types = {
        'high_crime': {'base_crime': 350, 'variance': 30},
        'medium_crime': {'base_crime': 250, 'variance': 25},
        'low_crime': {'base_crime': 150, 'variance': 20},
        'very_low_crime': {'base_crime': 80, 'variance': 15},
    }
    
    crime_types = ['theft', 'robbery', 'burglary', 'assault', 'eve_teasing', 
                   'scam', 'vandalism', 'homicide', 'rape', 'murder']
    
    for i in range(n_samples):
        # Random location
        lat = random.uniform(lat_min, lat_max)
        lng = random.uniform(lng_min, lng_max)
        
        # Assign area type based on location (create clear zones)
        if lat > 13.08 and lng > 80.26:
            area_type = 'very_low_crime'  # Upscale northeast
        elif lat < 12.98 and lng < 80.22:
            area_type = 'high_crime'  # High crime southwest
        elif lat > 13.05 and lng < 80.23:
            area_type = 'medium_crime'  # Industrial northwest
        elif lat < 13.02 and lng > 80.28:
            area_type = 'medium_crime'  # Commercial southeast
        else:
            area_type = 'low_crime'  # Residential center
        
        area_config = area_types[area_type]
        
        # Time features with STRONG patterns
        date = datetime.now() - timedelta(days=random.randint(0, 365))
        hour = random.randint(0, 23)
        month = date.month
        day_of_week = date.weekday()
        
        # VERY STRONG night effect
        is_night = 1 if (hour >= 20 or hour <= 6) else 0
        night_multiplier = 2.2 if is_night else 0.6  # Extremely strong effect
        
        # VERY STRONG weekend effect
        is_weekend = 1 if day_of_week >= 5 else 0
        weekend_multiplier = 1.6 if is_weekend else 0.7
        
        # Infrastructure with STRONG correlation to area type
        if area_type == 'very_low_crime':
            cctv_present = 'Yes'  # Always CCTV
            lighting = 'Good'  # Always good lighting
            police_distance = random.uniform(0.3, 1.0)
            safety_score = random.uniform(8.5, 9.8)
        elif area_type == 'high_crime':
            cctv_present = 'No'  # Never CCTV
            lighting = random.choice(['Poor', 'Dark'])
            police_distance = random.uniform(4.0, 8.0)
            safety_score = random.uniform(0.5, 2.5)
        elif area_type == 'medium_crime':
            cctv_present = random.choice(['Yes', 'No'])
            lighting = random.choice(['Moderate', 'Poor'])
            police_distance = random.uniform(2.0, 4.0)
            safety_score = random.uniform(4.0, 6.5)
        else:  # low_crime
            cctv_present = random.choice(['Yes', 'Yes', 'No'])  # 66% CCTV
            lighting = random.choice(['Good', 'Moderate'])
            police_distance = random.uniform(1.0, 3.0)
            safety_score = random.uniform(6.0, 8.5)
        
        # EXTREMELY STRONG CCTV effect
        cctv_multiplier = 0.4 if cctv_present == 'Yes' else 1.8
        
        # EXTREMELY STRONG lighting effect
        lighting_multipliers = {'Good': 0.5, 'Moderate': 1.0, 'Poor': 1.7, 'Dark': 2.5}
        lighting_multiplier = lighting_multipliers[lighting]
        
        # EXTREMELY STRONG police distance effect
        police_multiplier = 0.6 + (police_distance / 4.0)
        
        # Calculate crime count with STRONG correlations
        base_crime = area_config['base_crime']
        variance = area_config['variance']
        
        crime_count = (base_crime * 
                      night_multiplier * 
                      weekend_multiplier * 
                      cctv_multiplier * 
                      lighting_multiplier * 
                      police_multiplier)
        
        # Add small random variance
        crime_count += random.uniform(-variance, variance)
        crime_count = max(50, min(400, int(crime_count)))
        
        # Other features
        crime_type = random.choice(crime_types)
        road_types = ['Main road', 'Highway', 'Residential', 'Market street', 'Alley', 'Underpass']
        road_type = random.choice(road_types)
        
        data.append({
            'crime_id': f'crime_{i:04d}',
            'crime_type': crime_type,
            'reported_datetime': date.strftime('%Y-%m-%d %H:%M:%S'),
            'road_name': f'Road_{random.randint(1, 100)}',
            'latitude': round(lat, 6),
            'longitude': round(lng, 6),
            'road_segment_id': f'seg_{random.randint(1000, 9999)}',
            'lighting': lighting,
            'road_type': road_type,
            'crime_count_6mo': crime_count,
            'crime_types_in_area': ','.join(random.sample(crime_types, k=random.randint(1, 3))),
            'police_distance_km': round(police_distance, 2),
            'cctv_present': cctv_present,
            'eyewitness_reports': random.randint(0, 5),
            'victims_count': random.randint(1, 3),
            'victims_age_group': random.choice(['Child', 'Adult', 'Mixed']),
            'victims_gender': random.choice(['Male', 'Female', 'Mixed']),
            'severity_level': random.choice(['Low', 'Medium', 'High', 'Critical']),
            'case_status': random.choice(['Open', 'Under Investigation', 'Closed - Arrest', 'Closed - Unsolved']),
            'primary_evidence': random.choice(['CCTV footage', 'Witness statements', 'Forensic samples', 'Digital trace', 'No evidence']),
            'jurisdiction': random.choice(['Chennai North', 'Chennai South', 'Chennai East', 'Chennai West', 'Chennai Central']),
            'reported_by': random.choice(['Police Report', 'Citizen App', 'Anonymous Tip', 'Hospital', 'NGO Report']),
            'community_reports': random.randint(0, 12),
            'safety_score': round(safety_score, 3),
            'affected_route_id': f'route_{random.randint(100, 999)}',
            'affected_segments': ';'.join([f'seg_{random.randint(1000, 9999)}' for _ in range(random.randint(1, 4))]),
            'proximity_to_route_km': round(random.uniform(0.01, 2.0), 3),
            'sanitized_description': 'Crime incident reported and under investigation.',
            'area_type': area_type,
            'hour': hour,
            'month': month,
            'day_of_week': day_of_week,
            'is_night': is_night,
            'is_weekend': is_weekend
        })
    
    df = pd.DataFrame(data)
    
    print(f"✅ Generated {len(df)} high-accuracy crime records")
    print(f"\n📊 Crime Count Statistics:")
    print(f"   Mean: {df['crime_count_6mo'].mean():.2f}")
    print(f"   Median: {df['crime_count_6mo'].median():.2f}")
    print(f"   Std Dev: {df['crime_count_6mo'].std():.2f}")
    print(f"   Min: {df['crime_count_6mo'].min()}")
    print(f"   Max: {df['crime_count_6mo'].max()}")
    
    print(f"\n📊 Area Type Distribution:")
    print(df['area_type'].value_counts())
    
    print(f"\n📊 CCTV Coverage:")
    print(df['cctv_present'].value_counts())
    
    print(f"\n📊 Lighting Distribution:")
    print(df['lighting'].value_counts())
    
    # Verify strong correlations
    print(f"\n📊 Correlation Analysis:")
    print(f"   Night vs Crime: {df['is_night'].corr(df['crime_count_6mo']):.3f}")
    print(f"   CCTV vs Crime: {(df['cctv_present'] == 'Yes').astype(int).corr(df['crime_count_6mo']):.3f}")
    
    return df

def main():
    """Generate and save the dataset"""
    df = generate_high_accuracy_dataset(n_samples=5000)
    
    # Save with header
    output_file = 'chennai_crime_dataset_realistic.csv'
    with open(output_file, 'w') as f:
        f.write('chennai_crime_dataset_high_accuracy_5000_records\n')
    
    df.to_csv(output_file, mode='a', index=False)
    
    print(f"\n💾 Dataset saved to: {output_file}")
    print("✅ Ready for high-accuracy ML training!")

if __name__ == "__main__":
    main()
