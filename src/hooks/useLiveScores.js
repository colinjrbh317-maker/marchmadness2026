import { useState, useCallback } from "react";
import { TEAMS } from "../data/teams";

// Normalize text for comparison: expand abbreviations, strip punctuation
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\bst\./g, "state")        // "Michigan St." → "Michigan State"
    .replace(/['']/g, "")               // "Hawai'i" → "Hawaii"
    .replace(/[^a-z0-9\s()]/g, "")     // Strip remaining punctuation
    .trim();
}

// Check if API name contains our team name as a substring (normalized)
function fuzzyMatch(apiName, ourName) {
  const api = normalize(apiName);
  const our = normalize(ourName);
  if (api.includes(our)) return true;
  const words = our.split(/\s+/);
  if (words.length > 1 && words.every((w) => api.includes(w))) return true;
  return false;
}

function findTeamByApiName(apiName) {
  const apiNorm = normalize(apiName);

  // 1. Exact sportsDbName
  let match = TEAMS.find(
    (t) => t.sportsDbName && normalize(t.sportsDbName) === apiNorm
  );
  if (match) return match;

  // 2. Best fuzzy match on name — prefer longest matching name to avoid
  //    "Tennessee" matching before "Tennessee St." for "Tennessee State Tigers"
  const candidates = TEAMS.filter(
    (t) => !t.name.includes("/") && fuzzyMatch(apiName, t.name)
  );
  if (candidates.length > 0) {
    // Pick the candidate whose normalized name is longest (most specific)
    candidates.sort((a, b) => normalize(b.name).length - normalize(a.name).length);
    return candidates[0];
  }

  // 3. First Four individual team names
  match = TEAMS.find(
    (t) =>
      t.firstFourTeams &&
      t.firstFourTeams.some((ft) => fuzzyMatch(apiName, ft))
  );
  if (match) return match;

  // 4. sportsDbName fuzzy
  match = TEAMS.find((t) => t.sportsDbName && fuzzyMatch(apiName, t.sportsDbName));
  if (match) return match;

  // 5. Abbreviation initials match (e.g., "LIU" from "Long Island University Sharks")
  //    Check if abbr matches the start of the initials (ignoring mascot words)
  match = TEAMS.find((t) => {
    const abbr = t.abbr?.toLowerCase();
    if (!abbr || abbr === "ff" || abbr.length < 2) return false;
    const words = apiNorm.split(/\s+/);
    if (words.length >= abbr.length) {
      const initials = words.map((w) => w[0]).join("");
      if (initials.startsWith(abbr)) return true;
    }
    return false;
  });
  return match || null;
}

// Source 1: NCAA API
async function fetchNcaaScores() {
  const res = await fetch("https://ncaa-api.henrygd.me/scoreboard/basketball-men/d1");
  if (!res.ok) throw new Error("NCAA API failed");
  const data = await res.json();
  return parseNcaaResponse(data);
}

function parseNcaaResponse(data) {
  const games = [];
  const gamesList = data?.games || [];
  for (const g of gamesList) {
    const game = g?.game;
    if (!game) continue;
    const status = game.gameState || game.currentPeriod;
    if (status !== "final" && status !== "F") continue;

    const home = game.home;
    const away = game.away;
    if (!home || !away) continue;

    const homeScore = parseInt(home.score) || 0;
    const awayScore = parseInt(away.score) || 0;
    const winner = homeScore > awayScore ? home.names?.short || home.names?.full : away.names?.short || away.names?.full;
    const loser = homeScore > awayScore ? away.names?.short || away.names?.full : home.names?.short || home.names?.full;

    if (winner && loser) {
      games.push({ winner, loser, homeScore, awayScore });
    }
  }
  return games;
}

// Source 2: ESPN Hidden API (fetches entire tournament window: March 18 - April 8)
async function fetchEspnScores() {
  const year = new Date().getFullYear();
  const start = `${year}0318`;
  const end = `${year}0408`;
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${start}-${end}&groups=100`
  );
  if (!res.ok) throw new Error("ESPN API failed");
  const data = await res.json();
  return parseEspnResponse(data);
}

function parseEspnResponse(data) {
  const games = [];
  for (const event of data?.events || []) {
    const competition = event?.competitions?.[0];
    if (!competition) continue;
    const status = competition.status?.type?.name;
    if (status !== "STATUS_FINAL") continue;

    const competitors = competition.competitors || [];
    if (competitors.length !== 2) continue;

    const sorted = [...competitors].sort((a, b) => parseInt(b.score) - parseInt(a.score));
    const winner = sorted[0]?.team?.displayName || sorted[0]?.team?.shortDisplayName;
    const loser = sorted[1]?.team?.displayName || sorted[1]?.team?.shortDisplayName;
    const homeScore = parseInt(sorted[0].score) || 0;
    const awayScore = parseInt(sorted[1].score) || 0;

    if (winner && loser) {
      games.push({ winner, loser, homeScore: homeScore, awayScore });
    }
  }
  return games;
}

export function useLiveScores(gameState, updateState) {
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const syncScores = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncResults(null);

    let games = null;
    let source = null;

    // Try ESPN first (supports multi-day range), NCAA as fallback (today only)
    try {
      games = await fetchEspnScores();
      source = "ESPN API";
    } catch {
      try {
        games = await fetchNcaaScores();
        source = "NCAA API";
      } catch {
        setSyncError("Both APIs unavailable. Enter results manually in the Tracker.");
        setSyncing(false);
        return;
      }
    }

    if (!games || games.length === 0) {
      setSyncError("No completed tournament games found yet.");
      setSyncing(false);
      return;
    }

    // Match API results to our teams, skipping already-processed games
    const processed = new Set(gameState.processedGames || []);
    const matched = [];
    for (const game of games) {
      const winnerTeam = findTeamByApiName(game.winner);
      const loserTeam = findTeamByApiName(game.loser);

      if (winnerTeam && loserTeam) {
        const gameKey = `${winnerTeam.id}-${loserTeam.id}`;
        // Only include if both teams are in our bracket, one is owned, AND not already processed
        if (
          (gameState.ownership[winnerTeam.id] || gameState.ownership[loserTeam.id]) &&
          !processed.has(gameKey)
        ) {
          matched.push({
            winner: winnerTeam,
            loser: loserTeam,
            score: `${game.homeScore}-${game.awayScore}`,
            gameKey,
          });
        }
      }
    }

    if (matched.length === 0) {
      setSyncError(`Found ${games.length} games via ${source} but none matched our bracket teams.`);
      setSyncing(false);
      return;
    }

    setSyncResults({ games: matched, source });
    setSyncing(false);
  }, [gameState]);

  const applySyncResults = useCallback(() => {
    if (!syncResults) return;

    const newResults = { ...gameState.roundResults };
    const newProcessed = [...(gameState.processedGames || [])];
    for (const game of syncResults.games) {
      const currentRound = newResults[game.winner.id] || 0;
      // Advance winner by one round
      newResults[game.winner.id] = currentRound + 1;
      // Record this game as processed so it won't appear again
      if (game.gameKey) {
        newProcessed.push(game.gameKey);
      }
    }

    updateState({ roundResults: newResults, processedGames: newProcessed });
    setSyncResults(null);
  }, [syncResults, gameState.roundResults, gameState.processedGames, updateState]);

  const dismissSync = useCallback(() => {
    setSyncResults(null);
    setSyncError(null);
  }, []);

  return {
    syncing,
    syncResults,
    syncError,
    syncScores,
    applySyncResults,
    dismissSync,
  };
}
