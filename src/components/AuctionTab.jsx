import { useState, useMemo } from "react";
import { TEAMS, getR64Opponent } from "../data/teams";
import { SEED_COLORS, PLAYER_COLORS } from "../data/constants";
import TeamLogo from "./TeamLogo";
import { cn } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const BID_AMOUNTS = [1, 5, 10, 20, 50, 100];

export default function AuctionTab({
  gameState,
  updateState,
  currentTeam,
  auction,
  sounds,
}) {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const { selectBidder, setBidAmount, confirmSale, undoLastSale, skipTeam, quickSale, isValidBid, getMaxBid } = auction;

  // Matchup: R64 opponent
  const opponent = useMemo(() => {
    if (!currentTeam) return null;
    return getR64Opponent(currentTeam);
  }, [currentTeam]);

  // Progress
  const sold = Object.keys(gameState.ownership).length;
  const total = gameState.teamOrder.length || 64;

  // Upcoming teams
  const upcomingTeams = useMemo(() => {
    return gameState.teamOrder
      .slice(gameState.currentTeamIndex + 1, gameState.currentTeamIndex + 11)
      .map((id) => TEAMS.find((t) => t.id === id))
      .filter(Boolean);
  }, [gameState.teamOrder, gameState.currentTeamIndex]);

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
        {/* Progress counter */}
        <div className="text-center">
          <div className="text-sm text-gray-500 font-body">
            TEAM {sold + 1} OF {total}
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

        {/* Confirm + Undo + Quick Sale + Skip */}
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
          <button
            onClick={() => {
              skipTeam();
              sounds.playWhoosh();
            }}
            className="px-4 py-3 rounded font-body text-sm border border-border text-gray-900 hover:border-amber-600 hover:text-amber-700 transition-all cursor-pointer"
          >
            SKIP
          </button>
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

      {/* Upcoming sidebar */}
      <div className="flex-shrink-0 flex flex-col items-end">
        <button
          onClick={() => setShowUpcoming(!showUpcoming)}
          className="px-3 py-1 rounded border border-border text-xs font-body text-gray-500 cursor-pointer hover:border-red-700/50 transition-all mb-2"
        >
          {showUpcoming ? "Hide Upcoming" : "Show Upcoming"}
        </button>
        {showUpcoming && (
          <div className="w-52 space-y-1">
            <h4 className="font-display text-sm text-gray-500 tracking-wide mb-2">UP NEXT</h4>
            {upcomingTeams.map((team, i) => (
              <div
                key={team.id}
                className="flex items-center gap-2 px-2 py-1 rounded text-xs font-body"
              >
                <span className="text-gray-400 w-4">{i + 1}</span>
                <Badge
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white p-0 flex-shrink-0"
                  style={{ backgroundColor: SEED_COLORS[team.seed], borderColor: SEED_COLORS[team.seed] }}
                >
                  {team.seed}
                </Badge>
                <span className="text-gray-900 truncate">
                  {gameState.teamNameOverrides[team.id] || team.name}
                </span>
                <span className="text-gray-400 ml-auto">{team.region.slice(0, 1)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
