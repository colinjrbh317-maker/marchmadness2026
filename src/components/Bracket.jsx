import BracketSVG from "./BracketSVG";

export default function Bracket({ gameState }) {
  return (
    <div className="py-4 space-y-4">
      <h2 className="text-3xl font-display text-accent tracking-wider text-center">
        2026 NCAA TOURNAMENT
      </h2>
      <BracketSVG gameState={gameState} />
    </div>
  );
}
