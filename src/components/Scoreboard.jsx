import { useState } from "react";
import { SEED_COLORS, ROUND_POINTS } from "../data/constants";
import TeamLogo from "./TeamLogo";
import { Card, CardContent } from "./ui/card";
import { NumberTicker } from "./ui/number-ticker";
import { Badge } from "./ui/badge";

export default function Scoreboard({ gameState, standings, rosters }) {
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  return (
    <div className="space-y-4 py-4">
      <h2 className="text-3xl font-display text-red-700 tracking-wider text-center">
        STANDINGS
      </h2>
      <div className="text-center text-xs font-body text-gray-500">
        Tiebreaker: most cash remaining
      </div>

      <div className="space-y-2">
        {standings.map((player, idx) => {
          const rank = idx + 1;
          const isExpanded = expandedPlayer === player.id;
          const teams = rosters[player.id] || [];

          return (
            <div key={player.id}>
              <Card
                className="!p-0 !gap-0 cursor-pointer hover:border-gray-300 transition-all !ring-0"
                style={{
                  borderLeftColor: player.color,
                  borderLeftWidth: 3,
                  borderTop: "1px solid #e0e0e0",
                  borderRight: "1px solid #e0e0e0",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: player.color + "08",
                }}
                onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
              >
                <CardContent className="!p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <span className="text-5xl font-display text-gray-500 w-10 text-center">
                      {rank}
                    </span>

                    {/* Name */}
                    <div className="flex-1">
                      <span className="text-3xl font-display tracking-wide" style={{ color: player.color }}>
                        {player.name}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-right">
                      <div>
                        <div className="text-4xl font-display" style={{ color: player.color }}>
                          {player.points > 0 ? (
                            <NumberTicker
                              value={player.points}
                              className="!text-inherit"
                              style={{ color: player.color }}
                            />
                          ) : (
                            "0"
                          )}
                        </div>
                        <div className="text-[10px] font-body text-gray-500">PTS</div>
                      </div>
                      <div>
                        <div className="text-lg font-display text-gray-900">
                          {player.teamCount > 0 ? (
                            <NumberTicker
                              value={player.teamCount}
                              className="!text-inherit text-gray-900"
                            />
                          ) : (
                            "0"
                          )}
                        </div>
                        <div className="text-[10px] font-body text-gray-500">TEAMS</div>
                      </div>
                      <div>
                        <div className="text-lg font-display text-gray-900">
                          $
                          {player.spent > 0 ? (
                            <NumberTicker
                              value={player.spent}
                              className="!text-inherit text-gray-900"
                            />
                          ) : (
                            "0"
                          )}
                        </div>
                        <div className="text-[10px] font-body text-gray-500">SPENT</div>
                      </div>
                      <div>
                        <div className="text-lg font-display text-gray-900">
                          $
                          {player.budget > 0 ? (
                            <NumberTicker
                              value={player.budget}
                              className="!text-inherit text-gray-900"
                            />
                          ) : (
                            "0"
                          )}
                        </div>
                        <div className="text-[10px] font-body text-gray-500">LEFT</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expanded team details */}
              {isExpanded && teams.length > 0 && (
                <div className="ml-14 mr-4 mt-1 mb-2 bg-white rounded border border-gray-200 p-3 space-y-1">
                  {teams.map((team) => {
                    let teamPts = 0;
                    for (let r = 1; r <= team.roundReached; r++) {
                      teamPts += ROUND_POINTS[r] || 0;
                    }
                    return (
                      <div key={team.id} className="flex items-center gap-2 text-xs font-body">
                        <TeamLogo team={team} ownership={gameState.ownership} size={16} />
                        <Badge
                          variant="outline"
                          className="!h-4 !w-4 !p-0 !rounded-full flex items-center justify-center text-[8px] font-bold !border-0 flex-shrink-0"
                          style={{
                            backgroundColor: SEED_COLORS[team.seed],
                            color: "#ffffff",
                          }}
                        >
                          {team.seed}
                        </Badge>
                        <span className="text-gray-900 flex-1 truncate">
                          {gameState.teamNameOverrides[team.id] || team.name}
                        </span>
                        <span className="text-gray-500">${team.price}</span>
                        {team.roundReached > 0 && (
                          <span className="text-red-700">+{teamPts} pts</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
