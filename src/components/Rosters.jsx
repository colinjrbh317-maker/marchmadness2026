import { SEED_COLORS, ROUND_NAMES, ROUND_POINTS } from "../data/constants";
import TeamLogo from "./TeamLogo";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";

function PlayerBudgetBar({ budget, color }) {
  const pct = (budget / 200) * 100;
  return (
    <Progress
      value={pct}
      className="gap-0 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-gray-200 [&_[data-slot=progress-track]]:rounded-full [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-[var(--player-color)]"
      style={{ "--player-color": color }}
    />
  );
}

export default function Rosters({ gameState, rosters, scores }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {gameState.players.map((player) => {
        const teams = rosters[player.id] || [];
        const budget = gameState.budgets[player.id];
        const spent = 200 - budget;
        const points = scores[player.id] || 0;

        return (
          <Card
            key={player.id}
            className="bg-gray-50 ring-0 py-0 gap-0 border"
            style={{
              borderColor: player.color + "40",
              borderLeftColor: player.color,
              borderLeftWidth: "3px",
            }}
          >
            <CardHeader className="px-4 pt-4 pb-0 gap-0">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl tracking-wide" style={{ color: player.color }}>
                  {player.name}
                </h3>
                <div className="text-right">
                  <div className="text-lg font-display" style={{ color: player.color }}>
                    {points > 0 ? (
                      <>
                        <NumberTicker
                          value={points}
                          className="text-lg font-display !text-inherit"
                          style={{ color: player.color }}
                        />{" "}
                        PTS
                      </>
                    ) : (
                      "0 PTS"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 text-xs font-body text-gray-500 mt-2 mb-3">
                <span>{teams.length} teams</span>
                <span>${spent} spent</span>
                <span>${budget} left</span>
              </div>

              {/* Budget bar */}
              <PlayerBudgetBar budget={budget} color={player.color} />
            </CardHeader>

            <CardContent className="px-4 pt-3 pb-4">
              {/* Team list */}
              <div className="space-y-1">
                {teams.length === 0 ? (
                  <div className="text-xs text-gray-400 font-body italic">No teams yet</div>
                ) : (
                  teams.map((team) => {
                    let teamPts = 0;
                    for (let r = 1; r <= team.roundReached; r++) {
                      teamPts += ROUND_POINTS[r] || 0;
                    }
                    return (
                      <div key={team.id} className="flex items-center gap-2 text-sm font-semibold font-body">
                        <TeamLogo team={team} ownership={gameState.ownership} size={16} />
                        <Badge
                          variant="default"
                          className="w-4 h-4 min-w-4 rounded-full px-0 py-0 text-[8px] font-bold text-white flex items-center justify-center flex-shrink-0 border-transparent"
                          style={{ backgroundColor: SEED_COLORS[team.seed] }}
                        >
                          {team.seed}
                        </Badge>
                        <span className="text-gray-900 flex-1 truncate">
                          {gameState.teamNameOverrides[team.id] || team.name}
                        </span>
                        <span className="text-gray-500">${team.price}</span>
                        {team.roundReached > 0 && (
                          <span className="text-red-700 text-[10px]">+{teamPts}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
