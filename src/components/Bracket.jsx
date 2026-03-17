import BracketSVG from "./BracketSVG";
import { Particles } from "@/components/ui/particles";

export default function Bracket({ gameState }) {
  return (
    <div className="relative py-1 space-y-1">
      <Particles
        className="absolute inset-0 z-0"
        quantity={40}
        size={0.3}
        color="#d44427"
        staticity={70}
        ease={80}
        vx={0.02}
        vy={0.01}
      />
      <div className="relative z-10">
        <h2 className="text-3xl font-display text-red-700 tracking-wider text-center">
          2026 NCAA TOURNAMENT
        </h2>
        <BracketSVG gameState={gameState} />
      </div>
    </div>
  );
}
