#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate a realistic crime dataset with patterns that ML can learn
This creates data with clear relationships between features and crime rates
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_realistic_crime_dataset(n_samples=2000):
    """Generate realistic crime data with learnable patterns"""
    
    print("🔄 Generating realistic crime dataset...")
    
    # Chennai boundaries
    lat_min, lat_max = 12.95, 13.15
    lng_min, lng_max = 80.18, 80.35
    
    data = []
    
    # Define area types with different crime characteristics
    area_types = {
        'commercial': {'base_crime': 250, 'variance': 50, 'night_multiplier': 1.5},
        'residential': {'base_crime': 180, 'variance': 40, 'night_multiplier': 1.3},
        'industrial': {'base_crime': 220, 'variance': 45, 'night_multiplier': 1.6},
        'slum': {'base_crime': 320, 'variance': 60, 'night_multiplier': 1.4},
        'upscale': {'base_crime': 120, 'variance': 30, 'night_multiplier': 1.2},
    }
    
    crime_types = ['theft', 'robbery', 'burglary', 'assault', 'eve_teasing', 
                   'scam', 'vandalism', 'homicide', 'rape', 'murder']
    
    lighting_types = ['Good', 'Moderate', 'Poor', 'Dark']
    road_types = ['Main road', 'Highway', 'Residential', 'Market street', 'Alley', 'Underpass']
    
    for i in range(n_samples):
        # Random location
        lat = random.uniform(lat_min, lat_max)
        lng = random.uniform(lng_min, lng_max)
        
        # Assign area type based on location (create zones)
        if lat > 13.08 and lng > 80.25:
            area_type = 'upscale'
        elif lat < 13.00 and lng < 80.22:
            area_type = 'slum'
        elif lat > 13.05 and lng < 80.23:
            area_type = 'industrial'
        elif lat < 13.05 and lng > 80.27:
            area_type = 'commercial'
        else:
            area_type = 'residential'
        
        area_config = area_types[area_type]
        
        # Time features
        date = datetime.now() - timedelta(days=random.randint(0, 365))
        hour = random.randint(0, 23)
        month = date.month
        day_of_week = date.weekday()
        
        # Night time increases crime
        is_night = 1 if (hour >= 20 or hour <= 6) else 0
        night_factor = area_config['night_multiplier'] if is_night else 1.0
        
        # Weekend increases certain crimes
        is_weekend = 1 if day_of_week >= 5 else 0
        weekend_factor = 1.15 if is_weekend else 1.0
        
        # Infrastructure features (correlated with area type)
        if area_type == 'upscale':
            cctv_present = random.choice(['Yes', 'Yes', 'Yes', 'No'])  # 75% CCTV
            lighting = random.choice(['Good', 'Good', 'Moderate'])
            police_distance = random.uniform(0.5, 2.0)
            safety_score = random.uniform(7.0, 9.5)
        elif area_type == 'slum':
            cctv_present = random.choice(['No', 'No', 'No', 'Yes'])  # 25% CCTV
            lighting = random.choice(['Poor', 'Dark', 'Poor'])
            police_distance = random.uniform(3.0, 7.0)
            safety_score = random.uniform(1.0, 4.0)
        elif area_type == 'commercial':
            cctv_present = random.choice(['Yes', 'Yes', 'No'])  # 66% CCTV
            lighting = random.choice(['Good', 'Moderate'])
            police_distance = random.uniform(1.0, 3.0)
            safety_score = random.uniform(5.0, 7.5)
        elif area_type == 'industrial':
            cctv_present = random.choice(['Yes', 'No'])  # 50% CCTV
            lighting = random.choice(['Moderate', 'Poor'])
            police_distance = random.uniform(2.0, 5.0)
            safety_score = random.uniform(4.0, 6.5)
        else:  # residential
            cctv_present = random.choice(['Yes', 'No', 'No'])  # 33% CCTV
            lighting = random.choice(['Good', 'Moderate', 'Poor'])
            police_distance = random.uniform(1.5, 4.0)
            safety_score = random.uniform(5.0, 8.0)
        
        # CCTV reduces crime
        cctv_factor = 0.7 if cctv_present == 'Yes' else 1.0
        
        # Lighting affects crime
        lighting_factors = {'Good': 0.8, 'Moderate': 1.0, 'Poor': 1.3, 'Dark': 1.5}
        lighting_factor = lighting_factors[lighting]
        
        # Police distance affects crime
        police_factor = 1.0 + (police_distance / 10.0)  # Further police = more crime
        
        # Calculate crime count with all factors
        base_crime = area_config['base_crime']
        variance = area_config['variance']
        
        crime_count = base_crime * night_factor * weekend_factor * cctv_factor * lighting_factor * police_factor
        crime_count += random.uniform(-variance, variance)
        crime_count = max(50, min(400, int(crime_count)))  # Clamp between 50-400
        
        # Other features
        crime_type = random.choice(crime_types)
        road_type = random.choice(road_types)
        
        # Severity is independent of crime count (to avoid data leakage)
        severity = random.choice(['Low', 'Medium', 'High', 'Critical'])
        
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
            'severity_level': severity,
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
            'area_type': area_type,  # Hidden feature for validation
            'hour': hour,
            'month': month,
            'day_of_week': day_of_week,
            'is_night': is_night,
            'is_weekend': is_weekend
        })
    
    df = pd.DataFrame(data)
    
    print(f"✅ Generated {len(df)} realistic crime records")
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
    
    return df

def main():
    """Generate and save the dataset"""
    df = generate_realistic_crime_dataset(n_samples=2000)
    
    # Save with header
    output_file = 'chennai_crime_dataset_realistic.csv'
    with open(output_file, 'w') as f:
        f.write('chennai_crime_dataset_realistic_2000_records\n')
    
    df.to_csv(output_file, mode='a', index=False)
    
    print(f"\n💾 Dataset saved to: {output_file}")
    print("✅ Ready for ML training!")

if __name__ == "__main__":
    main()
