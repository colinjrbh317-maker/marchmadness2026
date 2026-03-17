# March Madness 2026 Betting Prediction Model - Data Sources & APIs Research

## Research Summary

Comprehensive research on data sources, APIs, predictive metrics, and historical data for building a March Madness 2026 NCAA basketball betting prediction model.

---

## 1. Free/Cheap Sports Betting Odds APIs

### The Odds API (RECOMMENDED - Best Free Tier)
- **URL**: https://the-odds-api.com/
- **NCAA Endpoint**: `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds`
- **Full Example Request**:
  ```
  GET https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=YOUR_API_KEY
  ```
- **Available Markets**:
  - `h2h` = moneyline
  - `spreads` = point spreads
  - `totals` = over/under
- **Response Format**: JSON with game start times, home/away teams, bookmaker odds per region/market, rotation numbers, and deep links to bookmaker sites
- **Odds Formats**: American or Decimal (via `oddsFormat` parameter)
- **Free Tier**: 500 credits/month (1 credit = 1 region x 1 market per request)
- **Paid Tiers**:
  - 20K credits: $30/mo
  - 100K credits: $59/mo
  - 5M credits: $119/mo
  - 15M credits: $249/mo
- **Documentation**: https://the-odds-api.com/liveapi/guides/v4/
- **Strategic Note**: 500 free credits is tight for a full tournament. With 67 games, requesting 3 markets (h2h, spreads, totals) x 1 region = 3 credits per game poll. You get ~167 polling cycles. For real-time tracking, consider the $30/mo tier during March.

### Sports Game Odds
- **URL**: https://sportsgameodds.com/
- **Coverage**: NFL, NBA, College Sports, NHL + 25 sports across 55+ leagues
- **Markets**: Pre-match and live odds for moneylines, spreads, over/unders
- **Free Tier**: Free plan available + 7-day free trial on paid plans
- **Paid Plans**: From $99/mo
- **Note**: More expensive than The Odds API but broader coverage including props and deep linking

### Odds-API.io
- **URL**: https://odds-api.io/pricing/free
- **Free Tier**: Available (details on their pricing page)
- **Alternative**: Newer entrant, worth checking for NCAA coverage

### Other Notable Options
- **OddsJam**: Premium, gold standard for real-time odds + line movement + arbitrage detection. Not free.
- **Unabated API**: Covers College Basketball. Premium pricing.
- **SportsDataIO**: `https://sportsdata.io/developers/api-documentation/ncaa-basketball` - Full NCAA basketball data API with odds. Paid.
- **OddsMatrix**: `https://oddsmatrix.com/sports-leagues/college-basketball-data-feed-api/` - Enterprise-grade, expensive.

### RECOMMENDATION
Start with **The Odds API free tier** (500 credits/month). Upgrade to $30/mo plan for tournament month. This gives you real-time spreads, moneylines, and totals from multiple bookmakers in clean JSON format.

---

## 2. NCAA Basketball Advanced Stats Sources

### KenPom (kenpom.com) - GOLD STANDARD
- **URL**: https://kenpom.com/
- **Cost**: Subscription required (~$24.95/year)
- **Key Metrics Available**:
  - **AdjEM** (Adjusted Efficiency Margin) - Points a team would outscore average D1 team by
  - **AdjO** (Adjusted Offensive Efficiency) - Points scored per 100 possessions vs average D1 opponent
  - **AdjD** (Adjusted Defensive Efficiency) - Points allowed per 100 possessions vs average D1 opponent
  - **AdjT** (Adjusted Tempo) - Possessions per 40 minutes vs average D1 tempo team
  - **Luck** rating
  - **Strength of Schedule** (AdjEM SOS, OppO, OppD)
  - **NCSOS** (Non-conference SOS)
- **Data Status**: Actively updated through 2025-26 season (data as of March 15, 2026 confirmed)
- **Access Method**: Web scraping (no official API). The `hoopR` R package can scrape KenPom data.
- **Ratings Glossary**: https://kenpom.com/blog/ratings-glossary/

### Barttorvik (barttorvik.com) - BEST FREE ALTERNATIVE
- **URL**: https://barttorvik.com/
- **Cost**: FREE
- **Key Metrics Available**:
  - **ADJOE** (Adjusted Offensive Efficiency)
  - **ADJDE** (Adjusted Defensive Efficiency)
  - **ADJ T** (Adjusted Tempo)
  - **PRPG!** (Points Over Replacement Per Adjusted Game At That Usage) - player metric
  - **T-Rank** power rankings for all 365 D1 teams
  - **T-Ranketology** bracket projections: https://barttorvik.com/tranketology.php
  - **Team play-by-play splits**: https://barttorvik.com/teampbp.php
  - **Team shooting stats**: https://barttorvik.com/teampbp.php
  - **NCAA Teamsheet Ranks**: https://barttorvik.com/teamsheets.php
- **Data Access**: Web interface. An R package `toRvik` exists: https://torvik.dev/articles/introduction.php
- **Strategic Note**: Very similar metrics to KenPom but completely free. Use as primary data source for efficiency ratings.

### EvanMiya (evanmiya.com) - BEST PLAYER-LEVEL DATA
- **URL**: https://evanmiya.com/
- **Cost**: Subscription (some data free)
- **Trusted by**: 120+ Division 1 programs
- **Key Metrics**:
  - **BPR** (Bayesian Performance Rating) - trained on D1 data specifically
  - **OBPR** (Offensive BPR) - offensive points per 100 possessions above D1 average
  - **DBPR** (Defensive BPR)
  - **Team Net Relative Rating** - sum of O-Rate and D-Rate, points expected to outscore average D1 team per 100 possessions
  - Player ratings, lineup metrics, transfer portal rankings, game predictions
- **Historical Data**: Goes back to 2009-10 season
- **Created by**: Evan Miyakawa, Ph.D. statistician

### ESPN API (Unofficial) - FREE, NO AUTH REQUIRED
- **Base URL**: `http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/`
- **Endpoints**:
  - Scoreboard: `/scoreboard`
  - All Teams: `/teams`
  - Specific Team: `/teams/:team`
  - News: `/news`
- **Authentication**: NONE required - publicly accessible
- **Response Format**: JSON
- **Caveat**: Unofficial/undocumented. ESPN can modify or remove endpoints without notice. Not recommended for production requiring guaranteed uptime.
- **Documentation**: https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b

### NCAA.com API
- **GitHub**: https://github.com/henrygd/ncaa-api
- **Coverage**: Scores, stats, rankings, standings, schedules, history, logos, game details
- **Rate Limit**: 5 requests/second per IP
- **Cost**: Free

### Sports Reference / College Basketball Reference
- **URL**: https://www.sports-reference.com/cbb/
- **Rate Limit**: 20 requests/minute
- **Access Tools**:
  - `sportsipy` Python library: https://sportsreference.readthedocs.io/en/stable/
  - `CBBpy` Python package: https://pypi.org/project/CBBpy/ - play-by-play, boxscore, game metadata for D1
  - `hoopR` R package: https://hoopr.sportsdataverse.org/ - includes KenPom scraping
- **Note**: Rate limiters in place. Scrapers only get static content. Some older scraping methods broken.

### Haslametrics
- **URL**: https://haslametrics.com/
- **Focus**: Predictive analysis based on team prior performance
- **Cost**: Free web access
- **Note**: Less well-known but offers unique analytical perspective

### NCAA Official Stats
- **URL**: https://www.ncaa.com/stats/basketball-men/d1
- **Data**: Statistics Ranking Summary since 2002
- **Cost**: Free

---

## 3. Key Predictive Metrics for March Madness

### Tier 1: Most Predictive (Must Have)

| Metric | Source | Why It Matters |
|--------|--------|----------------|
| **AdjEM** (Adjusted Efficiency Margin) | KenPom, Barttorvik | Better predictor than seeding. The single most important metric. |
| **AdjO** (Adjusted Offensive Efficiency) | KenPom, Barttorvik | Points scored per 100 possessions, opponent-adjusted |
| **AdjD** (Adjusted Defensive Efficiency) | KenPom, Barttorvik | Points allowed per 100 possessions, opponent-adjusted |
| **Efficiency Ratio** (AdjO / AdjD) | Derived | Holistic performance measure. Model using ADJOE + ADJDE achieved 74.6% accuracy. |

### Tier 2: High Value

| Metric | Source | Why It Matters |
|--------|--------|----------------|
| **AdjT** (Adjusted Tempo) | KenPom, Barttorvik | Slow-paced top seeds are more upset-prone. Key upset predictor. |
| **Strength of Schedule** | KenPom (SOS metrics) | Context for efficiency numbers |
| **Defensive Turnover Rate** | Barttorvik PBP data | Key first-round upset predictor |
| **3-Point Shooting %** | ESPN, Sports Ref | Hot shooting swings single-elimination games |
| **Free Throw %** | ESPN, Sports Ref | Critical in close tournament games |

### Tier 3: Tournament-Specific Factors

| Metric | Source | Why It Matters |
|--------|--------|----------------|
| **Coaching Tournament Experience** | Manual research | Coaches like Izzo consistently outperform seed expectations |
| **Player Experience** | EvanMiya, roster data | Experienced teams handle pressure better |
| **Momentum / Recent Form** | Last 10 games data | Teams peaking at right time |
| **Luck Rating** | KenPom | High-luck teams regress in tournament |
| **Volatility** | Derived from game-by-game variance | High-variance teams are more upset-capable |
| **Rebounding Margin** | ESPN, Sports Ref | Correlates with tournament success |

### Tier 4: Upset-Specific Features

- **Tempo mismatch**: Slow underdogs vs fast favorites reduce possessions and variance
- **Defensive turnover rate (DTO_d)**: Forces mistakes from favored teams
- **Average player height**: Size mismatches in early rounds
- **Seed gap**: Models achieve 76% accuracy in games with 5+ seed gap

### Model Architecture Recommendation
- **Logistic regression** as baseline (interpretable, ~74% accuracy with efficiency metrics alone)
- **Random forest / XGBoost** for ensemble improvement
- **Features**: AdjEM, AdjO, AdjD, AdjT, SOS, 3PT%, FT%, turnover rate, experience, coaching history
- Multiple linear regression with adjusted efficiency metrics achieved ~62% ranking accuracy

---

## 4. Historical March Madness Betting Data for Backtesting

### TeamRankings.com (BEST for Historical Lines)
- **URL**: https://www.teamrankings.com/ncb/odds-history/results/
- **Data**: Historical NCAA basketball odds and betting line results
- **Coverage**: Point spreads, totals lines, historical results
- **Cost**: Subscription required for full access

### Covers.com
- **URL**: https://www.covers.com/ncaab/march-madness/trends
- **Data**: Spreads for every March Madness game, line movement data, consensus picks, ATS trends
- **Historical**: ATS performance by seed since 1985
- **Key stat**: Since 1985, underdogs cover 44% of the time, win outright 29%

### BettingData.com
- **URL**: https://bettingdata.com/ncaa-basketball/odds
- **Data**: NCAA basketball odds, point spreads, over/under, money lines
- **Coverage**: Advanced odds and lines for all college basketball games

### The Lines (VegasInsider/thelines.com)
- **URL**: https://www.thelines.com/odds/march-madness/
- **Data**: Current and historical March Madness odds

### Kaggle Datasets
- Search "March Madness" on Kaggle - multiple datasets with historical tournament results
- The annual "March Machine Learning Mania" competition provides cleaned historical data
- Includes game results, seeds, team stats going back decades

### Key Historical Patterns for Backtesting
- Favorites vs spread by seed matchup
- Over/under trends by round
- Line movement patterns pre-game
- Conference performance vs expectations

---

## 5. 2026 Tournament Timing & Current State

### Key Dates (Men's Tournament)
| Event | Date | Location |
|-------|------|----------|
| **Selection Sunday** | Sunday, March 15, 2026 (6 PM ET on CBS) | -- |
| **First Four** | Tues-Wed, March 17-18, 2026 | Dayton, OH |
| **First Round** | Thurs-Fri, March 19-20, 2026 | Various |
| **Second Round** | Sat-Sun, March 21-22, 2026 | Various |
| **Sweet 16** | Thurs-Fri, March 26-27, 2026 | Regional sites |
| **Elite 8** | Sat-Sun, March 28-29, 2026 | Regional sites |
| **Final Four** | Saturday, April 4, 2026 | Lucas Oil Stadium, Indianapolis |
| **Championship** | Monday, April 6, 2026 | Lucas Oil Stadium, Indianapolis |

### Current State (as of March 16, 2026)
- **Selection Sunday was YESTERDAY** (March 15, 2026)
- The bracket has been revealed
- **No. 1 Seeds**: Duke, Arizona, Michigan, Florida
- First Four games start TOMORROW (March 17)
- First round starts Thursday, March 19

### CRITICAL TIMING
You are in the optimal window right now. The bracket is set, odds are being released for every game, and you have 1-3 days before games begin. This is the time to:
1. Pull initial odds from The Odds API
2. Gather current team efficiency ratings from Barttorvik/KenPom
3. Build matchup predictions for First Four and Round 1
4. Set up automated odds tracking for line movement

---

## 6. Implementation Strategy (Strategic Recommendations)

### Phase 1: Data Collection (TODAY - March 17)
1. Sign up for The Odds API (free tier, 500 credits)
2. Scrape current Barttorvik T-Rank data for all 68 teams
3. Pull KenPom ratings if subscribed ($24.95/year)
4. Fetch ESPN API team data for supplemental stats
5. Build team lookup table mapping across data sources

### Phase 2: Model Building (March 17-18)
1. Create matchup features: AdjEM differential, tempo differential, SOS differential
2. Use historical tournament data from Kaggle for training
3. Logistic regression baseline with efficiency metrics
4. Add tournament-specific features (seed, experience, coaching)
5. Validate against past tournaments (backtest 2019-2025)

### Phase 3: Betting Edge Detection (March 18-19)
1. Compare model probabilities to implied odds from The Odds API
2. Identify games where model disagrees with market by >5%
3. Track line movement for confirmation/divergence
4. Focus on first-round games (highest volume, most data)

### Phase 4: Live Tournament (March 19+)
1. Poll The Odds API for live line updates
2. Update model with each round's results
3. Re-run predictions for subsequent rounds
4. Track model performance vs closing lines

### Tech Stack Recommendation
Given the existing project uses React/Vite:
- **Data fetching**: Node.js scripts using fetch/axios against APIs
- **Model**: Use a TypeScript-compatible ML library or pre-compute predictions
- **Storage**: JSON files or SQLite for local data
- **Visualization**: Integrate predictions into existing bracket component

---

## Sources

- [The Odds API](https://the-odds-api.com/)
- [The Odds API - NCAA Basketball](https://the-odds-api.com/sports-odds-data/ncaa-basketball-odds.html)
- [The Odds API v4 Documentation](https://the-odds-api.com/liveapi/guides/v4/)
- [Sports Game Odds](https://sportsgameodds.com/)
- [Odds-API.io Free Tier](https://odds-api.io/pricing/free)
- [KenPom Ratings](https://kenpom.com/)
- [KenPom Ratings Glossary](https://kenpom.com/blog/ratings-glossary/)
- [Barttorvik T-Rank](https://barttorvik.com/trank.php)
- [Barttorvik T-Ranketology](https://barttorvik.com/tranketology.php)
- [toRvik R Package](https://torvik.dev/articles/introduction.php)
- [EvanMiya CBB Analytics](https://evanmiya.com/)
- [EvanMiya - BPR Explained](https://blog.evanmiya.com/p/bayesian-performance-rating)
- [ESPN Hidden API Docs](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [ESPN API Guide (2026)](https://sportsapis.dev/espn-api)
- [hoopR - Men's Basketball Data Tools](https://hoopr.sportsdataverse.org/)
- [NCAA API on GitHub](https://github.com/henrygd/ncaa-api)
- [CBBpy - College Basketball Python](https://pypi.org/project/CBBpy/)
- [Haslametrics](https://haslametrics.com/)
- [NCAA Official Stats](https://www.ncaa.com/stats/basketball-men/d1)
- [TeamRankings Historical Odds](https://www.teamrankings.com/ncb/odds-history/results/)
- [Covers March Madness Trends](https://www.covers.com/ncaab/march-madness/trends)
- [BettingData NCAA Basketball](https://bettingdata.com/ncaa-basketball/odds)
- [NCAA 2026 Tournament Schedule](https://www.ncaa.com/news/basketball-men/article/2026-03-15/2026-march-madness-mens-ncaa-tournament-schedule-dates)
- [NCAA 2026 Bracket](https://www.ncaa.com/news/basketball-men/mml-official-bracket/2026-03-15/2026-ncaa-tournament-printable-bracket-schedule-march-madness)
- [KenPom for Betting (Betstamp)](https://betstamp.com/education/kenpom-march-madness-betting-guide)
- [Torvik Ratings Explained (OddsShark)](https://www.oddsshark.com/ncaab/what-are-torvik-ratings)
- [Harvard Sports Analysis - Tournament Prediction](https://harvardsportsanalysis.org/2012/03/survival-of-the-fittest-a-new-model-for-ncaa-tournament-prediction/)
- [March Madness ML Predictions (Towards Data Science)](https://towardsdatascience.com/data-driven-march-madness-predictions/)
- [March Madness Mathematical Modeling (arXiv)](https://arxiv.org/html/2503.21790v1)
- [March Madness Odds (CBS Sports)](https://www.cbssports.com/college-basketball/news/ncaa-tournament-2026-odds-speads-lines-first-four-first-round-games-march-madness/)
- [SportsDataIO NCAA Basketball API](https://sportsdata.io/developers/api-documentation/ncaa-basketball)
