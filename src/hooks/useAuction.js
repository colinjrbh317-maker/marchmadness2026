import { useCallback } from "react";
import { TEAMS } from "../data/teams";

const REGION_ORDER = ["East", "South", "West", "Midwest"];

export function useAuction(gameState, updateState) {
  const getCurrentTeam = useCallback(() => {
    if (gameState.seedOrder.length === 0) return null;
    const seed = gameState.seedOrder[gameState.currentSeedIndex];
    const region = REGION_ORDER[gameState.currentRegionIndex];
    if (!seed || !region) return null;
    return TEAMS.find((t) => t.seed === seed && t.region === region) || null;
  }, [gameState.seedOrder, gameState.currentSeedIndex, gameState.currentRegionIndex]);

  const selectBidder = useCallback((playerId) => {
    updateState({ currentBidder: playerId });
  }, [updateState]);

  const setBidAmount = useCallback((amount) => {
    updateState({ currentBid: amount });
  }, [updateState]);

  const getMaxBid = useCallback((playerId) => {
    const budget = gameState.budgets[playerId] || 0;
    // Count unsold teams remaining (not owned by anyone)
    const totalUnsold = TEAMS.filter((t) => !gameState.ownership[t.id]).length;
    // Player must reserve $1 for each remaining team after this one
    // But only if there are teams left that SOMEONE needs to buy
    // Simple: max bid = budget - (0) since other players can buy remaining teams
    // Actually the rule is: player can't bid so much that they can't afford $1 min on future teams
    // But since OTHER players can buy, the only constraint is budget >= bid amount
    return budget;
  }, [gameState.budgets, gameState.ownership]);

  const isValidBid = useCallback((playerId, amount) => {
    if (!playerId || !amount || amount < 1) return false;
    const budget = gameState.budgets[playerId] || 0;
    return amount <= budget;
  }, [gameState.budgets]);

  const confirmSale = useCallback(() => {
    const team = getCurrentTeam();
    if (!team || !gameState.currentBidder || gameState.currentBid < 1) return;
    if (!isValidBid(gameState.currentBidder, gameState.currentBid)) return;

    const teamId = team.id;
    const playerId = gameState.currentBidder;
    const amount = gameState.currentBid;

    // Save undo info
    const lastSale = {
      teamId,
      playerId,
      amount,
      prevSeedIndex: gameState.currentSeedIndex,
      prevRegionIndex: gameState.currentRegionIndex,
    };

    // Calculate next position
    let nextSeedIndex = gameState.currentSeedIndex;
    let nextRegionIndex = gameState.currentRegionIndex;
    let nextPhase = "bidding";

    if (nextRegionIndex < 3) {
      nextRegionIndex++;
    } else if (nextSeedIndex < 15) {
      nextSeedIndex++;
      nextRegionIndex = 0;
    } else {
      nextPhase = "complete";
    }

    updateState({
      ownership: { ...gameState.ownership, [teamId]: playerId },
      prices: { ...gameState.prices, [teamId]: amount },
      budgets: {
        ...gameState.budgets,
        [playerId]: gameState.budgets[playerId] - amount,
      },
      currentSeedIndex: nextSeedIndex,
      currentRegionIndex: nextRegionIndex,
      currentBid: 0,
      currentBidder: null,
      auctionPhase: nextPhase,
      lastSale,
    });
  }, [gameState, getCurrentTeam, isValidBid, updateState]);

  const undoLastSale = useCallback(() => {
    const sale = gameState.lastSale;
    if (!sale) return;

    const newOwnership = { ...gameState.ownership };
    delete newOwnership[sale.teamId];

    const newPrices = { ...gameState.prices };
    delete newPrices[sale.teamId];

    updateState({
      ownership: newOwnership,
      prices: newPrices,
      budgets: {
        ...gameState.budgets,
        [sale.playerId]: gameState.budgets[sale.playerId] + sale.amount,
      },
      currentSeedIndex: sale.prevSeedIndex,
      currentRegionIndex: sale.prevRegionIndex,
      currentBid: 0,
      currentBidder: null,
      auctionPhase: "bidding",
      lastSale: null,
    });
  }, [gameState, updateState]);

  return {
    getCurrentTeam,
    selectBidder,
    setBidAmount,
    getMaxBid,
    isValidBid,
    confirmSale,
    undoLastSale,
  };
}
