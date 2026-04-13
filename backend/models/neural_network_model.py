"""
Neural Network Model for Earthquake Prediction
Using sklearn's MLPClassifier for neural network implementation
"""

import numpy as np
import pandas as pd
import os
import joblib
from typing import Dict, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

from .data_generator import generate_disaster_data, get_feature_columns


class EarthquakeNeuralNetwork:
    """
    Neural Network model for earthquake prediction
    Uses Multi-Layer Perceptron (Deep Learning)
    """
    
    def __init__(self, model_path: str = "backend/models/neural_network_earthquake.pkl"):
        self.model: Optional[MLPClassifier] = None
        self.scaler = StandardScaler()
        self.model_path = model_path
        # Earthquake-specific features (emphasize seismic activity and pressure)
        self.feature_columns = [
            'seismic_activity', 'pressure', 'temperature', 
            'humidity', 'wind_speed', 'cloud_cover',
            'precipitation', 'visibility', 'terrain_elevation',
            'month', 'day_of_year'
        ]
        self.is_trained = False
        self.training_history = None
        
    def build_model(self) -> MLPClassifier:
        """
        Build the neural network architecture
        """
        model = MLPClassifier(
            hidden_layer_sizes=(128, 64, 32, 16),
            activation='relu',
            solver='adam',
            alpha=0.001,
            batch_size=32,
            learning_rate='adaptive',
            learning_rate_init=0.001,
            max_iter=200,
            early_stopping=True,
            validation_fraction=0.1,
            n_iter_no_change=15,
            random_state=42,
            verbose=False
        )
        return model
    
    def train(self, n_samples: int = 10000) -> Dict:
        """Train the neural network model"""
        print("Generating training data...")
        df = generate_disaster_data(n_samples)
        
        # Prepare features
        X = df[self.feature_columns].values
        y = df['earthquake'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Build model
        print("Building Neural Network for Earthquake Prediction...")
        self.model = self.build_model()
        
        # Train model
        print("Training Neural Network...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        
        self.is_trained = True
        
        # Save model
        self.save()
        
        return {
            'accuracy': accuracy,
            'roc_auc': roc_auc,
            'classification_report': classification_report(y_test, y_pred),
            'n_samples': n_samples,
            'n_earthquake_cases': int(y.sum()),
            'n_features': len(self.feature_columns),
            'iterations': self.model.n_iter_
        }
    
    def predict(self, features: Dict) -> Tuple[float, float]:
        """
        Predict earthquake probability
        
        Args:
            features: Dictionary of input features
            
        Returns:
            Tuple of (probability, confidence)
        """
        if not self.is_trained or self.model is None:
            raise ValueError("Model not trained yet!")
        
        # Prepare features in correct order
        feature_vector = np.array([[
            features.get(col, 0) for col in self.feature_columns
        ]])
        
        # Scale and predict
        feature_scaled = self.scaler.transform(feature_vector)
        probability = self.model.predict_proba(feature_scaled)[0, 1]
        
        # Confidence based on loss (lower loss = higher confidence)
        # Using prediction margin as confidence proxy
        all_proba = self.model.predict_proba(feature_scaled)[0]
        confidence = 1 - np.std(all_proba)
        
        return float(probability), float(confidence)
    
    def predict_batch(self, features_df: pd.DataFrame) -> np.ndarray:
        """Predict earthquake probabilities for multiple samples"""
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        X = features_df[self.feature_columns].values
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)[:, 1]
    
    def predict_risk_level(self, features: Dict) -> Tuple[str, float]:
        """
        Predict earthquake risk level
        
        Returns:
            Tuple of (risk_level, probability)
            risk_level: 'low', 'medium', 'high', 'severe'
        """
        probability, _ = self.predict(features)
        
        if probability < 0.20:
            risk_level = 'low'
        elif probability < 0.40:
            risk_level = 'medium'
        elif probability < 0.60:
            risk_level = 'high'
        else:
            risk_level = 'severe'
        
        return risk_level, probability
    
    def save(self):
        """Save model and scaler to disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'disaster_type': 'earthquake'
        }, self.model_path)
        
        print(f"Earthquake model saved to {self.model_path}")
    
    def load(self):
        """Load model and scaler from disk"""
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.feature_columns = data['feature_columns']
            self.is_trained = True
            print(f"Earthquake model loaded from {self.model_path}")
        else:
            print(f"Model file not found at {self.model_path}")
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        if self.model is None:
            return {"status": "Model not built yet!"}
        
        return {
            "hidden_layers": self.model.hidden_layer_sizes,
            "iterations": self.model.n_iter_,
            "loss": self.model.loss_,
            "n_layers": self.model.n_layers_
        }


def train_earthquake_model() -> Dict:
    """
    Train and save the Neural Network earthquake model
    """
    model = EarthquakeNeuralNetwork()
    results = model.train(15000)
    
    print(f"\n=== Earthquake Prediction Model Training Results ===")
    print(f"Accuracy: {results['accuracy']:.4f}")
    print(f"ROC-AUC: {results['roc_auc']:.4f}")
    print(f"Training Samples: {results['n_samples']}")
    print(f"Earthquake Cases in Training: {results['n_earthquake_cases']}")
    print(f"Iterations: {results['iterations']}")
    
    return results


if __name__ == "__main__":
    # Train and test model
    results = train_earthquake_model()
    
    # Test prediction
    test_features = {
        'seismic_activity': 5.5,
        'pressure': 1008,
        'temperature': 25,
        'humidity': 65,
        'wind_speed': 15,
        'cloud_cover': 40,
        'precipitation': 5,
        'visibility': 8,
        'terrain_elevation': 500,
        'month': 6,
        'day_of_year': 170
    }
    
    model = EarthquakeNeuralNetwork()
    model.load()
    
    prob, conf = model.predict(test_features)
    risk_level, _ = model.predict_risk_level(test_features)
    
    print(f"\n=== Test Prediction ===")
    print(f"Earthquake Probability: {prob:.2%}")
    print(f"Risk Level: {risk_level.upper()}")
    print(f"Confidence: {conf:.2%}")
