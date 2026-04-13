"""
Data Generator for Disaster Prediction Models
Generates synthetic training data for floods, earthquakes, and cyclones
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random


def generate_disaster_data(n_samples: int = 10000) -> dict:
    """
    Generate synthetic disaster data for training ML models
    
    Features:
    - temperature: float (15-45°C)
    - humidity: float (20-100%)
    - precipitation: float (0-100mm)
    - wind_speed: float (0-200 km/h)
    - pressure: float (950-1050 hPa)
    - visibility: float (0-10 km)
    - cloud_cover: float (0-100%)
    - seismic_activity: float (0-10 magnitude)
    - historical_flood_risk: float (0-1)
    - terrain_elevation: float (0-3000m)
    - distance_to_coast: float (0-1000km)
    """
    
    np.random.seed(42)
    random.seed(42)
    
    # Generate base features
    data = {
        'temperature': np.random.uniform(15, 45, n_samples),
        'humidity': np.random.uniform(20, 100, n_samples),
        'precipitation': np.random.exponential(20, n_samples),
        'wind_speed': np.random.exponential(30, n_samples),
        'pressure': np.random.normal(1013, 20, n_samples),
        'visibility': np.random.uniform(0.5, 10, n_samples),
        'cloud_cover': np.random.uniform(0, 100, n_samples),
        'seismic_activity': np.random.exponential(0.5, n_samples),
        'historical_flood_risk': np.random.uniform(0, 1, n_samples),
        'terrain_elevation': np.random.uniform(0, 3000, n_samples),
        'distance_to_coast': np.random.uniform(0, 1000, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Add time-based features
    timestamps = [datetime.now() - timedelta(days=random.randint(0, 365)) for _ in range(n_samples)]
    df['month'] = [t.month for t in timestamps]
    df['day_of_year'] = [t.timetuple().tm_yday for t in timestamps]
    
    # Generate flood labels (1 = flood, 0 = no flood)
    # Flood occurs with high precipitation, low terrain elevation, high historical risk
    flood_prob = (
        0.3 * (df['precipitation'] / df['precipitation'].max()) +
        0.3 * (1 - df['terrain_elevation'] / df['terrain_elevation'].max()) +
        0.2 * df['historical_flood_risk'] +
        0.1 * (df['humidity'] / 100) +
        0.1 * (1 - df['visibility'] / df['visibility'].max())
    )
    df['flood'] = (flood_prob + np.random.normal(0, 0.1, n_samples) > 0.5).astype(int)
    
    # Generate earthquake labels (1 = earthquake, 0 = no earthquake)
    # Earthquake occurs with high seismic activity
    earthquake_prob = (
        0.5 * (df['seismic_activity'] / df['seismic_activity'].max()) +
        0.3 * np.random.random(n_samples) +
        0.2 * (1 - df['pressure'] / df['pressure'].max() + 0.5)
    )
    df['earthquake'] = (earthquake_prob + np.random.normal(0, 0.15, n_samples) > 0.6).astype(int)
    
    # Generate cyclone labels (1 = cyclone, 0 = no cyclone)
    # Cyclone occurs with low pressure, high wind speed, near coast
    cyclone_prob = (
        0.35 * (1 - (df['pressure'] - 950) / 100) +
        0.35 * (df['wind_speed'] / df['wind_speed'].max()) +
        0.2 * (1 - df['distance_to_coast'] / df['distance_to_coast'].max()) +
        0.1 * (df['cloud_cover'] / 100)
    )
    df['cyclone'] = (cyclone_prob + np.random.normal(0, 0.12, n_samples) > 0.55).astype(int)
    
    return df


def generate_time_series_cyclone_data(n_days: int = 365 * 5) -> pd.DataFrame:
    """
    Generate time series data for cyclone prediction
    """
    np.random.seed(42)
    random.seed(42)
    
    dates = pd.date_range(start='2019-01-01', periods=n_days, freq='D')
    
    # Generate seasonal patterns
    months = np.array([d.month for d in dates])
    
    # Cyclone season in India: May-November (5-11)
    seasonal_factor = np.where((months >= 5) & (months <= 11), 1.5, 0.5)
    
    # Generate features
    data = {
        'date': dates,
        'sea_surface_temp': 25 + 5 * np.sin(2 * np.pi * months / 12) + np.random.normal(0, 1, n_days),
        'wind_speed': 10 + 20 * seasonal_factor * np.random.random(n_days),
        'pressure': 1013 - 15 * seasonal_factor * np.random.random(n_days) + np.random.normal(0, 5, n_days),
        'humidity': 60 + 20 * seasonal_factor * np.random.random(n_days),
        'ocean_heat_content': 50 + 30 * seasonal_factor * np.random.random(n_days),
    }
    
    df = pd.DataFrame(data)
    
    # Cyclone probability based on conditions
    cyclone_prob = (
        0.25 * (data['sea_surface_temp'] - 25) / 5 +
        0.25 * data['wind_speed'] / 30 +
        0.25 * (1013 - data['pressure']) / 15 +
        0.15 * data['humidity'] / 100 +
        0.10 * data['ocean_heat_content'] / 80
    )
    
    df['cyclone_probability'] = np.clip(cyclone_prob + np.random.normal(0, 0.1, n_days), 0, 1)
    df['cyclone_occurred'] = (df['cyclone_probability'] > 0.6).astype(int)
    
    return df


def get_feature_columns() -> list:
    """Return list of feature column names"""
    return [
        'temperature', 'humidity', 'precipitation', 'wind_speed',
        'pressure', 'visibility', 'cloud_cover', 'seismic_activity',
        'historical_flood_risk', 'terrain_elevation', 'distance_to_coast',
        'month', 'day_of_year'
    ]


if __name__ == "__main__":
    # Generate and save training data
    print("Generating disaster data...")
    df = generate_disaster_data(10000)
    df.to_csv('backend/models/disaster_data.csv', index=False)
    print(f"Generated {len(df)} samples")
    print(f"Flood cases: {df['flood'].sum()}")
    print(f"Earthquake cases: {df['earthquake'].sum()}")
    print(f"Cyclone cases: {df['cyclone'].sum()}")
    
    print("\nGenerating time series data...")
    ts_df = generate_time_series_cyclone_data()
    ts_df.to_csv('backend/models/cyclone_timeseries.csv', index=False)
    print(f"Generated {len(ts_df)} days of time series data")
