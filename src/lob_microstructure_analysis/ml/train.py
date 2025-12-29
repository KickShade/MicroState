# src/lob_microstructure_analysis/ml/train.py
"""
Model training pipeline for LOB microstructure prediction.

Handles:
- Time-based train/val/test split
- Class imbalance (weighted loss or SMOTE)
- Multiple model architectures
- Hyperparameter tuning
- Model evaluation and saving

Usage:
    python -m lob_microstructure_analysis.ml.train data/features/live_*.parquet
"""

import sys
from pathlib import Path
from datetime import datetime
import polars as pl
import numpy as np
import joblib
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
)
from sklearn.utils.class_weight import compute_class_weight
import lightgbm as lgb


class ModelTrainer:
    """Train and evaluate LOB microstructure models."""
    
    def __init__(
        self,
        data_path: str | Path,
        train_frac: float = 0.7,
        val_frac: float = 0.15,
        # test_frac = 0.15 (implicit)
    ):
        """
        Initialize trainer.
        
        Args:
            data_path: Path to feature dataset (Parquet)
            train_frac: Fraction of data for training
            val_frac: Fraction for validation
        """
        self.data_path = Path(data_path)
        self.train_frac = train_frac
        self.val_frac = val_frac
        
        # Load data
        print(f"Loading data from {self.data_path}...")

        # Handle wildcard / directory paths properly
        if "*" in str(self.data_path) or self.data_path.is_dir():
            files = sorted(self.data_path.parent.glob(self.data_path.name))
            if not files:
                raise FileNotFoundError(f"No parquet files found for {self.data_path}")
            print(f"Found {len(files)} parquet files")
            self.df = pl.concat([pl.read_parquet(f) for f in files])
        else:
            if not self.data_path.exists():
                raise FileNotFoundError(f"Data file not found: {self.data_path}")
            self.df = pl.read_parquet(self.data_path)

        
        # Remove unlabeled rows
        self.df = self.df.filter(pl.col('label').is_not_null())
        
        print(f"Loaded {len(self.df):,} labeled records")
        
        # Feature columns (exclude timestamp and label)
        self.feature_cols = [
            c for c in self.df.columns 
            if c not in ['timestamp', 'label']
        ]
        
        print(f"Features: {len(self.feature_cols)}")
        print(f"  {', '.join(self.feature_cols)}")
        
        # Split data
        self._split_data()
        
        # Model
        self.model = None
        
    def _split_data(self):
        """Time-based train/val/test split (NO shuffling)."""
        # Sort by timestamp (critical!)
        self.df = self.df.sort('timestamp')
        
        n = len(self.df)
        train_end = int(n * self.train_frac)
        val_end = int(n * (self.train_frac + self.val_frac))
        
        train_df = self.df[:train_end]
        val_df = self.df[train_end:val_end]
        test_df = self.df[val_end:]
        
        # Convert to numpy arrays
        self.X_train = train_df.select(self.feature_cols).to_numpy()
        self.y_train = train_df['label'].to_numpy()
        
        self.X_val = val_df.select(self.feature_cols).to_numpy()
        self.y_val = val_df['label'].to_numpy()
        
        self.X_test = test_df.select(self.feature_cols).to_numpy()
        self.y_test = test_df['label'].to_numpy()
        
        print("\n=== Data Split ===")
        print(f"Train: {len(self.X_train):,} samples")
        print(f"Val:   {len(self.X_val):,} samples")
        print(f"Test:  {len(self.X_test):,} samples")
        
        # Label distribution
        print("\n=== Label Distribution ===")
        for split_name, y in [('Train', self.y_train), 
                               ('Val', self.y_val), 
                               ('Test', self.y_test)]:
            unique, counts = np.unique(y, return_counts=True)
            print(f"\n{split_name}:")
            for label, count in zip(unique, counts):
                pct = count / len(y) * 100
                label_name = {-1: 'DOWN', 0: 'FLAT', 1: 'UP'}.get(label, label)
                print(f"  {label_name:5} ({label:2}): {count:5,} ({pct:5.1f}%)")
    
    def train_lightgbm(
        self,
        num_iterations: int = 200,
        learning_rate: float = 0.05,
        num_leaves: int = 31,
        early_stopping_rounds: int = 20,
    ):
        """
        Train LightGBM classifier.
        
        Args:
            num_iterations: Number of boosting rounds
            learning_rate: Learning rate
            num_leaves: Max number of leaves in tree
            early_stopping_rounds: Stop if no improvement
        """
        print("\n" + "="*60)
        print("TRAINING LIGHTGBM MODEL")
        print("="*60)
        
        # Handle class imbalance with class weights
        class_weights = compute_class_weight(
            'balanced',
            classes=np.array([-1, 0, 1]),
            y=self.y_train
        )
        
        # Map labels to weights
        sample_weights = np.array([
            class_weights[{-1: 0, 0: 1, 1: 2}[label]] 
            for label in self.y_train
        ])
        
        print(f"\nClass weights: {class_weights}")
        print(f"  DOWN: {class_weights[0]:.2f}")
        print(f"  FLAT: {class_weights[1]:.2f}")
        print(f"  UP:   {class_weights[2]:.2f}")
        
        # Create datasets
        train_data = lgb.Dataset(
            self.X_train,
            label=self.y_train + 1,  # LightGBM needs 0,1,2 not -1,0,1
            weight=sample_weights,
            feature_name=self.feature_cols,
        )
        
        val_data = lgb.Dataset(
            self.X_val,
            label=self.y_val + 1,
            feature_name=self.feature_cols,
            reference=train_data,
        )
        
        # Parameters
        params = {
            'objective': 'multiclass',
            'num_class': 3,
            'metric': 'multi_logloss',
            'num_leaves': num_leaves,
            'learning_rate': learning_rate,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': 0,
            'seed': 42,
        }
        
        print("\nTraining...")
        
        # Train
        self.model = lgb.train(
            params,
            train_data,
            num_boost_round=num_iterations,
            valid_sets=[train_data, val_data],
            valid_names=['train', 'val'],
            callbacks=[
                lgb.early_stopping(stopping_rounds=early_stopping_rounds),
                lgb.log_evaluation(period=20),
            ]
        )
        
        print("\n✅ Training complete!")
        print(f"Best iteration: {self.model.best_iteration}")
        print(f"Best score: {self.model.best_score}")
    
    def evaluate(self):
        """Evaluate model on all splits."""
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        print("\n" + "="*60)
        print("MODEL EVALUATION")
        print("="*60)
        
        for split_name, X, y in [
            ('Train', self.X_train, self.y_train),
            ('Val', self.X_val, self.y_val),
            ('Test', self.X_test, self.y_test),
        ]:
            # Predict (returns probabilities for each class)
            y_pred_proba = self.model.predict(X)
            y_pred = np.argmax(y_pred_proba, axis=1) - 1  # Convert 0,1,2 -> -1,0,1
            
            # Metrics
            acc = accuracy_score(y, y_pred)
            bal_acc = balanced_accuracy_score(y, y_pred)
            f1_macro = f1_score(y, y_pred, average='macro')
            f1_weighted = f1_score(y, y_pred, average='weighted')
            
            print(f"\n=== {split_name} Set ===")
            print(f"Accuracy:          {acc:.4f}")
            print(f"Balanced Accuracy: {bal_acc:.4f}")
            print(f"F1 (macro):        {f1_macro:.4f}")
            print(f"F1 (weighted):     {f1_weighted:.4f}")
            
            print("\nClassification Report:")
            print(classification_report(
                y, y_pred,
                target_names=['DOWN (-1)', 'FLAT (0)', 'UP (1)'],
                digits=3
            ))
            
            print("Confusion Matrix:")
            cm = confusion_matrix(y, y_pred, labels=[-1, 0, 1])
            print("              Predicted")
            print("              DOWN  FLAT  UP")
            for i, label in enumerate(['DOWN', 'FLAT', 'UP  ']):
                print(f"Actual {label}  {cm[i][0]:5} {cm[i][1]:5} {cm[i][2]:5}")
    
    def plot_feature_importance(self, top_n: int = 15, save_path: str = None):
        """Plot feature importance."""
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        try:
            import matplotlib.pyplot as plt
        except ImportError:
            print("⚠️  matplotlib not installed, skipping plot")
            return
        
        # Get feature importance
        importance = self.model.feature_importance(importance_type='gain')
        feature_names = self.model.feature_name()
        
        # Sort
        top_n = min(top_n, len(importance))
        indices = np.argsort(importance)[::-1][:top_n]

        
        # Plot
        plt.figure(figsize=(10, 6))
        plt.barh(
            range(top_n),
            importance[indices],
            align='center'
        )
        plt.yticks(range(top_n), [feature_names[i] for i in indices])
        plt.xlabel('Importance (Gain)')
        plt.title(f'Top {top_n} Feature Importances')
        plt.gca().invert_yaxis()
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
            print(f"Feature importance plot saved to {save_path}")
        else:
            plt.show()
    
    def save_model(self, output_dir: str = "models"):
        """Save trained model and metadata."""
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save LightGBM model (native format)
        model_path = output_dir / f"lgbm_model_{timestamp}.txt"
        self.model.save_model(str(model_path))
        
        # Save feature names
        feature_path = output_dir / f"feature_names_{timestamp}.pkl"
        joblib.dump(self.feature_cols, feature_path)
        
        # Save metadata
        metadata = {
            'timestamp': timestamp,
            'data_path': str(self.data_path),
            'n_train': len(self.X_train),
            'n_val': len(self.X_val),
            'n_test': len(self.X_test),
            'features': self.feature_cols,
            'best_iteration': self.model.best_iteration,
            'best_score': self.model.best_score,
        }
        
        metadata_path = output_dir / f"model_metadata_{timestamp}.pkl"
        joblib.dump(metadata, metadata_path)
        
        print("\n" + "="*60)
        print("MODEL SAVED")
        print("="*60)
        print(f"Model:    {model_path}")
        print(f"Features: {feature_path}")
        print(f"Metadata: {metadata_path}")
        print("="*60)
        
        return model_path


def main():
    """Main training pipeline."""
    if len(sys.argv) < 2:
        print("Usage: python -m lob_microstructure_analysis.ml.train <data_path>")
        print("Example: python -m lob_microstructure_analysis.ml.train data/features/live_btcusdt_*.parquet")
        sys.exit(1)
    
    data_path = sys.argv[1]
    
    # Initialize trainer
    trainer = ModelTrainer(
        data_path=data_path,
        train_frac=0.7,
        val_frac=0.15,
    )
    
    # Train model
    trainer.train_lightgbm(
        num_iterations=200,
        learning_rate=0.05,
        num_leaves=31,
        early_stopping_rounds=20,
    )
    
    # Evaluate
    trainer.evaluate()
    
    # Feature importance (optional)
    try:
        trainer.plot_feature_importance(
            top_n=15,
            save_path="models/feature_importance.png"
        )
    except Exception as e:
        print(f"Could not plot feature importance: {e}")
    
    # Save model
    trainer.save_model(output_dir="models")
    
    print("\n✅ Training pipeline complete!")


if __name__ == "__main__":
    main()