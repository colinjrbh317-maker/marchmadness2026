import { SEED_COLORS, PLAYER_COLORS } from "../data/constants";

export default function TeamLogo({ team, logos, ownership, size = 24 }) {
  const url = logos?.[team.id];
  const owner = ownership?.[team.id];
  const bgColor = owner ? PLAYER_COLORS[owner] : SEED_COLORS[team.seed];

  if (url) {
    return (
      <img
        src={url}
        alt={team.abbr}
        width={size}
        height={size}
        className="object-contain rounded"
        loading="lazy"
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-background flex-shrink-0"
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
