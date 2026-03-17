import { useCallback } from "react";
import { TEAMS } from "../data/teams";

export function useAuction(gameState, updateState) {
  const getCurrentTeam = useCallback(() => {
    if (gameState.teamOrder.length === 0) return null;
    const teamId = gameState.teamOrder[gameState.currentTeamIndex];
    if (!teamId) return null;
    return TEAMS.find((t) => t.id === teamId) || null;
  }, [gameState.teamOrder, gameState.currentTeamIndex]);

  const selectBidder = useCallback((playerId) => {
    updateState({ currentBidder: playerId });
  }, [updateState]);

  const setBidAmount = useCallback((amount) => {
    updateState({ currentBid: amount });
  }, [updateState]);

  const getMaxBid = useCallback((playerId) => {
    return gameState.budgets[playerId] || 0;
  }, [gameState.budgets]);

  const isValidBid = useCallback((playerId, amount) => {
    if (!playerId || !amount || amount < 1) return false;
    const budget = gameState.budgets[playerId] || 0;
    return amount <= budget;
  }, [gameState.budgets]);

  const advanceTeam = (currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= gameState.teamOrder.length) {
      return { currentTeamIndex: nextIndex, auctionPhase: "complete" };
    }
    return { currentTeamIndex: nextIndex, auctionPhase: "bidding" };
  };

  const confirmSale = useCallback(() => {
    const team = getCurrentTeam();
    if (!team || !gameState.currentBidder || gameState.currentBid < 1) return;
    if (!isValidBid(gameState.currentBidder, gameState.currentBid)) return;

    const teamId = team.id;
    const playerId = gameState.currentBidder;
    const amount = gameState.currentBid;

    const lastSale = {
      teamId,
      playerId,
      amount,
      prevTeamIndex: gameState.currentTeamIndex,
    };

    const next = advanceTeam(gameState.currentTeamIndex);

    updateState({
      ownership: { ...gameState.ownership, [teamId]: playerId },
      prices: { ...gameState.prices, [teamId]: amount },
      budgets: {
        ...gameState.budgets,
        [playerId]: gameState.budgets[playerId] - amount,
      },
      currentTeamIndex: next.currentTeamIndex,
      currentBid: 0,
      currentBidder: null,
      auctionPhase: next.auctionPhase,
      lastSale,
    });
  }, [gameState, getCurrentTeam, isValidBid, updateState]);

  const quickSale = useCallback(() => {
    const team = getCurrentTeam();
    if (!team) return;

    const eligible = gameState.players.filter((p) => gameState.budgets[p.id] >= 1);
    if (eligible.length === 0) return;

    const player = eligible[Math.floor(Math.random() * eligible.length)];
    const teamId = team.id;

    const lastSale = {
      teamId,
      playerId: player.id,
      amount: 1,
      prevTeamIndex: gameState.currentTeamIndex,
    };

    const next = advanceTeam(gameState.currentTeamIndex);

    updateState({
      ownership: { ...gameState.ownership, [teamId]: player.id },
      prices: { ...gameState.prices, [teamId]: 1 },
      budgets: {
        ...gameState.budgets,
        [player.id]: gameState.budgets[player.id] - 1,
      },
      currentTeamIndex: next.currentTeamIndex,
      currentBid: 0,
      currentBidder: null,
      auctionPhase: next.auctionPhase,
      lastSale,
    });
  }, [gameState, getCurrentTeam, updateState]);

  const skipTeam = useCallback(() => {
    if (gameState.teamOrder.length === 0) return;

    const newOrder = [...gameState.teamOrder];
    const [skipped] = newOrder.splice(gameState.currentTeamIndex, 1);
    newOrder.push(skipped);

    updateState({
      teamOrder: newOrder,
      currentBid: 0,
      currentBidder: null,
    });
  }, [gameState.teamOrder, gameState.currentTeamIndex, updateState]);

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
      currentTeamIndex: sale.prevTeamIndex,
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
    skipTeam,
    quickSale,
  };
}
