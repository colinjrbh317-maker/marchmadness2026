import { useMemo } from "react";
import { ROUND_POINTS } from "../data/constants";
import { TEAMS } from "../data/teams";

export function useScoring(gameState) {
  const scores = useMemo(() => {
    const result = { colin: 0, james: 0, luke: 0, donald: 0 };
    for (const [teamId, round] of Object.entries(gameState.roundResults)) {
      const owner = gameState.ownership[teamId];
      if (owner && result[owner] !== undefined) {
        for (let r = 1; r <= round; r++) {
          result[owner] += ROUND_POINTS[r] || 0;
        }
      }
    }
    return result;
  }, [gameState.roundResults, gameState.ownership]);

  const rosters = useMemo(() => {
    const result = { colin: [], james: [], luke: [], donald: [] };
    for (const [teamId, playerId] of Object.entries(gameState.ownership)) {
      const team = TEAMS.find((t) => t.id === teamId);
      if (team && result[playerId]) {
        result[playerId].push({
          ...team,
          price: gameState.prices[teamId] || 0,
          roundReached: gameState.roundResults[teamId] || 0,
        });
      }
    }
    // Sort each roster by seed
    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => a.seed - b.seed);
    }
    return result;
  }, [gameState.ownership, gameState.prices, gameState.roundResults]);

  const standings = useMemo(() => {
    return gameState.players
      .map((p) => ({
        ...p,
        points: scores[p.id] || 0,
        budget: gameState.budgets[p.id] || 0,
        teamCount: rosters[p.id]?.length || 0,
        spent: 200 - (gameState.budgets[p.id] || 0),
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.budget - a.budget;
      });
  }, [gameState.players, scores, gameState.budgets, rosters]);

  return { scores, rosters, standings };
}
