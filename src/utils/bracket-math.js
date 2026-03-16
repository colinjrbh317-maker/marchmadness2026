// SVG Bracket geometry calculations
// 4 regions converge to center: East(TL), South(BL), West(TR), Midwest(BR)

export const SVG_W = 1400;
export const SVG_H = 880;
export const SLOT_W = 120;
export const SLOT_H = 20;
export const SLOT_GAP = 2;

const REGION_MARGIN = 10;
const ROUND_GAP = 16;
const MATCHUP_GAP = 4; // gap between the 2 teams in a matchup

// Calculate Y positions for round 1 slots (16 per region, 8 matchups)
function getR1Ys(regionTop, regionHeight) {
  const totalMatchups = 8;
  const matchupH = SLOT_H * 2 + MATCHUP_GAP;
  const totalH = totalMatchups * matchupH + (totalMatchups - 1) * SLOT_GAP * 2;
  const startY = regionTop + (regionHeight - totalH) / 2;

  const ys = [];
  for (let m = 0; m < totalMatchups; m++) {
    const baseY = startY + m * (matchupH + SLOT_GAP * 2);
    ys.push(baseY);                        // top team of matchup
    ys.push(baseY + SLOT_H + MATCHUP_GAP); // bottom team of matchup
  }
  return ys;
}

// For later rounds, center between parent positions
function centerBetween(y1, y2) {
  return (y1 + y2) / 2;
}

// Build all slot positions for a left-flowing region (East/South)
function buildLeftRegion(regionTop, regionHeight) {
  const r1Ys = getR1Ys(regionTop, regionHeight);
  const rounds = [[], [], [], [], []]; // R1(16), R2(8), R3(4), R4(2), Regional Final(1)

  // Round 1: 16 slots
  for (let i = 0; i < 16; i++) {
    rounds[0].push({
      x: REGION_MARGIN,
      y: r1Ys[i],
    });
  }

  // Round 2: 8 slots (center between each pair of R1)
  for (let i = 0; i < 8; i++) {
    rounds[1].push({
      x: REGION_MARGIN + SLOT_W + ROUND_GAP,
      y: centerBetween(rounds[0][i * 2].y, rounds[0][i * 2 + 1].y),
    });
  }

  // Round 3: 4 slots
  for (let i = 0; i < 4; i++) {
    rounds[2].push({
      x: REGION_MARGIN + (SLOT_W + ROUND_GAP) * 2,
      y: centerBetween(rounds[1][i * 2].y, rounds[1][i * 2 + 1].y),
    });
  }

  // Round 4: 2 slots
  for (let i = 0; i < 2; i++) {
    rounds[3].push({
      x: REGION_MARGIN + (SLOT_W + ROUND_GAP) * 3,
      y: centerBetween(rounds[2][i * 2].y, rounds[2][i * 2 + 1].y),
    });
  }

  // Elite Eight: 1 slot
  rounds[4].push({
    x: REGION_MARGIN + (SLOT_W + ROUND_GAP) * 4,
    y: centerBetween(rounds[3][0].y, rounds[3][1].y),
  });

  return rounds;
}

// Build right-flowing region (West/Midwest) - mirror of left
function buildRightRegion(regionTop, regionHeight) {
  const left = buildLeftRegion(regionTop, regionHeight);
  return left.map((round) =>
    round.map((slot) => ({
      x: SVG_W - REGION_MARGIN - SLOT_W - (slot.x - REGION_MARGIN),
      y: slot.y,
    }))
  );
}

// Generate all positions
export function generateBracketPositions() {
  const halfH = SVG_H / 2;

  const east = buildLeftRegion(0, halfH);           // top-left
  const south = buildLeftRegion(halfH, halfH);       // bottom-left
  const west = buildRightRegion(0, halfH);           // top-right
  const midwest = buildRightRegion(halfH, halfH);    // bottom-right

  // Final Four: 4 slots at center
  const ffX = SVG_W / 2 - SLOT_W / 2;
  const finalFour = [
    { x: ffX - 70, y: halfH - SLOT_H - 30 },  // East winner (top-left)
    { x: ffX - 70, y: halfH + 10 },             // South winner (bottom-left)
    { x: ffX + 70, y: halfH - SLOT_H - 30 },   // West winner (top-right)
    { x: ffX + 70, y: halfH + 10 },             // Midwest winner (bottom-right)
  ];

  // Championship: 2 semifinal winners + 1 champion
  const semis = [
    { x: ffX, y: halfH - SLOT_H - 10 },  // East/South winner
    { x: ffX, y: halfH - 10 + SLOT_H },   // West/Midwest winner
  ];

  const champion = {
    x: ffX,
    y: halfH - SLOT_H / 2,
  };

  return {
    regions: { East: east, South: south, West: west, Midwest: midwest },
    finalFour,
    semis,
    champion,
  };
}

// Generate connecting lines between rounds for a region
export function generateLines(rounds, isRight) {
  const lines = [];
  for (let r = 0; r < rounds.length - 1; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];
    for (let i = 0; i < nextRound.length; i++) {
      const top = currentRound[i * 2];
      const bot = currentRound[i * 2 + 1];
      const next = nextRound[i];
      if (!top || !bot || !next) continue;

      const topMidY = top.y + SLOT_H / 2;
      const botMidY = bot.y + SLOT_H / 2;
      const nextMidY = next.y + SLOT_H / 2;

      let fromX, toX;
      if (isRight) {
        fromX = top.x; // left edge of slot
        toX = next.x + SLOT_W; // right edge of next slot
      } else {
        fromX = top.x + SLOT_W; // right edge of slot
        toX = next.x; // left edge of next slot
      }

      const midX = (fromX + toX) / 2;

      // Top team line
      lines.push(`M${fromX},${topMidY} H${midX} V${nextMidY} H${toX}`);
      // Bottom team line
      lines.push(`M${fromX},${botMidY} H${midX} V${nextMidY}`);
    }
  }
  return lines;
}
