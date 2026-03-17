"""
Bonus bet optimizer: rank games for promotional/bonus bet placement.
Finds best underdog opportunities in the +300 to +500 range,
calculates conversion scores and confidence levels.
"""

import json
import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from model.value import american_to_implied_prob, american_to_decimal, is_excluded_team

PREDICTIONS_PATH = os.path.join(PROJECT_ROOT, "data", "predictions.json")
ODDS_PATH = os.path.join(PROJECT_ROOT, "data", "odds_current.json")
BONUS_PICKS_PATH = os.path.join(PROJECT_ROOT, "data", "bonus_picks.json")

# Bonus bet sweet spot: underdog odds range
BONUS_MIN_ODDS = 200   # +200 minimum
BONUS_MAX_ODDS = 600   # +600 maximum
BONUS_SWEET_MIN = 300   # +300 ideal minimum
BONUS_SWEET_MAX = 500   # +500 ideal maximum


def calculate_conversion_score(model_prob, american_odds):
    """
    Calculate bonus conversion score.
    Higher is better. Considers:
    - Model probability (higher = more likely to convert)
    - Odds value (higher odds = better conversion if it hits)
    - Sweet spot bonus (extra weight for +300 to +500 range)
    """
    if american_odds <= 0:
        return 0.0

    decimal_odds = american_to_decimal(american_odds)
    implied_prob = american_to_implied_prob(american_odds)

    # Expected value per dollar of bonus
    ev = model_prob * (decimal_odds - 1) - (1 - model_prob)

    # Sweet spot multiplier (bonus bets convert best at +300 to +500)
    if BONUS_SWEET_MIN <= american_odds <= BONUS_SWEET_MAX:
        sweet_mult = 1.3
    elif BONUS_MIN_ODDS <= american_odds <= BONUS_MAX_ODDS:
        sweet_mult = 1.1
    else:
        sweet_mult = 0.8

    # Edge over market
    edge = model_prob - implied_prob

    # Conversion score: weighted combo of EV, edge, and sweet spot
    score = (ev * 0.4 + edge * 0.3 + model_prob * 0.3) * sweet_mult

    return round(score, 4)


def calculate_confidence_score(model_prob, edge, books_count):
    """
    Calculate confidence in the pick.
    Based on model probability, edge size, and number of books offering odds.
    """
    prob_score = model_prob * 40  # 0-40 points
    edge_score = min(edge * 200, 30)  # 0-30 points (capped)
    books_score = min(books_count * 3, 30)  # 0-30 points (capped at 10 books)

    return round(prob_score + edge_score + books_score, 1)


def find_bonus_opportunities(predictions=None, odds_data=None):
    """
    Find and rank the best games for bonus bet placement.
    Targets underdogs in the +300 to +500 range with model edge.
    """
    print("=" * 60)
    print("MARCH MADNESS 2026 - BONUS BET OPTIMIZER")
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
    if odds_data is None and os.path.exists(ODDS_PATH):
        with open(ODDS_PATH, "r") as f:
            odds_raw = json.load(f)
        odds_games = odds_raw.get("games", [])
        print(f"[INFO] Loaded odds for {len(odds_games)} games")

    bonus_picks = []

    for pred in predictions:
        t1 = pred["team1"]
        t2 = pred["team2"]

        # Skip Virginia teams
        if is_excluded_team(t1) or is_excluded_team(t2):
            continue

        # For bonus bets, we want the underdog (lower win prob team)
        underdog = t2 if t1["win_prob"] > t2["win_prob"] else t1
        favorite = t1 if t1["win_prob"] > t2["win_prob"] else t2

        underdog_prob = underdog["win_prob"]
        underdog_seed = underdog["seed"]

        # Find odds from market data or estimate
        best_underdog_odds = None
        best_book = "estimated"
        books_with_odds = 0
        all_book_odds = []

        # Try to match with real odds
        for game in odds_games:
            home = game.get("home_team", "").lower()
            away = game.get("away_team", "").lower()
            uname = underdog["name"].lower()

            if uname in home or uname in away or home in uname or away in uname:
                # Found matching game - scan all bookmakers
                for book in game.get("bookmakers", []):
                    h2h = book.get("markets", {}).get("h2h", [])
                    for outcome in h2h:
                        oname = outcome.get("name", "").lower()
                        if uname in oname or oname in uname:
                            odds = outcome.get("price", 0)
                            if odds > 0:  # Underdog odds are positive
                                books_with_odds += 1
                                all_book_odds.append({
                                    "book": book.get("title", "Unknown"),
                                    "odds": odds,
                                })
                                if best_underdog_odds is None or odds > best_underdog_odds:
                                    best_underdog_odds = odds
                                    best_book = book.get("title", "Unknown")
                break

        # If no real odds, estimate from seed matchup
        if best_underdog_odds is None:
            if underdog_prob < 0.5:
                est_odds = round((1 - underdog_prob) / underdog_prob * 100)
                est_odds = max(est_odds, 100)  # At least +100
            else:
                est_odds = round(underdog_prob / (1 - underdog_prob) * -100)

            best_underdog_odds = est_odds
            best_book = "estimated"
            books_with_odds = 0

        # Filter: only consider underdogs in our target range
        if best_underdog_odds < BONUS_MIN_ODDS or best_underdog_odds > BONUS_MAX_ODDS:
            # Still include but with lower priority if close
            if best_underdog_odds < 150 or best_underdog_odds > 800:
                continue

        implied_prob = american_to_implied_prob(best_underdog_odds)
        edge = underdog_prob - implied_prob

        conversion_score = calculate_conversion_score(underdog_prob, best_underdog_odds)
        confidence = calculate_confidence_score(underdog_prob, max(edge, 0), books_with_odds)

        # Widest odds spread across books
        odds_spread = 0
        if len(all_book_odds) >= 2:
            odds_values = [o["odds"] for o in all_book_odds]
            odds_spread = max(odds_values) - min(odds_values)

        pick = {
            "game": f"({t1['seed']}) {t1['name']} vs ({t2['seed']}) {t2['name']}",
            "region": pred["region"],
            "round": pred["round"],
            "bonus_pick": underdog["name"],
            "bonus_pick_seed": underdog_seed,
            "bonus_pick_espnId": underdog.get("espnId"),
            "opponent": favorite["name"],
            "opponent_seed": favorite["seed"],
            "model_prob": round(underdog_prob, 4),
            "implied_prob": round(implied_prob, 4),
            "edge": round(edge, 4),
            "best_odds": best_underdog_odds,
            "best_book": best_book,
            "books_count": books_with_odds,
            "odds_spread": odds_spread,
            "all_book_odds": all_book_odds if all_book_odds else None,
            "conversion_score": conversion_score,
            "confidence_score": confidence,
            "in_sweet_spot": BONUS_SWEET_MIN <= best_underdog_odds <= BONUS_SWEET_MAX,
            "decimal_odds": round(american_to_decimal(best_underdog_odds), 3),
        }
        bonus_picks.append(pick)

    # Sort by conversion score descending
    bonus_picks.sort(key=lambda x: x["conversion_score"], reverse=True)

    # Add rank
    for i, pick in enumerate(bonus_picks):
        pick["rank"] = i + 1

    # Print results
    print(f"\n--- BONUS BET RANKINGS ---\n")
    for pick in bonus_picks[:15]:
        sweet = " *SWEET SPOT*" if pick["in_sweet_spot"] else ""
        print(
            f"  #{pick['rank']} {pick['bonus_pick']} (seed {pick['bonus_pick_seed']})"
            f"  vs {pick['opponent']}"
            f"  |  Odds: +{pick['best_odds']} ({pick['best_book']})"
            f"  |  Model: {pick['model_prob']:.1%}"
            f"  |  Conv Score: {pick['conversion_score']:.3f}"
            f"  |  Confidence: {pick['confidence_score']:.0f}/100"
            f"{sweet}"
        )

    print(f"\n  Total bonus candidates: {len(bonus_picks)}")
    sweet_count = sum(1 for p in bonus_picks if p["in_sweet_spot"])
    print(f"  In sweet spot (+{BONUS_SWEET_MIN} to +{BONUS_SWEET_MAX}): {sweet_count}")

    # Save
    os.makedirs(os.path.dirname(BONUS_PICKS_PATH), exist_ok=True)
    with open(BONUS_PICKS_PATH, "w") as f:
        json.dump(bonus_picks, f, indent=2)
    print(f"\n[DONE] Bonus picks saved to {BONUS_PICKS_PATH}")

    return bonus_picks


if __name__ == "__main__":
    find_bonus_opportunities()
