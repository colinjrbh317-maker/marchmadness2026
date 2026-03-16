import { useState } from "react";
import { SEED_COLORS, ROUND_POINTS } from "../data/constants";
import TeamLogo from "./TeamLogo";

export default function Scoreboard({ gameState, standings, rosters, logos }) {
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  return (
    <div className="space-y-4 py-4">
      <h2 className="text-3xl font-display text-accent tracking-wider text-center">
        STANDINGS
      </h2>
      <div className="text-center text-xs font-body text-text-muted">
        Tiebreaker: most cash remaining
      </div>

      <div className="space-y-2">
        {standings.map((player, idx) => {
          const rank = idx + 1;
          const isExpanded = expandedPlayer === player.id;
          const teams = rosters[player.id] || [];

          return (
            <div key={player.id}>
              <button
                onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                className="w-full bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-border/80 transition-all text-left"
                style={{
                  borderLeftColor: player.color,
                  borderLeftWidth: 3,
                  backgroundColor: player.color + "08",
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <span className="text-3xl font-display text-text-muted w-10 text-center">
                    {rank}
                  </span>

                  {/* Name */}
                  <div className="flex-1">
                    <span className="text-xl font-display tracking-wide" style={{ color: player.color }}>
                      {player.name}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 text-right">
                    <div>
                      <div className="text-2xl font-display" style={{ color: player.color }}>
                        {player.points}
                      </div>
                      <div className="text-[10px] font-body text-text-muted">PTS</div>
                    </div>
                    <div>
                      <div className="text-lg font-display text-text">{player.teamCount}</div>
                      <div className="text-[10px] font-body text-text-muted">TEAMS</div>
                    </div>
                    <div>
                      <div className="text-lg font-display text-text">${player.spent}</div>
                      <div className="text-[10px] font-body text-text-muted">SPENT</div>
                    </div>
                    <div>
                      <div className="text-lg font-display text-text">${player.budget}</div>
                      <div className="text-[10px] font-body text-text-muted">LEFT</div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded team details */}
              {isExpanded && teams.length > 0 && (
                <div className="ml-14 mr-4 mt-1 mb-2 bg-background rounded border border-border/50 p-3 space-y-1">
                  {teams.map((team) => {
                    let teamPts = 0;
                    for (let r = 1; r <= team.roundReached; r++) {
                      teamPts += ROUND_POINTS[r] || 0;
                    }
                    return (
                      <div key={team.id} className="flex items-center gap-2 text-xs font-body">
                        <TeamLogo team={team} logos={logos} ownership={gameState.ownership} size={16} />
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-background flex-shrink-0"
                          style={{ backgroundColor: SEED_COLORS[team.seed] }}
                        >
                          {team.seed}
                        </span>
                        <span className="text-text flex-1 truncate">
                          {gameState.teamNameOverrides[team.id] || team.name}
                        </span>
                        <span className="text-text-muted">${team.price}</span>
                        {team.roundReached > 0 && (
                          <span className="text-accent">+{teamPts} pts</span>
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
