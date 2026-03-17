"""
Scrape team advanced stats from ESPN API + Barttorvik CSV fallback.
Produces data/team_stats_2026.json with AdjOE, AdjDE, AdjEM, tempo, four factors.
"""

import json
import os
import time
import requests

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE_DIR = os.path.join(PROJECT_ROOT, "data", "cache")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "data", "team_stats_2026.json")

# All 68 tournament teams from src/data/teams.js
TOURNAMENT_TEAMS = [
    # East
    {"name": "Duke", "seed": 1, "region": "East", "abbr": "DUKE", "espnId": 150},
    {"name": "UConn", "seed": 2, "region": "East", "abbr": "UCONN", "espnId": 41},
    {"name": "Michigan St.", "seed": 3, "region": "East", "abbr": "MSU", "espnId": 127},
    {"name": "Kansas", "seed": 4, "region": "East", "abbr": "KU", "espnId": 2305},
    {"name": "St. John's", "seed": 5, "region": "East", "abbr": "SJU", "espnId": 2599},
    {"name": "Louisville", "seed": 6, "region": "East", "abbr": "LOU", "espnId": 97},
    {"name": "UCLA", "seed": 7, "region": "East", "abbr": "UCLA", "espnId": 26},
    {"name": "Ohio State", "seed": 8, "region": "East", "abbr": "OSU", "espnId": 194},
    {"name": "TCU", "seed": 9, "region": "East", "abbr": "TCU", "espnId": 2628},
    {"name": "UCF", "seed": 10, "region": "East", "abbr": "UCF", "espnId": 2116},
    {"name": "South Florida", "seed": 11, "region": "East", "abbr": "USF", "espnId": 58},
    {"name": "Northern Iowa", "seed": 12, "region": "East", "abbr": "UNI", "espnId": 2460},
    {"name": "Cal Baptist", "seed": 13, "region": "East", "abbr": "CBU", "espnId": 2856},
    {"name": "North Dakota St.", "seed": 14, "region": "East", "abbr": "NDSU", "espnId": 2449},
    {"name": "Furman", "seed": 15, "region": "East", "abbr": "FUR", "espnId": 231},
    {"name": "Siena", "seed": 16, "region": "East", "abbr": "SIEN", "espnId": 2561},
    # South
    {"name": "Florida", "seed": 1, "region": "South", "abbr": "FLA", "espnId": 57},
    {"name": "Houston", "seed": 2, "region": "South", "abbr": "HOU", "espnId": 248},
    {"name": "Illinois", "seed": 3, "region": "South", "abbr": "ILL", "espnId": 356},
    {"name": "Nebraska", "seed": 4, "region": "South", "abbr": "NEB", "espnId": 158},
    {"name": "Vanderbilt", "seed": 5, "region": "South", "abbr": "VAN", "espnId": 238},
    {"name": "North Carolina", "seed": 6, "region": "South", "abbr": "UNC", "espnId": 153},
    {"name": "Saint Mary's", "seed": 7, "region": "South", "abbr": "SMC", "espnId": 2608},
    {"name": "Clemson", "seed": 8, "region": "South", "abbr": "CLEM", "espnId": 228},
    {"name": "Iowa", "seed": 9, "region": "South", "abbr": "IOWA", "espnId": 2294},
    {"name": "Texas A&M", "seed": 10, "region": "South", "abbr": "TAMU", "espnId": 245},
    {"name": "VCU", "seed": 11, "region": "South", "abbr": "VCU", "espnId": 2670},
    {"name": "McNeese", "seed": 12, "region": "South", "abbr": "MCN", "espnId": 2377},
    {"name": "Troy", "seed": 13, "region": "South", "abbr": "TROY", "espnId": 2653},
    {"name": "Penn", "seed": 14, "region": "South", "abbr": "PENN", "espnId": 219},
    {"name": "Idaho", "seed": 15, "region": "South", "abbr": "IDHO", "espnId": 70},
    {"name": "Prairie View A&M", "seed": 16, "region": "South", "abbr": "PVAM", "espnId": 2504, "firstFour": True},
    {"name": "Lehigh", "seed": 16, "region": "South", "abbr": "LEH", "espnId": 2329, "firstFour": True},
    # West
    {"name": "Arizona", "seed": 1, "region": "West", "abbr": "ARIZ", "espnId": 12},
    {"name": "Purdue", "seed": 2, "region": "West", "abbr": "PUR", "espnId": 2509},
    {"name": "Gonzaga", "seed": 3, "region": "West", "abbr": "GONZ", "espnId": 2250},
    {"name": "Arkansas", "seed": 4, "region": "West", "abbr": "ARK", "espnId": 8},
    {"name": "Wisconsin", "seed": 5, "region": "West", "abbr": "WIS", "espnId": 275},
    {"name": "BYU", "seed": 6, "region": "West", "abbr": "BYU", "espnId": 252},
    {"name": "Miami (FL)", "seed": 7, "region": "West", "abbr": "MIA", "espnId": 2390},
    {"name": "Villanova", "seed": 8, "region": "West", "abbr": "NOVA", "espnId": 222},
    {"name": "Utah St.", "seed": 9, "region": "West", "abbr": "USU", "espnId": 328},
    {"name": "Missouri", "seed": 10, "region": "West", "abbr": "MIZ", "espnId": 142},
    {"name": "Texas", "seed": 11, "region": "West", "abbr": "TEX", "espnId": 251, "firstFour": True},
    {"name": "NC State", "seed": 11, "region": "West", "abbr": "NCST", "espnId": 152, "firstFour": True},
    {"name": "High Point", "seed": 12, "region": "West", "abbr": "HPU", "espnId": 2272},
    {"name": "Hawaii", "seed": 13, "region": "West", "abbr": "HAW", "espnId": 62},
    {"name": "Kennesaw St.", "seed": 14, "region": "West", "abbr": "KSU", "espnId": 338},
    {"name": "Queens", "seed": 15, "region": "West", "abbr": "QU", "espnId": 2511},
    {"name": "LIU", "seed": 16, "region": "West", "abbr": "LIU", "espnId": 112358},
    # Midwest
    {"name": "Michigan", "seed": 1, "region": "Midwest", "abbr": "MICH", "espnId": 130},
    {"name": "Iowa State", "seed": 2, "region": "Midwest", "abbr": "ISU", "espnId": 66},
    {"name": "Virginia", "seed": 3, "region": "Midwest", "abbr": "UVA", "espnId": 258},
    {"name": "Alabama", "seed": 4, "region": "Midwest", "abbr": "BAMA", "espnId": 333},
    {"name": "Texas Tech", "seed": 5, "region": "Midwest", "abbr": "TTU", "espnId": 2641},
    {"name": "Tennessee", "seed": 6, "region": "Midwest", "abbr": "TENN", "espnId": 2633},
    {"name": "Kentucky", "seed": 7, "region": "Midwest", "abbr": "UK", "espnId": 96},
    {"name": "Georgia", "seed": 8, "region": "Midwest", "abbr": "UGA", "espnId": 61},
    {"name": "Saint Louis", "seed": 9, "region": "Midwest", "abbr": "SLU", "espnId": 139},
    {"name": "Santa Clara", "seed": 10, "region": "Midwest", "abbr": "SCU", "espnId": 2541},
    {"name": "Miami (OH)", "seed": 11, "region": "Midwest", "abbr": "MIOH", "espnId": 193, "firstFour": True},
    {"name": "SMU", "seed": 11, "region": "Midwest", "abbr": "SMU", "espnId": 2567, "firstFour": True},
    {"name": "Akron", "seed": 12, "region": "Midwest", "abbr": "AKR", "espnId": 2006},
    {"name": "Hofstra", "seed": 13, "region": "Midwest", "abbr": "HOF", "espnId": 2275},
    {"name": "Wright St.", "seed": 14, "region": "Midwest", "abbr": "WSU", "espnId": 2750},
    {"name": "Tennessee St.", "seed": 15, "region": "Midwest", "abbr": "TSU", "espnId": 2634},
    {"name": "UMBC", "seed": 16, "region": "Midwest", "abbr": "UMBC", "espnId": 2378, "firstFour": True},
    {"name": "Howard", "seed": 16, "region": "Midwest", "abbr": "HOW", "espnId": 47, "firstFour": True},
]

# Seed-based baseline stats for fallback estimation
# Higher seeds get better offensive/defensive ratings
SEED_BASELINES = {
    1:  {"adj_oe": 120.0, "adj_de": 92.0, "tempo": 69.0, "sos": 0.95},
    2:  {"adj_oe": 118.0, "adj_de": 93.5, "tempo": 68.5, "sos": 0.92},
    3:  {"adj_oe": 116.5, "adj_de": 95.0, "tempo": 68.0, "sos": 0.89},
    4:  {"adj_oe": 115.0, "adj_de": 96.0, "tempo": 68.0, "sos": 0.86},
    5:  {"adj_oe": 113.5, "adj_de": 97.0, "tempo": 67.5, "sos": 0.83},
    6:  {"adj_oe": 112.0, "adj_de": 98.0, "tempo": 67.5, "sos": 0.80},
    7:  {"adj_oe": 111.0, "adj_de": 99.0, "tempo": 67.0, "sos": 0.77},
    8:  {"adj_oe": 110.0, "adj_de": 100.0, "tempo": 67.0, "sos": 0.74},
    9:  {"adj_oe": 109.0, "adj_de": 100.5, "tempo": 67.0, "sos": 0.72},
    10: {"adj_oe": 108.5, "adj_de": 101.0, "tempo": 67.0, "sos": 0.70},
    11: {"adj_oe": 108.0, "adj_de": 101.5, "tempo": 67.0, "sos": 0.67},
    12: {"adj_oe": 107.0, "adj_de": 102.0, "tempo": 67.0, "sos": 0.63},
    13: {"adj_oe": 106.0, "adj_de": 103.0, "tempo": 66.5, "sos": 0.55},
    14: {"adj_oe": 105.0, "adj_de": 104.0, "tempo": 66.5, "sos": 0.50},
    15: {"adj_oe": 104.0, "adj_de": 105.0, "tempo": 66.0, "sos": 0.45},
    16: {"adj_oe": 102.0, "adj_de": 107.0, "tempo": 66.0, "sos": 0.38},
}


def get_seed_estimate(seed):
    """Generate estimated stats based on seed line."""
    base = SEED_BASELINES.get(seed, SEED_BASELINES[16])
    return {
        "adj_oe": base["adj_oe"],
        "adj_de": base["adj_de"],
        "adj_em": base["adj_oe"] - base["adj_de"],
        "tempo": base["tempo"],
        "efg_off": 50.0 + (17 - seed) * 0.6,
        "efg_def": 46.0 + seed * 0.5,
        "to_off": 17.0 + seed * 0.15,
        "to_def": 20.0 - seed * 0.2,
        "or_pct": 30.0 + (17 - seed) * 0.3,
        "ft_rate": 30.0 + (17 - seed) * 0.4,
        "three_pct": 34.0 + (17 - seed) * 0.3,
        "sos": base["sos"],
        "source": "seed_estimate",
    }


def fetch_espn_stats(espn_id, team_name):
    """Fetch team stats from ESPN API."""
    cache_path = os.path.join(CACHE_DIR, f"espn_stats_{espn_id}.json")

    # Check cache first
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

    url = (
        f"https://site.api.espn.com/apis/site/v2/sports/basketball/"
        f"mens-college-basketball/teams/{espn_id}/statistics"
    )
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        # Cache raw response
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=2)

        return data
    except Exception as e:
        print(f"  [WARN] ESPN API failed for {team_name} (id={espn_id}): {e}")
        return None


def parse_espn_stats(raw, seed):
    """Parse ESPN API response into our stat format."""
    if not raw:
        return None

    stats = {}
    try:
        # ESPN returns stats in splits.categories
        categories = raw.get("results", {}).get("stats", {}).get("categories", [])
        if not categories:
            # Try alternate structure
            splits = raw.get("splits", {})
            categories = splits.get("categories", [])

        stat_map = {}
        for cat in categories:
            for stat in cat.get("stats", []):
                stat_map[stat.get("name", "")] = stat.get("value", 0)

        # Map ESPN stats to our format
        ppg = stat_map.get("avgPoints", 0)
        opp_ppg = stat_map.get("avgPointsAgainst", stat_map.get("oppPoints", 0))
        possessions = stat_map.get("possessions", stat_map.get("avgPossessions", 68))
        fgm = stat_map.get("avgFieldGoalsMade", 0)
        fga = stat_map.get("avgFieldGoalsAttempted", 0)
        fg3m = stat_map.get("avgThreePointFieldGoalsMade", 0)
        fg3a = stat_map.get("avgThreePointFieldGoalsAttempted", 0)
        ftm = stat_map.get("avgFreeThrowsMade", 0)
        fta = stat_map.get("avgFreeThrowsAttempted", 0)
        tov = stat_map.get("avgTurnovers", 0)
        oreb = stat_map.get("avgOffensiveRebounds", 0)
        dreb = stat_map.get("avgDefensiveRebounds", 0)

        # Calculate advanced stats
        tempo = possessions if possessions > 0 else 68.0

        # Offensive/Defensive efficiency (points per 100 possessions)
        if tempo > 0:
            adj_oe = (ppg / tempo) * 100 if ppg > 0 else SEED_BASELINES[seed]["adj_oe"]
            adj_de = (opp_ppg / tempo) * 100 if opp_ppg > 0 else SEED_BASELINES[seed]["adj_de"]
        else:
            adj_oe = SEED_BASELINES[seed]["adj_oe"]
            adj_de = SEED_BASELINES[seed]["adj_de"]

        # Effective FG%
        efg_off = ((fgm + 0.5 * fg3m) / fga * 100) if fga > 0 else 50.0

        # Turnover rate
        to_off = (tov / (fga + 0.475 * fta + tov) * 100) if (fga + fta + tov) > 0 else 18.0

        # Offensive rebound %
        or_pct = (oreb / (oreb + dreb) * 100) if (oreb + dreb) > 0 else 30.0

        # Free throw rate
        ft_rate = (fta / fga * 100) if fga > 0 else 30.0

        # 3PT%
        three_pct = (fg3m / fg3a * 100) if fg3a > 0 else 34.0

        stats = {
            "adj_oe": round(adj_oe, 1),
            "adj_de": round(adj_de, 1),
            "adj_em": round(adj_oe - adj_de, 1),
            "tempo": round(tempo, 1),
            "efg_off": round(efg_off, 1),
            "efg_def": round(50.0 - (17 - seed) * 0.3, 1),  # Estimated, ESPN doesn't give opp eFG easily
            "to_off": round(to_off, 1),
            "to_def": round(20.0 - seed * 0.2, 1),  # Estimated
            "or_pct": round(or_pct, 1),
            "ft_rate": round(ft_rate, 1),
            "three_pct": round(three_pct, 1),
            "sos": SEED_BASELINES[seed]["sos"],
            "source": "espn_api",
        }
        return stats
    except Exception as e:
        print(f"  [WARN] Failed to parse ESPN stats: {e}")
        return None


def try_barttorvik_csv():
    """Try to fetch Barttorvik T-Rank CSV as supplementary data."""
    cache_path = os.path.join(CACHE_DIR, "barttorvik_2026.csv")

    if os.path.exists(cache_path):
        print("  [INFO] Using cached Barttorvik CSV")
        with open(cache_path, "r") as f:
            return f.read()

    url = "https://barttorvik.com/trank.php?year=2026&csv=1"
    try:
        resp = requests.get(url, timeout=15, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        resp.raise_for_status()
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cache_path, "w") as f:
            f.write(resp.text)
        return resp.text
    except Exception as e:
        print(f"  [WARN] Barttorvik CSV fetch failed: {e}")
        return None


def parse_barttorvik_csv(csv_text):
    """Parse Barttorvik CSV into a name-keyed dict of stats."""
    if not csv_text:
        return {}

    lines = csv_text.strip().split("\n")
    if len(lines) < 2:
        return {}

    results = {}
    try:
        # Barttorvik CSV columns: Rank, Team, Conf, Record, AdjOE, AdjDE, ..., Tempo, ...
        for line in lines[1:]:
            cols = line.split(",")
            if len(cols) < 10:
                continue
            team_name = cols[1].strip().strip('"')
            try:
                results[team_name] = {
                    "adj_oe": float(cols[4]),
                    "adj_de": float(cols[5]),
                    "adj_em": float(cols[4]) - float(cols[5]),
                    "tempo": float(cols[7]) if len(cols) > 7 else 68.0,
                    "source": "barttorvik",
                }
            except (ValueError, IndexError):
                continue
    except Exception as e:
        print(f"  [WARN] Barttorvik CSV parse error: {e}")

    return results


def scrape_all_teams():
    """Main scraping function. Returns dict of all team stats."""
    os.makedirs(CACHE_DIR, exist_ok=True)

    # Try Barttorvik CSV first for supplementary data
    print("[1/3] Attempting Barttorvik CSV download...")
    bt_csv = try_barttorvik_csv()
    bt_data = parse_barttorvik_csv(bt_csv)
    if bt_data:
        print(f"  [OK] Got Barttorvik data for {len(bt_data)} teams")
    else:
        print("  [INFO] No Barttorvik data available, will use ESPN + seed estimates")

    # Fetch from ESPN API
    print(f"[2/3] Fetching ESPN stats for {len(TOURNAMENT_TEAMS)} teams...")
    all_stats = {}

    for i, team in enumerate(TOURNAMENT_TEAMS):
        name = team["name"]
        espn_id = team["espnId"]
        seed = team["seed"]
        key = f"{team['region']}-{seed}-{name}"

        print(f"  ({i+1}/{len(TOURNAMENT_TEAMS)}) {name}...", end=" ")

        # Try ESPN first
        raw = fetch_espn_stats(espn_id, name)
        parsed = parse_espn_stats(raw, seed)

        if parsed:
            stats = parsed
            print("ESPN OK")
        else:
            # Fall back to seed estimate
            stats = get_seed_estimate(seed)
            print("seed estimate")

        # Merge Barttorvik data if available (override adj metrics)
        for bt_name, bt_stats in bt_data.items():
            if name.lower() in bt_name.lower() or bt_name.lower() in name.lower():
                stats["adj_oe"] = bt_stats["adj_oe"]
                stats["adj_de"] = bt_stats["adj_de"]
                stats["adj_em"] = bt_stats["adj_em"]
                stats["tempo"] = bt_stats.get("tempo", stats["tempo"])
                stats["source"] = "barttorvik+" + stats["source"]
                break

        all_stats[key] = {
            **team,
            "stats": stats,
        }

        # Rate limit: 0.3s between ESPN requests
        if parsed and parsed.get("source") == "espn_api":
            time.sleep(0.3)

    # Save output
    print(f"[3/3] Writing {len(all_stats)} teams to {OUTPUT_PATH}")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(all_stats, f, indent=2)

    print(f"[DONE] Team stats saved to {OUTPUT_PATH}")
    return all_stats


if __name__ == "__main__":
    scrape_all_teams()
