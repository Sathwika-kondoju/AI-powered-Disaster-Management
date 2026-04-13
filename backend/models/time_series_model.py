"""
Time Series Model for Cyclone Prediction
Uses ARIMA and statistical methods for time series forecasting of cyclones
"""

import numpy as np
import pandas as pd
import os
import joblib
from typing import Dict, Tuple, Optional, List
import warnings
warnings.filterwarnings('ignore')

from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.stattools import adfuller
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
import pickle

from .data_generator import generate_time_series_cyclone_data


class CycloneTimeSeriesModel:
    """
    Time Series model for cyclone prediction
    Uses ARIMA and Exponential Smoothing for forecasting
    """
    
    def __init__(self, model_path: str = "backend/models/time_series_cyclone.pkl"):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = model_path
        self.feature_columns = [
            'sea_surface_temp', 'wind_speed', 'pressure', 
            'humidity', 'ocean_heat_content'
        ]
        self.is_trained = False
        self.training_history = None
        self.model_type = 'arima'
        
    def check_stationarity(self, series: pd.Series) -> bool:
        """Check if time series is stationary using ADF test"""
        result = adfuller(series.dropna())
        return result[1] < 0.05
    
    def preprocess_data(self, df: pd.DataFrame) -> Tuple[pd.Series, pd.DataFrame]:
        """Preprocess time series data"""
        # Set date as index
        df = df.set_index('date')
        
        # Target variable
        target = df['cyclone_probability']
        
        # Features
        features = df[self.feature_columns]
        
        return target, features
    
    def train(self, n_days: int = 365 * 5) -> Dict:
        """Train the time series model"""
        print("Generating time series data...")
        df = generate_time_series_cyclone_data(n_days)
        
        target, features = self.preprocess_data(df)
        
        # Split into train and test
        train_size = int(len(target) * 0.8)
        train_target = target[:train_size]
        test_target = target[train_size:]
        
        train_features = features[:train_size]
        test_features = features[train_size:]
        
        # Scale features
        train_features_scaled = self.scaler.fit_transform(train_features)
        test_features_scaled = self.scaler.transform(test_features)
        
        print("Training Time Series Model for Cyclone Prediction...")
        
        # Try different models and select the best one
        best_aic = float('inf')
        best_model = None
        best_order = None
        
        # Try different ARIMA orders
        orders_to_try = [(1,0,1), (1,1,1), (2,1,1), (2,1,2), (3,1,1)]
        
        for order in orders_to_try:
            try:
                model = ARIMA(train_target, order=order)
                fitted = model.fit()
                
                if fitted.aic < best_aic:
                    best_aic = fitted.aic
                    best_model = fitted
                    best_order = order
            except Exception as e:
                continue
        
        if best_model is None:
            # Fallback to simple ARIMA
            print("Using fallback ARIMA(1,1,1) model...")
            self.model = ARIMA(train_target, order=(1,1,1)).fit()
            self.model_type = 'arima'
        else:
            print(f"Best ARIMA order: {best_order} with AIC: {best_aic:.2f}")
            self.model = best_model
            self.model_type = 'arima'
        
        # Make predictions on test set
        predictions = self.model.forecast(steps=len(test_target))
        
        # Calculate metrics
        mse = mean_squared_error(test_target, predictions)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(test_target, predictions)
        
        # Calculate accuracy (within 20% threshold)
        accuracy = np.mean(np.abs(test_target - predictions) < 0.2)
        
        self.is_trained = True
        self.scaler = StandardScaler()
        self.scaler.fit(train_features)
        
        # Save model
        self.save()
        
        return {
            'rmse': rmse,
            'mae': mae,
            'accuracy': accuracy,
            'aic': best_aic if best_model else self.model.aic,
            'order': best_order if best_order else (1,1,1),
            'n_samples': n_days,
            'n_cyclone_cases': int(df['cyclone_occurred'].sum()),
            'model_type': self.model_type
        }
    
    def predict(self, features: Dict) -> Tuple[float, float]:
        """
        Predict cyclone probability using time series
        
        Args:
            features: Dictionary containing current weather features
                     and optionally 'days_ahead' for forecast
            
        Returns:
            Tuple of (probability, confidence)
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        # Get forecast days ahead
        days_ahead = features.get('days_ahead', 1)
        
        # If we have historical data, use it; otherwise use simple forecast
        try:
            forecast = self.model.forecast(steps=days_ahead)
            if isinstance(forecast, pd.Series):
                probability = float(forecast.iloc[-1])
            else:
                probability = float(forecast[-1])
        except Exception:
            # Fallback: use feature-based prediction
            probability = self._predict_from_features(features)
        
        # Confidence based on forecast horizon
        # Further predictions are less confident
        confidence = max(0.5, 1.0 - (days_ahead * 0.05))
        
        # Also incorporate current features for confidence
        if 'pressure' in features:
            # Low pressure increases cyclone likelihood
            if features['pressure'] < 990:
                probability = max(probability, 0.6)
                confidence *= 0.9
        
        if 'wind_speed' in features:
            if features['wind_speed'] > 50:
                probability = max(probability, 0.7)
                confidence *= 0.85
        
        return float(np.clip(probability, 0, 1)), float(confidence)
    
    def _predict_from_features(self, features: Dict) -> float:
        """Fallback prediction using current features"""
        prob = 0.0
        
        # Sea surface temperature (warmer = more cyclone risk)
        if 'sea_surface_temp' in features:
            sst = features['sea_surface_temp']
            prob += 0.2 * max(0, (sst - 26) / 10)
        
        # Wind speed
        if 'wind_speed' in features:
            prob += 0.2 * min(1, features['wind_speed'] / 100)
        
        # Pressure (lower = more cyclone risk)
        if 'pressure' in features:
            p = features['pressure']
            if p < 1013:
                prob += 0.3 * (1013 - p) / 50
        
        # Humidity
        if 'humidity' in features:
            prob += 0.15 * features['humidity'] / 100
        
        # Ocean heat content
        if 'ocean_heat_content' in features:
            prob += 0.15 * features['ocean_heat_content'] / 100
        
        return min(prob, 1.0)
    
    def predict_forecast(self, n_days: int = 7) -> List[Dict]:
        """
        Get cyclone probability forecast for next n days
        
        Args:
            n_days: Number of days to forecast
            
        Returns:
            List of dictionaries with date and probability
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        forecast = self.model.forecast(steps=n_days)
        
        results = []
        base_date = pd.Timestamp.now()
        
        for i in range(n_days):
            if isinstance(forecast, pd.Series):
                prob = float(forecast.iloc[i])
            else:
                prob = float(forecast[i])
            
            results.append({
                'date': (base_date + pd.Timedelta(days=i+1)).strftime('%Y-%m-%d'),
                'probability': prob,
                'risk_level': self._get_risk_level(prob)
            })
        
        return results
    
    def _get_risk_level(self, probability: float) -> str:
        """Get risk level from probability"""
        if probability < 0.25:
            return 'low'
        elif probability < 0.50:
            return 'medium'
        elif probability < 0.75:
            return 'high'
        else:
            return 'severe'
    
    def predict_risk_level(self, features: Dict) -> Tuple[str, float]:
        """
        Predict cyclone risk level
        
        Returns:
            Tuple of (risk_level, probability)
        """
        probability, _ = self.predict(features)
        risk_level = self._get_risk_level(probability)
        
        return risk_level, probability
    
    def save(self):
        """Save model to disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'model_type': self.model_type,
            'disaster_type': 'cyclone'
        }, self.model_path)
        
        print(f"Time series model saved to {self.model_path}")
    
    def load(self):
        """Load model from disk"""
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.feature_columns = data['feature_columns']
            self.model_type = data.get('model_type', 'arima')
            self.is_trained = True
            print(f"Time series model loaded from {self.model_path}")
        else:
            print(f"Model file not found at {self.model_path}")
    
    def get_seasonal_analysis(self, df: pd.DataFrame) -> Dict:
        """Analyze seasonal patterns in cyclone data"""
        df = df.set_index('date')
        
        monthly_avg = df.groupby(df.index.month)['cyclone_probability'].mean()
        
        peak_months = monthly_avg.nlargest(3).index.tolist()
        
        return {
            'monthly_average': monthly_avg.to_dict(),
            'peak_months': peak_months,
            'cyclone_season': 'May - November' if 5 in peak_months or 6 in peak_months else 'Year-round'
        }


def train_cyclone_model() -> Dict:
    """
    Train and save the Time Series cyclone model
    """
    model = CycloneTimeSeriesModel()
    results = model.train(365 * 5)
    
    print(f"\n=== Cyclone Prediction Model Training Results ===")
    print(f"RMSE: {results['rmse']:.4f}")
    print(f"MAE: {results['mae']:.4f}")
    print(f"Accuracy: {results['accuracy']:.4f}")
    print(f"Model Type: {results['model_type']}")
    print(f"ARIMA Order: {results['order']}")
    print(f"Training Days: {results['n_samples']}")
    print(f"Cyclone Cases in Training: {results['n_cyclone_cases']}")
    
    # Test forecast
    forecast = model.predict_forecast(7)
    print("\n7-Day Forecast:")
    for day in forecast:
        print(f"  {day['date']}: {day['probability']:.2%} ({day['risk_level']})")
    
    return results


if __name__ == "__main__":
    # Train and test model
    results = train_cyclone_model()
    
    # Test prediction
    test_features = {
        'sea_surface_temp': 29,
        'wind_speed': 45,
        'pressure': 985,
        'humidity': 85,
        'ocean_heat_content': 70,
        'days_ahead': 1
    }
    
    model = CycloneTimeSeriesModel()
    model.load()
    
    prob, conf = model.predict(test_features)
    risk_level, _ = model.predict_risk_level(test_features)
    
    print(f"\n=== Test Prediction ===")
    print(f"Cyclone Probability: {prob:.2%}")
    print(f"Risk Level: {risk_level.upper()}")
    print(f"Confidence: {conf:.2%}")
