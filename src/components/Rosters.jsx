import { SEED_COLORS, ROUND_NAMES, ROUND_POINTS } from "../data/constants";
import TeamLogo from "./TeamLogo";

export default function Rosters({ gameState, rosters, scores, logos }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {gameState.players.map((player) => {
        const teams = rosters[player.id] || [];
        const budget = gameState.budgets[player.id];
        const spent = 200 - budget;
        const points = scores[player.id] || 0;

        return (
          <div
            key={player.id}
            className="bg-surface border rounded-lg p-4"
            style={{ borderColor: player.color + "40", borderLeftColor: player.color, borderLeftWidth: 3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xl tracking-wide" style={{ color: player.color }}>
                {player.name}
              </h3>
              <div className="text-right">
                <div className="text-lg font-display" style={{ color: player.color }}>
                  {points} PTS
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-xs font-body text-text-muted mb-3">
              <span>{teams.length} teams</span>
              <span>${spent} spent</span>
              <span>${budget} left</span>
            </div>

            {/* Budget bar */}
            <div className="h-1.5 bg-background rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(budget / 200) * 100}%`, backgroundColor: player.color }}
              />
            </div>

            {/* Team list */}
            <div className="space-y-1">
              {teams.length === 0 ? (
                <div className="text-xs text-text-muted/50 font-body italic">No teams yet</div>
              ) : (
                teams.map((team) => {
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
                        <span className="text-accent text-[10px]">+{teamPts}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
