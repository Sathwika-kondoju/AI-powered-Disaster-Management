"""
Logistic Regression Model for Disaster Prediction
Multi-class classification for Flood, Earthquake, and Cyclone prediction
"""

import numpy as np
import pandas as pd
import os
import joblib
from typing import Dict, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

from .data_generator import generate_disaster_data, get_feature_columns


class LogisticRegressionModel:
    """
    Logistic Regression model for multi-class disaster prediction
    """
    
    def __init__(self, model_path: str = "backend/models/logistic_regression.pkl"):
        self.model: Optional[LogisticRegression] = None
        self.scaler = StandardScaler()
        self.model_path = model_path
        self.feature_columns = get_feature_columns()
        self.is_trained = False
        
    def build_model(self, disaster_type: str = 'flood') -> LogisticRegression:
        """Build logistic regression model"""
        if disaster_type == 'flood':
            # Binary classification for flood
            model = LogisticRegression(
                solver='lbfgs',
                max_iter=1000,
                random_state=42
            )
        elif disaster_type == 'earthquake':
            # Binary classification for earthquake
            model = LogisticRegression(
                solver='lbfgs',
                max_iter=1000,
                random_state=42
            )
        elif disaster_type == 'cyclone':
            # Binary classification for cyclone
            model = LogisticRegression(
                solver='lbfgs',
                max_iter=1000,
                random_state=42
            )
        else:
            model = LogisticRegression(
                solver='lbfgs',
                max_iter=1000,
                random_state=42
            )
        return model
    
    def train(self, n_samples: int = 10000, disaster_type: str = 'flood') -> Dict:
        """Train the logistic regression model"""
        print(f"Training Logistic Regression for {disaster_type}...")
        
        df = generate_disaster_data(n_samples)
        
        # Select target column based on disaster type
        if disaster_type == 'flood':
            target_col = 'flood'
        elif disaster_type == 'earthquake':
            target_col = 'earthquake'
        else:
            target_col = 'cyclone'
        
        # Prepare features and target
        X = df[self.feature_columns].values
        y = df[target_col].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Build and train model
        self.model = self.build_model(disaster_type)
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        
        # Handle single-class case
        if len(np.unique(y_test)) > 1:
            roc_auc = roc_auc_score(y_test, y_pred_proba)
        else:
            roc_auc = 1.0  # Perfect score if only one class
        
        self.is_trained = True
        
        # Save model
        self.save()
        
        return {
            'accuracy': accuracy,
            'roc_auc': roc_auc,
            'disaster_type': disaster_type,
            'n_samples': n_samples
        }
    
    def predict(self, features: Dict) -> Tuple[float, float]:
        """Predict disaster probability"""
        if not self.is_trained or self.model is None:
            raise ValueError("Model not trained yet!")
        
        # Prepare features in correct order
        feature_vector = np.array([[
            features.get(col, 0) for col in self.feature_columns
        ]])
        
        # Scale and predict
        feature_scaled = self.scaler.transform(feature_vector)
        probability = self.model.predict_proba(feature_scaled)[0, 1]
        
        # Confidence based on prediction margin
        all_proba = self.model.predict_proba(feature_scaled)[0]
        confidence = 1 - np.std(all_proba)
        
        return float(probability), float(confidence)
    
    def save(self):
        """Save model and scaler to disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'disaster_type': 'logistic_regression'
        }, self.model_path)
        
        print(f"Logistic Regression model saved to {self.model_path}")
    
    def load(self):
        """Load model and scaler from disk"""
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.feature_columns = data['feature_columns']
            self.is_trained = True
            print(f"Logistic Regression model loaded from {self.model_path}")
        else:
            print(f"Model file not found at {self.model_path}")


def train_all_types() -> Dict:
    """
    Train logistic regression for all disaster types
    """
    results = {}
    
    # Train for flood
    model = LogisticRegressionModel("backend/models/logistic_regression_flood.pkl")
    results['flood'] = model.train(10000, 'flood')
    print(f"Flood - Accuracy: {results['flood']['accuracy']:.4f}, ROC-AUC: {results['flood']['roc_auc']:.4f}")
    
    # Train for earthquake
    model = LogisticRegressionModel("backend/models/logistic_regression_earthquake.pkl")
    results['earthquake'] = model.train(10000, 'earthquake')
    print(f"Earthquake - Accuracy: {results['earthquake']['accuracy']:.4f}, ROC-AUC: {results['earthquake']['roc_auc']:.4f}")
    
    # Train for cyclone
    model = LogisticRegressionModel("backend/models/logistic_regression_cyclone.pkl")
    results['cyclone'] = model.train(10000, 'cyclone')
    print(f"Cyclone - Accuracy: {results['cyclone']['accuracy']:.4f}, ROC-AUC: {results['cyclone']['roc_auc']:.4f}")
    
    return results


if __name__ == "__main__":
    results = train_all_types()
    print("\n=== Training Complete ===")
    for dtype, result in results.items():
        print(f"{dtype}: Accuracy={result['accuracy']:.4f}, ROC-AUC={result['roc_auc']:.4f}")
