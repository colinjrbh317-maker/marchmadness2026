import { useState, useMemo, useEffect, useRef } from "react";
import { TEAMS, getR64Opponent, getTeamsBySeed } from "../data/teams";
import { SEED_COLORS, PLAYER_COLORS } from "../data/constants";
import TeamLogo from "./TeamLogo";
import { cn } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const BID_AMOUNTS = [1, 5, 10, 20, 50, 100];
const REGION_ORDER = ["East", "South", "West", "Midwest"];

export default function AuctionTab({
  gameState,
  updateState,
  currentTeam,
  auction,
  sounds,
}) {
  const [showDrawOrder, setShowDrawOrder] = useState(false);
  const prevSeedRef = useRef(null);
  const { selectBidder, setBidAmount, confirmSale, undoLastSale, skipSeed, quickSale, isValidBid, getMaxBid } = auction;

  // Seed reveal animation trigger
  const currentSeed = gameState.seedOrder[gameState.currentSeedIndex];
  useEffect(() => {
    if (currentSeed && currentSeed !== prevSeedRef.current) {
      prevSeedRef.current = currentSeed;
      if (currentSeed <= 2) {
        sounds.playDrumRoll();
      } else {
        sounds.playWhoosh();
      }
    }
  }, [currentSeed, sounds]);

  // Matchup: R64 opponent
  const opponent = useMemo(() => {
    if (!currentTeam) return null;
    return getR64Opponent(currentTeam);
  }, [currentTeam]);

  // Seed sidebar data
  const sidebarSeeds = useMemo(() => {
    return gameState.seedOrder.map((seed, idx) => {
      const teams = getTeamsBySeed(seed);
      const soldCount = teams.filter((t) => gameState.ownership[t.id]).length;
      return { seed, index: idx, teams, soldCount };
    });
  }, [gameState.seedOrder, gameState.ownership]);

  // Expanded seed matchups
  const expandedMatchups = useMemo(() => {
    if (!currentSeed) return [];
    const oppSeed = 17 - currentSeed;
    return REGION_ORDER.map((region) => {
      const team = TEAMS.find((t) => t.seed === currentSeed && t.region === region);
      const opp = TEAMS.find((t) => t.seed === oppSeed && t.region === region);
      return { region, team, opp };
    });
  }, [currentSeed]);

  if (!currentTeam || gameState.auctionPhase !== "bidding") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <h2 className="text-4xl font-display text-red-700">AUCTION COMPLETE</h2>
      </div>
    );
  }

  const canConfirm =
    gameState.currentBidder &&
    gameState.currentBid >= 1 &&
    isValidBid(gameState.currentBidder, gameState.currentBid);

  return (
    <div className="flex gap-4">
      {/* Main auction area */}
      <div className="flex-1 space-y-4">
        {/* Seed reveal */}
        <div className="text-center">
          <div
            key={currentSeed}
            className="inline-block animate-[seed-reveal_0.4s_ease-out]"
          >
            <AnimatedShinyText
              className="text-8xl font-display animate-[glow-pulse_2s_ease-in-out_infinite]"
              shimmerWidth={200}
              style={{ color: SEED_COLORS[currentSeed] }}
            >
              {currentSeed}
            </AnimatedShinyText>
          </div>
          <div className="text-sm text-gray-500 font-body">
            SEED {currentSeed} -- {gameState.currentRegionIndex + 1} of 4
          </div>
        </div>

        {/* Team on block */}
        <Card className="bg-gray-50 border-2 border-border rounded-lg p-0 relative overflow-hidden ring-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <TeamLogo team={currentTeam} ownership={gameState.ownership} size={48} />
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white p-0"
                    style={{ backgroundColor: SEED_COLORS[currentTeam.seed], borderColor: SEED_COLORS[currentTeam.seed] }}
                  >
                    {currentTeam.seed}
                  </Badge>
                  <h3 className="text-4xl font-display text-gray-900 tracking-wide">
                    {gameState.teamNameOverrides[currentTeam.id] || currentTeam.name}
                  </h3>
                </div>
                <div className="text-sm text-gray-500 font-body">{currentTeam.region} Region</div>
              </div>
            </div>

            {/* First Four label */}
            {currentTeam.firstFour && (
              <div className="mt-2 text-xs text-gray-500 font-body italic bg-white/50 rounded px-2 py-1">
                Owner receives whichever team wins the play-in game
              </div>
            )}

            {/* Matchup preview */}
            {opponent && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-gray-500 font-body">Round of 64 opponent</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white p-0"
                    style={{ backgroundColor: SEED_COLORS[opponent.seed], borderColor: SEED_COLORS[opponent.seed] }}
                  >
                    {opponent.seed}
                  </Badge>
                  <span className="text-sm font-body text-gray-900">
                    {gameState.teamNameOverrides[opponent.id] || opponent.name}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <BorderBeam
            colorFrom="#d44427"
            colorTo="#d4442740"
            size={80}
            duration={8}
            borderWidth={2}
          />
        </Card>

        {/* Bidder selection */}
        <div className="grid grid-cols-4 gap-2">
          {gameState.players.map((player) => {
            const budget = gameState.budgets[player.id];
            const isSelected = gameState.currentBidder === player.id;
            const cantAfford = budget < 1;
            return (
              <button
                key={player.id}
                onClick={() => {
                  if (!cantAfford) {
                    selectBidder(player.id);
                    sounds.playCashRegister();
                  }
                }}
                disabled={cantAfford}
                className={cn(
                  "p-4 rounded border-2 transition-all cursor-pointer font-display text-2xl",
                  isSelected
                    ? "border-current bg-current/10"
                    : "border-border bg-gray-50 hover:border-current/50",
                  cantAfford && "opacity-30 cursor-not-allowed"
                )}
                style={{ color: player.color }}
              >
                {player.name}
                <div className="text-xs font-body mt-0.5" style={{ color: player.color + "99" }}>
                  ${budget}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bid amount */}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {BID_AMOUNTS.map((amt) => {
              const selected = gameState.currentBid === amt;
              const tooMuch =
                gameState.currentBidder &&
                amt > (gameState.budgets[gameState.currentBidder] || 0);
              return (
                <button
                  key={amt}
                  onClick={() => !tooMuch && setBidAmount(amt)}
                  disabled={tooMuch}
                  className={cn(
                    "px-6 py-3 rounded font-body text-lg font-bold transition-all cursor-pointer",
                    selected
                      ? "bg-red-700 text-white"
                      : "bg-gray-50 border border-border text-gray-900 hover:border-red-700/50",
                    tooMuch && "opacity-20 cursor-not-allowed"
                  )}
                >
                  ${amt}
                </button>
              );
            })}
            {/* Custom bid input */}
            <input
              type="number"
              min="1"
              max={gameState.currentBidder ? getMaxBid(gameState.currentBidder) : 200}
              value={gameState.currentBid || ""}
              onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
              placeholder="$"
              className="w-20 px-3 py-2 bg-gray-50 border border-border rounded font-body text-sm text-gray-900 outline-none focus:border-red-700"
            />
          </div>
        </div>

        {/* Confirm + Undo */}
        <div className="flex gap-3">
          {canConfirm ? (
            <PulsatingButton
              onClick={() => {
                confirmSale();
                sounds.playGavel();
              }}
              pulseColor="#d44427"
              className="flex-1 py-5 rounded font-display text-3xl tracking-wider bg-red-700 text-white hover:brightness-110"
            >
              SOLD -- NEXT TEAM
            </PulsatingButton>
          ) : (
            <button
              disabled
              className="flex-1 py-5 rounded font-display text-3xl tracking-wider transition-all bg-gray-50 text-gray-500 border border-border cursor-not-allowed"
            >
              SOLD -- NEXT TEAM
            </button>
          )}
          <button
            onClick={undoLastSale}
            disabled={!gameState.lastSale}
            className={cn(
              "px-4 py-3 rounded font-body text-sm border transition-all cursor-pointer",
              gameState.lastSale
                ? "border-border text-gray-900 hover:border-red-700"
                : "border-gray-200 text-gray-300 cursor-not-allowed"
            )}
          >
            UNDO
          </button>
          <button
            onClick={() => {
              quickSale();
              sounds.playGavel();
            }}
            className="px-4 py-3 rounded font-body text-sm border border-border text-gray-900 hover:border-green-600 hover:text-green-700 transition-all cursor-pointer"
          >
            $1 RANDOM
          </button>
          {gameState.currentRegionIndex === 0 && (
            <button
              onClick={() => {
                skipSeed();
                sounds.playWhoosh();
              }}
              className="px-4 py-3 rounded font-body text-sm border border-border text-gray-900 hover:border-amber-600 hover:text-amber-700 transition-all cursor-pointer"
            >
              SKIP SEED
            </button>
          )}
        </div>

        {/* Budget bars */}
        <div className="space-y-1.5">
          {gameState.players.map((player) => {
            const budget = gameState.budgets[player.id];
            const pct = (budget / 200) * 100;
            return (
              <div key={player.id} className="flex items-center gap-2">
                <span
                  className="text-xs font-body w-16 text-right"
                  style={{ color: player.color }}
                >
                  {player.name}
                </span>
                <Progress
                  value={pct}
                  className="flex-1 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-background [&_[data-slot=progress-track]]:rounded-full [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-[var(--player-color)]"
                  style={{ "--player-color": player.color }}
                />
                <span className="text-xs font-body text-gray-500 w-10">${budget}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seed sidebar toggle + sidebar */}
      <div className="flex-shrink-0 flex flex-col items-end">
        <button
          onClick={() => setShowDrawOrder(!showDrawOrder)}
          className="px-3 py-1 rounded border border-border text-xs font-body text-gray-500 cursor-pointer hover:border-red-700/50 transition-all mb-2"
        >
          {showDrawOrder ? "Hide Order" : "Show Order"}
        </button>
        {showDrawOrder && (
          <div className="w-48 space-y-1">
            <h4 className="font-display text-sm text-gray-500 tracking-wide mb-2">DRAW ORDER</h4>
            {sidebarSeeds.map(({ seed, index, soldCount }) => {
              const isCurrent = index === gameState.currentSeedIndex;
              const isDone = index < gameState.currentSeedIndex;
              const isExpanded = isCurrent;
              return (
                <div key={seed}>
                  <div
                    className={cn(
                      "flex items-center justify-between px-2 py-1 rounded text-xs font-body",
                      isCurrent && "bg-gray-50 border border-red-700/50",
                      isDone && "opacity-30"
                    )}
                  >
                    <span
                      className="font-bold"
                      style={{ color: SEED_COLORS[seed] }}
                    >
                      SEED {seed}
                    </span>
                    <span className="text-gray-500">
                      {isDone ? "4/4" : isCurrent ? `${soldCount}/4` : "0/4"}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="ml-2 mt-1 space-y-0.5 mb-2">
                      {expandedMatchups.map(({ region, team, opp }) => (
                        <div key={region} className="text-[10px] font-body text-gray-500 flex gap-1">
                          <span className="text-gray-400 w-8">{region.slice(0, 1)}</span>
                          <span className={cn(
                            team && gameState.ownership[team.id] ? "line-through opacity-50" : "text-gray-900"
                          )}>
                            ({seed}) {team?.abbr || "?"}
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span>({17 - seed}) {opp?.abbr || "?"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
