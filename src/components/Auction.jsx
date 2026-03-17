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
  rosters,
  scores,
  liveScores,
}) {
  return (
    <div className="space-y-2 py-1">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => updateState({ auctionTab: tab.id })}
            className={cn(
              "px-4 py-2 font-display text-sm tracking-wider transition-colors cursor-pointer",
              gameState.auctionTab === tab.id
                ? "text-red-700 border-b-2 border-red-700"
                : "text-gray-500 hover:text-gray-900"
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
        />
      )}
      {gameState.auctionTab === "rosters" && (
        <Rosters
          gameState={gameState}
          rosters={rosters}
          scores={scores}
        />
      )}
      {gameState.auctionTab === "tracker" && (
        <Tracker
          gameState={gameState}
          updateState={updateState}
          sounds={sounds}
          liveScores={liveScores}
        />
      )}
    </div>
  );
}
