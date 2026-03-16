import { cn } from "../lib/utils";
import AuctionTab from "./AuctionTab";
import Rosters from "./Rosters";
import Tracker from "./Tracker";

const TABS = [
  { id: "auction", label: "AUCTION" },
  { id: "rosters", label: "ROSTERS" },
  { id: "tracker", label: "TRACKER" },
];

export default function Auction({
  gameState,
  updateState,
  currentTeam,
  auction,
  sounds,
  logos,
  rosters,
  scores,
  liveScores,
}) {
  return (
    <div className="space-y-4 py-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => updateState({ auctionTab: tab.id })}
            className={cn(
              "px-4 py-2 font-display text-sm tracking-wider transition-colors cursor-pointer",
              gameState.auctionTab === tab.id
                ? "text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {gameState.auctionTab === "auction" && (
        <AuctionTab
          gameState={gameState}
          updateState={updateState}
          currentTeam={currentTeam}
          auction={auction}
          sounds={sounds}
          logos={logos}
        />
      )}
      {gameState.auctionTab === "rosters" && (
        <Rosters
          gameState={gameState}
          rosters={rosters}
          scores={scores}
          logos={logos}
        />
      )}
      {gameState.auctionTab === "tracker" && (
        <Tracker
          gameState={gameState}
          updateState={updateState}
          sounds={sounds}
          logos={logos}
          liveScores={liveScores}
        />
      )}
    </div>
  );
}
