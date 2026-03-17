"""
Training pipeline for March Madness prediction model.
Generates synthetic training data based on historical seed matchup win rates,
trains LogisticRegression + XGBoost ensemble.
"""

import json
import os
import pickle
import warnings

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, log_loss
from sklearn.model_selection import cross_val_predict
from xgboost import XGBClassifier

from model.features import FEATURE_COLS

warnings.filterwarnings("ignore")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CACHE_DIR = os.path.join(PROJECT_ROOT, "data", "cache")
MODEL_LR_PATH = os.path.join(CACHE_DIR, "model_lr.pkl")
MODEL_XGB_PATH = os.path.join(CACHE_DIR, "model_xgb.pkl")

# Historical seed matchup win rates (higher seed wins)
SEED_WIN_RATES = {
    (1, 16): 0.99,
    (2, 15): 0.94,
    (3, 14): 0.85,
    (4, 13): 0.80,
    (5, 12): 0.64,
    (6, 11): 0.62,
    (7, 10): 0.61,
    (8, 9): 0.51,
}

# Seed-based stat profiles (mean, std) for generating synthetic data
# These approximate real distributions from historical KenPom/Barttorvik data
SEED_PROFILES = {
    1:  {"adj_em": (28.0, 3.0), "adj_oe": (120.0, 3.0), "adj_de": (92.0, 2.5), "tempo": (69.0, 3.0), "sos": (0.95, 0.03)},
    2:  {"adj_em": (24.5, 3.0), "adj_oe": (118.0, 3.0), "adj_de": (93.5, 2.5), "tempo": (68.5, 3.0), "sos": (0.92, 0.04)},
    3:  {"adj_em": (21.5, 3.0), "adj_oe": (116.5, 3.0), "adj_de": (95.0, 2.5), "tempo": (68.0, 3.0), "sos": (0.89, 0.04)},
    4:  {"adj_em": (19.0, 3.0), "adj_oe": (115.0, 3.0), "adj_de": (96.0, 2.5), "tempo": (68.0, 3.0), "sos": (0.86, 0.05)},
    5:  {"adj_em": (16.5, 3.5), "adj_oe": (113.5, 3.5), "adj_de": (97.0, 3.0), "tempo": (67.5, 3.0), "sos": (0.83, 0.05)},
    6:  {"adj_em": (14.0, 3.5), "adj_oe": (112.0, 3.5), "adj_de": (98.0, 3.0), "tempo": (67.5, 3.0), "sos": (0.80, 0.06)},
    7:  {"adj_em": (12.0, 3.5), "adj_oe": (111.0, 3.5), "adj_de": (99.0, 3.0), "tempo": (67.0, 3.0), "sos": (0.77, 0.06)},
    8:  {"adj_em": (10.0, 4.0), "adj_oe": (110.0, 3.5), "adj_de": (100.0, 3.0), "tempo": (67.0, 3.0), "sos": (0.74, 0.07)},
    9:  {"adj_em": (8.5, 4.0), "adj_oe": (109.0, 3.5), "adj_de": (100.5, 3.0), "tempo": (67.0, 3.0), "sos": (0.72, 0.07)},
    10: {"adj_em": (7.5, 4.0), "adj_oe": (108.5, 3.5), "adj_de": (101.0, 3.0), "tempo": (67.0, 3.0), "sos": (0.70, 0.07)},
    11: {"adj_em": (6.5, 4.5), "adj_oe": (108.0, 4.0), "adj_de": (101.5, 3.5), "tempo": (67.0, 3.0), "sos": (0.67, 0.08)},
    12: {"adj_em": (5.0, 4.5), "adj_oe": (107.0, 4.0), "adj_de": (102.0, 3.5), "tempo": (67.0, 3.0), "sos": (0.63, 0.08)},
    13: {"adj_em": (3.0, 4.5), "adj_oe": (106.0, 4.0), "adj_de": (103.0, 3.5), "tempo": (66.5, 3.0), "sos": (0.55, 0.10)},
    14: {"adj_em": (1.0, 5.0), "adj_oe": (105.0, 4.0), "adj_de": (104.0, 3.5), "tempo": (66.5, 3.0), "sos": (0.50, 0.10)},
    15: {"adj_em": (-1.0, 5.0), "adj_oe": (104.0, 4.0), "adj_de": (105.0, 4.0), "tempo": (66.0, 3.0), "sos": (0.45, 0.10)},
    16: {"adj_em": (-5.0, 5.0), "adj_oe": (102.0, 4.5), "adj_de": (107.0, 4.5), "tempo": (66.0, 3.0), "sos": (0.38, 0.10)},
}


def generate_team_stats(seed, rng):
    """Generate synthetic team stats for a given seed."""
    profile = SEED_PROFILES[seed]
    adj_oe = rng.normal(*profile["adj_oe"])
    adj_de = rng.normal(*profile["adj_de"])
    tempo = rng.normal(*profile["tempo"])
    sos = np.clip(rng.normal(*profile["sos"]), 0.1, 1.0)

    return {
        "adj_oe": adj_oe,
        "adj_de": adj_de,
        "adj_em": adj_oe - adj_de,
        "tempo": tempo,
        "efg_off": 50.0 + (17 - seed) * 0.6 + rng.normal(0, 2.0),
        "efg_def": 46.0 + seed * 0.5 + rng.normal(0, 2.0),
        "to_off": 17.0 + seed * 0.15 + rng.normal(0, 1.5),
        "to_def": 20.0 - seed * 0.2 + rng.normal(0, 1.5),
        "or_pct": 30.0 + (17 - seed) * 0.3 + rng.normal(0, 2.0),
        "ft_rate": 30.0 + (17 - seed) * 0.4 + rng.normal(0, 3.0),
        "sos": sos,
    }


def generate_matchup_features(seed1, seed2, rng):
    """Generate synthetic features for a seed1 vs seed2 matchup."""
    s1 = generate_team_stats(seed1, rng)
    s2 = generate_team_stats(seed2, rng)

    return {
        "seed_diff": seed2 - seed1,
        "adj_em_diff": s1["adj_em"] - s2["adj_em"],
        "adj_oe_diff": s1["adj_oe"] - s2["adj_oe"],
        "adj_de_diff": s2["adj_de"] - s1["adj_de"],
        "tempo_diff": s1["tempo"] - s2["tempo"],
        "efg_off_diff": s1["efg_off"] - s2["efg_off"],
        "efg_def_diff": s2["efg_def"] - s1["efg_def"],
        "to_off_diff": s2["to_off"] - s1["to_off"],
        "to_def_diff": s1["to_def"] - s2["to_def"],
        "or_diff": s1["or_pct"] - s2["or_pct"],
        "ft_rate_diff": s1["ft_rate"] - s2["ft_rate"],
        "sos_diff": s1["sos"] - s2["sos"],
    }


def generate_training_data(n_samples=2000, seed=42):
    """
    Generate synthetic training data based on historical seed win rates.
    Each sample is a matchup with features and outcome (1 = higher seed wins).
    """
    rng = np.random.RandomState(seed)
    rows = []

    samples_per_matchup = n_samples // len(SEED_WIN_RATES)

    for (high_seed, low_seed), win_rate in SEED_WIN_RATES.items():
        for _ in range(samples_per_matchup):
            features = generate_matchup_features(high_seed, low_seed, rng)

            # Determine outcome based on historical win rate
            # Add some noise based on feature quality (better features = more likely to match base rate)
            em_advantage = features["adj_em_diff"]
            # Adjust win probability based on actual generated stats
            adjusted_prob = win_rate + (em_advantage - (SEED_PROFILES[high_seed]["adj_em"][0] - SEED_PROFILES[low_seed]["adj_em"][0])) * 0.01
            adjusted_prob = np.clip(adjusted_prob, 0.02, 0.98)

            outcome = 1 if rng.random() < adjusted_prob else 0
            features["higher_seed_wins"] = outcome
            features["high_seed"] = high_seed
            features["low_seed"] = low_seed
            rows.append(features)

    # Also generate some random seed matchups for later rounds
    extra_pairs = [
        (1, 8), (1, 5), (1, 4), (1, 3), (1, 2),
        (2, 7), (2, 6), (2, 3), (3, 6), (3, 5),
        (4, 5), (4, 8), (6, 7),
    ]
    # Approximate win rates for these matchups
    extra_rates = {
        (1, 8): 0.80, (1, 5): 0.75, (1, 4): 0.70, (1, 3): 0.65, (1, 2): 0.55,
        (2, 7): 0.72, (2, 6): 0.68, (2, 3): 0.58, (3, 6): 0.60, (3, 5): 0.56,
        (4, 5): 0.55, (4, 8): 0.62, (6, 7): 0.52,
    }

    for pair in extra_pairs:
        rate = extra_rates.get(pair, 0.55)
        for _ in range(samples_per_matchup // 2):
            features = generate_matchup_features(pair[0], pair[1], rng)
            em_advantage = features["adj_em_diff"]
            adjusted_prob = rate + (em_advantage - (SEED_PROFILES[pair[0]]["adj_em"][0] - SEED_PROFILES[pair[1]]["adj_em"][0])) * 0.01
            adjusted_prob = np.clip(adjusted_prob, 0.02, 0.98)
            outcome = 1 if rng.random() < adjusted_prob else 0
            features["higher_seed_wins"] = outcome
            features["high_seed"] = pair[0]
            features["low_seed"] = pair[1]
            rows.append(features)

    df = pd.DataFrame(rows)
    print(f"[INFO] Generated {len(df)} synthetic training samples")
    return df


def train_models(df):
    """Train LogisticRegression and XGBoost models."""
    X = df[FEATURE_COLS].values
    y = df["higher_seed_wins"].values

    # Logistic Regression
    print("\n[TRAIN] Logistic Regression...")
    lr = LogisticRegression(
        C=1.0,
        max_iter=1000,
        solver="lbfgs",
        random_state=42,
    )
    lr.fit(X, y)

    # Cross-validated predictions for evaluation
    lr_probs = cross_val_predict(lr, X, y, cv=5, method="predict_proba")[:, 1]
    lr_preds = (lr_probs > 0.5).astype(int)
    lr_acc = accuracy_score(y, lr_preds)
    lr_ll = log_loss(y, lr_probs)
    print(f"  Accuracy (5-fold CV): {lr_acc:.4f}")
    print(f"  Log Loss (5-fold CV): {lr_ll:.4f}")

    # Feature importances
    print("  Feature weights:")
    for name, coef in sorted(zip(FEATURE_COLS, lr.coef_[0]), key=lambda x: abs(x[1]), reverse=True):
        print(f"    {name}: {coef:+.4f}")

    # XGBoost
    print("\n[TRAIN] XGBoost...")
    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        eval_metric="logloss",
        random_state=42,
        verbosity=0,
    )
    xgb.fit(X, y)

    xgb_probs = cross_val_predict(xgb, X, y, cv=5, method="predict_proba")[:, 1]
    xgb_preds = (xgb_probs > 0.5).astype(int)
    xgb_acc = accuracy_score(y, xgb_preds)
    xgb_ll = log_loss(y, xgb_probs)
    print(f"  Accuracy (5-fold CV): {xgb_acc:.4f}")
    print(f"  Log Loss (5-fold CV): {xgb_ll:.4f}")

    # Feature importances
    print("  Feature importances:")
    for name, imp in sorted(zip(FEATURE_COLS, xgb.feature_importances_), key=lambda x: x[1], reverse=True):
        print(f"    {name}: {imp:.4f}")

    # Ensemble evaluation
    print("\n[EVAL] Ensemble (0.4*LR + 0.6*XGB)...")
    ens_probs = 0.4 * lr_probs + 0.6 * xgb_probs
    ens_preds = (ens_probs > 0.5).astype(int)
    ens_acc = accuracy_score(y, ens_preds)
    ens_ll = log_loss(y, ens_probs)
    print(f"  Accuracy (5-fold CV): {ens_acc:.4f}")
    print(f"  Log Loss (5-fold CV): {ens_ll:.4f}")

    return lr, xgb


def save_models(lr, xgb):
    """Save trained models to disk."""
    os.makedirs(CACHE_DIR, exist_ok=True)

    with open(MODEL_LR_PATH, "wb") as f:
        pickle.dump(lr, f)
    print(f"\n[SAVE] LR model saved to {MODEL_LR_PATH}")

    with open(MODEL_XGB_PATH, "wb") as f:
        pickle.dump(xgb, f)
    print(f"[SAVE] XGB model saved to {MODEL_XGB_PATH}")


def load_models():
    """Load trained models from disk. Returns (lr, xgb) or None."""
    if not os.path.exists(MODEL_LR_PATH) or not os.path.exists(MODEL_XGB_PATH):
        return None, None

    with open(MODEL_LR_PATH, "rb") as f:
        lr = pickle.load(f)
    with open(MODEL_XGB_PATH, "rb") as f:
        xgb = pickle.load(f)

    return lr, xgb


def train_pipeline():
    """Full training pipeline: generate data, train, save."""
    print("=" * 60)
    print("MARCH MADNESS 2026 - MODEL TRAINING PIPELINE")
    print("=" * 60)

    df = generate_training_data(n_samples=2000)
    lr, xgb = train_models(df)
    save_models(lr, xgb)

    print("\n[DONE] Training complete.")
    return lr, xgb


if __name__ == "__main__":
    train_pipeline()
