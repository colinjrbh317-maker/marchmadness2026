import { useState } from "react";
import { REGIONS, TEAMS } from "../data/teams";
import { getTeamsByRegion } from "../data/teams";
import { SEED_COLORS, shuffleArray } from "../data/constants";
import { cn } from "../lib/utils";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import TeamLogo from "./TeamLogo";

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
    const teamIds = TEAMS.map((t) => t.id);
    const teamOrder = shuffleArray(teamIds);
    updateState({
      teamOrder,
      currentTeamIndex: 0,
      auctionPhase: "bidding",
      screen: "auction",
    });
  };

  const getDisplayName = (team) => {
    return gameState.teamNameOverrides[team.id] || team.name;
  };

  return (
    <div className="space-y-3 py-1 px-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 min-h-[48px]">
        <h1 className="text-4xl font-display text-red-700 tracking-wider leading-none whitespace-nowrap">
          MARCH MADNESS <span className="text-gray-900">2026</span>
        </h1>

        {/* Players inline */}
        <div className="flex gap-2">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className="bg-gray-50 border border-border rounded px-3 py-1 text-center"
              style={{ borderLeftColor: player.color, borderLeftWidth: 3 }}
            >
              {editingPlayer === player.id ? (
                <Input
                  autoFocus
                  className="bg-transparent text-center font-display text-sm text-gray-900 outline-none border-b border-gray-500 w-20 h-auto rounded-none border-x-0 border-t-0 px-0 py-0 focus-visible:ring-0"
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
                  className="font-display text-sm text-gray-900 cursor-pointer hover:text-red-700 transition-colors"
                >
                  {player.name}
                </button>
              )}
              <div className="text-[10px] text-gray-500">$200</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <ShimmerButton
            onClick={handleBegin}
            shimmerColor="#d44427"
            background="rgba(212, 68, 39, 1)"
            borderRadius="6px"
            className="px-5 py-2 font-display text-lg tracking-wider text-white flex-shrink-0"
          >
            SHUFFLE AND BEGIN
          </ShimmerButton>
        </div>
      </div>

      {/* Rules bar — compact single row */}
      <Card className="bg-gray-50 border border-border rounded px-4 py-2 gap-0">
        <CardContent className="p-0">
          <div className="flex items-start gap-8 text-xs font-body text-gray-500">
            <div className="flex gap-6">
              <span>$200 per player</span>
              <span>64 teams auctioned</span>
              <span>Random team order</span>
              <span>Min bid: $1</span>
            </div>
            <div className="flex gap-4 ml-auto text-gray-400">
              <span>R64: 1pt</span>
              <span>R32: 2pt</span>
              <span>S16: 4pt</span>
              <span>E8: 8pt</span>
              <span>F4: 16pt</span>
              <span className="text-red-700 font-bold">Champ: 32pt</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Grid — 4 columns, fills remaining space */}
      <div className="grid grid-cols-4 gap-3 pb-12">
        {REGIONS.map((region) => {
          const teams = getTeamsByRegion(region);
          return (
            <Card key={region} className="bg-gray-50 border border-border rounded p-3 gap-0 py-2">
              <CardHeader className="p-0 mb-1">
                <CardTitle className="font-display text-xl text-red-700 tracking-wide">
                  {region.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-1.5 py-[2px] text-xs font-body"
                    >
                      <TeamLogo team={team} ownership={gameState.ownership} size={20} />
                      <Badge
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 px-0 py-0 border-0"
                        style={{ backgroundColor: SEED_COLORS[team.seed] }}
                      >
                        {team.seed}
                      </Badge>
                      {editingTeam === team.id ? (
                        <Input
                          autoFocus
                          className="bg-transparent text-gray-900 outline-none border-b border-gray-500 flex-1 text-xs h-auto rounded-none border-x-0 border-t-0 px-0 py-0 focus-visible:ring-0 focus-visible:border-gray-500"
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
                            "text-gray-900 cursor-pointer hover:text-red-700 transition-colors text-left truncate text-sm font-semibold",
                            team.firstFour && "italic text-gray-500"
                          )}
                        >
                          {getDisplayName(team)}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
