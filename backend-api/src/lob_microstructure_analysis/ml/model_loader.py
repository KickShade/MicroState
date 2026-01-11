# # src/lob_microstructure_analysis/ml/model_loader.py

# from pathlib import Path
# from lob_microstructure_analysis.ml.predictor import Predictor


# # ------------------------------------------------------------
# # Robust repo root resolution (works with uvicorn, pytest, CLI)
# # ------------------------------------------------------------
# PROJECT_ROOT = Path(__file__).resolve()
# while PROJECT_ROOT.name != "lob_microstructure_analysis":
#     if PROJECT_ROOT.parent == PROJECT_ROOT:
#         raise RuntimeError("Could not locate project root")
#     PROJECT_ROOT = PROJECT_ROOT.parent

# MODELS_DIR = PROJECT_ROOT / "models"


# def load_latest_model() -> Predictor:
#     if not MODELS_DIR.exists():
#         raise FileNotFoundError(f"Models directory not found: {MODELS_DIR}")

#     model_files = sorted(
#         MODELS_DIR.glob("lgbm_model_*.txt"),
#         key=lambda p: p.stat().st_mtime,
#         reverse=True,
#     )

#     if not model_files:
#         raise FileNotFoundError(f"No trained model artifacts found in {MODELS_DIR}")

#     model_path = model_files[0]

#     print("📦 Loading LightGBM model")
#     print(f"   Path: {model_path}")
#     print(f"   Exists: {model_path.exists()}")

#     return Predictor(model_path)


# src/lob_microstructure_analysis/ml/model_loader.py

from pathlib import Path
import importlib.util
from lob_microstructure_analysis.ml.predictor import Predictor


# ------------------------------------------------------------
# Robust project root resolution (namespace-package safe)
# ------------------------------------------------------------
def get_project_root() -> Path:
    spec = importlib.util.find_spec("lob_microstructure_analysis")
    if spec is None or spec.origin is None:
        # Fallback: current working directory
        return Path.cwd()

    # spec.origin points to .../lob_microstructure_analysis/__init__.py
    package_path = Path(spec.origin).resolve()

    # Walk up until we find pyproject.toml
    current = package_path
    while current != current.parent:
        if (current / "pyproject.toml").exists():
            return current
        current = current.parent

    # Final fallback (never crash at import time)
    return Path.cwd()


PROJECT_ROOT = get_project_root()
MODELS_DIR = PROJECT_ROOT / "models"


def load_latest_model() -> Predictor:
    if not MODELS_DIR.exists():
        raise FileNotFoundError(f"Models directory not found: {MODELS_DIR}")

    model_files = sorted(
        MODELS_DIR.glob("lgbm_model_*.txt"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not model_files:
        raise FileNotFoundError(f"No trained model artifacts found in {MODELS_DIR}")

    model_path = model_files[0]

    print("📦 Loading LightGBM model")
    print(f"   Path: {model_path}")

    return Predictor(model_path)
