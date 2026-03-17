"""
Generate JSON files for the React frontend.
Combines predictions, value bets, and bonus picks into public/data/ directory.
"""

import json
import os
import sys
from datetime import datetime

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Input paths
PREDICTIONS_PATH = os.path.join(PROJECT_ROOT, "data", "predictions.json")
VALUE_BETS_PATH = os.path.join(PROJECT_ROOT, "data", "value_bets.json")
BONUS_PICKS_PATH = os.path.join(PROJECT_ROOT, "data", "bonus_picks.json")

# Output paths (for React app)
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public", "data")
OUT_PREDICTIONS = os.path.join(PUBLIC_DIR, "predictions.json")
OUT_VALUE_BETS = os.path.join(PUBLIC_DIR, "value_bets.json")
OUT_BONUS_PICKS = os.path.join(PUBLIC_DIR, "bonus_picks.json")


def load_json(path, default=None):
    """Load JSON file or return default."""
    if not os.path.exists(path):
        print(f"  [WARN] File not found: {path}")
        return default if default is not None else []
    with open(path, "r") as f:
        return json.load(f)


def generate_output(predictions=None, value_bets=None, bonus_picks=None):
    """
    Generate JSON files for the React frontend.
    Can accept data directly or load from disk.
    """
    print("=" * 60)
    print("MARCH MADNESS 2026 - OUTPUT GENERATION")
    print("=" * 60)

    timestamp = datetime.now().isoformat()
    os.makedirs(PUBLIC_DIR, exist_ok=True)

    # Load data if not provided
    if predictions is None:
        predictions = load_json(PREDICTIONS_PATH, [])
    if value_bets is None:
        value_bets = load_json(VALUE_BETS_PATH, [])
    if bonus_picks is None:
        bonus_picks = load_json(BONUS_PICKS_PATH, [])

    # Write predictions.json
    pred_output = {
        "generated_at": timestamp,
        "model_version": "v1.0-synthetic-2026",
        "total_games": len(predictions),
        "predictions": predictions,
    }
    with open(OUT_PREDICTIONS, "w") as f:
        json.dump(pred_output, f, indent=2)
    print(f"[OK] predictions.json: {len(predictions)} games -> {OUT_PREDICTIONS}")

    # Write value_bets.json
    vb_output = {
        "generated_at": timestamp,
        "min_edge_threshold": 0.03,
        "excluded_teams": ["Virginia (UVA)", "VCU"],
        "total_bets": len(value_bets),
        "total_kelly_allocation": round(sum(vb.get("kelly_bet", 0) for vb in value_bets), 2),
        "value_bets": value_bets,
    }
    with open(OUT_VALUE_BETS, "w") as f:
        json.dump(vb_output, f, indent=2)
    print(f"[OK] value_bets.json: {len(value_bets)} bets -> {OUT_VALUE_BETS}")

    # Write bonus_picks.json
    bp_output = {
        "generated_at": timestamp,
        "odds_range": "+200 to +600",
        "sweet_spot": "+300 to +500",
        "excluded_teams": ["Virginia (UVA)", "VCU"],
        "total_picks": len(bonus_picks),
        "sweet_spot_count": sum(1 for p in bonus_picks if p.get("in_sweet_spot")),
        "bonus_picks": bonus_picks,
    }
    with open(OUT_BONUS_PICKS, "w") as f:
        json.dump(bp_output, f, indent=2)
    print(f"[OK] bonus_picks.json: {len(bonus_picks)} picks -> {OUT_BONUS_PICKS}")

    print(f"\n[DONE] All output files generated at {timestamp}")
    print(f"  Output directory: {PUBLIC_DIR}")

    return {
        "predictions": pred_output,
        "value_bets": vb_output,
        "bonus_picks": bp_output,
    }


if __name__ == "__main__":
    generate_output()
