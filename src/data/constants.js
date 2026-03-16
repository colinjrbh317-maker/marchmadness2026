export const PLAYERS = [
  { id: "colin", name: "Colin", color: "#f97316" },
  { id: "james", name: "James", color: "#22d3ee" },
  { id: "luke", name: "Luke", color: "#a3e635" },
  { id: "donald", name: "Donald", color: "#e879f9" },
];

export const PLAYER_COLORS = {
  colin: "#f97316",
  james: "#22d3ee",
  luke: "#a3e635",
  donald: "#e879f9",
};

export const STARTING_BUDGET = 200;

export const ROUND_POINTS = {
  1: 1,   // Round of 64
  2: 2,   // Round of 32
  3: 4,   // Sweet 16
  4: 8,   // Elite Eight
  5: 16,  // Final Four
  6: 32,  // Championship
};

export const ROUND_NAMES = {
  1: "R64",
  2: "R32",
  3: "S16",
  4: "E8",
  5: "F4",
  6: "NCG",
};

export const ROUND_FULL_NAMES = {
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet 16",
  4: "Elite Eight",
  5: "Final Four",
  6: "Championship",
};

// Standard NCAA bracket order per region (top to bottom)
// Each pair is [highSeed, lowSeed] in a first-round matchup
export const BRACKET_ORDER = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

export const SEED_COLORS = {
  1: "#f97316",
  2: "#fb923c",
  3: "#f59e0b",
  4: "#eab308",
  5: "#d4d424",
  6: "#a3e635",
  7: "#4ade80",
  8: "#34d399",
  9: "#2dd4bf",
  10: "#22d3ee",
  11: "#38bdf8",
  12: "#60a5fa",
  13: "#818cf8",
  14: "#a78bfa",
  15: "#c084fc",
  16: "#1a1a2e",
};

// Fisher-Yates shuffle
export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initial game state
export function createInitialState() {
  return {
    screen: "setup",
    auctionTab: "auction",

    players: PLAYERS.map(p => ({ ...p })),

    seedOrder: [],
    currentSeedIndex: 0,
    currentRegionIndex: 0,
    auctionPhase: "pre",
    currentBid: 0,
    currentBidder: null,

    ownership: {},
    prices: {},
    budgets: {
      colin: STARTING_BUDGET,
      james: STARTING_BUDGET,
      luke: STARTING_BUDGET,
      donald: STARTING_BUDGET,
    },

    roundResults: {},
    firstFourWinners: {},

    lastSale: null,

    muted: false,
    teamNameOverrides: {},
  };
}

export const STATE_VERSION = 1;
