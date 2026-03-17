export const PLAYERS = [
  { id: "colin", name: "Colin", color: "#d44427" },
  { id: "james", name: "James", color: "#0891b2" },
  { id: "luke", name: "Luke", color: "#16a34a" },
  { id: "donald", name: "Donald", color: "#9333ea" },
];

export const PLAYER_COLORS = {
  colin: "#d44427",
  james: "#0891b2",
  luke: "#16a34a",
  donald: "#9333ea",
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
  1: "#555555",
  2: "#555555",
  3: "#555555",
  4: "#555555",
  5: "#555555",
  6: "#555555",
  7: "#555555",
  8: "#555555",
  9: "#555555",
  10: "#555555",
  11: "#555555",
  12: "#555555",
  13: "#555555",
  14: "#555555",
  15: "#555555",
  16: "#555555",
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
