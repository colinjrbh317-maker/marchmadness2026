"""
Edge detection and Kelly criterion bet sizing.
Compares model probabilities to betting market implied probabilities,
flags value bets, and sizes positions using fractional Kelly.
"""

import json
import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

PREDICTIONS_PATH = os.path.join(PROJECT_ROOT, "data", "predictions.json")
ODDS_PATH = os.path.join(PROJECT_ROOT, "data", "odds_current.json")
VALUE_BETS_PATH = os.path.join(PROJECT_ROOT, "data", "value_bets.json")

# Virginia teams - EXCLUDED from betting recommendations (VA resident restriction)
EXCLUDED_ESPN_IDS = {258, 2670}  # UVA=258, VCU=2670
EXCLUDED_NAMES = {"virginia", "vcu"}

# Minimum edge threshold for a value bet
MIN_EDGE = 0.03  # 3%


def american_to_implied_prob(american_odds):
    """Convert American odds to implied probability."""
    if american_odds > 0:
        return 100.0 / (american_odds + 100.0)
    elif american_odds < 0:
        return abs(american_odds) / (abs(american_odds) + 100.0)
    else:
        return 0.5


def american_to_decimal(american_odds):
    """Convert American odds to decimal odds."""
    if american_odds > 0:
        return 1.0 + american_odds / 100.0
    elif american_odds < 0:
        return 1.0 + 100.0 / abs(american_odds)
    else:
        return 2.0


def fractional_kelly(win_prob, decimal_odds, fraction=0.25, max_pct=0.05, bankroll=1000):
    """
    Calculate fractional Kelly criterion bet size.

    Args:
        win_prob: Model's estimated win probability
        decimal_odds: Decimal odds (e.g., 2.0 for even money)
        fraction: Kelly fraction (0.25 = quarter Kelly, conservative)
        max_pct: Maximum percentage of bankroll to bet
        bankroll: Total bankroll

    Returns:
        Recommended bet size in dollars
    """
    if win_prob <= 0 or win_prob >= 1 or decimal_odds <= 1:
        return 0.0

    # Full Kelly: f = (bp - q) / b
    # where b = decimal_odds - 1, p = win_prob, q = 1 - p
    b = decimal_odds - 1
    p = win_prob
    q = 1 - p

    full_kelly = (b * p - q) / b

    if full_kelly <= 0:
        return 0.0

    # Apply fraction and cap
    bet_pct = min(full_kelly * fraction, max_pct)
    bet_amount = round(bankroll * bet_pct, 2)

    return max(bet_amount, 0)


def is_excluded_team(team):
    """Check if team is a Virginia team (betting excluded)."""
    espn_id = team.get("espnId")
    name = team.get("name", "").lower()

    if espn_id in EXCLUDED_ESPN_IDS:
        return True
    if any(excl in name for excl in EXCLUDED_NAMES):
        return True
    return False


def match_prediction_to_odds(prediction, odds_games):
    """
    Try to match a prediction to odds data by team name.
    Returns the matched odds game or None.
    """
    t1_name = prediction["team1"]["name"].lower()
    t2_name = prediction["team2"]["name"].lower()

    for game in odds_games:
        home = game.get("home_team", "").lower()
        away = game.get("away_team", "").lower()

        # Fuzzy match: check if team name is contained in odds team name
        t1_match = any(
            t1_name in s or s in t1_name
            for s in [home, away]
        )
        t2_match = any(
            t2_name in s or s in t2_name
            for s in [home, away]
        )

        if t1_match or t2_match:
            return game

    return None


def find_value_bets(predictions=None, odds_data=None, bankroll=1000):
    """
    Main value detection function.
    Compares model predictions to market odds, finds edges.
    """
    print("=" * 60)
    print("MARCH MADNESS 2026 - VALUE BET DETECTION")
    print("=" * 60)

    # Load predictions
    if predictions is None:
        if not os.path.exists(PREDICTIONS_PATH):
            print("[ERROR] No predictions found. Run predict.py first.")
            return []
        with open(PREDICTIONS_PATH, "r") as f:
            predictions = json.load(f)

    # Load odds
    odds_games = []
    if odds_data is None:
        if os.path.exists(ODDS_PATH):
            with open(ODDS_PATH, "r") as f:
                odds_raw = json.load(f)
            odds_games = odds_raw.get("games", [])
            print(f"[INFO] Loaded odds for {len(odds_games)} games")
        else:
            print("[WARN] No odds data found. Will generate value estimates without market odds.")

    value_bets = []

    for pred in predictions:
        t1 = pred["team1"]
        t2 = pred["team2"]

        # Skip games involving Virginia teams
        if is_excluded_team(t1) or is_excluded_team(t2):
            print(f"  [SKIP] {t1['name']} vs {t2['name']} (VA team excluded)")
            continue

        # Try to match with odds
        matched_odds = match_prediction_to_odds(pred, odds_games)

        if matched_odds:
            # Extract moneyline odds
            consensus_h2h = matched_odds.get("consensus_h2h", {})

            for team_key, team_data in [("team1", t1), ("team2", t2)]:
                model_prob = team_data["win_prob"]
                team_name = team_data["name"]

                # Find odds for this team
                ml_odds = None
                for odds_name, odds_val in consensus_h2h.items():
                    if team_name.lower() in odds_name.lower() or odds_name.lower() in team_name.lower():
                        ml_odds = odds_val
                        break

                if ml_odds is not None:
                    implied_prob = american_to_implied_prob(ml_odds)
                    edge = model_prob - implied_prob
                    decimal_odds = american_to_decimal(ml_odds)
                    kelly_bet = fractional_kelly(model_prob, decimal_odds, bankroll=bankroll)

                    if edge >= MIN_EDGE:
                        value_bets.append({
                            "game": f"({t1['seed']}) {t1['name']} vs ({t2['seed']}) {t2['name']}",
                            "region": pred["region"],
                            "round": pred["round"],
                            "bet_on": team_name,
                            "bet_on_seed": team_data["seed"],
                            "bet_on_espnId": team_data.get("espnId"),
                            "model_prob": round(model_prob, 4),
                            "implied_prob": round(implied_prob, 4),
                            "edge": round(edge, 4),
                            "american_odds": ml_odds,
                            "decimal_odds": round(decimal_odds, 3),
                            "kelly_bet": kelly_bet,
                            "predicted_spread": pred["predicted_spread"],
                            "confidence": "HIGH" if edge > 0.08 else "MEDIUM" if edge > 0.05 else "LOW",
                        })
        else:
            # No odds available - generate synthetic value estimates based on seed
            # Use seed-implied line as proxy for market odds
            for team_key, team_data in [("team1", t1), ("team2", t2)]:
                model_prob = team_data["win_prob"]
                seed = team_data["seed"]

                # Estimate market implied prob from seed
                # Markets tend to slightly overvalue favorites
                if seed <= 4:
                    market_adjustment = 0.03  # Markets overvalue top seeds by ~3%
                elif seed <= 8:
                    market_adjustment = 0.01
                elif seed <= 12:
                    market_adjustment = -0.02  # Markets slightly undervalue mid-seeds
                else:
                    market_adjustment = -0.03

                opp_team = t2 if team_key == "team1" else t1
                baseline_implied = 1.0 - (seed / (seed + opp_team["seed"]))
                implied_prob = baseline_implied + market_adjustment
                edge = model_prob - implied_prob

                # Estimate American odds from implied prob
                if implied_prob > 0.5:
                    est_american = round(-implied_prob / (1 - implied_prob) * 100)
                else:
                    est_american = round((1 - implied_prob) / implied_prob * 100)

                decimal_odds = american_to_decimal(est_american)
                kelly_bet = fractional_kelly(model_prob, decimal_odds, bankroll=bankroll)

                if edge >= MIN_EDGE:
                    value_bets.append({
                        "game": f"({t1['seed']}) {t1['name']} vs ({t2['seed']}) {t2['name']}",
                        "region": pred["region"],
                        "round": pred["round"],
                        "bet_on": team_data["name"],
                        "bet_on_seed": seed,
                        "bet_on_espnId": team_data.get("espnId"),
                        "model_prob": round(model_prob, 4),
                        "implied_prob": round(implied_prob, 4),
                        "edge": round(edge, 4),
                        "american_odds": est_american,
                        "decimal_odds": round(decimal_odds, 3),
                        "kelly_bet": kelly_bet,
                        "predicted_spread": pred["predicted_spread"],
                        "confidence": "HIGH" if edge > 0.08 else "MEDIUM" if edge > 0.05 else "LOW",
                        "odds_source": "estimated",
                    })

    # Sort by edge descending
    value_bets.sort(key=lambda x: x["edge"], reverse=True)

    # Print results
    print(f"\n--- VALUE BETS (edge >= {MIN_EDGE*100:.0f}%) ---\n")
    total_kelly = 0
    for vb in value_bets:
        total_kelly += vb["kelly_bet"]
        print(
            f"  [{vb['confidence']}] {vb['bet_on']} (seed {vb['bet_on_seed']})"
            f"  |  Edge: {vb['edge']:.1%}  |  Model: {vb['model_prob']:.1%} vs Market: {vb['implied_prob']:.1%}"
            f"  |  Odds: {vb['american_odds']:+d}  |  Kelly: ${vb['kelly_bet']:.2f}"
        )

    print(f"\n  Total value bets: {len(value_bets)}")
    print(f"  Total Kelly allocation: ${total_kelly:.2f} of ${bankroll}")

    # Save
    os.makedirs(os.path.dirname(VALUE_BETS_PATH), exist_ok=True)
    with open(VALUE_BETS_PATH, "w") as f:
        json.dump(value_bets, f, indent=2)
    print(f"\n[DONE] Value bets saved to {VALUE_BETS_PATH}")

    return value_bets


if __name__ == "__main__":
    find_value_bets()
