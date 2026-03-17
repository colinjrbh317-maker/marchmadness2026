"""
Generate predictions for all tournament matchups.
Loads trained models (or trains if missing), computes win probabilities,
predicted spreads, and totals for each first-round game.
"""

import json
import os
import sys

import numpy as np
import pandas as pd

# Add project root to path for imports
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from model.features import FEATURE_COLS, load_team_stats, compute_matchup_features
from model.train import load_models, train_pipeline

PREDICTIONS_PATH = os.path.join(PROJECT_ROOT, "data", "predictions.json")


def get_models():
    """Load or train models."""
    lr, xgb = load_models()
    if lr is None or xgb is None:
        print("[INFO] No saved models found. Training now...")
        lr, xgb = train_pipeline()
    return lr, xgb


def predict_matchup(lr, xgb, team1_stats, team2_stats, team1_seed, team2_seed):
    """
    Predict outcome of team1 (higher seed) vs team2 (lower seed).
    Returns dict with probabilities, predicted spread, predicted total.
    """
    features = compute_matchup_features(team1_stats, team2_stats, team1_seed, team2_seed)
    X = pd.DataFrame([features])[FEATURE_COLS].values

    # Get probabilities from both models
    lr_prob = lr.predict_proba(X)[0][1]  # P(higher seed wins)
    xgb_prob = xgb.predict_proba(X)[0][1]

    # Ensemble: 0.4 * LR + 0.6 * XGB
    ensemble_prob = 0.4 * lr_prob + 0.6 * xgb_prob

    # Predicted spread (negative means team1 favored)
    # Rough conversion: each 0.01 of win prob above 0.5 ~ 0.3 points
    prob_advantage = ensemble_prob - 0.5
    predicted_spread = round(-prob_advantage * 30, 1)  # team1 perspective

    # Predicted total based on combined tempo and offensive efficiency
    avg_tempo = (team1_stats.get("tempo", 68) + team2_stats.get("tempo", 68)) / 2
    avg_oe = (team1_stats.get("adj_oe", 110) + team2_stats.get("adj_oe", 110)) / 2
    predicted_total = round(avg_tempo * avg_oe / 100 * 2, 1)

    return {
        "team1_win_prob": round(ensemble_prob, 4),
        "team2_win_prob": round(1 - ensemble_prob, 4),
        "lr_prob": round(lr_prob, 4),
        "xgb_prob": round(xgb_prob, 4),
        "predicted_spread": predicted_spread,
        "predicted_total": predicted_total,
        "features": {k: round(v, 3) for k, v in features.items()},
    }


def build_matchup_pairs(all_stats):
    """
    Build all Round of 64 matchup pairs from team stats.
    Returns list of (team1_data, team2_data) where team1 is the higher seed.
    Also includes First Four matchups.
    """
    # Group teams by region and seed
    by_region_seed = {}
    first_four_pairs = []

    for key, team in all_stats.items():
        region = team.get("region")
        seed = team.get("seed")
        is_ff = team.get("firstFour", False)

        rk = (region, seed)
        if rk not in by_region_seed:
            by_region_seed[rk] = []
        by_region_seed[rk].append((key, team))

    # Identify First Four matchups (same region, same seed, both firstFour)
    for rk, teams in by_region_seed.items():
        if len(teams) == 2 and all(t[1].get("firstFour") for t in teams):
            first_four_pairs.append((teams[0], teams[1], rk))

    # Build R64 matchups
    regions = ["East", "South", "West", "Midwest"]
    seed_pairs = [(1, 16), (2, 15), (3, 14), (4, 13), (5, 12), (6, 11), (7, 10), (8, 9)]
    r64_matchups = []

    for region in regions:
        for high_seed, low_seed in seed_pairs:
            high_teams = by_region_seed.get((region, high_seed), [])
            low_teams = by_region_seed.get((region, low_seed), [])

            # Pick non-First-Four team, or first available
            t1 = None
            for kt in high_teams:
                if not kt[1].get("firstFour"):
                    t1 = kt
                    break
            if not t1 and high_teams:
                t1 = high_teams[0]

            t2 = None
            for kt in low_teams:
                if not kt[1].get("firstFour"):
                    t2 = kt
                    break
            if not t2 and low_teams:
                t2 = low_teams[0]

            if t1 and t2:
                r64_matchups.append({
                    "round": "R64",
                    "region": region,
                    "team1_key": t1[0],
                    "team1": t1[1],
                    "team2_key": t2[0],
                    "team2": t2[1],
                })

    # Build First Four matchups
    ff_matchups = []
    for (k1, t1), (k2, t2), rk in first_four_pairs:
        ff_matchups.append({
            "round": "First Four",
            "region": rk[0],
            "team1_key": k1,
            "team1": t1,
            "team2_key": k2,
            "team2": t2,
        })

    return ff_matchups + r64_matchups


def generate_predictions():
    """Main prediction function. Returns list of all predictions."""
    print("=" * 60)
    print("MARCH MADNESS 2026 - PREDICTION ENGINE")
    print("=" * 60)

    # Load models
    lr, xgb = get_models()

    # Load team stats
    print("\n[INFO] Loading team stats...")
    all_stats = load_team_stats()
    print(f"[INFO] Loaded stats for {len(all_stats)} teams")

    # Build matchups
    matchups = build_matchup_pairs(all_stats)
    print(f"[INFO] Built {len(matchups)} matchups")

    predictions = []
    print("\n--- PREDICTIONS ---\n")

    for m in matchups:
        t1 = m["team1"]
        t2 = m["team2"]

        pred = predict_matchup(
            lr, xgb,
            t1["stats"], t2["stats"],
            t1["seed"], t2["seed"],
        )

        result = {
            "round": m["round"],
            "region": m["region"],
            "team1": {
                "name": t1["name"],
                "seed": t1["seed"],
                "abbr": t1.get("abbr", ""),
                "espnId": t1.get("espnId"),
                "win_prob": pred["team1_win_prob"],
            },
            "team2": {
                "name": t2["name"],
                "seed": t2["seed"],
                "abbr": t2.get("abbr", ""),
                "espnId": t2.get("espnId"),
                "win_prob": pred["team2_win_prob"],
            },
            "predicted_spread": pred["predicted_spread"],
            "predicted_total": pred["predicted_total"],
            "model_detail": {
                "lr_prob": pred["lr_prob"],
                "xgb_prob": pred["xgb_prob"],
                "ensemble_prob": pred["team1_win_prob"],
            },
        }
        predictions.append(result)

        # Print summary
        marker = m["round"]
        fav = t1["name"] if pred["team1_win_prob"] > 0.5 else t2["name"]
        fav_prob = max(pred["team1_win_prob"], pred["team2_win_prob"])
        print(
            f"  [{marker}] ({t1['seed']}) {t1['name']} vs ({t2['seed']}) {t2['name']}"
            f"  =>  {fav} {fav_prob:.1%}  |  Spread: {pred['predicted_spread']:+.1f}  |  Total: {pred['predicted_total']:.0f}"
        )

    # Convert numpy types to native Python for JSON serialization
    def convert_numpy(obj):
        if isinstance(obj, dict):
            return {k: convert_numpy(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_numpy(i) for i in obj]
        elif hasattr(obj, 'item'):  # numpy scalar
            return obj.item()
        return obj

    predictions = convert_numpy(predictions)

    # Save predictions
    os.makedirs(os.path.dirname(PREDICTIONS_PATH), exist_ok=True)
    with open(PREDICTIONS_PATH, "w") as f:
        json.dump(predictions, f, indent=2)
    print(f"\n[DONE] {len(predictions)} predictions saved to {PREDICTIONS_PATH}")

    return predictions


if __name__ == "__main__":
    generate_predictions()
