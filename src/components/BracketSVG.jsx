import { useMemo, useState } from "react";
import { TEAMS, REGIONS } from "../data/teams";
import { SEED_COLORS, PLAYER_COLORS, BRACKET_ORDER } from "../data/constants";
import {
  generateBracketPositions,
  generateLines,
  SVG_W,
  SVG_H,
  SLOT_W,
  SLOT_H,
} from "../utils/bracket-math";

// Map bracket positions to teams: 8 matchups per region, each has high/low seed
function getRegionTeams(region) {
  const teams = [];
  for (const [highSeed, lowSeed] of BRACKET_ORDER) {
    const high = TEAMS.find((t) => t.region === region && t.seed === highSeed);
    const low = TEAMS.find((t) => t.region === region && t.seed === lowSeed);
    teams.push(high);
    teams.push(low);
  }
  return teams;
}

function BracketSlot({ x, y, team, gameState, onHover, isHighlighted }) {
  if (!team) {
    return (
      <rect x={x} y={y} width={SLOT_W} height={SLOT_H} rx={3}
        fill="#0a0a0a" stroke="#1e1e1e" strokeWidth={0.5} />
    );
  }

  const owner = gameState.ownership[team.id];
  const ownerColor = owner ? PLAYER_COLORS[owner] : null;
  const seedColor = SEED_COLORS[team.seed];
  const displayName = gameState.teamNameOverrides[team.id] || team.abbr;

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => onHover(team)}
      onMouseLeave={() => onHover(null)}
    >
      <rect
        x={x} y={y} width={SLOT_W} height={SLOT_H} rx={3}
        fill={ownerColor ? ownerColor + "25" : "#0a0a0a"}
        stroke={ownerColor || "#1e1e1e"}
        strokeWidth={ownerColor ? 1.5 : 0.5}
      />
      {/* Seed badge */}
      <circle
        cx={x + 10} cy={y + SLOT_H / 2} r={7}
        fill={seedColor}
      />
      <text
        x={x + 10} y={y + SLOT_H / 2 + 3.5}
        textAnchor="middle"
        fontSize={8} fontWeight="bold" fill="#080808"
        fontFamily="'Courier New', monospace"
      >
        {team.seed}
      </text>
      {/* Team name */}
      <text
        x={x + 22} y={y + SLOT_H / 2 + 3.5}
        fontSize={9} fill="#e0d8cc"
        fontFamily="'Courier New', monospace"
      >
        {displayName.slice(0, 12)}
      </text>
    </g>
  );
}

export default function BracketSVG({ gameState }) {
  const [hoveredTeam, setHoveredTeam] = useState(null);

  const positions = useMemo(() => generateBracketPositions(), []);

  // Build team arrays for each region
  const regionTeams = useMemo(() => {
    const result = {};
    for (const region of REGIONS) {
      result[region] = getRegionTeams(region);
    }
    return result;
  }, []);

  // Generate connecting lines
  const allLines = useMemo(() => {
    const lines = {};
    for (const region of REGIONS) {
      const isRight = region === "West" || region === "Midwest";
      lines[region] = generateLines(positions.regions[region], isRight);
    }
    return lines;
  }, [positions]);

  // Hover popover
  const popover = useMemo(() => {
    if (!hoveredTeam) return null;
    const owner = gameState.ownership[hoveredTeam.id];
    const price = gameState.prices[hoveredTeam.id];
    const ownerName = owner ? gameState.players.find((p) => p.id === owner)?.name : "Unsold";
    return {
      team: hoveredTeam,
      owner: ownerName,
      price: price || 0,
    };
  }, [hoveredTeam, gameState]);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full min-w-[900px]"
        style={{ background: "#080808" }}
      >
        {/* Region labels */}
        {[
          { region: "East", x: 60, y: 20 },
          { region: "South", x: 60, y: SVG_H / 2 + 20 },
          { region: "West", x: SVG_W - 60, y: 20 },
          { region: "Midwest", x: SVG_W - 80, y: SVG_H / 2 + 20 },
        ].map(({ region, x, y }) => (
          <text
            key={region}
            x={x} y={y}
            fontSize={14} fontFamily="'Bebas Neue', sans-serif"
            fill="#f97316" letterSpacing="2"
          >
            {region.toUpperCase()}
          </text>
        ))}

        {/* Connecting lines for each region */}
        {REGIONS.map((region) => (
          <g key={`lines-${region}`}>
            {allLines[region]?.map((d, i) => (
              <path
                key={i} d={d}
                fill="none" stroke="#1e1e1e" strokeWidth={1}
              />
            ))}
          </g>
        ))}

        {/* Region slots */}
        {REGIONS.map((region) => {
          const rounds = positions.regions[region];
          const teams = regionTeams[region];

          return (
            <g key={region}>
              {/* Round 1 slots (index 0, 16 teams) */}
              {rounds[0]?.map((pos, i) => (
                <BracketSlot
                  key={`${region}-r1-${i}`}
                  x={pos.x} y={pos.y}
                  team={teams[i]}
                  gameState={gameState}
                  onHover={setHoveredTeam}
                />
              ))}
              {/* Later rounds show winners (empty for now) */}
              {rounds.slice(1).map((round, roundIdx) =>
                round.map((pos, i) => (
                  <rect
                    key={`${region}-r${roundIdx + 2}-${i}`}
                    x={pos.x} y={pos.y}
                    width={SLOT_W} height={SLOT_H} rx={3}
                    fill="#0a0a0a" stroke="#1e1e1e" strokeWidth={0.5}
                  />
                ))
              )}
            </g>
          );
        })}

        {/* Final Four label */}
        <text
          x={SVG_W / 2} y={SVG_H / 2 - 50}
          textAnchor="middle"
          fontSize={16} fontFamily="'Bebas Neue', sans-serif"
          fill="#f97316" letterSpacing="3"
        >
          FINAL FOUR
        </text>

        {/* Final Four + Championship slots */}
        {positions.finalFour.map((pos, i) => (
          <rect
            key={`ff-${i}`}
            x={pos.x} y={pos.y}
            width={SLOT_W} height={SLOT_H} rx={3}
            fill="#0a0a0a" stroke="#f97316" strokeWidth={0.5} opacity={0.3}
          />
        ))}
        {positions.semis.map((pos, i) => (
          <rect
            key={`semi-${i}`}
            x={pos.x} y={pos.y}
            width={SLOT_W} height={SLOT_H} rx={3}
            fill="#0a0a0a" stroke="#f97316" strokeWidth={0.5} opacity={0.3}
          />
        ))}
        <rect
          x={positions.champion.x} y={positions.champion.y}
          width={SLOT_W} height={SLOT_H} rx={3}
          fill="#0a0a0a" stroke="#f97316" strokeWidth={1.5}
        />
        <text
          x={SVG_W / 2} y={positions.champion.y + SLOT_H + 16}
          textAnchor="middle"
          fontSize={10} fontFamily="'Bebas Neue', sans-serif"
          fill="#f97316" letterSpacing="2"
        >
          CHAMPION
        </text>
      </svg>

      {/* Hover popover */}
      {popover && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 bg-surface border border-border rounded px-3 py-2 text-xs font-body z-50 shadow-lg">
          <div className="text-text font-bold">{popover.team.name}</div>
          <div className="text-text-muted">
            Owner: {popover.owner}
            {popover.price > 0 && ` -- $${popover.price}`}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {gameState.players.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 text-xs font-body">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-text-muted">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
