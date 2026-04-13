"""
Random Forest Model for Flood Prediction
Specialized model for flood prediction using ensemble of decision trees
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score, confusion_matrix
import joblib
import os
from typing import Dict, Tuple, Optional

from .data_generator import generate_disaster_data, get_feature_columns


class RandomForestFloodModel:
    """
    Random Forest model specifically optimized for flood prediction
    """
    
    def __init__(self, model_path: str = "backend/models/random_forest_flood.pkl"):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        self.scaler = StandardScaler()
        self.model_path = model_path
        # Flood-specific features (emphasize precipitation and terrain features)
        self.feature_columns = [
            'precipitation', 'humidity', 'historical_flood_risk', 
            'terrain_elevation', 'visibility', 'wind_speed',
            'temperature', 'cloud_cover', 'pressure', 'distance_to_coast',
            'month', 'day_of_year'
        ]
        self.is_trained = False
        
    def train(self, n_samples: int = 10000) -> Dict:
        """Train the Random Forest model for flood prediction"""
        print("Generating training data...")
        df = generate_disaster_data(n_samples)
        
        # Prepare features
        X = df[self.feature_columns].values
        y = df['flood'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        print("Training Random Forest model for Flood Prediction...")
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
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'classification_report': classification_report(y_test, y_pred),
            'n_samples': n_samples,
            'n_flood_cases': int(y.sum()),
            'n_features': len(self.feature_columns)
        }
    
    def predict(self, features: Dict) -> Tuple[float, float]:
        """
        Predict flood probability
        
        Args:
            features: Dictionary of input features
            
        Returns:
            Tuple of (probability, confidence)
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        # Prepare features in correct order
        feature_vector = np.array([[
            features.get(col, 0) for col in self.feature_columns
        ]])
        
        # Scale and predict
        feature_scaled = self.scaler.transform(feature_vector)
        probability = self.model.predict_proba(feature_scaled)[0, 1]
        
        # Confidence based on prediction variance across trees
        all_tree_probas = np.array([
            tree.predict_proba(feature_scaled)[0, 1] 
            for tree in self.model.estimators_
        ])
        confidence = 1 - np.std(all_tree_probas)
        
        return float(probability), float(confidence)
    
    def predict_batch(self, features_df: pd.DataFrame) -> np.ndarray:
        """Predict flood probabilities for multiple samples"""
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        X = features_df[self.feature_columns].values
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)[:, 1]
    
    def predict_risk_level(self, features: Dict) -> Tuple[str, float]:
        """
        Predict flood risk level
        
        Returns:
            Tuple of (risk_level, probability)
            risk_level: 'low', 'medium', 'high', 'severe'
        """
        probability, _ = self.predict(features)
        
        if probability < 0.25:
            risk_level = 'low'
        elif probability < 0.50:
            risk_level = 'medium'
        elif probability < 0.75:
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
            'disaster_type': 'flood'
        }, self.model_path)
        print(f"Flood model saved to {self.model_path}")
    
    def load(self):
        """Load model and scaler from disk"""
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.feature_columns = data['feature_columns']
            self.is_trained = True
            print(f"Flood model loaded from {self.model_path}")
        else:
            print(f"Model file not found at {self.model_path}")
    
    def get_feature_importance(self) -> pd.DataFrame:
        """Get feature importance from Random Forest"""
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        return importance
    
    def tune_hyperparameters(self, X_train: np.ndarray, y_train: np.ndarray) -> Dict:
        """
        Tune hyperparameters using GridSearchCV
        """
        param_grid = {
            'n_estimators': [50, 100, 200],
            'max_depth': [10, 15, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }
        
        print("Tuning Random Forest hyperparameters...")
        grid_search = GridSearchCV(
            RandomForestClassifier(random_state=42, n_jobs=-1),
            param_grid,
            cv=3,
            scoring='roc_auc',
            n_jobs=-1
        )
        
        grid_search.fit(X_train, y_train)
        
        self.model = grid_search.best_estimator_
        
        return {
            'best_params': grid_search.best_params_,
            'best_score': grid_search.best_score_
        }


def train_flood_model() -> Dict:
    """
    Train and save the Random Forest flood model
    """
    model = RandomForestFloodModel()
    results = model.train(15000)
    
    print(f"\n=== Flood Prediction Model Training Results ===")
    print(f"Accuracy: {results['accuracy']:.4f}")
    print(f"ROC-AUC: {results['roc_auc']:.4f}")
    print(f"Training Samples: {results['n_samples']}")
    print(f"Flood Cases in Training: {results['n_flood_cases']}")
    
    print("\nFeature Importance:")
    importance = model.get_feature_importance()
    for _, row in importance.head(5).iterrows():
        print(f"  {row['feature']}: {row['importance']:.4f}")
    
    return results


if __name__ == "__main__":
    # Train and test model
    results = train_flood_model()
    
    # Test prediction
    test_features = {
        'precipitation': 75,
        'humidity': 92,
        'historical_flood_risk': 0.8,
        'terrain_elevation': 5,
        'visibility': 1,
        'wind_speed': 35,
        'temperature': 28,
        'cloud_cover': 95,
        'pressure': 1005,
        'distance_to_coast': 50,
        'month': 7,
        'day_of_year': 195
    }
    
    model = RandomForestFloodModel()
    model.load()
    
    prob, conf = model.predict(test_features)
    risk_level, _ = model.predict_risk_level(test_features)
    
    print(f"\n=== Test Prediction ===")
    print(f"Flood Probability: {prob:.2%}")
    print(f"Risk Level: {risk_level.upper()}")
    print(f"Confidence: {conf:.2%}")
