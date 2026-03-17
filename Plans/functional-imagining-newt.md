# March Madness 2026 Betting Prediction Model

## Context

Colin is running a March Madness auction draft app (React/Vite) with friends and wants to build a **data-driven betting prediction model** to find +EV edges on tournament games. The 2026 bracket is set (Selection Sunday was March 15), First Four starts March 17, Round of 64 starts March 20. We have a ~48 hour window to build a usable V1.

The existing app already has all 68 teams defined with ESPN IDs, live score fetching from NCAA/ESPN APIs, and a React/Vite frontend. The prediction system will be built as a **Python backend + JSON output** that the existing React app can consume.

---

## Architecture Overview

```
[Data Sources]          [Model Engine]           [Output Layer]
                        (Python)
Barttorvik/KenPom  -->                      -->  predictions.json
The Odds API       -->  Feature Engineering -->  value_bets.json    -->  React Dashboard
Kaggle Historical  -->  XGBoost + LogReg    -->  line_movement.json
ESPN API           -->  Kelly Sizing        -->
```

**Tech stack:** Python 3.11+ (pandas, scikit-learn, xgboost, requests) for the model. JSON output files consumed by the existing React/Vite app. No separate backend server needed — just scripts that output JSON.

---

## Phase 1: Data Pipeline (ISC-C1, ISC-C6, ISC-A4)

### 1A. Team Advanced Stats Scraper

**Source: Barttorvik (free, no auth required)**
- URL: `https://barttorvik.com` — scrape T-Rank page for all D1 teams
- Alternative: Use the `toRvik` pattern — their data is available at predictable URLs
- Backup: ESPN API team stats endpoints (no auth needed)

**Data to collect per team:**
| Metric | Source | Description |
|--------|--------|-------------|
| AdjOE | Barttorvik | Adjusted offensive efficiency (pts/100 poss) |
| AdjDE | Barttorvik | Adjusted defensive efficiency |
| AdjEM | Barttorvik | Efficiency margin (AdjOE - AdjDE) |
| AdjTempo | Barttorvik | Adjusted tempo (possessions/40 min) |
| eFG% (O/D) | Barttorvik | Effective FG% offense and defense |
| TO% (O/D) | Barttorvik | Turnover rate offense and defense |
| OR% (O/D) | Barttorvik | Offensive rebound rate |
| FTRate (O/D) | Barttorvik | Free throw rate |
| 3PT% | Barttorvik | Three-point percentage |
| 3PT% Variance | Calculated | Std dev of 3PT% over last 10 games |
| SOS | Barttorvik | Strength of schedule |
| WAB | Barttorvik | Wins above bubble |
| Record (last 10) | ESPN API | Recent form |
| Conf Tourney Result | Manual/ESPN | How far in conference tournament |

**Files to create:**
- `model/scrapers/barttorvik.py` — scrape team stats into `data/team_stats_2026.json`
- `model/scrapers/espn_stats.py` — supplementary stats from ESPN API
- `model/scrapers/odds.py` — betting lines from The Odds API

**Key decisions:**
- Barttorvik over KenPom because it's free and has nearly identical metrics
- ESPN API as fallback (already proven working in `useLiveScores.js`)
- Cache all API responses to disk to avoid re-fetching and handle outages (ISC-A4)

### 1B. Betting Odds Pipeline

**Source: The Odds API (free tier: 500 credits/month)**
- Sign up: `https://the-odds-api.com`
- Endpoint: `GET https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds`
- Params: `regions=us&markets=h2h,spreads,totals&oddsFormat=american`
- Returns: JSON with odds from multiple sportsbooks (DraftKings, FanDuel, BetMGM, etc.)

**Plan: $30/month tier (20,000 credits/month)**
- Each poll = 3 credits (3 markets x 1 region)
- Budget: ~6,667 polls over 3 weeks — more than enough
- Strategy: Poll every 2 hours during active game days for full line movement tracking
- Poll every 30 minutes in the 4 hours before tip-off for final line movement
- Store every snapshot for historical line movement analysis

**Data to capture per game:**
- Opening line (first poll after matchup is set)
- Current spread + juice from each book
- Current moneyline from each book
- Current over/under from each book
- Timestamp of each poll (for line movement)

**Files to create:**
- `model/scrapers/odds.py` — fetch and cache odds
- `data/odds/` directory — timestamped JSON files per poll
- `model/line_movement.py` — analyze opening vs current lines

### 1C. Historical Data for Training

**Source: Kaggle March Machine Learning Mania**
- URL: `https://www.kaggle.com/competitions/march-machine-learning-mania-2026/data`
- Contains: tournament results back to 1985, regular season results, team stats
- Also available: Historical KenPom/Barttorvik ratings by year

**Supplementary historical sources:**
- Sports Reference (sports-reference.com/cbb) — historical team stats
- Historical closing lines from Covers.com and TeamRankings.com (manual collection or scraping)

**Files to create:**
- `data/historical/` — Kaggle CSVs (tourney results, season stats, seeds)
- `model/scrapers/historical.py` — clean and join historical data with stats

---

## Phase 2: Feature Engineering (ISC-C6)

### Feature Matrix Design

For each historical and current matchup, create a **differential feature vector**:

```python
features = {
    # Core efficiency differentials (Tier 1)
    'adj_em_diff': team1.AdjEM - team2.AdjEM,
    'adj_oe_diff': team1.AdjOE - team2.AdjOE,
    'adj_de_diff': team1.AdjDE - team2.AdjDE,
    'tempo_diff': team1.AdjTempo - team2.AdjTempo,

    # Four Factors differentials (Tier 1)
    'efg_off_diff': team1.eFG_O - team2.eFG_O,
    'efg_def_diff': team1.eFG_D - team2.eFG_D,
    'to_off_diff': team1.TO_O - team2.TO_O,
    'to_def_diff': team1.TO_D - team2.TO_D,
    'or_diff': team1.OR_O - team2.OR_O,
    'ft_rate_diff': team1.FTRate_O - team2.FTRate_O,

    # Tournament-specific (Tier 3)
    'seed_diff': team1.seed - team2.seed,
    'seed_matchup': f"{team1.seed}v{team2.seed}",  # historical base rates
    'sos_diff': team1.SOS - team2.SOS,
    'three_pt_variance_diff': team1.three_var - team2.three_var,
    'recent_form_diff': team1.last10_wins - team2.last10_wins,
    'conf_tourney_wins_diff': team1.conf_wins - team2.conf_wins,

    # Categorical
    'higher_seed_home': 1 if team1.seed < team2.seed else 0,  # seed advantage
}
```

**File:** `model/features.py` — feature engineering pipeline

---

## Phase 3: Prediction Model (ISC-C3, ISC-C4, ISC-C9, ISC-A3)

### Model Architecture: Ensemble of Logistic Regression + XGBoost

**Why ensemble:**
- Logistic regression: interpretable, stable, great baseline (~74% accuracy historically)
- XGBoost: captures non-linear interactions, handles missing data, best Kaggle performance
- Blend: average probabilities from both (weighted 0.4 LR + 0.6 XGB)

**Training approach:**
1. Build feature matrix from historical data (2010-2025 tournaments)
2. Leave-one-tournament-out cross-validation (NOT random splits — ISC-A3)
3. Train on 14 years, predict 1 year, rotate. Report avg accuracy + log loss.
4. Final model trained on all historical data, applied to 2026 matchups

**Calibration:**
- Apply Platt scaling (sigmoid calibration) to XGBoost outputs
- Verify calibration curve: predicted 60% should win ~60% of the time
- Log loss is the primary metric, not accuracy

**Spread prediction:**
- Convert win probability to predicted spread: `spread = (prob - 0.5) * k` where k is calibrated from historical data (~25-30 for college basketball)
- Compare predicted spread to market spread for ATS value

**Totals prediction (ISC-C11):**
- Separate model: `predicted_total = (team1.AdjOE + team2.AdjOE) * tempo_factor / 100`
- Adjust for pace matchup and defensive profiles
- Compare to market over/under for totals value

**Files to create:**
- `model/train.py` — training pipeline with LOTO cross-validation
- `model/predict.py` — generate predictions for current matchups
- `model/calibrate.py` — probability calibration
- `model/backtest.py` — historical backtesting with simulated betting

---

## Phase 4: Value Detection & Bankroll (ISC-C5, ISC-C7, ISC-A2)

### Implied Probability Conversion

```python
def american_to_implied(odds):
    if odds > 0:
        return 100 / (odds + 100)
    else:
        return abs(odds) / (abs(odds) + 100)
```

### Edge Calculation

```
edge = model_probability - market_implied_probability
```

Only flag bets where `edge > 0.03` (3% minimum threshold, configurable).

### Kelly Criterion Sizing

```python
def fractional_kelly(prob, odds, fraction=0.25, max_pct=0.05, bankroll=1000):  # $1,000 starting bankroll
    b = decimal_odds - 1  # net odds
    q = 1 - prob
    kelly = (b * prob - q) / b
    sized = kelly * fraction  # 1/4 Kelly default
    capped = min(sized, max_pct)  # never exceed 5% of bankroll
    return round(capped * bankroll, 2)
```

**Correlated bet adjustment:** Since tournament outcomes are correlated (if a team wins R64, it affects R32 matchups), reduce Kelly fraction further when placing multiple bets on the same team's path.

**Files to create:**
- `model/value.py` — edge detection and Kelly sizing
- `model/output.py` — generate JSON output files for the dashboard

### Output Format

```json
// predictions.json
{
  "generated": "2026-03-17T10:00:00Z",
  "round": "First Four",
  "games": [
    {
      "game_id": "south-16-ff",
      "team1": "Prairie View A&M",
      "team2": "Lehigh",
      "model_win_prob_team1": 0.42,
      "model_win_prob_team2": 0.58,
      "predicted_spread": -2.5,
      "predicted_total": 138.5,
      "market": {
        "spread": { "team1": "+3.5", "team2": "-3.5", "source": "DraftKings" },
        "moneyline": { "team1": "+145", "team2": "-175" },
        "over_under": { "total": 141.5 }
      },
      "value_bets": [
        {
          "type": "spread",
          "pick": "Prairie View A&M +3.5",
          "edge": 0.045,
          "kelly_bet": 12.50,
          "confidence": "medium"
        }
      ]
    }
  ]
}
```

---

## Phase 5: Dashboard Integration (ISC-C8, ISC-C10)

### React Component: `src/components/Predictions.jsx`

Add a new tab to the existing app (alongside Bracket, Auction, Scoreboard) that displays:

1. **Predictions Table** — for each upcoming game:
   - Teams + seeds
   - Model win probability (bar chart visual)
   - Market spread + moneyline
   - Model predicted spread
   - Edge % (color-coded: green >5%, yellow 3-5%)
   - Recommended bet + Kelly size

2. **Value Bets Panel** — filtered view showing only +EV opportunities, sorted by edge size

3. **Line Movement Tracker** — opening vs current line with direction indicator

4. **Model Performance** — running track record of model predictions vs actual results as tournament progresses

**Integration approach:**
- Python scripts output JSON files to `public/data/` directory
- React app fetches these via simple `fetch('/data/predictions.json')`
- Manual refresh: re-run Python pipeline, JSON files update, React picks up on next page load
- Could add a simple `npm run predict` script that calls Python pipeline

### Modifications to existing files:
- `src/App.jsx` — add Predictions tab to navigation
- `src/components/NavBar.jsx` — add predictions icon/tab
- New: `src/components/Predictions.jsx` — main predictions dashboard
- New: `src/hooks/usePredictions.js` — fetch and parse prediction JSON

---

## Phase 6: Line Movement & Edge Tracking (ISC-C12)

### Polling Strategy

```
Round starts → poll immediately (capture opening)
Every 8 hours → poll for movement
2 hours before game → final poll
```

Store all polls as timestamped JSON. Compute:
- `movement = current_spread - opening_spread`
- Flag "steam moves" where line moves >1.5 points in <4 hours
- Flag "reverse line movement" where line moves opposite to public betting %

**File:** `model/line_movement.py`

---

## Implementation Timeline

### Day 1 (March 16 — TODAY)

| Time | Task | ISC |
|------|------|-----|
| Hour 1-2 | Set up Python project, install deps, sign up for The Odds API | Setup |
| Hour 2-4 | Build Barttorvik scraper + team stats pipeline | ISC-C1 |
| Hour 4-5 | Build odds fetcher + First Four lines | ISC-C2 |
| Hour 5-7 | Download Kaggle data, build feature matrix | ISC-C6 |
| Hour 7-9 | Train model on historical data | ISC-C3, ISC-C4 |
| Hour 9-10 | Run backtests | ISC-C9 |

### Day 2 (March 17 — First Four)

| Time | Task | ISC |
|------|------|-----|
| Morning | Generate First Four predictions + value bets | ISC-C5 |
| Afternoon | Build React dashboard component | ISC-C8 |
| Evening | First Four games — track model performance live | ISC-C10 |

### Day 3+ (March 18-20 — Before Round of 64)

| Time | Task | ISC |
|------|------|-----|
| Ongoing | Refine model based on First Four results | ISC-C3 |
| Ongoing | Add totals model | ISC-C11 |
| Ongoing | Line movement tracking for R64 games | ISC-C12 |
| Ongoing | Kelly sizing refinement | ISC-C7 |

---

## Project Structure (new files)

```
MARCH MADNESS/
├── model/                    # Python prediction engine
│   ├── requirements.txt      # pandas, scikit-learn, xgboost, requests, beautifulsoup4
│   ├── scrapers/
│   │   ├── barttorvik.py     # Team advanced stats
│   │   ├── odds.py           # The Odds API integration
│   │   ├── espn_stats.py     # ESPN supplementary data
│   │   └── historical.py     # Kaggle data loader
│   ├── features.py           # Feature engineering pipeline
│   ├── train.py              # Model training with LOTO CV
│   ├── predict.py            # Current round predictions
│   ├── calibrate.py          # Probability calibration
│   ├── backtest.py           # Historical backtesting
│   ├── value.py              # Edge detection + Kelly sizing
│   ├── line_movement.py      # Line movement analysis
│   ├── output.py             # Generate JSON for React app
│   └── run_pipeline.py       # One-command full pipeline run
├── data/
│   ├── historical/           # Kaggle CSVs
│   ├── odds/                 # Timestamped odds snapshots
│   ├── team_stats_2026.json  # Current year team stats
│   └── cache/                # API response cache
├── public/data/              # JSON output for React consumption
│   ├── predictions.json
│   ├── value_bets.json
│   └── line_movement.json
├── src/components/
│   ├── Predictions.jsx       # NEW: predictions dashboard
│   └── ... (existing)
├── src/hooks/
│   ├── usePredictions.js     # NEW: fetch prediction data
│   └── ... (existing)
```

---

## Key Edge-Finding Strategies

Based on research, these are the **highest-value betting angles** for March Madness:

1. **Early-round unders** — 63.4% hit rate over last 2 tournaments. Unfamiliar opponents, nerves, and conservative play drive lower-scoring games.
2. **12-seed over 5-seed** — ~36% upset rate historically. Public overvalues 5-seeds.
3. **Low-luck teams** — KenPom "Luck" metric identifies teams whose record exceeds their stats. High-luck teams regress in tournament.
4. **Tempo mismatches** — When a fast team faces a slow team, the slow team's pace tends to win out. This creates under opportunities and upset scenarios.
5. **Conference tournament champions** — 3 of last 4 national champions won their conference tournament. Recent winning momentum matters.
6. **Selection Sunday opening lines** — The first 24-48 hours after lines are posted have the most market inefficiency before sharp money corrects prices. Bet early where model disagrees.
7. **Defensive TO rate** — Teams that force turnovers at a high rate are undervalued as underdogs in early rounds.

---

## Prerequisites & Setup

1. **Python 3.11+** — check if installed: `python3 --version`
2. **The Odds API key** — sign up at `https://the-odds-api.com` ($30/month plan, 20K credits)
3. **Kaggle account** — download March Machine Learning Mania 2026 dataset
4. **pip install:** `pandas scikit-learn xgboost requests beautifulsoup4 numpy`
5. **Bankroll:** $1,000 starting bankroll for Kelly criterion sizing (configurable)

---

## Verification

| ISC | Method | Pass Signal |
|-----|--------|-------------|
| C1 | `python model/scrapers/barttorvik.py` | JSON with 68 teams, all stat fields present |
| C2 | `python model/scrapers/odds.py` | JSON with h2h, spreads, totals for current games |
| C3 | `python model/predict.py` | Probabilities between 0-1 for each matchup |
| C4 | `python model/train.py` | LOTO CV accuracy >70%, log loss reported |
| C5 | `python model/value.py` | Value bets list with edge >3% |
| C6 | Inspect feature matrix | All tournament-specific columns present |
| C7 | `python model/value.py --test-kelly` | Max bet never exceeds 5% of bankroll |
| C8 | Browser screenshot | Predictions tab renders with all data columns |
| C9 | `python model/backtest.py` | Positive ROI over 2015-2025 simulation |
| C10 | `python model/run_pipeline.py --round 2` | New predictions generated for R32 |
| C11 | `python model/predict.py --totals` | Predicted totals + edge vs market |
| C12 | `python model/line_movement.py` | Opening vs current lines with movement flags |
| A1 | Attempt prediction with missing data | Error returned, not a guess |
| A2 | Kelly with 50% edge input | Bet capped at 5% |
| A3 | Inspect train.py | Uses temporal CV, not random split |
| A4 | Disable primary API, run pipeline | Falls back to cached data |
