// All 64 teams in the 2026 NCAA Tournament bracket
// Four First Four play-in slots are marked with firstFour: true

export const REGIONS = ["East", "South", "West", "Midwest"];

export const TEAMS = [
  // === EAST REGION ===
  { id: "east-1", name: "Duke", seed: 1, region: "East", abbr: "DUKE", sportsDbName: "Duke Blue Devils" },
  { id: "east-2", name: "UConn", seed: 2, region: "East", abbr: "UCONN", sportsDbName: "Connecticut Huskies" },
  { id: "east-3", name: "Michigan St.", seed: 3, region: "East", abbr: "MSU", sportsDbName: "Michigan State Spartans" },
  { id: "east-4", name: "Kansas", seed: 4, region: "East", abbr: "KU", sportsDbName: "Kansas Jayhawks" },
  { id: "east-5", name: "St. John's", seed: 5, region: "East", abbr: "SJU", sportsDbName: "St John's Red Storm" },
  { id: "east-6", name: "Louisville", seed: 6, region: "East", abbr: "LOU", sportsDbName: "Louisville Cardinals" },
  { id: "east-7", name: "UCLA", seed: 7, region: "East", abbr: "UCLA", sportsDbName: "UCLA Bruins" },
  { id: "east-8", name: "Ohio State", seed: 8, region: "East", abbr: "OSU", sportsDbName: "Ohio State Buckeyes" },
  { id: "east-9", name: "TCU", seed: 9, region: "East", abbr: "TCU", sportsDbName: "TCU Horned Frogs" },
  { id: "east-10", name: "UCF", seed: 10, region: "East", abbr: "UCF", sportsDbName: "UCF Knights" },
  { id: "east-11", name: "South Florida", seed: 11, region: "East", abbr: "USF", sportsDbName: "South Florida Bulls" },
  { id: "east-12", name: "Northern Iowa", seed: 12, region: "East", abbr: "UNI", sportsDbName: "Northern Iowa Panthers" },
  { id: "east-13", name: "Cal Baptist", seed: 13, region: "East", abbr: "CBU", sportsDbName: "California Baptist Lancers" },
  { id: "east-14", name: "North Dakota St.", seed: 14, region: "East", abbr: "NDSU", sportsDbName: "North Dakota State Bison" },
  { id: "east-15", name: "Furman", seed: 15, region: "East", abbr: "FUR", sportsDbName: "Furman Paladins" },
  { id: "east-16", name: "Siena", seed: 16, region: "East", abbr: "SIEN", sportsDbName: "Siena Saints" },

  // === SOUTH REGION ===
  { id: "south-1", name: "Florida", seed: 1, region: "South", abbr: "FLA", sportsDbName: "Florida Gators" },
  { id: "south-2", name: "Houston", seed: 2, region: "South", abbr: "HOU", sportsDbName: "Houston Cougars" },
  { id: "south-3", name: "Illinois", seed: 3, region: "South", abbr: "ILL", sportsDbName: "Illinois Fighting Illini" },
  { id: "south-4", name: "Nebraska", seed: 4, region: "South", abbr: "NEB", sportsDbName: "Nebraska Cornhuskers" },
  { id: "south-5", name: "Vanderbilt", seed: 5, region: "South", abbr: "VAN", sportsDbName: "Vanderbilt Commodores" },
  { id: "south-6", name: "North Carolina", seed: 6, region: "South", abbr: "UNC", sportsDbName: "North Carolina Tar Heels" },
  { id: "south-7", name: "Saint Mary's", seed: 7, region: "South", abbr: "SMC", sportsDbName: "Saint Mary's Gaels" },
  { id: "south-8", name: "Clemson", seed: 8, region: "South", abbr: "CLEM", sportsDbName: "Clemson Tigers" },
  { id: "south-9", name: "Iowa", seed: 9, region: "South", abbr: "IOWA", sportsDbName: "Iowa Hawkeyes" },
  { id: "south-10", name: "Texas A&M", seed: 10, region: "South", abbr: "TAMU", sportsDbName: "Texas A&M Aggies" },
  { id: "south-11", name: "VCU", seed: 11, region: "South", abbr: "VCU", sportsDbName: "VCU Rams" },
  { id: "south-12", name: "McNeese", seed: 12, region: "South", abbr: "MCN", sportsDbName: "McNeese State Cowboys" },
  { id: "south-13", name: "Troy", seed: 13, region: "South", abbr: "TROY", sportsDbName: "Troy Trojans" },
  { id: "south-14", name: "Penn", seed: 14, region: "South", abbr: "PENN", sportsDbName: "Penn Quakers" },
  { id: "south-15", name: "Idaho", seed: 15, region: "South", abbr: "IDHO", sportsDbName: "Idaho Vandals" },
  {
    id: "south-16", name: "Prairie View A&M / Lehigh", seed: 16, region: "South", abbr: "FF",
    sportsDbName: "Prairie View A&M Panthers", firstFour: true,
    firstFourTeams: ["Prairie View A&M", "Lehigh"],
  },

  // === WEST REGION ===
  { id: "west-1", name: "Arizona", seed: 1, region: "West", abbr: "ARIZ", sportsDbName: "Arizona Wildcats" },
  { id: "west-2", name: "Purdue", seed: 2, region: "West", abbr: "PUR", sportsDbName: "Purdue Boilermakers" },
  { id: "west-3", name: "Gonzaga", seed: 3, region: "West", abbr: "GONZ", sportsDbName: "Gonzaga Bulldogs" },
  { id: "west-4", name: "Arkansas", seed: 4, region: "West", abbr: "ARK", sportsDbName: "Arkansas Razorbacks" },
  { id: "west-5", name: "Wisconsin", seed: 5, region: "West", abbr: "WIS", sportsDbName: "Wisconsin Badgers" },
  { id: "west-6", name: "BYU", seed: 6, region: "West", abbr: "BYU", sportsDbName: "BYU Cougars" },
  { id: "west-7", name: "Miami (FL)", seed: 7, region: "West", abbr: "MIA", sportsDbName: "Miami Hurricanes" },
  { id: "west-8", name: "Villanova", seed: 8, region: "West", abbr: "NOVA", sportsDbName: "Villanova Wildcats" },
  { id: "west-9", name: "Utah St.", seed: 9, region: "West", abbr: "USU", sportsDbName: "Utah State Aggies" },
  { id: "west-10", name: "Missouri", seed: 10, region: "West", abbr: "MIZ", sportsDbName: "Missouri Tigers" },
  {
    id: "west-11", name: "Texas / NC State", seed: 11, region: "West", abbr: "FF",
    sportsDbName: "Texas Longhorns", firstFour: true,
    firstFourTeams: ["Texas", "NC State"],
  },
  { id: "west-12", name: "High Point", seed: 12, region: "West", abbr: "HPU", sportsDbName: "High Point Panthers" },
  { id: "west-13", name: "Hawaii", seed: 13, region: "West", abbr: "HAW", sportsDbName: "Hawaii Rainbow Warriors" },
  { id: "west-14", name: "Kennesaw St.", seed: 14, region: "West", abbr: "KSU", sportsDbName: "Kennesaw State Owls" },
  { id: "west-15", name: "Queens", seed: 15, region: "West", abbr: "QU", sportsDbName: "Queens Royals" },
  { id: "west-16", name: "LIU", seed: 16, region: "West", abbr: "LIU", sportsDbName: "LIU Sharks" },

  // === MIDWEST REGION ===
  { id: "midwest-1", name: "Michigan", seed: 1, region: "Midwest", abbr: "MICH", sportsDbName: "Michigan Wolverines" },
  { id: "midwest-2", name: "Iowa State", seed: 2, region: "Midwest", abbr: "ISU", sportsDbName: "Iowa State Cyclones" },
  { id: "midwest-3", name: "Virginia", seed: 3, region: "Midwest", abbr: "UVA", sportsDbName: "Virginia Cavaliers" },
  { id: "midwest-4", name: "Alabama", seed: 4, region: "Midwest", abbr: "BAMA", sportsDbName: "Alabama Crimson Tide" },
  { id: "midwest-5", name: "Texas Tech", seed: 5, region: "Midwest", abbr: "TTU", sportsDbName: "Texas Tech Red Raiders" },
  { id: "midwest-6", name: "Tennessee", seed: 6, region: "Midwest", abbr: "TENN", sportsDbName: "Tennessee Volunteers" },
  { id: "midwest-7", name: "Kentucky", seed: 7, region: "Midwest", abbr: "UK", sportsDbName: "Kentucky Wildcats" },
  { id: "midwest-8", name: "Georgia", seed: 8, region: "Midwest", abbr: "UGA", sportsDbName: "Georgia Bulldogs" },
  { id: "midwest-9", name: "Saint Louis", seed: 9, region: "Midwest", abbr: "SLU", sportsDbName: "Saint Louis Billikens" },
  { id: "midwest-10", name: "Santa Clara", seed: 10, region: "Midwest", abbr: "SCU", sportsDbName: "Santa Clara Broncos" },
  {
    id: "midwest-11", name: "Miami (OH) / SMU", seed: 11, region: "Midwest", abbr: "FF",
    sportsDbName: "Miami (OH) RedHawks", firstFour: true,
    firstFourTeams: ["Miami (OH)", "SMU"],
  },
  { id: "midwest-12", name: "Akron", seed: 12, region: "Midwest", abbr: "AKR", sportsDbName: "Akron Zips" },
  { id: "midwest-13", name: "Hofstra", seed: 13, region: "Midwest", abbr: "HOF", sportsDbName: "Hofstra Pride" },
  { id: "midwest-14", name: "Wright St.", seed: 14, region: "Midwest", abbr: "WSU", sportsDbName: "Wright State Raiders" },
  { id: "midwest-15", name: "Tennessee St.", seed: 15, region: "Midwest", abbr: "TSU", sportsDbName: "Tennessee State Tigers" },
  {
    id: "midwest-16", name: "UMBC / Howard", seed: 16, region: "Midwest", abbr: "FF",
    sportsDbName: "UMBC Retrievers", firstFour: true,
    firstFourTeams: ["UMBC", "Howard"],
  },
];

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
