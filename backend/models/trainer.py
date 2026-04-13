"""
Model Trainer
Trains all ML models for the disaster prediction system
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.logistic_regression_model import train_all_types as train_logistic
from models.random_forest_model import train_flood_model
from models.neural_network_model import train_earthquake_model
from models.time_series_model import train_cyclone_model


def train_all_models():
    """
    Train all ML models for disaster prediction
    """
    print("=" * 60)
    print("DISASTER PREDICTION MODEL TRAINING")
    print("=" * 60)
    
    results = {}
    
    # 1. Train Logistic Regression (base model for all types)
    print("\n" + "=" * 60)
    print("1. TRAINING LOGISTIC REGRESSION MODELS")
    print("=" * 60)
    try:
        results['logistic_regression'] = train_logistic()
        print("\n✓ Logistic Regression training completed!")
    except Exception as e:
        print(f"\n✗ Logistic Regression training failed: {e}")
        results['logistic_regression'] = {'error': str(e)}
    
    # 2. Train Random Forest (for floods)
    print("\n" + "=" * 60)
    print("2. TRAINING RANDOM FOREST MODEL (FLOODS)")
    print("=" * 60)
    try:
        results['random_forest'] = train_flood_model()
        print("\n✓ Random Forest training completed!")
    except Exception as e:
        print(f"\n✗ Random Forest training failed: {e}")
        results['random_forest'] = {'error': str(e)}
    
    # 3. Train Neural Network (for earthquakes)
    print("\n" + "=" * 60)
    print("3. TRAINING NEURAL NETWORKTHQUAKES MODEL (EAR)")
    print("=" * 60)
    try:
        results['neural_network'] = train_earthquake_model()
        print("\n✓ Neural Network training completed!")
    except Exception as e:
        print(f"\n✗ Neural Network training failed: {e}")
        results['neural_network'] = {'error': str(e)}
    
    # 4. Train Time Series (for cyclones)
    print("\n" + "=" * 60)
    print("4. TRAINING TIME SERIES MODEL (CYCLONES)")
    print("=" * 60)
    try:
        results['time_series'] = train_cyclone_model()
        print("\n✓ Time Series training completed!")
    except Exception as e:
        print(f"\n✗ Time Series training failed: {e}")
        results['time_series'] = {'error': str(e)}
    
    # Summary
    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    
    for model_name, result in results.items():
        print(f"\n{model_name.upper().replace('_', ' ')}:")
        if 'error' in result:
            print(f"  Status: FAILED")
            print(f"  Error: {result['error']}")
        else:
            print(f"  Status: SUCCESS")
            if 'accuracy' in result:
                print(f"  Accuracy: {result['accuracy']:.4f}")
            if 'roc_auc' in result:
                print(f"  ROC-AUC: {result['roc_auc']:.4f}")
            if 'rmse' in result:
                print(f"  RMSE: {result['rmse']:.4f}")
    
    print("\n" + "=" * 60)
    print("ALL MODELS TRAINED SUCCESSFULLY!")
    print("=" * 60)
    print("\nModel files saved in: backend/models/")
    print("  - logistic_regression.pkl")
    print("  - random_forest_flood.pkl")
    print("  - neural_network_earthquake.keras")
    print("  - time_series_cyclone.pkl")
    
    return results


if __name__ == "__main__":
    train_all_models()
