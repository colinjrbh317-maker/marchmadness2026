import { useState } from "react";
import { REGIONS } from "../data/teams";
import { getTeamsByRegion } from "../data/teams";
import { SEED_COLORS, shuffleArray } from "../data/constants";
import { cn } from "../lib/utils";

export default function Setup({ gameState, updateState }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);

  const handlePlayerNameChange = (playerId, newName) => {
    const players = gameState.players.map((p) =>
      p.id === playerId ? { ...p, name: newName } : p
    );
    updateState({ players });
  };

  const handleTeamNameChange = (teamId, newName) => {
    updateState({
      teamNameOverrides: {
        ...gameState.teamNameOverrides,
        [teamId]: newName,
      },
    });
  };

  const handleBegin = () => {
    const seeds = Array.from({ length: 16 }, (_, i) => i + 1);
    const seedOrder = shuffleArray(seeds);
    updateState({
      seedOrder,
      currentSeedIndex: 0,
      currentRegionIndex: 0,
      auctionPhase: "bidding",
      screen: "auction",
    });
  };

  const getDisplayName = (team) => {
    return gameState.teamNameOverrides[team.id] || team.name;
  };

  return (
    <div className="space-y-8 py-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-6xl font-display text-accent tracking-wider">
          MARCH MADNESS
        </h1>
        <h2 className="text-3xl font-display text-text tracking-wide mt-1">
          AUCTION DRAFT 2026
        </h2>
      </div>

      {/* Players */}
      <div className="space-y-3">
        <h3 className="text-xl font-display text-text tracking-wide">PLAYERS</h3>
        <div className="grid grid-cols-4 gap-3">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className="bg-surface border border-border rounded p-3 text-center"
              style={{ borderLeftColor: player.color, borderLeftWidth: 3 }}
            >
              {editingPlayer === player.id ? (
                <input
                  autoFocus
                  className="bg-transparent text-center font-display text-lg text-text outline-none border-b border-text-muted w-full"
                  defaultValue={player.name}
                  onBlur={(e) => {
                    handlePlayerNameChange(player.id, e.target.value || player.name);
                    setEditingPlayer(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.target.blur();
                  }}
                />
              ) : (
                <button
                  onClick={() => setEditingPlayer(player.id)}
                  className="font-display text-lg text-text cursor-pointer hover:text-accent transition-colors"
                >
                  {player.name}
                </button>
              )}
              <div className="text-xs text-text-muted font-body mt-1">$200</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="bg-surface border border-border rounded p-4 space-y-3">
        <h3 className="text-xl font-display text-text tracking-wide">RULES</h3>
        <div className="grid grid-cols-2 gap-4 text-sm font-body text-text-muted">
          <div>
            <p>-- Each player starts with $200</p>
            <p>-- All 64 teams go up for auction</p>
            <p>-- Seeds drawn in random order</p>
            <p>-- 4 teams per seed, then next seed</p>
            <p>-- Minimum bid: $1 per team</p>
          </div>
          <div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-text">
                  <th className="pr-4">Round</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Round of 64</td><td>1</td></tr>
                <tr><td>Round of 32</td><td>2</td></tr>
                <tr><td>Sweet 16</td><td>4</td></tr>
                <tr><td>Elite Eight</td><td>8</td></tr>
                <tr><td>Final Four</td><td>16</td></tr>
                <tr><td>Champion</td><td>32</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-text-muted font-body">
          Tiebreaker: most cash remaining. Winner takes the entire pot.
        </p>
      </div>

      {/* Team Grid by Region */}
      <div className="space-y-3">
        <h3 className="text-xl font-display text-text tracking-wide">THE BRACKET</h3>
        <div className="grid grid-cols-2 gap-4">
          {REGIONS.map((region) => {
            const teams = getTeamsByRegion(region);
            return (
              <div key={region} className="bg-surface border border-border rounded p-3">
                <h4 className="font-display text-lg text-accent tracking-wide mb-2">
                  {region.toUpperCase()}
                </h4>
                <div className="space-y-0.5">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-2 py-0.5 text-xs font-body"
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-background flex-shrink-0"
                        style={{ backgroundColor: SEED_COLORS[team.seed] }}
                      >
                        {team.seed}
                      </span>
                      {editingTeam === team.id ? (
                        <input
                          autoFocus
                          className="bg-transparent text-text outline-none border-b border-text-muted flex-1 text-xs"
                          defaultValue={getDisplayName(team)}
                          onBlur={(e) => {
                            handleTeamNameChange(team.id, e.target.value || team.name);
                            setEditingTeam(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.target.blur();
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingTeam(team.id)}
                          className={cn(
                            "text-text cursor-pointer hover:text-accent transition-colors text-left truncate",
                            team.firstFour && "italic text-text-muted"
                          )}
                        >
                          {getDisplayName(team)}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Begin Button */}
      <div className="text-center py-4">
        <button
          onClick={handleBegin}
          className="px-8 py-4 bg-accent text-background font-display text-2xl tracking-wider rounded hover:brightness-110 transition-all cursor-pointer"
        >
          DRAW SEEDS AND BEGIN
        </button>
      </div>
    </div>
  );
}
