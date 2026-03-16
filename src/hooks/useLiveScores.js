import { useState, useCallback } from "react";
import { TEAMS } from "../data/teams";

// Fuzzy match: does the API team name contain our short name?
function fuzzyMatch(apiName, ourName) {
  const api = apiName.toLowerCase();
  const our = ourName.toLowerCase();
  // Direct substring
  if (api.includes(our)) return true;
  // Handle common abbreviations
  const words = our.split(/\s+/);
  if (words.length > 1 && words.every((w) => api.includes(w))) return true;
  return false;
}

function findTeamByApiName(apiName) {
  // Try exact sportsDbName match first
  let match = TEAMS.find(
    (t) => t.sportsDbName && t.sportsDbName.toLowerCase() === apiName.toLowerCase()
  );
  if (match) return match;

  // Try fuzzy matching on name
  match = TEAMS.find((t) => fuzzyMatch(apiName, t.name));
  if (match) return match;

  // Try fuzzy on sportsDbName
  match = TEAMS.find((t) => t.sportsDbName && fuzzyMatch(apiName, t.sportsDbName));
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

// Source 2: ESPN Hidden API
async function fetchEspnScores() {
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${today}&groups=100`
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

    // Try NCAA API first
    try {
      games = await fetchNcaaScores();
      source = "NCAA API";
    } catch {
      // Try ESPN
      try {
        games = await fetchEspnScores();
        source = "ESPN API";
      } catch {
        setSyncError("Both APIs unavailable. Enter results manually in the Tracker.");
        setSyncing(false);
        return;
      }
    }

    if (!games || games.length === 0) {
      setSyncError("No completed games found today.");
      setSyncing(false);
      return;
    }

    // Match API results to our teams
    const matched = [];
    for (const game of games) {
      const winnerTeam = findTeamByApiName(game.winner);
      const loserTeam = findTeamByApiName(game.loser);

      if (winnerTeam && loserTeam) {
        // Only include if both teams are in our bracket AND one owns them
        if (gameState.ownership[winnerTeam.id] || gameState.ownership[loserTeam.id]) {
          matched.push({
            winner: winnerTeam,
            loser: loserTeam,
            score: `${game.homeScore}-${game.awayScore}`,
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
    for (const game of syncResults.games) {
      const currentRound = newResults[game.winner.id] || 0;
      // Advance winner by one round
      newResults[game.winner.id] = currentRound + 1;
    }

    updateState({ roundResults: newResults });
    setSyncResults(null);
  }, [syncResults, gameState.roundResults, updateState]);

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
