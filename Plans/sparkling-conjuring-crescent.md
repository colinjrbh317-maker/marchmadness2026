# March Madness Auction Draft App — Implementation Plan

## Context

Colin and three friends (James, Luke, Donald) want to run a live auction draft for the 2026 NCAA Tournament and use the app throughout the entire tournament (~3 weeks). Each player gets $200 to bid on all 64 teams. Points accumulate as owned teams advance through the bracket. The winner takes the cash pot. The app needs to feel like a dark sports broadcast — high contrast, clean, no clutter, no emojis. State must persist across browser sessions so the app survives the full tournament.

---

## Architecture: Vite + React

**Why Vite + React:**
- State persistence via localStorage (essential for 3-week tournament use)
- JSON export/import for backup
- Hot reload during development
- Well-organized multi-file structure for easy fixes during the tournament
- shadcn/ui + Magic UI + Tailwind CSS for production-grade UI
- Still deploys as a static site (plus one serverless function for KV)

**Project structure:**
```
/Users/colinryan/MARCH MADNESS/
  api/
    state.js                   # Vercel serverless: GET/POST game state to KV
  src/
    App.jsx                    # Root component, routing, global state
    index.css                  # Global styles, Tailwind directives, font imports
    main.jsx                   # React DOM entry point
    lib/
      utils.js                 # cn() helper (shadcn/ui standard)
    data/
      teams.js                 # All 64 teams with metadata
      constants.js             # Colors, scoring rules, bracket slots
    components/
      ui/                      # shadcn/ui base components (auto-generated)
        button.jsx
        card.jsx
        tabs.jsx
        dialog.jsx
        input.jsx
        table.jsx
        badge.jsx
        toggle.jsx
        popover.jsx
        progress.jsx
      magicui/                 # Magic UI animated components (auto-generated)
        number-ticker.jsx
        marquee.jsx
        confetti.jsx
        shimmer-button.jsx
        animated-shiny-text.jsx
        border-beam.jsx
        neon-gradient-card.jsx
        particles.jsx
        ripple.jsx
        pulsating-button.jsx
      NavBar.jsx               # 4 view buttons + mute toggle + export/import
      Setup.jsx                # Player names, team grid, rules, begin button
      Auction.jsx              # Tab container (shadcn Tabs)
      AuctionTab.jsx           # Current team, bidding UI, seed sidebar
      Rosters.jsx              # 4 player neon-gradient roster cards
      Tracker.jsx              # Per-team round toggle rows + Sync Scores
      Bracket.jsx              # Bracket wrapper + legend + particles bg
      BracketSVG.jsx           # SVG rendering of 64-team bracket
      Scoreboard.jsx           # Live standings with number-ticker animations
      Ticker.jsx               # Magic UI Marquee-powered broadcast bar
      TeamLogo.jsx             # Logo img with fallback badge
    hooks/
      useAuction.js            # Bid logic, sale, undo, advance
      useScoring.js            # Point calculation from round results
      usePersistence.js        # localStorage auto-save + JSON export/import
      useSync.js               # Vercel KV push/poll for multi-device sync
      useSoundEffects.js       # Web Audio API synthesized sounds
      useLiveScores.js         # Multi-source NCAA score fetching
      useLogos.js              # SportsDB logo fetching + caching
    utils/
      bracket-math.js          # SVG coordinate calculations
      matchups.js              # Seed pairing logic, opponent lookup
      team-matching.js         # Fuzzy name matching for live score APIs
  index.html                   # HTML entry point
  components.json              # shadcn/ui config
  tailwind.config.js           # Tailwind config with custom theme
  package.json
  vercel.json                  # Vercel config (KV binding)
  vite.config.js
  Plans/                       # This plan
```

---

## UI Libraries: shadcn/ui + Magic UI + Tailwind CSS

### Why This Stack
- **Tailwind CSS** — utility-first styling, dark mode built-in, pairs perfectly with the broadcast aesthetic
- **shadcn/ui** — production-grade base components (Tabs, Card, Button, Dialog, Input, Table, Badge, Toggle, Popover). Not a package — components copy directly into the project, fully customizable. Built on Radix UI primitives.
- **Magic UI** — animated components that elevate the broadcast feel. Also copies into the project (same CLI pattern as shadcn). Built on Framer Motion.

### Installation
```bash
# Tailwind CSS (via Vite)
npm install -D tailwindcss @tailwindcss/vite

# shadcn/ui init (sets up paths, installs Radix primitives)
npx shadcn@latest init

# Individual shadcn components (installed as needed)
npx shadcn@latest add button card tabs dialog input table badge toggle popover

# Magic UI components (same CLI pattern)
npx magicui@latest add number-ticker marquee confetti shimmer-button
npx magicui@latest add animated-shiny-text border-beam neon-gradient-card
npx magicui@latest add particles ripple pulsating-button
```

### Component Mapping — Where Each Library Is Used

#### shadcn/ui Components (Base UI)

| shadcn Component | Used In | Purpose |
|-----------------|---------|---------|
| **Tabs** | Auction screen | Auction / Rosters / Tracker tab switching |
| **Card** | Rosters, Scoreboard, Team on block | Player roster cards, scoreboard rows, team auction card |
| **Button** | Everywhere | Bid buttons, "Sold", "Undo", "Draw Seeds", nav buttons |
| **Dialog** | Live scores, JSON import, reset | Confirmation modals before destructive/sync actions |
| **Input** | Setup, Auction | Player name editing, team name editing, custom bid amount |
| **Table** | Tracker, Scoreboard, Setup rules | Round toggles, standings, scoring rules display |
| **Badge** | Bracket, Auction, Tracker | Seed number badges (color-coded), round labels, player tags |
| **Toggle** | Tracker, NavBar | Round progression toggles (R64/R32/S16/E8/F4/NCG), mute |
| **Popover** | Bracket | Click-on-slot detail: owner, price, points |
| **Progress** | Auction | Budget bars per player |

#### Magic UI Components (Animated Effects)

| Magic UI Component | Used In | Purpose |
|-------------------|---------|---------|
| **Number Ticker** | Scoreboard, Budget bars, Seed reveal | Animated counting for points, budgets, seed numbers. Numbers roll up/down smoothly when values change. |
| **Marquee** | Broadcast Ticker | Continuous horizontal scroll at bottom of screen. Built-in smooth infinite scroll — replaces custom CSS keyframe approach. |
| **Confetti** | Auction complete, Championship | Celebration burst when auction finishes or when champion is crowned. Party moment. |
| **Shimmer Button** | "Draw Seeds and Begin" CTA | Eye-catching shimmer effect on the most important button in the app. |
| **Animated Shiny Text** | Seed reveal, "SOLD" flash | Shimmering text effect on the large seed number reveal and "SOLD" confirmation. |
| **Border Beam** | Team on block card | Animated glowing border around the currently auctioned team card. Moves like a spotlight. |
| **Neon Gradient Card** | Player roster cards | Subtle animated neon glow border on each player's roster card, tinted with their player color. |
| **Particles** | Bracket background | Subtle floating particles on the bracket view background, creating depth and broadcast atmosphere. |
| **Ripple** | Bid amount buttons | Ripple effect on bid quick-select buttons when clicked. Tactile feedback. |
| **Pulsating Button** | "Sold — Next Team" | Gentle pulse animation on the confirm button when a valid bid is ready, drawing the auctioneer's eye. |

#### Tailwind CSS (All Styling)

All component styling uses Tailwind utility classes. Key customizations in `tailwind.config.js`:
```js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: "#111111",
        border: "#1e1e1e",
        text: "#e0d8cc",
        "text-muted": "#555555",
        accent: "#f97316",
        colin: "#f97316",
        james: "#22d3ee",
        luke: "#a3e635",
        donald: "#e879f9",
        // Seed colors 1-16
        "seed-1": "#f97316", "seed-2": "#fb923c", /* ... */
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Courier New'", "monospace"],
      },
      animation: {
        // Custom animations beyond Magic UI's built-ins
        "seed-reveal": "seed-reveal 0.4s ease-out",
        "sold-flash": "sold-flash 0.3s ease-out",
      },
    },
  },
};
```

### Design Philosophy
- **shadcn/ui** provides the structural bones — Tabs, Cards, Dialogs, Tables
- **Magic UI** provides the broadcast magic — animated numbers, glowing borders, confetti celebrations, marquee ticker
- **Tailwind** ties it all together with the dark broadcast palette and custom spacing
- The combination creates a production-quality feel that would take weeks to build from scratch

**Setup commands:**
```bash
cd "/Users/colinryan/MARCH MADNESS"
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install @vercel/kv                          # Multi-device state sync
npm install framer-motion                       # Magic UI dependency

# Initialize shadcn/ui
npx shadcn@latest init

# Install shadcn/ui components
npx shadcn@latest add button card tabs dialog input table badge toggle popover progress

# Install Magic UI components
npx magicui@latest add number-ticker marquee confetti shimmer-button
npx magicui@latest add animated-shiny-text border-beam neon-gradient-card
npx magicui@latest add particles ripple pulsating-button

npm run dev                                     # Local development

# Deploy (after app is working locally):
npx vercel                                      # First deploy + KV setup
npx vercel env pull                             # Pull KV credentials to .env.local
```

---

## Data Model

### Static Data (`src/data/`)

**teams.js — 64 team entries:**
```js
export const TEAMS = [
  { id: "duke", name: "Duke", seed: 1, region: "East", abbr: "DUKE",
    sportsDbName: "Duke Blue Devils", firstFour: false, firstFourPartner: null },
  // ... all 64 teams
];

export const FIRST_FOUR = [
  { region: "South", seed: 16, teamA: "Prairie View A&M", teamB: "Lehigh" },
  { region: "West", seed: 11, teamA: "Texas", teamB: "NC State" },
  { region: "Midwest", seed: 11, teamA: "Miami (OH)", teamB: "SMU" },
  { region: "Midwest", seed: 16, teamA: "UMBC", teamB: "Howard" },
];
```

**constants.js — everything else:**
```js
export const PLAYERS = [
  { id: "colin",  name: "Colin",  color: "#f97316" },
  { id: "james",  name: "James",  color: "#22d3ee" },
  { id: "luke",   name: "Luke",   color: "#a3e635" },
  { id: "donald", name: "Donald", color: "#e879f9" },
];

export const ROUND_POINTS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 };

export const BRACKET_ORDER = [
  [1, 16], [8, 9], [5, 12], [4, 13],
  [6, 11], [3, 14], [7, 10], [2, 15]
];

export const SEED_COLORS = {
  1: "#f97316", 2: "#fb923c", 3: "#f59e0b", 4: "#eab308",
  5: "#d4d424", 6: "#a3e635", 7: "#4ade80", 8: "#34d399",
  9: "#2dd4bf", 10: "#22d3ee", 11: "#38bdf8", 12: "#60a5fa",
  13: "#818cf8", 14: "#a78bfa", 15: "#c084fc", 16: "#1a1a2e"
};

export const THEME = {
  bg: "#080808", surface: "#111111", border: "#1e1e1e",
  text: "#e0d8cc", textMuted: "#555555", accent: "#f97316",
  fontDisplay: "'Bebas Neue', sans-serif",
  fontBody: "'Courier New', monospace",
  maxWidth: 800,
};
```

### App State (in App.jsx, persisted via usePersistence)

```js
const [gameState, setGameState] = useState({
  // Screen
  screen: "setup",           // setup | auction | bracket | scoreboard
  auctionTab: "auction",     // auction | rosters | tracker

  // Players
  players: PLAYERS.map(p => ({ ...p })),  // editable names

  // Auction
  seedOrder: [],              // shuffled 1-16
  currentSeedIndex: 0,
  currentRegionIndex: 0,
  auctionPhase: "pre",       // pre | bidding | complete
  currentBid: 0,
  currentBidder: null,

  // Ownership
  ownership: {},              // { teamId: playerId }
  prices: {},                 // { teamId: amount }
  budgets: { colin: 200, james: 200, luke: 200, donald: 200 },

  // Tournament Results
  roundResults: {},           // { teamId: highestRoundReached (1-6) }
  firstFourWinners: {},       // { "South-16": "Prairie View A&M" }

  // Undo
  lastSale: null,             // { teamId, playerId, amount, prevSeedIndex, prevRegionIndex }

  // Settings
  muted: false,
  teamNameOverrides: {},      // { teamId: newName }
});
```

All state lives in a single `gameState` object for easy serialization to localStorage and JSON export.

### Derived State (useMemo)

- `currentTeam` — team on the block (from seedOrder + indexes)
- `rosters` — per-player team arrays
- `scores` — per-player point totals
- `standings` — sorted by points, tiebreak by cash remaining
- `teamsBySeed` — teams grouped by seed
- `tickerMessages` — contextual messages
- `teamsRemaining` — count of unsold teams per player (for budget reserve calc)

---

## Persistence System (`usePersistence.js`)

### Auto-Save to localStorage
- Every state change triggers a debounced save (300ms) to `localStorage.setItem("marchMadness2026", JSON.stringify(gameState))`
- On app load, check for saved state and restore if found
- Version field in state for future migration support

### JSON Export/Import
- **Export:** Button in NavBar downloads `march-madness-backup-{date}.json`
- **Import:** File picker restores full state from JSON file
- Validates JSON structure before importing (checks for required keys)
- Confirmation dialog before overwrite

### Reset
- "New Game" button in setup with confirmation dialog
- Clears localStorage and resets to initial state

---

## Deployment: Vercel + Vercel KV

### Vercel Hosting
- Deploy Vite project to Vercel (free tier) for multi-device access
- Everyone at the auction can view bracket/scoreboard on their phones
- `vercel deploy` from CLI or connect GitHub repo for auto-deploy

### Vercel KV — Multi-Device State Sync
The auctioneer's laptop is the source of truth. Other devices get live updates:

**API route (`api/state.js`):**
```js
// GET  /api/state → returns current game state from KV
// POST /api/state → auctioneer pushes updated state to KV
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const state = await kv.get('marchMadness2026');
    return res.json(state || {});
  }
  if (req.method === 'POST') {
    await kv.set('marchMadness2026', req.body);
    return res.json({ ok: true });
  }
}
```

**Auctioneer role — explicit, not auto-detected:**
- On first load, the app shows a simple choice: "I'm the Auctioneer" / "I'm a Viewer"
- Selecting "Auctioneer" enables all controls and pushes state to KV on every change (debounced 1s)
- Selecting "Viewer" hides all edit controls — shows read-only Bracket, Scoreboard, Rosters with a "LIVE" badge. Polls `GET /api/state` every 5 seconds for updates.
- The role choice is stored in localStorage so the user doesn't re-select on every reload
- Colin's laptop = Auctioneer. Friends' phones = Viewer. Simple, explicit, no ambiguity.
- If a viewer wants to become the auctioneer (e.g., someone else takes over), there's a small "Switch to Auctioneer" option in settings — not prominent, no accidental clicks

**Cost:** Free (Vercel KV free tier: 256MB storage, 30k requests/day — more than enough)

**Package:** `@vercel/kv` (one dependency for the serverless route)

---

## Live Scores Integration (`useLiveScores.js`)

### Multi-Source Fallback Strategy
Manual entry is always the primary workflow. Live sync is a convenience bonus.

**Source 1 — NCAA API (most reliable, purpose-built):**
```
https://ncaa-api.henrygd.me/scoreboard/basketball-men/d1
```
Free, open-source proxy of NCAA.com data. 5 req/sec rate limit. Returns game scores, team names, game status. Purpose-built for exactly this use case.

**Source 2 — ESPN Hidden API (backup):**
```
https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=YYYYMMDD&groups=100
```
Undocumented but widely used. No API key. Returns JSON with team names, scores, game status. May break without warning — that's why it's source 2.

**Source 3 — Manual entry (always available):**
Round toggle buttons in the Tracker tab. Zero API dependency.

### Implementation
- "Sync Scores" button on Tracker tab
- Tries NCAA API first → if fails, tries ESPN → if fails, shows "API unavailable, enter manually"
- Success: shows confirmation modal listing completed games and winners
- User reviews and confirms before results are applied
- Applies results: toggles round progression, recalculates scores, updates bracket
- Ticker announces synced results
- Stores last sync timestamp to avoid duplicate fetches

### Team Name Matching
APIs return full names ("Duke Blue Devils") while our data uses short names ("Duke"). Match strategy:
- Fuzzy substring match (does API name contain our team name?)
- Fallback: Levenshtein distance for close matches
- Unmatched teams flagged in confirmation modal for manual resolution

---

## Component Details

### NavBar.jsx
- 4 screen buttons: Setup, Auction, Bracket, Scoreboard
- Active button highlighted with accent underline
- Mute toggle (speaker icon) in top-right
- Export/Import buttons (small, in corner)
- Fixed top, z-index above content

### Setup.jsx
- 4 player name inputs (inline-editable, click-to-edit)
- Team grid: 4 region columns, 16 rows each, showing seed + team name
- Any team name click-to-edit (for First Four updates after play-in games)
- Rules panel: scoring table + auction rules summary
- "Draw Seeds and Begin" CTA button → shuffles seeds → transitions to Auction

### AuctionTab.jsx
- **Seed reveal:** Large seed number with scale animation + glow on change
- **Team card:** Logo (medium), name, seed badge, region label
- **Matchup preview:** Below team card — "Round of 64 opponent: (12) Northern Iowa"
- **First Four display:** Both team names + "Owner receives whichever team wins play-in"
- **Bidder buttons:** 4 buttons, one per player, showing "$X left" in muted text
- **Bid amount:** Quick-select chips ($1, $5, $10, $20, $50, $100) + manual input
- **"Sold — Next Team":** Disabled until bidder + valid amount selected
- **Undo button:** Reverts last sale, disabled when no sales exist
- **Seed sidebar (right):** All 16 seeds in draw order, current highlighted, completed dimmed. Active seed expands to show all 4 regional matchups at that seed.
- **Budget bars:** 4 horizontal bars at bottom of auction area, color-coded per player

### Tracker.jsx
- Rows sorted by seed, grouped by region
- Each row: seed badge, team logo (small), team name, owner color-dot
- 6 toggle buttons per row: R64, R32, S16, E8, F4, NCG
- Toggling awards points and updates bracket
- "Sync Scores" button at top (live scores integration)
- Points recalculate live

### BracketSVG.jsx
- **ViewBox:** `0 0 1400 900`
- **4 regions in quadrants:**
  - East (top-left): R1 slots flow left→right
  - South (bottom-left): R1 slots flow left→right
  - West (top-right): R1 slots flow right→left (mirrored)
  - Midwest (bottom-right): R1 slots flow right→left (mirrored)
- **Final Four + Championship** at center
- **Each slot:** 120x22px rect, seed number (left), small logo (16x16), abbreviated team name
- **Owner coloring:** Sold slots fill with `rgba(playerColor, 0.25)`, border with playerColor
- **Connecting lines:** SVG paths with right-angle bends between rounds
- **Click interaction:** Popover on slot click showing owner, price paid, points earned
- **First Four:** Display "PV A&M / Lehigh" until play-in result entered, then winner only
- **Responsive:** Horizontal scroll wrapper for smaller screens

### Scoreboard.jsx
- Table sorted by points descending
- Columns: Rank, Player Name, Points, Teams Owned, Spent, Cash Remaining
- "Tiebreaker: most cash remaining" label displayed
- Expandable rows: click to show all owned teams with logo, price, round reached, points
- Player row background subtly tinted with player color

### Ticker.jsx
- Fixed bottom bar, 40px height, #0a0a0a background
- Courier New condensed text, high contrast
- CSS keyframe continuous horizontal scroll
- Messages rotate and update based on auction/tournament state:
  - Recent sale: "Duke sold to Colin for $47"
  - Budget leader: "James has the most remaining — $134 left"
  - Points leader: "Luke leads with 24 points"
  - Best value: "Best value: Arizona to Donald for $3"
  - Low budget: "Colin is running low — $8 remaining"
  - High seed: "1-SEED ON THE BLOCK"
  - Team count: "Donald owns the most teams — 6"

---

## SVG Bracket Geometry (`utils/bracket-math.js`)

```js
// Returns {x, y} for any slot in the bracket
export function getSlotPosition(region, round, position) {
  const SLOT_W = 120, SLOT_H = 22, GAP = 4;
  const REGION_W = 580, REGION_H = 420;
  const TOTAL_W = 1400, TOTAL_H = 900;

  // Base positions for Round 1 (16 slots per region, 8 matchups)
  const r1Y = position * (SLOT_H * 2 + GAP * 2);

  // Each subsequent round: centered between feeder positions
  // Round N position = avg(Round N-1 positions that feed into it)

  // Region offsets:
  // East: x=0, y=0 (top-left, flows right)
  // South: x=0, y=460 (bottom-left, flows right)
  // West: x=TOTAL_W, y=0 (top-right, flows LEFT — mirrored)
  // Midwest: x=TOTAL_W, y=460 (bottom-right, flows LEFT — mirrored)
}
```

The key insight: left regions (East, South) have Round 1 on the far left and progress rightward. Right regions (West, Midwest) have Round 1 on the far right and progress leftward (mirrored). Both converge at the center for Final Four.

---

## Sound Effects (`useSoundEffects.js`)

All synthesized with Web Audio API — zero audio files:

| Event | Sound | Implementation |
|-------|-------|---------------|
| "Sold" confirmation | Gavel slam | Short noise burst with fast decay |
| Bid placed | Cash register | Quick high-frequency ping |
| 1/2-seed reveal | Drum roll | Oscillating low-frequency with crescendo |
| Upset in Tracker | Crowd cheer | White noise burst with bandpass filter |
| Seed change | Whoosh | Frequency sweep down |

```js
export function useSoundEffects(muted) {
  const ctxRef = useRef(null);

  const getContext = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const playGavel = () => { if (muted) return; /* ... */ };
  const playCashRegister = () => { /* ... */ };
  // etc.

  return { playGavel, playCashRegister, playDrumRoll, playCrowdCheer, playWhoosh };
}
```

---

## Included Innovations

### Undo Last Sale
- "Undo" button visible during auction, disabled when no sales exist
- Reverts: ownership, budget, auction pointer (moves back one team)
- Single-level only (undoes most recent sale)
- Ticker announces: "Undid: Duke sold to Colin for $47"

### Sound Effects (Web Audio API)
- Gavel on sold, cash register on bid, drum roll on top-seed reveal
- Crowd cheer on upset advancement in Tracker
- Mute toggle in NavBar, respects `prefers-reduced-motion`

### Auto-Save + JSON Backup
- Every state change auto-saves to localStorage (debounced 300ms)
- Manual JSON export/import for backup and portability
- App survives page reloads, browser restarts, entire tournament duration

### Live Scores — Multi-Source Fallback
- "Sync Scores" button tries NCAA API first, ESPN as backup, manual as always-available
- Confirmation modal before applying any results
- Fuzzy team name matching handles API name differences

### Vercel Deploy + Multi-Device Sync
- Deploy to Vercel free tier for phone/laptop access during auction and tournament
- Vercel KV stores game state; auctioneer pushes, viewers poll every 5s
- Read-only viewer mode auto-detects (no controls, just live data)

### Auctioneer-Operated Flow
- One person runs the laptop, players call out bids verbally
- Optimized for fast operation: click player → click amount → click Sold

### Desktop-First
- Optimized for 1200px+ laptop screens
- Bracket renders at full SVG resolution
- Mobile gets horizontal scroll but isn't the priority

---

## Implementation Phases

### Phase 1: Project Setup + Data Layer + UI Libraries
- Initialize Vite + React project
- Install and configure Tailwind CSS with custom dark broadcast theme
- Initialize shadcn/ui, install base components (Button, Card, Tabs, Dialog, etc.)
- Install Magic UI components (NumberTicker, Marquee, Confetti, ShimmerButton, etc.)
- Create `teams.js` with all 64 teams (hardcoded from official bracket)
- Create `constants.js` with all configuration
- Create `App.jsx` with gameState, routing, layout shell
- Create `usePersistence.js` (auto-save + export/import)
- Create `index.css` with Tailwind directives, Bebas Neue font import, keyframes
- **Verify:** `npm run dev` serves the app, shadcn + Magic UI components render, state saves/restores

### Phase 2: Setup Screen
- `Setup.jsx`: player name editing, team grid, rules panel
- Click-to-edit for player names and team names
- "Draw Seeds and Begin" with Fisher-Yates shuffle
- **Verify:** Names editable, begin button transitions to auction view

### Phase 3: Auction Screen
- `AuctionTab.jsx`: seed reveal, team card, bid controls, matchup preview
- `useAuction.js`: bid logic, sale confirmation, advance, undo
- `useSoundEffects.js`: gavel, cash register, drum roll
- Seed sidebar with expandable matchups
- Budget bars and enforcement
- First Four handling (dual-name display, single auction unit)
- **Verify:** Full auction of a few teams, undo works, budget enforced, sounds play

### Phase 4: Rosters + Tracker
- `Rosters.jsx`: 4 player cards with owned teams
- `Tracker.jsx`: round toggle buttons per team, point calculation
- `useScoring.js`: point accumulation from round results
- **Verify:** Toggling rounds awards correct points, rosters update live

### Phase 5: SVG Bracket
- `bracket-math.js`: coordinate calculation for all slots
- `BracketSVG.jsx`: slot rendering, connecting lines, region layout
- Final Four + Championship center convergence
- Owner color-coding, click popovers
- First Four display logic
- **Verify:** All 64 teams visible in correct positions, colors apply on sale

### Phase 6: Scoreboard + Ticker
- `Scoreboard.jsx`: standings table with expandable rows
- `Ticker.jsx`: continuous scroll with contextual messages
- Tiebreaker display
- **Verify:** Standings sort correctly, ticker scrolls, messages update

### Phase 7: Live Scores + Logos
- `useLiveScores.js`: Multi-source integration (NCAA API → ESPN fallback → manual)
- `team-matching.js`: Fuzzy name matching for API responses
- Confirmation modal before applying synced results
- `useLogos.js`: SportsDB fetch with batching + fallback badges
- **Verify:** Sync Scores button works, fallback to manual if API down

### Phase 8: Vercel Deploy + Multi-Device Sync
- `api/state.js`: Vercel serverless function for KV read/write
- `useSync.js`: Auctioneer pushes state, viewers poll every 5s
- `vercel.json`: KV store binding
- Deploy to Vercel, set up KV store
- Test on phone: visit Vercel URL, verify live updates
- **Verify:** Change state on laptop, see update on phone within 5s

### Phase 9: Polish + Edge Cases
- Final animation polish (seed reveal, sold flash, bracket fills)
- Edge cases: last team auto-sell, $0 budget player skipping
- JSON export/import UI
- "New Game" reset with confirmation
- **Verify:** Full end-to-end: setup → auction → track results → scoreboard → phone sync

---

## Future Additions (Post-MVP)

- **Auction Shot Clock** — 30s countdown with auto-sell
- **Draft Grades** — A-F report card after auction completes
- **Value Meter** — STEAL-to-OVERPAY gauge during bidding
- **Nomination Mode** — Players take turns nominating teams
- **Trade System** — Post-auction team swaps between players
- **Cinderella Tracker** — Special animations for upset runs
- **Head-to-Head Highlights** — When owned teams face each other in bracket

---

## Verification Plan

| # | Criterion | Method |
|---|-----------|--------|
| C1 | Vite React project builds and serves successfully | CLI: `npm run dev` + `npm run build` |
| C2 | Four players each start with exactly $200 budget | Browser: open app, verify all show $200 |
| C3 | All 64 teams match official 2026 bracket | Grep: count entries in teams.js, verify names |
| C4 | Seeds shuffle randomly on begin | Browser: begin multiple times, verify different orders |
| C5 | Four teams per seed auction before next seed | Browser: auction through one seed |
| C6 | Budget enforcement blocks over-budget bids | Browser: attempt bid > remaining |
| C7 | First Four displays both teams as one unit | Browser: navigate to 16-seed auction |
| C8 | SVG bracket shows 4 regions converging to center | Browser: screenshot bracket view |
| C9 | Bracket slots fill with owner color | Browser: sell team, check bracket |
| C10 | Tracker toggles award correct points | Browser: toggle rounds, check math |
| C11 | Scoreboard sorts by points, tiebreak by cash | Browser: verify ordering |
| C12 | Ticker scrolls on every screen | Browser: check all 4 views |
| C13 | Logos load from SportsDB with fallback | Browser: check images |
| C14 | Only Bebas Neue and Courier New fonts used | Grep: font-family in CSS/JSX |
| C15 | Dark palette matches spec hex values | Grep: verify in constants.js |
| C16 | Matchup preview shows R64 opponent | Browser: verify on auction card |
| C17 | Seed sidebar expands with 4 matchups | Browser: check expanded seed |
| C18 | Rosters show teams, logos, prices, points | Browser: check after sales |
| C19 | Setup allows inline name editing | Browser: edit names |
| C20 | Nav switches between all 4 views | Browser: click all buttons |
| C21 | Undo reverts last sale correctly | Browser: sell then undo |
| C22 | Sound effects play on sold/bid/reveal | Browser: listen during auction |
| C23 | Mute toggle silences all sounds | Browser: toggle and verify |
| C24 | State persists across page reload | Browser: reload, verify state |
| C25 | JSON export downloads valid backup file | Browser: click export, check file |
| C26 | JSON import restores state correctly | Browser: import saved file |
| C27 | Live scores try NCAA API then ESPN fallback then manual | Browser: click Sync Scores |
| C28 | Vercel deploy serves app accessible via public URL | CLI: `npx vercel` succeeds |
| C29 | Vercel KV syncs state from auctioneer to viewer devices | Browser: change on laptop, check phone |
| C30 | Read-only viewer mode auto-detects on non-auctioneer devices | Browser: open on second device |
| A1 | No emojis in rendered UI | Grep: search for emoji ranges |
| A2 | No component libs beyond shadcn/ui Magic UI and Radix | Read: check package.json deps |
| A3 | No system fonts (Inter, Arial, Roboto) | Grep: search style declarations |
