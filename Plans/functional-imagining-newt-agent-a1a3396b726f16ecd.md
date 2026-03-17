# March Madness NCAA Tournament Betting Prediction Model: Research Report

## Query Analysis

This research was decomposed into five parallel investigations:
1. Model architectures and their comparative performance
2. Key features and variables used by successful models
3. Edge-finding methodology for tournament betting
4. Bankroll management and Kelly criterion application
5. Open-source models and community resources

---

## 1. Proven Model Architectures

### Elo Rating Systems

FiveThirtyEight's Elo system remains the gold standard for interpretable tournament prediction. Their methodology calculates running team ratings dating back to the 1950s using game scores, location adjustments, and distance-traveled penalties. Key design decisions:

- **Tournament weighting**: Historically there are *fewer* upsets in the tournament than Elo ratings alone would predict, likely because tournament conditions (neutral courts, better officiating) reduce noise. FiveThirtyEight weights tournament games higher than regular-season games to account for this.
- **Season carryover**: Teams retain their previous season's rating, reverted toward the mean of their *conference* (not the national mean), which captures recruiting/program strength.
- **Simplicity advantage**: Elo requires only final scores and game locations, making it robust against overfitting.

Sources: [How Our March Madness Predictions Work (FiveThirtyEight)](https://fivethirtyeight.com/features/how-our-march-madness-predictions-work/), [How FiveThirtyEight Is Forecasting the 2016 NCAA Tournament](https://fivethirtyeight.com/features/how-fivethirtyeight-is-forecasting-the-2016-ncaa-tournament/)

### Logistic Regression with Tempo-Free Stats

Logistic regression consistently emerges as a top performer relative to its complexity. Across multiple comparative studies, it yields the most consistent, highest accuracy score with the lowest standard deviation. One implementation correctly predicted UConn as the 2024 champion when Random Forest (which had marginally higher raw accuracy) did not. A separate logistic regression model achieved 87.7% accuracy on game outcomes.

**Why it works well for this domain**: The tournament sample is small (63-67 games per year). Logistic regression's regularization and interpretability provide a natural guard against overfitting compared to more flexible models.

Sources: [Machine Learning vs March Madness (GitHub)](https://github.com/paul-lindquist/machine-learning-vs-march-madness), [Machine Learning March Madness (Medium)](https://medium.com/@anthony.klemm/machine-learning-march-madness-2b86cb3e21d2)

### Ensemble Methods (Random Forest, XGBoost, Gradient Boosting)

XGBoost has been the workhorse of Kaggle March Machine Learning Mania competitions:
- One XGBoost model achieved **90% test accuracy** using straightforward feature engineering.
- XGBoost powered the top solution for the 2018 women's competition and has been adapted for both men's and women's tournaments since.
- Gradient boosting achieved a peak accuracy of **84%** in another study and produced the best accuracy with the lowest log loss.
- The **2023 Kaggle gold medal solution** (top 1%) used XGBoost with external ratings (Pomeroy, Moore, Sagarin) and Recursive Feature Elimination.

Random Forest tends to perform well on raw accuracy but with higher variance. The ensemble of logistic regression + gradient boosting + neural network has shown strong results as a meta-learner.

Sources: [XGBalling (GitHub)](https://github.com/hussien-hussien/xgballing), [Top 1% Gold Kaggle March ML Mania 2023 (Medium)](https://medium.com/@maze508/top-1-gold-kaggle-march-machine-learning-mania-2023-solution-writeup-2c0273a62a78), [Machine Learning Madness (Conor Dewey)](https://www.conordewey.com/blog/machine-learning-madness-predicting-every-ncaa-tournament-matchup/)

### Neural Networks / Deep Learning

Neural networks have shown mixed results:
- In one comparative study, neural networks achieved **67% accuracy**, outperforming SVM (65%), kNN (63%), logistic regression (63%), and random forest (61%).
- However, in another study, random forest outperformed neural networks with higher accuracy and lower log loss.
- Deep learning approaches on Kaggle have been explored but rarely dominate leaderboards for this problem.

**Strategic assessment**: Neural networks tend to underperform expectations for March Madness because the dataset is fundamentally small (hundreds of tournament games, not millions of data points). The signal-to-noise ratio favors simpler models with domain-specific features over raw model complexity.

Sources: [Applying Machine Learning to March Madness (Adeshpande)](https://adeshpande3.github.io/Applying-Machine-Learning-to-March-Madness), [Deep Learning Techniques to Predict March Madness (Kaggle)](https://www.kaggle.com/code/benjenkins96/deep-learning-techniques-to-predict-march-madness)

### Which Approach Performs Best Against the Spread?

Against the spread (ATS), the picture shifts. Pure game-outcome models (moneyline prediction) do not directly translate to ATS edge because the spread already prices in team quality differentials. The most successful ATS approaches:
- **Blend multiple rating systems** rather than relying on a single model (the 2023 Kaggle winner used 10+ external ratings).
- **Focus on closing line value (CLV)** rather than win percentage -- beating the closing number is the true measure of long-term edge.
- **The 2024 Kaggle winner** notably used Monte Carlo simulation with a blend of third-party ratings and intuition, implemented in R, suggesting that model sophistication matters less than feature quality and calibration.

---

## 2. Key Features and Variables

### Tier 1: Foundation Metrics (Highest Predictive Value)

**KenPom-Style Adjusted Efficiency**
- **AdjO** (Adjusted Offensive Efficiency): Points scored per 100 possessions vs. average D-I defense
- **AdjD** (Adjusted Defensive Efficiency): Points allowed per 100 possessions vs. average D-I offense
- **AdjEM** (Adjusted Efficiency Margin): AdjO minus AdjD; the single most predictive team-level metric

Since 2002, all but two March Madness champions have been top-20 in *both* AdjO and AdjD according to KenPom.

Sources: [KenPom Ratings Glossary](https://kenpom.com/blog/ratings-glossary/), [KenPom Explained for March Madness Betting (betstamp)](https://betstamp.com/education/kenpom-march-madness-betting-guide), [KenPom Rankings Explained (SI)](https://www.si.com/college-basketball/kenpom-rankings-explained-who-is-ken-pomeroy-what-do-rankings-mean)

**Four Factors (Dean Oliver)**
Both offense and defense:
1. **eFG%** (Effective Field Goal Percentage) -- shooting efficiency adjusted for 3-point value
2. **TO%** (Turnover Percentage) -- turnovers per possession
3. **OR%** (Offensive Rebound Percentage) -- second-chance opportunities
4. **FT Rate** (Free Throw Rate) -- getting to the line / free throws attempted per field goal attempt

The 2023 Kaggle gold solution found field goals made margin, turnover margin, and free throw attempts margin among the most influential features.

**Tempo/Pace**
- **AdjT** (Adjusted Tempo): Possessions per 40 minutes against an average-paced opponent
- Tempo mismatches create prediction difficulty -- when a slow, grind-it-out team faces an up-tempo team, the uncertainty is higher than models typically capture.

### Tier 2: Differentiating Metrics

**Strength of Schedule Adjustments**
- Conference strength ratings
- Wins Above Bubble (WAB)
- Non-conference strength of schedule (isolates performance against quality opponents outside conference play)

**External Rating Systems**
The 2023 Kaggle gold solution used the top 10 historically most accurate rating systems, including: Pomeroy, Moore, Sagarin, Massey, and others. Blending multiple rating systems reduces model-specific bias.

**Three-Point Shooting Variance**
Three-point shooting has high game-to-game variance. Teams heavily dependent on three-point shooting carry higher upset risk, while teams that defend the three well are more tournament-resilient. Two-point shooting percentage allowed was identified as a key predictor in FiveThirtyEight-style models.

### Tier 3: Tournament-Specific Features

**Seed Matchup History**
Historical seed-vs-seed records provide base rates:
- 5 vs 12: No. 5 seeds are 103-57 (64%) since 1985 -- but 12-seeds upset at a higher rate than most casual fans expect
- 8 vs 9: Nearly a coin flip (No. 9 seeds hold 81-75 edge)
- 11-seeds: Respectable 61-95 record; consistent source of early-round value

**Coaching Tournament Experience**
Coaches with deep tournament experience have historically outperformed expectations, though this is difficult to isolate from team quality.

**Travel Distance**
FiveThirtyEight's model accounts for the fact that teams perform significantly worse when traveling long distances. Tournament region assignments can create meaningful travel-distance differentials.

**Recent Form / Conference Tournament Performance**
- From 1998-2011, all but 4 of 14 national champions won their conference tournament
- Three of the last four champions (Kansas 2022, UConn 2024, Florida 2025) won conference tournament crowns
- However, expending energy in conference tournaments can negatively impact first/second round performance
- Teams that lose in conference tournament quarterfinals or earlier face very long odds

**Player-Level Data**
- Injuries to key players (particularly if they miss conference tournament games)
- Minutes distribution (teams with deep rotations may have a fatigue advantage in the condensed tournament schedule)
- Position-specific heights (shooting guard height, small forward height, center height were found significant in one model)

Sources: [NCAA Tournament Trends (Boyd's Bets)](https://www.boydsbets.com/ncaa-tournament-trends/), [How Recent Champions Did in Conference Tournaments (NCAA.com)](https://www.ncaa.com/news/basketball-men/bracketiq/2025-04-07/how-recent-eventual-march-madness-mens-champions-did-their-conference), [March Madness Betting Trends (VegasOdds)](https://www.vegasodds.com/blog/march-madness-betting-trends/)

---

## 3. Edge-Finding Methodology

### Contrarian Strategy and Public Betting

In large bracket pools, going chalk (picking all higher seeds) guarantees you cannot win because too many entrants do the same. The strategic play is to be selectively contrarian:
- **Avoid picking a No. 1 seed as champion** in very large pools (too much bracket ownership)
- **Target at least one 12-over-5 upset** in the first round (historically happens ~36% of the time per matchup, and usually at least one occurs each year)
- Identify games where public bias inflates one side; defensive underdogs frequently cover spreads

Sources: [NCAA Bracket Picks FAQ (PoolGenius)](https://poolgenius.teamrankings.com/ncaa-bracket-picks/faq/), [March Madness 2026 Betting Guide (Sports Betting Ace)](https://www.sportsbettingace.com/march-madness-2026-betting-guide-top-odds-trends-sleeper-teams-and-smart-wagering-strategies/)

### Line Movement and Closing Line Value

- **CLV (Closing Line Value)** is the gold standard metric for evaluating betting performance. Beating the closing number over a sample of bets is the strongest indicator of long-term profitability, more reliable than simple win rate.
- **Selection Sunday creates initial market inefficiency**: Early lines reflect uncertainty before matchup-specific money sharpens the board. Bettors who place wagers early (before public money and bracket narratives reshape pricing) often capture the most value.
- **Steam moves**: Sudden, sharp line movements indicate professional money. Following these moves (or, more precisely, being ahead of them) is a signal of value identification.

Sources: [March Madness Betting Guide (MyBookie)](https://www.mybookie.ag/march-madness-betting/), [NCAA Basketball Line Movement Tracker (BetQL)](https://betql.co/ncaab/line-movement)

### First-Half and Totals Strategies

**Under Trends:**
- Early-round Unders went **45-26-1 (63.4%)** over the last two tournaments
- Early tip-off games (1 PM ET or before) since 2011 hit the under **62%** of the time (attributed to nerves, unfamiliar arenas, national TV pressure)
- Championship games with totals of 150+ have gone **6-2 Under (75%)** since 2001

**First-Half Unders:**
First-half unders are a specific angle: teams unfamiliar with the venue, crowd, and TV stage tend to start slowly. However, elite offensive teams (e.g., Alabama averaged 43.5 first-half points in 2025) require adjustment.

**Derivative Markets:**
Betting first-half spreads and totals (derived from full-game lines) can offer value when team tendencies (pace, defensive intensity in opening minutes) diverge from the full-game pricing assumptions.

Sources: [March Madness 2025 Round by Round Betting Trends (VSiN)](https://vsin.com/college-basketball/march-madness-2025-round-by-round-betting-trends/), [First Half Unders Betting Guide (Sports Gambling Podcast)](https://www.sportsgamblingpodcast.com/2025/03/16/first-half-unders-betting-guide-for-march-madness-in-2025/), [How to Bet on March Madness (Covers)](https://www.covers.com/ncaab/march-madness/how-to-bet)

### Matchup-Driven Value

Teams face unfamiliar opponents from different conferences, creating mismatches that sportsbooks may struggle to price accurately. Specific edges:
- **Strong defensive underdogs** can slow high-powered offenses and keep games competitive, frequently covering spreads
- **Underdogs in rounds 1-2** consistently perform well ATS even when losing outright -- 10, 11, and 12 seeds covering is one of the most reliable tournament trends
- **Stylistic mismatches** (tempo, zone defense specialists, elite rebounding teams) create opportunities where generic rating-based lines undervalue one side

Sources: [March Madness Betting Strategy (betstamp)](https://betstamp.com/education/march-madness-betting-strategy), [Betting March Madness (Unabated)](https://unabated.com/articles/betting-march-madness)

---

## 4. Bankroll Management and Kelly Criterion

### The Kelly Criterion Formula

**f* = (bp - q) / b**

Where:
- f* = fraction of bankroll to wager
- b = decimal odds minus 1 (net odds received)
- p = probability of winning (your model's estimate)
- q = probability of losing (1 - p)

In decimal odds form: **(Decimal odds x win probability - loss probability) / Decimal odds**

### Fractional Kelly for Tournament Betting

Full Kelly is mathematically optimal for long-term geometric growth but is extremely aggressive for real-world application, particularly in a tournament setting with:
- Limited sample size (67 games over 3 weeks)
- Model uncertainty (your probability estimates have confidence intervals)
- Correlated outcomes (one upset cascades through the bracket)

**Recommended approach**: Use **1/4 Kelly or 1/2 Kelly** for March Madness:
- **1/2 Kelly**: Achieves 75% of the growth rate of full Kelly with significantly lower variance
- **1/4 Kelly**: More conservative; suitable when model confidence is lower (early-round games with limited matchup data)

### Practical Bankroll Rules for Tournament Betting

1. **Set a tournament-specific bankroll** separate from your regular season bankroll
2. **Cap individual bets at 2-5% of tournament bankroll** regardless of Kelly output (protects against model overconfidence)
3. **Reduce bet sizing in later rounds** when model uncertainty increases (fewer data points on specific matchups)
4. **Never chase losses** -- the compressed tournament schedule creates emotional pressure to "make it back" on the next slate of games
5. **Track CLV, not just wins** -- if you're consistently beating the closing line, your process is sound even through short-term variance

Sources: [Kelly Criterion (Wikipedia)](https://en.wikipedia.org/wiki/Kelly_criterion), [Bankroll Management and Kelly Criterion (Trademate Sports)](https://www.tradematesports.com/en/blog/bankroll-management-sports-betting), [Kelly Criterion for Sports Betting (Sportsbettingdime)](https://www.sportsbettingdime.com/guides/strategy/kelly-criterion/), [Modified Kelly Criteria (SFU)](https://www.sfu.ca/~tswartz/papers/kelly.pdf)

---

## 5. Open-Source Models and Resources

### Kaggle Competitions

**March Machine Learning Mania** (Annual, now in its 12th year for 2026):
- [2026 Competition](https://www.kaggle.com/competitions/march-machine-learning-mania-2026) -- Active, $50,000 prize pool
- Task: Estimate P(Team A beats Team B) for all 2,278 possible matchups
- Scored on log loss (calibration matters, not just accuracy)
- Historical competitions provide datasets, notebooks, and discussion forums going back to 2014

### Notable GitHub Repositories

1. **[sfirke/predicting-march-madness](https://github.com/sfirke/predicting-march-madness)** -- R-based, MIT license, top 10% in 2016, top 25% in 2017. Uses tidyverse; designed for reusability. Good starting template.

2. **[adeshpande3/March-Madness-ML](https://github.com/adeshpande3/March-Madness-ML)** -- Multiple repos covering 2017+, includes scraped data, Kaggle data, and precomputed training matrices. Year-agnostic code.

3. **[hussien-hussien/xgballing](https://github.com/hussien-hussien/xgballing)** -- XGBoost-focused approach for tournament betting, achieved 90% test accuracy.

4. **[paul-lindquist/machine-learning-vs-march-madness](https://github.com/paul-lindquist/machine-learning-vs-march-madness)** -- Compares 6 ML models (logistic regression, XGBoost, Random Forest, KNN, Decision Tree, Bagging) using 8 years of data. Excellent for model comparison.

5. **[harvitronix/kaggle-march-madness-machine-learning](https://github.com/harvitronix/kaggle-march-madness-machine-learning)** -- 2016 competition, 63rd/598. Good reference implementation.

6. **[kjaisingh/Forecasting-March-Madness](https://github.com/kjaisingh/march-madness-2019)** -- 2019 tournament predictions.

7. **[GitHub topic: march-madness](https://github.com/topics/march-madness)** -- Aggregated collection of all March Madness repos.

### Academic Resources

- [March Madness Tournament Predictions: A Mathematical Modeling Approach (arXiv, 2025)](https://arxiv.org/html/2503.21790v1)
- [Predicting the March Madness Champion using Statistical Methods (IACIS, 2025)](https://iacis.org/iis/2025/1_iis_2025_486-501.pdf)
- [NCAA Bracket Prediction Using Machine Learning and Combinatorial Fusion Analysis (arXiv, 2026)](https://arxiv.org/html/2603.10916v1)
- [Using Conformal Win Probability to Predict NCAA Tournament Outcomes (Taylor & Francis, 2023)](https://www.tandfonline.com/doi/full/10.1080/00031305.2023.2283199)

### Data Sources

- **KenPom.com** -- The definitive source for adjusted efficiency metrics (paid subscription, ~$25/year)
- **Kaggle datasets** -- Historical game results, team stats, seeds, and ordinal rankings going back decades
- **Sports-Reference.com** -- Comprehensive historical box scores and season stats
- **Bart Torvik (barttorvik.com)** -- Free alternative to KenPom with similar tempo-free metrics

---

## Strategic Insights (Second-Order Effects)

### Insight 1: The Simplicity Paradox
The most sophisticated models do not consistently outperform simpler ones for this problem. The 2024 Kaggle winner was a high school teacher using R with Monte Carlo simulation. The fundamental constraint is *sample size* -- you have ~67 tournament games per year, with high variance driven by single-elimination format. Models that overfit to regular-season patterns often fail when tournament dynamics (neutral courts, unfamiliar matchups, pressure) shift the distribution.

**Implication**: Invest more time in feature engineering and calibration than in model architecture complexity.

### Insight 2: Calibration Over Accuracy
Kaggle scores on *log loss*, not accuracy. This means predicting a 55% win probability and being right is valued more than predicting 95% and being right -- because the 95% prediction is penalized catastrophically when wrong. This applies directly to betting: well-calibrated probability estimates that honestly reflect uncertainty will outperform overconfident models.

**Implication**: Build models that output honest probabilities, not binary predictions. Use Platt scaling or isotonic regression to calibrate outputs.

### Insight 3: The Market Is the Benchmark
The closing line of sportsbooks represents the market's best estimate, informed by sharp money, proprietary models, and public action. Your model does not need to predict game outcomes perfectly -- it needs to disagree with the market in spots where the market is wrong. This is a fundamentally different optimization target than predicting winners.

**Implication**: Frame your model's output as "where does my probability estimate differ from the implied probability of the spread/moneyline?" rather than "who wins this game?"

### Insight 4: Correlation and Portfolio Thinking
Tournament outcomes are correlated (if a 12-seed beats a 5-seed, it affects the 4-seed's path, total scoring patterns, etc.). This means you cannot treat each bet independently. Kelly criterion assumes independent bets -- in a tournament with correlated legs, you need to reduce sizing further or model the correlation structure explicitly.

**Implication**: Use fractional Kelly (1/4 to 1/2) and think of your tournament bets as a portfolio with correlated positions, not independent wagers.

---

## Recommended Implementation Roadmap

### Phase 1: Data Pipeline (Week 1)
- Pull KenPom or Bart Torvik data for adjusted efficiency metrics
- Pull Kaggle historical datasets for game results and seeds
- Aggregate external rating systems (Pomeroy, Sagarin, Massey, etc.)
- Build feature matrix: efficiency differentials, Four Factors differentials, seed matchup, tempo differential

### Phase 2: Model Training (Week 1-2)
- Start with **logistic regression** as your baseline (interpretable, consistent)
- Add **XGBoost** as your primary model (proven Kaggle performer)
- Use Recursive Feature Elimination to prune features
- Cross-validate across multiple tournament years (leave-one-tournament-out)
- Calibrate probability outputs (Platt scaling)

### Phase 3: Ensemble and Calibration (Week 2)
- Blend logistic regression + XGBoost outputs (simple average or stacking)
- Compare your probability outputs against historical closing lines
- Identify systematic biases (are you consistently overvaluing certain seed ranges?)
- Run Monte Carlo tournament simulations (10,000+ iterations)

### Phase 4: Betting Strategy (Tournament Time)
- Convert model probabilities to implied odds
- Compare against sportsbook lines; bet only where your edge exceeds 3-5%
- Apply 1/4 Kelly sizing
- Prioritize early-round games (most data, most market inefficiency from casual bettors)
- Track CLV on every bet
- Consider first-half unders as a supplementary angle

---

*Research compiled March 2026. All historical statistics and model performance claims are sourced from the cited materials and should be independently verified before implementation.*
