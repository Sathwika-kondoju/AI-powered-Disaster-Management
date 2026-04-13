"""
Prediction Service - Unified interface for all disaster prediction models
Lazy loading to avoid import-time errors
"""

import os
from typing import Dict, Tuple, Optional

# Import model classes
from .random_forest_model import FloodRandomForest
from .neural_network_model import EarthquakeNeuralNetwork
from .time_series_model import CycloneTimeSeries


class DisasterPredictionService:
    """
    Unified service for all disaster predictions
    """
    
    def __init__(self):
        # Models will be loaded lazily
        self._random_forest_model = None
        self._neural_network_model = None
        self._time_series_model = None
    
    @property
    def random_forest_model(self):
        """Lazy load Random Forest model"""
        if self._random_forest_model is None:
            self._random_forest_model = FloodRandomForest()
            try:
                self._random_forest_model.load()
            except Exception as e:
                print(f"Warning: Could not load Random Forest model: {e}")
        return self._random_forest_model
    
    @property
    def neural_network_model(self):
        """Lazy load Neural Network model"""
        if self._neural_network_model is None:
            self._neural_network_model = EarthquakeNeuralNetwork()
            try:
                self._neural_network_model.load()
            except Exception as e:
                print(f"Warning: Could not load Neural Network model: {e}")
        return self._neural_network_model
    
    @property
    def time_series_model(self):
        """Lazy load Time Series model"""
        if self._time_series_model is None:
            self._time_series_model = CycloneTimeSeries()
            try:
                self._time_series_model.load()
            except Exception as e:
                print(f"Warning: Could not load Time Series model: {e}")
        return self._time_series_model
    
    def predict_flood(self, features: Dict) -> Tuple[float, float]:
        """Predict flood probability using Random Forest"""
        return self.random_forest_model.predict(features)
    
    def predict_earthquake(self, features: Dict) -> Tuple[float, float]:
        """Predict earthquake probability using Neural Network"""
        return self.neural_network_model.predict(features)
    
    def predict_cyclone(self, features: Dict) -> Tuple[float, float]:
        """Predict cyclone probability using Time Series"""
        return self.time_series_model.predict(features)
    
    def predict_all(self, features: Dict) -> Dict:
        """Get predictions for all disaster types"""
        return {
            'flood': self.predict_flood(features),
            'earthquake': self.predict_earthquake(features),
            'cyclone': self.predict_cyclone(features)
        }
    
    def get_risk_level(self, probability: float) -> str:
        """Convert probability to risk level"""
        if probability < 0.20:
            return 'low'
        elif probability < 0.40:
            return 'medium'
        elif probability < 0.60:
            return 'high'
        else:
            return 'severe'
    
    def get_all_model_status(self) -> Dict:
        """Get status of all models"""
        return {
            'random_forest': {
                'loaded': self.random_forest_model.is_trained if self.random_forest_model else False,
                'type': 'Random Forest',
                'accuracy': '83.13%'
            },
            'neural_network': {
                'loaded': self.neural_network_model.is_trained if self.neural_network_model else False,
                'type': 'Neural Network (MLP)',
                'accuracy': '94.00%'
            },
            'time_series': {
                'loaded': self.time_series_model.is_trained if self.time_series_model else False,
                'type': 'Time Series (ARIMA)',
                'accuracy': '69.59%'
            }
        }


# Global service instance
_prediction_service: Optional[DisasterPredictionService] = None


def get_prediction_service() -> DisasterPredictionService:
    """Get or create the global prediction service instance"""
    global _prediction_service
    if _prediction_service is None:
        _prediction_service = DisasterPredictionService()
    return _prediction_service
