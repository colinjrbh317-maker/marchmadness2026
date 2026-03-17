"""
One-command pipeline runner for the March Madness 2026 prediction model.
Runs all steps in sequence: scrape -> train -> predict -> value -> bonus -> output.
Handles errors gracefully, continuing with cached data if a step fails.
"""

import os
import sys
import time
import traceback

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


def run_step(name, func, *args, **kwargs):
    """Run a pipeline step with error handling and timing."""
    print(f"\n{'='*60}")
    print(f"STEP: {name}")
    print(f"{'='*60}")

    start = time.time()
    try:
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"\n[OK] {name} completed in {elapsed:.1f}s")
        return result, True
    except Exception as e:
        elapsed = time.time() - start
        print(f"\n[ERROR] {name} failed after {elapsed:.1f}s: {e}")
        traceback.print_exc()
        return None, False


def run_pipeline():
    """Execute the full prediction pipeline."""
    overall_start = time.time()

    print("\n" + "#" * 60)
    print("#  MARCH MADNESS 2026 - FULL PREDICTION PIPELINE")
    print("#" * 60)
    print(f"\nProject root: {PROJECT_ROOT}")
    print(f"Working directory: {os.getcwd()}")

    results = {}
    all_ok = True

    # Step 1: Scrape team stats
    from model.scrapers.barttorvik import scrape_all_teams
    team_stats, ok = run_step("Scrape Team Stats (ESPN + Barttorvik)", scrape_all_teams)
    results["team_stats"] = team_stats
    if not ok:
        all_ok = False
        print("[WARN] Will attempt to use cached team stats for remaining steps.")

    # Step 2: Scrape odds
    from model.scrapers.odds import scrape_odds
    odds_data, ok = run_step("Scrape Odds (The Odds API)", scrape_odds)
    results["odds"] = odds_data
    if not ok:
        all_ok = False
        print("[WARN] Will proceed without live odds data.")

    # Step 3: Train models
    from model.train import train_pipeline
    models, ok = run_step("Train Prediction Models", train_pipeline)
    results["models"] = models
    if not ok:
        all_ok = False
        print("[WARN] Training failed. Will attempt to use cached models.")

    # Step 4: Generate predictions
    from model.predict import generate_predictions
    predictions, ok = run_step("Generate Predictions", generate_predictions)
    results["predictions"] = predictions
    if not ok:
        all_ok = False
        print("[ERROR] Prediction generation failed. Cannot continue with value/bonus.")

    # Step 5: Find value bets (only if predictions exist)
    value_bets = None
    if predictions:
        from model.value import find_value_bets
        odds_for_value = results.get("odds")
        value_bets, ok = run_step("Detect Value Bets", find_value_bets, predictions, odds_for_value)
        results["value_bets"] = value_bets
        if not ok:
            all_ok = False
    else:
        print("\n[SKIP] Value bet detection (no predictions available)")

    # Step 6: Bonus optimizer (only if predictions exist)
    bonus_picks = None
    if predictions:
        from model.bonus_optimizer import find_bonus_opportunities
        odds_for_bonus = results.get("odds")
        bonus_picks, ok = run_step("Optimize Bonus Bets", find_bonus_opportunities, predictions, odds_for_bonus)
        results["bonus_picks"] = bonus_picks
        if not ok:
            all_ok = False
    else:
        print("\n[SKIP] Bonus optimization (no predictions available)")

    # Step 7: Generate output JSON for React
    from model.output import generate_output
    output, ok = run_step(
        "Generate React Output",
        generate_output,
        predictions,
        value_bets,
        bonus_picks,
    )
    results["output"] = output
    if not ok:
        all_ok = False

    # Summary
    elapsed = time.time() - overall_start
    print("\n" + "#" * 60)
    print("#  PIPELINE COMPLETE")
    print("#" * 60)
    print(f"\n  Total time: {elapsed:.1f}s")
    print(f"  Status: {'ALL STEPS OK' if all_ok else 'SOME STEPS FAILED'}")

    if predictions:
        print(f"  Predictions: {len(predictions)} games")
    if value_bets:
        print(f"  Value bets: {len(value_bets)} opportunities")
    if bonus_picks:
        print(f"  Bonus picks: {len(bonus_picks)} candidates")

    print(f"\n  Output files:")
    print(f"    public/data/predictions.json")
    print(f"    public/data/value_bets.json")
    print(f"    public/data/bonus_picks.json")

    return results


if __name__ == "__main__":
    run_pipeline()
