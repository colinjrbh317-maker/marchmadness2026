import { useState, useMemo } from "react";
import { createInitialState, ROUND_POINTS } from "./data/constants";
import { TEAMS } from "./data/teams";
import { loadSavedState, usePersistence } from "./hooks/usePersistence";
import { useAuction } from "./hooks/useAuction";
import { useScoring } from "./hooks/useScoring";
import { useSoundEffects } from "./hooks/useSoundEffects";
import { useLiveScores } from "./hooks/useLiveScores";
import NavBar from "./components/NavBar";
import Setup from "./components/Setup";
import Auction from "./components/Auction";
import Bracket from "./components/Bracket";
import Scoreboard from "./components/Scoreboard";
import Predictions from "./components/Predictions";
import Ticker from "./components/Ticker";
import { usePredictions } from "./hooks/usePredictions";

function App() {
  const [gameState, setGameState] = useState(() => {
    return loadSavedState() || createInitialState();
  });

  const updateState = (updates) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  };

  const { exportState, importState, resetState } = usePersistence(gameState, setGameState);
  const auction = useAuction(gameState, updateState);
  const { scores, rosters, standings } = useScoring(gameState);
  const sounds = useSoundEffects(gameState.muted);
  const liveScores = useLiveScores(gameState, updateState);
  const predictionsData = usePredictions();

  // Current team being auctioned
  const currentTeam = useMemo(() => {
    if (gameState.seedOrder.length === 0) return null;
    const seed = gameState.seedOrder[gameState.currentSeedIndex];
    const regions = ["East", "South", "West", "Midwest"];
    const region = regions[gameState.currentRegionIndex];
    if (!seed || !region) return null;
    return TEAMS.find((t) => t.seed === seed && t.region === region) || null;
  }, [gameState.seedOrder, gameState.currentSeedIndex, gameState.currentRegionIndex]);

  // Ticker messages
  const tickerMessages = useMemo(() => {
    const msgs = [];
    const sold = Object.keys(gameState.ownership).length;

    if (gameState.auctionPhase === "pre") {
      msgs.push("MARCH MADNESS AUCTION DRAFT 2026");
      msgs.push(`${64 - sold} teams available -- $200 per player`);
      msgs.push("Seeds drawn randomly -- 4 teams per seed before next draw");
    } else if (gameState.auctionPhase === "bidding") {
      if (sold > 0) {
        const lastTeamId = Object.keys(gameState.ownership)[sold - 1];
        const lastTeam = TEAMS.find((t) => t.id === lastTeamId);
        const lastOwner = gameState.players.find((p) => p.id === gameState.ownership[lastTeamId]);
        if (lastTeam && lastOwner) {
          msgs.push(`${lastTeam.name} sold to ${lastOwner.name} for $${gameState.prices[lastTeamId]}`);
        }
      }

      if (standings.length > 0) {
        const budgetLeader = standings.reduce((a, b) => (a.budget > b.budget ? a : b));
        msgs.push(`${budgetLeader.name} has the most remaining -- $${budgetLeader.budget} left`);

        if (standings[0].points > 0) {
          msgs.push(`${standings[0].name} leads with ${standings[0].points} points`);
        }

        const mostTeams = standings.reduce((a, b) => (a.teamCount > b.teamCount ? a : b));
        if (mostTeams.teamCount > 0) {
          msgs.push(`${mostTeams.name} owns the most teams -- ${mostTeams.teamCount}`);
        }

        for (const p of standings) {
          if (p.budget <= 10 && p.budget > 0) {
            msgs.push(`${p.name} is running low -- $${p.budget} remaining`);
          }
        }
      }

      msgs.push(`${64 - sold} teams remaining`);
    } else if (gameState.auctionPhase === "complete") {
      msgs.push("AUCTION COMPLETE -- All 64 teams sold");
      for (const p of standings) {
        msgs.push(`${p.name}: ${p.teamCount} teams, ${p.points} pts, $${p.budget} remaining`);
      }
    }

    return msgs.length > 0 ? msgs : ["MARCH MADNESS AUCTION DRAFT 2026"];
  }, [gameState, standings]);

  const renderScreen = () => {
    switch (gameState.screen) {
      case "setup":
        return <Setup gameState={gameState} updateState={updateState} />;
      case "auction":
        return (
          <Auction
            gameState={gameState}
            updateState={updateState}
            currentTeam={currentTeam}
            auction={auction}
            sounds={sounds}
            rosters={rosters}
            scores={scores}
            liveScores={liveScores}
          />
        );
      case "bracket":
        return <Bracket gameState={gameState} />;
      case "scoreboard":
        return (
          <Scoreboard
            gameState={gameState}
            standings={standings}
            rosters={rosters}
          />
        );
      case "predictions":
        return (
          <Predictions
            predictions={predictionsData.predictions}
            valueBets={predictionsData.valueBets}
            bonusPicks={predictionsData.bonusPicks}
            loading={predictionsData.loading}
            lastUpdated={predictionsData.lastUpdated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-10">
      <NavBar
        screen={gameState.screen}
        onNavigate={(screen) => updateState({ screen })}
        muted={gameState.muted}
        onToggleMute={() => updateState({ muted: !gameState.muted })}
        onExport={exportState}
        onImport={importState}
        auctionPhase={gameState.auctionPhase}
      />
      <main className="flex-1 w-full mx-auto px-8" style={{ maxWidth: "100%", paddingTop: "48px" }}>
        {renderScreen()}
      </main>
      <Ticker messages={tickerMessages} />
    </div>
  );
}

export default App;
