import { useState } from "react";
import { SEED_COLORS, PLAYER_COLORS } from "../data/constants";

export default function TeamLogo({ team, ownership, size = 24 }) {
  const [failed, setFailed] = useState(false);
  const owner = ownership?.[team.id];
  const bgColor = owner ? PLAYER_COLORS[owner] : SEED_COLORS[team.seed];

  const logoUrl = team.espnId
    ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`
    : null;

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={team.abbr}
        width={size}
        height={size}
        className="object-contain flex-shrink-0"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: size * 0.4,
      }}
    >
      {team.seed}
    </div>
  );
}
