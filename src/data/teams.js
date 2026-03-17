// All 64 teams in the 2026 NCAA Tournament bracket
// Four First Four play-in slots are marked with firstFour: true
// espnId used for logos: https://a.espncdn.com/i/teamlogos/ncaa/500/{espnId}.png

export const REGIONS = ["East", "South", "West", "Midwest"];

export const TEAMS = [
  // === EAST REGION ===
  { id: "east-1", name: "Duke", seed: 1, region: "East", abbr: "DUKE", espnId: 150 },
  { id: "east-2", name: "UConn", seed: 2, region: "East", abbr: "UCONN", espnId: 41 },
  { id: "east-3", name: "Michigan St.", seed: 3, region: "East", abbr: "MSU", espnId: 127 },
  { id: "east-4", name: "Kansas", seed: 4, region: "East", abbr: "KU", espnId: 2305 },
  { id: "east-5", name: "St. John's", seed: 5, region: "East", abbr: "SJU", espnId: 2599 },
  { id: "east-6", name: "Louisville", seed: 6, region: "East", abbr: "LOU", espnId: 97 },
  { id: "east-7", name: "UCLA", seed: 7, region: "East", abbr: "UCLA", espnId: 26 },
  { id: "east-8", name: "Ohio State", seed: 8, region: "East", abbr: "OSU", espnId: 194 },
  { id: "east-9", name: "TCU", seed: 9, region: "East", abbr: "TCU", espnId: 2628 },
  { id: "east-10", name: "UCF", seed: 10, region: "East", abbr: "UCF", espnId: 2116 },
  { id: "east-11", name: "South Florida", seed: 11, region: "East", abbr: "USF", espnId: 58 },
  { id: "east-12", name: "Northern Iowa", seed: 12, region: "East", abbr: "UNI", espnId: 2460 },
  { id: "east-13", name: "Cal Baptist", seed: 13, region: "East", abbr: "CBU", espnId: 2856 },
  { id: "east-14", name: "North Dakota St.", seed: 14, region: "East", abbr: "NDSU", espnId: 2449 },
  { id: "east-15", name: "Furman", seed: 15, region: "East", abbr: "FUR", espnId: 231 },
  { id: "east-16", name: "Siena", seed: 16, region: "East", abbr: "SIEN", espnId: 2561 },

  // === SOUTH REGION ===
  { id: "south-1", name: "Florida", seed: 1, region: "South", abbr: "FLA", espnId: 57 },
  { id: "south-2", name: "Houston", seed: 2, region: "South", abbr: "HOU", espnId: 248 },
  { id: "south-3", name: "Illinois", seed: 3, region: "South", abbr: "ILL", espnId: 356 },
  { id: "south-4", name: "Nebraska", seed: 4, region: "South", abbr: "NEB", espnId: 158 },
  { id: "south-5", name: "Vanderbilt", seed: 5, region: "South", abbr: "VAN", espnId: 238 },
  { id: "south-6", name: "North Carolina", seed: 6, region: "South", abbr: "UNC", espnId: 153 },
  { id: "south-7", name: "Saint Mary's", seed: 7, region: "South", abbr: "SMC", espnId: 2608 },
  { id: "south-8", name: "Clemson", seed: 8, region: "South", abbr: "CLEM", espnId: 228 },
  { id: "south-9", name: "Iowa", seed: 9, region: "South", abbr: "IOWA", espnId: 2294 },
  { id: "south-10", name: "Texas A&M", seed: 10, region: "South", abbr: "TAMU", espnId: 245 },
  { id: "south-11", name: "VCU", seed: 11, region: "South", abbr: "VCU", espnId: 2670 },
  { id: "south-12", name: "McNeese", seed: 12, region: "South", abbr: "MCN", espnId: 2377 },
  { id: "south-13", name: "Troy", seed: 13, region: "South", abbr: "TROY", espnId: 2653 },
  { id: "south-14", name: "Penn", seed: 14, region: "South", abbr: "PENN", espnId: 219 },
  { id: "south-15", name: "Idaho", seed: 15, region: "South", abbr: "IDHO", espnId: 70 },
  {
    id: "south-16", name: "Prairie View A&M / Lehigh", seed: 16, region: "South", abbr: "FF",
    espnId: 2504, firstFour: true,
    firstFourTeams: ["Prairie View A&M", "Lehigh"],
    firstFourEspnIds: [2504, 2329],
  },

  // === WEST REGION ===
  { id: "west-1", name: "Arizona", seed: 1, region: "West", abbr: "ARIZ", espnId: 12 },
  { id: "west-2", name: "Purdue", seed: 2, region: "West", abbr: "PUR", espnId: 2509 },
  { id: "west-3", name: "Gonzaga", seed: 3, region: "West", abbr: "GONZ", espnId: 2250 },
  { id: "west-4", name: "Arkansas", seed: 4, region: "West", abbr: "ARK", espnId: 8 },
  { id: "west-5", name: "Wisconsin", seed: 5, region: "West", abbr: "WIS", espnId: 275 },
  { id: "west-6", name: "BYU", seed: 6, region: "West", abbr: "BYU", espnId: 252 },
  { id: "west-7", name: "Miami (FL)", seed: 7, region: "West", abbr: "MIA", espnId: 2390 },
  { id: "west-8", name: "Villanova", seed: 8, region: "West", abbr: "NOVA", espnId: 222 },
  { id: "west-9", name: "Utah St.", seed: 9, region: "West", abbr: "USU", espnId: 328 },
  { id: "west-10", name: "Missouri", seed: 10, region: "West", abbr: "MIZ", espnId: 142 },
  {
    id: "west-11", name: "Texas / NC State", seed: 11, region: "West", abbr: "FF",
    espnId: 251, firstFour: true,
    firstFourTeams: ["Texas", "NC State"],
    firstFourEspnIds: [251, 152],
  },
  { id: "west-12", name: "High Point", seed: 12, region: "West", abbr: "HPU", espnId: 2272 },
  { id: "west-13", name: "Hawaii", seed: 13, region: "West", abbr: "HAW", espnId: 62 },
  { id: "west-14", name: "Kennesaw St.", seed: 14, region: "West", abbr: "KSU", espnId: 338 },
  { id: "west-15", name: "Queens", seed: 15, region: "West", abbr: "QU", espnId: 2511 },
  { id: "west-16", name: "LIU", seed: 16, region: "West", abbr: "LIU", espnId: 112358 },

  // === MIDWEST REGION ===
  { id: "midwest-1", name: "Michigan", seed: 1, region: "Midwest", abbr: "MICH", espnId: 130 },
  { id: "midwest-2", name: "Iowa State", seed: 2, region: "Midwest", abbr: "ISU", espnId: 66 },
  { id: "midwest-3", name: "Virginia", seed: 3, region: "Midwest", abbr: "UVA", espnId: 258 },
  { id: "midwest-4", name: "Alabama", seed: 4, region: "Midwest", abbr: "BAMA", espnId: 333 },
  { id: "midwest-5", name: "Texas Tech", seed: 5, region: "Midwest", abbr: "TTU", espnId: 2641 },
  { id: "midwest-6", name: "Tennessee", seed: 6, region: "Midwest", abbr: "TENN", espnId: 2633 },
  { id: "midwest-7", name: "Kentucky", seed: 7, region: "Midwest", abbr: "UK", espnId: 96 },
  { id: "midwest-8", name: "Georgia", seed: 8, region: "Midwest", abbr: "UGA", espnId: 61 },
  { id: "midwest-9", name: "Saint Louis", seed: 9, region: "Midwest", abbr: "SLU", espnId: 139 },
  { id: "midwest-10", name: "Santa Clara", seed: 10, region: "Midwest", abbr: "SCU", espnId: 2541 },
  {
    id: "midwest-11", name: "Miami (OH) / SMU", seed: 11, region: "Midwest", abbr: "FF",
    espnId: 193, firstFour: true,
    firstFourTeams: ["Miami (OH)", "SMU"],
    firstFourEspnIds: [193, 2567],
  },
  { id: "midwest-12", name: "Akron", seed: 12, region: "Midwest", abbr: "AKR", espnId: 2006 },
  { id: "midwest-13", name: "Hofstra", seed: 13, region: "Midwest", abbr: "HOF", espnId: 2275 },
  { id: "midwest-14", name: "Wright St.", seed: 14, region: "Midwest", abbr: "WSU", espnId: 2750 },
  { id: "midwest-15", name: "Tennessee St.", seed: 15, region: "Midwest", abbr: "TSU", espnId: 2634 },
  {
    id: "midwest-16", name: "UMBC / Howard", seed: 16, region: "Midwest", abbr: "FF",
    espnId: 2378, firstFour: true,
    firstFourTeams: ["UMBC", "Howard"],
    firstFourEspnIds: [2378, 47],
  },
];

// ESPN CDN logo URL helper
export function getLogoUrl(team) {
  if (!team || !team.espnId) return null;
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`;
}

// Helper: get team by id
export function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}

// Helper: get teams by region
export function getTeamsByRegion(region) {
  return TEAMS.filter(t => t.region === region).sort((a, b) => a.seed - b.seed);
}

// Helper: get teams by seed
export function getTeamsBySeed(seed) {
  return TEAMS.filter(t => t.seed === seed);
}

// Helper: get opponent seed in Round of 64
export function getOpponentSeed(seed) {
  return 17 - seed;
}

// Helper: get Round of 64 opponent for a team
export function getR64Opponent(team) {
  const oppSeed = getOpponentSeed(team.seed);
  return TEAMS.find(t => t.region === team.region && t.seed === oppSeed);
}
