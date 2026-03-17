"""
Fetch NCAA tournament odds from The Odds API.
Caches responses and outputs data/odds_current.json.
"""

import json
import os
from datetime import datetime

import requests

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")), ".env"))
except ImportError:
    pass

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ODDS_DIR = os.path.join(PROJECT_ROOT, "data", "odds")
CACHE_DIR = os.path.join(PROJECT_ROOT, "data", "cache")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "data", "odds_current.json")

ODDS_API_BASE = "https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds"


def get_api_key():
    """Get API key from environment or .env file."""
    key = os.environ.get("ODDS_API_KEY", "")
    if not key:
        env_path = os.path.join(PROJECT_ROOT, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("ODDS_API_KEY="):
                        key = line.split("=", 1)[1].strip().strip("\"'")
                        break
    return key


def fetch_odds():
    """Fetch current NCAAB odds from The Odds API."""
    api_key = get_api_key()

    if not api_key:
        print("[WARN] ODDS_API_KEY not set. Attempting to use cached data.")
        return load_cached_odds()

    params = {
        "apiKey": api_key,
        "regions": "us",
        "markets": "h2h,spreads,totals",
        "oddsFormat": "american",
    }

    try:
        print("[INFO] Fetching odds from The Odds API...")
        resp = requests.get(ODDS_API_BASE, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        # Show remaining requests
        remaining = resp.headers.get("x-requests-remaining", "?")
        print(f"[INFO] API requests remaining: {remaining}")

        # Cache raw response with timestamp
        os.makedirs(ODDS_DIR, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        cache_path = os.path.join(ODDS_DIR, f"odds_{timestamp}.json")
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"[INFO] Cached raw odds to {cache_path}")

        return data

    except requests.exceptions.HTTPError as e:
        print(f"[ERROR] Odds API HTTP error: {e}")
        return load_cached_odds()
    except Exception as e:
        print(f"[ERROR] Odds API request failed: {e}")
        return load_cached_odds()


def load_cached_odds():
    """Load most recent cached odds file."""
    if not os.path.exists(ODDS_DIR):
        print("[WARN] No cached odds directory found.")
        return []

    files = sorted(
        [f for f in os.listdir(ODDS_DIR) if f.startswith("odds_") and f.endswith(".json")],
        reverse=True,
    )
    if not files:
        print("[WARN] No cached odds files found.")
        return []

    latest = os.path.join(ODDS_DIR, files[0])
    print(f"[INFO] Loading cached odds from {latest}")
    with open(latest, "r") as f:
        return json.load(f)


def parse_odds(raw_data):
    """Parse raw Odds API response into structured game odds."""
    if not raw_data:
        return []

    games = []
    for event in raw_data:
        game = {
            "id": event.get("id", ""),
            "sport": event.get("sport_key", ""),
            "commence_time": event.get("commence_time", ""),
            "home_team": event.get("home_team", ""),
            "away_team": event.get("away_team", ""),
            "bookmakers": [],
        }

        for book in event.get("bookmakers", []):
            book_data = {
                "key": book.get("key", ""),
                "title": book.get("title", ""),
                "markets": {},
            }

            for market in book.get("markets", []):
                market_key = market.get("key", "")
                outcomes = []
                for outcome in market.get("outcomes", []):
                    entry = {
                        "name": outcome.get("name", ""),
                        "price": outcome.get("price", 0),
                    }
                    if "point" in outcome:
                        entry["point"] = outcome["point"]
                    outcomes.append(entry)
                book_data["markets"][market_key] = outcomes

            game["bookmakers"].append(book_data)

        # Extract consensus odds (first bookmaker as baseline)
        if game["bookmakers"]:
            first_book = game["bookmakers"][0]

            # Moneyline
            h2h = first_book["markets"].get("h2h", [])
            if h2h:
                game["consensus_h2h"] = {o["name"]: o["price"] for o in h2h}

            # Spread
            spreads = first_book["markets"].get("spreads", [])
            if spreads:
                game["consensus_spread"] = {
                    o["name"]: {"price": o["price"], "point": o.get("point", 0)}
                    for o in spreads
                }

            # Totals
            totals = first_book["markets"].get("totals", [])
            if totals:
                game["consensus_total"] = {
                    o["name"]: {"price": o["price"], "point": o.get("point", 0)}
                    for o in totals
                }

        games.append(game)

    return games


def get_best_odds_per_game(games):
    """For each game, find best odds across all bookmakers."""
    results = []
    for game in games:
        best = {
            "home_team": game["home_team"],
            "away_team": game["away_team"],
            "commence_time": game["commence_time"],
            "best_home_ml": None,
            "best_away_ml": None,
            "best_home_spread": None,
            "best_away_spread": None,
            "best_over": None,
            "best_under": None,
            "books_count": len(game["bookmakers"]),
        }

        for book in game["bookmakers"]:
            title = book["title"]

            # Best moneyline
            h2h = book["markets"].get("h2h", [])
            for o in h2h:
                if o["name"] == game["home_team"]:
                    if best["best_home_ml"] is None or o["price"] > best["best_home_ml"]["price"]:
                        best["best_home_ml"] = {"price": o["price"], "book": title}
                elif o["name"] == game["away_team"]:
                    if best["best_away_ml"] is None or o["price"] > best["best_away_ml"]["price"]:
                        best["best_away_ml"] = {"price": o["price"], "book": title}

            # Best spread
            spreads = book["markets"].get("spreads", [])
            for o in spreads:
                if o["name"] == game["home_team"]:
                    if best["best_home_spread"] is None or o.get("point", 0) > best["best_home_spread"].get("point", -999):
                        best["best_home_spread"] = {"point": o.get("point", 0), "price": o["price"], "book": title}
                elif o["name"] == game["away_team"]:
                    if best["best_away_spread"] is None or o.get("point", 0) > best["best_away_spread"].get("point", -999):
                        best["best_away_spread"] = {"point": o.get("point", 0), "price": o["price"], "book": title}

            # Best total
            totals = book["markets"].get("totals", [])
            for o in totals:
                if o["name"] == "Over":
                    if best["best_over"] is None or o["price"] > best["best_over"]["price"]:
                        best["best_over"] = {"point": o.get("point", 0), "price": o["price"], "book": title}
                elif o["name"] == "Under":
                    if best["best_under"] is None or o["price"] > best["best_under"]["price"]:
                        best["best_under"] = {"point": o.get("point", 0), "price": o["price"], "book": title}

        results.append(best)

    return results


def scrape_odds():
    """Main entry point: fetch, parse, save odds."""
    os.makedirs(ODDS_DIR, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)

    raw = fetch_odds()
    games = parse_odds(raw)
    best_odds = get_best_odds_per_game(games)

    output = {
        "fetched_at": datetime.now().isoformat(),
        "games_count": len(games),
        "games": games,
        "best_odds": best_odds,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"[DONE] Parsed {len(games)} games, saved to {OUTPUT_PATH}")
    return output


if __name__ == "__main__":
    result = scrape_odds()
    print(f"\nFound {result['games_count']} games with odds data.")
