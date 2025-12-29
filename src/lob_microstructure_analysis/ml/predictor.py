# src/lob_microstructure_analysis/ml/predictor.py
"""
Real-time prediction engine for LOB microstructure.

Loads trained model and performs sub-millisecond inference.
"""

from pathlib import Path
from typing import Dict, Optional
import numpy as np
import joblib
import lightgbm as lgb


class Predictor:
    """
    Real-time prediction engine.
    
    Usage:
        predictor = Predictor("models/lgbm_model_20240115_123456.txt")
        
        features = {
            'best_bid': 89583.27,
            'best_ask': 89583.28,
            'spread': 0.01,
            'mid_price': 89583.275,
            'bid_volume_top_n': 12.5,
            'ask_volume_top_n': 11.8,
            'orderbook_imbalance': 0.05,
            'rolling_volatility': 15.2,
            'rolling_mid_return': 2.5,
            'rolling_imbalance_mean': 0.03,
        }
        
        prediction = predictor.predict(features)
        # Returns: {
        #     'prediction': 1,  # -1, 0, or 1
        #     'confidence': 0.68,
        #     'probabilities': {'down': 0.12, 'flat': 0.20, 'up': 0.68}
        # }
    """
    
    def __init__(self, model_path: str | Path, feature_names_path: str | Path = None):
        """
        Initialize predictor.
        
        Args:
            model_path: Path to saved LightGBM model (.txt)
            feature_names_path: Path to feature names (.pkl). 
                                If None, infers from model_path
        """
        self.model_path = Path(model_path)
        
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        # Load model
        self.model = lgb.Booster(model_file=str(self.model_path))
        
        # Load feature names
        if feature_names_path is None:
            # Infer from model path
            timestamp = self.model_path.stem.split('_')[-1]
            feature_names_path = self.model_path.parent / f"feature_names_{timestamp}.pkl"
        
        self.feature_names_path = Path(feature_names_path)
        
        if self.feature_names_path.exists():
            self.feature_names = joblib.load(self.feature_names_path)
        else:
            # Fall back to model's feature names
            self.feature_names = self.model.feature_name()
        
        print(f"✅ Model loaded: {self.model_path.name}")
        print(f"   Features: {len(self.feature_names)}")
    
    def predict(self, features: Dict[str, float]) -> Dict:
        """
        Make prediction from feature dictionary.
        
        Args:
            features: Dictionary of feature name -> value
            
        Returns:
            Dictionary with:
                - prediction: -1 (down), 0 (flat), 1 (up)
                - confidence: max probability (0-1)
                - probabilities: dict with 'down', 'flat', 'up' probs
                - raw_probabilities: array [down, flat, up]
        
        Raises:
            ValueError: If required features are missing
        """
        # Validate features
        missing = set(self.feature_names) - set(features.keys())
        if missing:
            raise ValueError(f"Missing features: {missing}")
        
        # Build feature vector in correct order
        feature_vector = np.array([
            features[name] for name in self.feature_names
        ]).reshape(1, -1)
        
        # Predict (returns probabilities for [class 0, class 1, class 2])
        proba = self.model.predict(feature_vector)[0]
        
        # Map back to labels: 0->-1, 1->0, 2->1
        prediction = np.argmax(proba) - 1
        confidence = np.max(proba)
        
        return {
            'prediction': int(prediction),
            'confidence': float(confidence),
            'probabilities': {
                'down': float(proba[0]),
                'flat': float(proba[1]),
                'up': float(proba[2])
            },
            'raw_probabilities': proba.tolist()
        }
    
    def predict_batch(self, features_list: list[Dict[str, float]]) -> list[Dict]:
        """
        Batch prediction for multiple feature sets.
        
        Args:
            features_list: List of feature dictionaries
            
        Returns:
            List of prediction dictionaries
        """
        # Build feature matrix
        feature_matrix = np.array([
            [features[name] for name in self.feature_names]
            for features in features_list
        ])
        
        # Predict
        probas = self.model.predict(feature_matrix)
        
        # Convert to result format
        results = []
        for proba in probas:
            prediction = np.argmax(proba) - 1
            confidence = np.max(proba)
            
            results.append({
                'prediction': int(prediction),
                'confidence': float(confidence),
                'probabilities': {
                    'down': float(proba[0]),
                    'flat': float(proba[1]),
                    'up': float(proba[2])
                }
            })
        
        return results
    
    def get_prediction_label(self, prediction: int) -> str:
        """Convert numeric prediction to label."""
        return {-1: 'DOWN', 0: 'FLAT', 1: 'UP'}.get(prediction, 'UNKNOWN')


def load_latest_model(model_dir: str = "models") -> Predictor:
    """
    Load the most recently trained model.
    
    Args:
        model_dir: Directory containing saved models
        
    Returns:
        Predictor instance
    """
    model_dir = Path(model_dir)
    
    if not model_dir.exists():
        raise FileNotFoundError(f"Model directory not found: {model_dir}")
    
    # Find all model files
    model_files = list(model_dir.glob("lgbm_model_*.txt"))
    
    if not model_files:
        raise FileNotFoundError(f"No models found in {model_dir}")
    
    # Sort by modification time (most recent first)
    latest_model = max(model_files, key=lambda p: p.stat().st_mtime)
    
    print(f"Loading latest model: {latest_model.name}")
    
    return Predictor(latest_model)


# Example usage
if __name__ == "__main__":
    # Load latest model
    predictor = load_latest_model("models")
    
    # Example feature vector
    features = {
    'best_bid': 89583.27,
    'best_ask': 89583.28,
    'spread': 0.01,
    'mid_price': 89583.275,
    'bid_volume_top_n': 12.5,
    'ask_volume_top_n': 11.8,
    'orderbook_imbalance': 0.05,
    'rolling_volatility': 15.2,
    'rolling_mid_return': 2.5,
    'rolling_imbalance_mean': 0.03,
}

    
    # Predict
    result = predictor.predict(features)
    
    print("\n=== Prediction ===")
    print(f"Direction: {predictor.get_prediction_label(result['prediction'])}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Probabilities:")
    print(f"  DOWN: {result['probabilities']['down']:.2%}")
    print(f"  FLAT: {result['probabilities']['flat']:.2%}")
    print(f"  UP:   {result['probabilities']['up']:.2%}")