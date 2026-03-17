"""
Feature engineering for matchup prediction.
Loads team stats and computes differential features for any two teams.
"""

import json
import os

import pandas as pd

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STATS_PATH = os.path.join(PROJECT_ROOT, "data", "team_stats_2026.json")

# Feature columns in the order expected by the model
FEATURE_COLS = [
    "seed_diff",
    "adj_em_diff",
    "adj_oe_diff",
    "adj_de_diff",
    "tempo_diff",
    "efg_off_diff",
    "efg_def_diff",
    "to_off_diff",
    "to_def_diff",
    "or_diff",
    "ft_rate_diff",
    "sos_diff",
]


def load_team_stats():
    """Load team stats from JSON file."""
    if not os.path.exists(STATS_PATH):
        raise FileNotFoundError(
            f"Team stats not found at {STATS_PATH}. Run barttorvik scraper first."
        )
    with open(STATS_PATH, "r") as f:
        return json.load(f)


def find_team(all_stats, name=None, espn_id=None, region=None, seed=None):
    """Find a team in the stats dict by name, espnId, or region+seed."""
    for key, team in all_stats.items():
        if espn_id is not None and team.get("espnId") == espn_id:
            return team
        if name is not None and team.get("name", "").lower() == name.lower():
            return team
        if region is not None and seed is not None:
            if team.get("region") == region and team.get("seed") == seed:
                return team
    return None


def compute_matchup_features(team1_stats, team2_stats, team1_seed, team2_seed):
    """
    Compute differential features for team1 vs team2.
    Positive values favor team1.
    """
    s1 = team1_stats
    s2 = team2_stats

    features = {
        "seed_diff": team2_seed - team1_seed,  # Lower seed = better, so positive = team1 favored
        "adj_em_diff": s1.get("adj_em", 0) - s2.get("adj_em", 0),
        "adj_oe_diff": s1.get("adj_oe", 0) - s2.get("adj_oe", 0),
        "adj_de_diff": s2.get("adj_de", 0) - s1.get("adj_de", 0),  # Lower DE is better
        "tempo_diff": s1.get("tempo", 0) - s2.get("tempo", 0),
        "efg_off_diff": s1.get("efg_off", 0) - s2.get("efg_off", 0),
        "efg_def_diff": s2.get("efg_def", 0) - s1.get("efg_def", 0),  # Lower opp eFG is better
        "to_off_diff": s2.get("to_off", 0) - s1.get("to_off", 0),  # Lower TO rate is better
        "to_def_diff": s1.get("to_def", 0) - s2.get("to_def", 0),  # Higher forced TO is better
        "or_diff": s1.get("or_pct", 0) - s2.get("or_pct", 0),
        "ft_rate_diff": s1.get("ft_rate", 0) - s2.get("ft_rate", 0),
        "sos_diff": s1.get("sos", 0) - s2.get("sos", 0),
    }

    return features


def get_matchup_features(all_stats, team1_key, team2_key):
    """
    Get features for a matchup given team keys (e.g., 'East-1-Duke').
    Returns dict of features.
    """
    t1 = all_stats.get(team1_key)
    t2 = all_stats.get(team2_key)

    if not t1 or not t2:
        raise ValueError(f"Team not found: {team1_key if not t1 else team2_key}")

    return compute_matchup_features(
        t1["stats"], t2["stats"], t1["seed"], t2["seed"]
    )


def get_matchup_dataframe(all_stats, team1_key, team2_key):
    """Get features as a single-row pandas DataFrame, ready for model input."""
    features = get_matchup_features(all_stats, team1_key, team2_key)
    return pd.DataFrame([features])[FEATURE_COLS]


def build_all_r64_matchups(all_stats):
    """
    Build feature DataFrames for all Round of 64 matchups.
    Returns list of (team1_key, team2_key, features_dict) tuples.
    """
    matchups = []
    regions = ["East", "South", "West", "Midwest"]
    seed_pairs = [(1, 16), (2, 15), (3, 14), (4, 13), (5, 12), (6, 11), (7, 10), (8, 9)]

    for region in regions:
        for high_seed, low_seed in seed_pairs:
            # Find teams by region and seed
            t1_key = None
            t2_key = None
            for key, team in all_stats.items():
                if team.get("region") == region and team.get("seed") == high_seed:
                    if not team.get("firstFour"):
                        t1_key = key
                    elif t1_key is None:
                        t1_key = key  # Use first First Four team as placeholder
                if team.get("region") == region and team.get("seed") == low_seed:
                    if not team.get("firstFour"):
                        t2_key = key
                    elif t2_key is None:
                        t2_key = key

            if t1_key and t2_key:
                features = get_matchup_features(all_stats, t1_key, t2_key)
                matchups.append((t1_key, t2_key, features))

    return matchups


if __name__ == "__main__":
    stats = load_team_stats()
    matchups = build_all_r64_matchups(stats)
    print(f"Built features for {len(matchups)} Round of 64 matchups:\n")
    for t1, t2, feats in matchups:
        team1 = stats[t1]
        team2 = stats[t2]
        print(f"  ({team1['seed']}) {team1['name']} vs ({team2['seed']}) {team2['name']}")
        print(f"    AdjEM diff: {feats['adj_em_diff']:+.1f}  Seed diff: {feats['seed_diff']:+d}")
