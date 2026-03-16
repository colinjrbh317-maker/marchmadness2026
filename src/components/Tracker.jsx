import { TEAMS, REGIONS } from "../data/teams";
import { SEED_COLORS, ROUND_NAMES, PLAYER_COLORS } from "../data/constants";
import TeamLogo from "./TeamLogo";
import { cn } from "../lib/utils";

const ROUNDS = [1, 2, 3, 4, 5, 6];

export default function Tracker({ gameState, updateState, sounds, logos, liveScores }) {
  const handleToggleRound = (teamId, round) => {
    const current = gameState.roundResults[teamId] || 0;
    let newRound;
    if (current === round) {
      // Toggle off: go back to previous round
      newRound = round - 1;
    } else {
      // Set to this round
      newRound = round;
    }

    const newResults = { ...gameState.roundResults };
    if (newRound <= 0) {
      delete newResults[teamId];
    } else {
      newResults[teamId] = newRound;
    }

    // Play upset sound if low seed advances past R64
    const team = TEAMS.find((t) => t.id === teamId);
    if (team && team.seed >= 10 && newRound > current && newRound >= 1) {
      sounds.playCrowdCheer();
    }

    updateState({ roundResults: newResults });
  };

  // Group teams by region, sorted by seed
  const teamsByRegion = REGIONS.reduce((acc, region) => {
    acc[region] = TEAMS.filter((t) => t.region === region).sort((a, b) => a.seed - b.seed);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Sync Scores button */}
      {liveScores && (
        <div className="flex items-center gap-3">
          <button
            onClick={liveScores.syncScores}
            disabled={liveScores.syncing}
            className="px-4 py-2 bg-surface border border-accent/30 rounded font-display text-sm text-accent tracking-wider hover:border-accent transition-all cursor-pointer disabled:opacity-50"
          >
            {liveScores.syncing ? "SYNCING..." : "SYNC SCORES"}
          </button>
          {liveScores.syncError && (
            <span className="text-xs font-body text-red-400">{liveScores.syncError}</span>
          )}
          {liveScores.syncResults && (
            <div className="flex-1 bg-surface border border-accent/20 rounded p-3">
              <div className="text-xs font-body text-text mb-2">
                Found {liveScores.syncResults.games.length} results via {liveScores.syncResults.source}:
              </div>
              {liveScores.syncResults.games.map((g, i) => (
                <div key={i} className="text-xs font-body text-text-muted">
                  {g.winner.name} beat {g.loser.name} ({g.score})
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={liveScores.applySyncResults}
                  className="px-3 py-1 bg-accent text-background text-xs font-body rounded cursor-pointer"
                >
                  APPLY
                </button>
                <button
                  onClick={liveScores.dismissSync}
                  className="px-3 py-1 border border-border text-text-muted text-xs font-body rounded cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {REGIONS.map((region) => (
        <div key={region}>
          <h3 className="font-display text-lg text-accent tracking-wide mb-2">
            {region.toUpperCase()}
          </h3>
          <div className="space-y-0.5">
            {teamsByRegion[region].map((team) => {
              const owner = gameState.ownership[team.id];
              const currentRound = gameState.roundResults[team.id] || 0;
              const displayName = gameState.teamNameOverrides[team.id] || team.name;

              return (
                <div
                  key={team.id}
                  className="flex items-center gap-2 py-1 px-2 rounded bg-surface/50 text-xs font-body"
                >
                  <TeamLogo team={team} logos={logos} ownership={gameState.ownership} size={16} />
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-background flex-shrink-0"
                    style={{ backgroundColor: SEED_COLORS[team.seed] }}
                  >
                    {team.seed}
                  </span>
                  <span className="text-text w-32 truncate">{displayName}</span>

                  {/* Owner dot */}
                  {owner ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PLAYER_COLORS[owner] }}
                      title={gameState.players.find((p) => p.id === owner)?.name}
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 flex-shrink-0" />
                  )}

                  {/* Round toggles */}
                  <div className="flex gap-0.5 ml-auto">
                    {ROUNDS.map((round) => {
                      const isActive = currentRound >= round;
                      const isOwned = !!owner;
                      return (
                        <button
                          key={round}
                          onClick={() => isOwned && handleToggleRound(team.id, round)}
                          disabled={!isOwned}
                          className={cn(
                            "w-7 h-5 rounded text-[9px] font-bold transition-all cursor-pointer",
                            isActive
                              ? "text-background"
                              : "bg-background text-text-muted border border-border",
                            !isOwned && "opacity-20 cursor-not-allowed"
                          )}
                          style={
                            isActive
                              ? { backgroundColor: owner ? PLAYER_COLORS[owner] : "#555" }
                              : undefined
                          }
                        >
                          {ROUND_NAMES[round]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
