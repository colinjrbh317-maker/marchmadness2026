import { useState } from "react";
import { TEAMS } from "../data/teams";
import TeamLogo from "./TeamLogo";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

const SUB_TABS = [
  { id: "predictions", label: "ALL GAMES" },
  { id: "value", label: "VALUE BETS" },
  { id: "bonus", label: "BONUS PICKS" },
];

function findTeam(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return TEAMS.find(
    (t) =>
      t.name.toLowerCase() === lower ||
      t.abbr.toLowerCase() === lower ||
      lower.includes(t.name.toLowerCase()) ||
      t.name.toLowerCase().includes(lower)
  );
}

function EdgeBadge({ edge }) {
  const pct = typeof edge === "number" ? edge : 0;
  const absPct = Math.abs(pct);
  let color = "bg-gray-100 text-gray-600";
  if (absPct >= 5) color = "bg-green-100 text-green-800";
  else if (absPct >= 3) color = "bg-yellow-100 text-yellow-800";
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-body font-medium", color)}>
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function WinProbBar({ prob, teamName }) {
  const pct = Math.round(prob * 100);
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full rounded bg-red-700/80 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-body text-gray-700 w-10 text-right">{pct}%</span>
    </div>
  );
}

function ConfidenceBadge({ confidence }) {
  if (!confidence) return null;
  const lower = String(confidence).toLowerCase();
  let color = "bg-gray-100 text-gray-600";
  if (lower === "high") color = "bg-green-100 text-green-800";
  else if (lower === "medium") color = "bg-yellow-100 text-yellow-800";
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-body font-medium", color)}>
      {confidence}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl font-display text-gray-300 mb-4">PICKS</div>
      <p className="font-body text-gray-500 text-sm max-w-md">
        Run the prediction pipeline to see picks. The model will analyze matchups, find value bets,
        and rank bonus opportunities.
      </p>
      <p className="font-body text-gray-400 text-xs mt-3">
        Expected files: /data/predictions.json, /data/value_bets.json, /data/bonus_picks.json
      </p>
    </div>
  );
}

function PredictionsTable({ predictions }) {
  if (!predictions.length) return <EmptyState />;

  // Sort by game_time then by edge descending
  const sorted = [...predictions].sort((a, b) => {
    const timeA = a.game_time || "";
    const timeB = b.game_time || "";
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return (Math.abs(b.edge || 0)) - (Math.abs(a.edge || 0));
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-display tracking-wider">MATCHUP</TableHead>
          <TableHead className="font-display tracking-wider">WIN PROB</TableHead>
          <TableHead className="font-display tracking-wider text-center">MODEL SPREAD</TableHead>
          <TableHead className="font-display tracking-wider text-center">MARKET SPREAD</TableHead>
          <TableHead className="font-display tracking-wider text-center">MONEYLINE</TableHead>
          <TableHead className="font-display tracking-wider text-center">EDGE</TableHead>
          <TableHead className="font-display tracking-wider">PICK</TableHead>
          <TableHead className="font-display tracking-wider text-center">KELLY %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((game, i) => {
          const favTeam = findTeam(game.favorite || game.team1);
          const dogTeam = findTeam(game.underdog || game.team2);
          return (
            <TableRow key={game.game_id || i}>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    {favTeam && <TeamLogo team={favTeam} size={20} />}
                    <span className="font-body text-sm font-medium">
                      {favTeam ? `(${favTeam.seed}) ${favTeam.name}` : game.favorite || game.team1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dogTeam && <TeamLogo team={dogTeam} size={20} />}
                    <span className="font-body text-sm text-gray-600">
                      {dogTeam ? `(${dogTeam.seed}) ${dogTeam.name}` : game.underdog || game.team2}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <WinProbBar
                  prob={game.win_prob || game.favorite_win_prob || 0.5}
                  teamName={game.favorite || game.team1}
                />
              </TableCell>
              <TableCell className="text-center font-body text-sm">
                {game.model_spread != null ? (game.model_spread > 0 ? "+" : "") + game.model_spread.toFixed(1) : "-"}
              </TableCell>
              <TableCell className="text-center font-body text-sm">
                {game.market_spread != null ? (game.market_spread > 0 ? "+" : "") + game.market_spread.toFixed(1) : "-"}
              </TableCell>
              <TableCell className="text-center font-body text-sm text-gray-600">
                {game.moneyline || "-"}
              </TableCell>
              <TableCell className="text-center">
                <EdgeBadge edge={game.edge || 0} />
              </TableCell>
              <TableCell>
                <span className="font-body text-sm font-medium">
                  {game.recommended_bet || game.pick || "-"}
                </span>
              </TableCell>
              <TableCell className="text-center font-body text-sm">
                {game.kelly_pct != null ? game.kelly_pct.toFixed(1) + "%" : "-"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ValueBetsPanel({ valueBets }) {
  if (!valueBets.length) return <EmptyState />;

  const sorted = [...valueBets].sort((a, b) => Math.abs(b.edge || 0) - Math.abs(a.edge || 0));

  return (
    <div className="grid gap-3">
      {sorted.map((bet, i) => {
        const team = findTeam(bet.team || bet.pick);
        return (
          <Card key={bet.game_id || i}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {team && <TeamLogo team={team} size={28} />}
                  <div>
                    <div className="font-body text-sm font-medium">
                      {bet.pick || bet.team || "Unknown"}
                    </div>
                    <div className="font-body text-xs text-gray-500">
                      {bet.matchup || bet.game || ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-body text-xs text-gray-500">EDGE</div>
                    <EdgeBadge edge={bet.edge || 0} />
                  </div>
                  <div className="text-center">
                    <div className="font-body text-xs text-gray-500">KELLY</div>
                    <div className="font-body text-sm font-medium">
                      {bet.kelly_pct != null ? bet.kelly_pct.toFixed(1) + "%" : "-"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-body text-xs text-gray-500">BET AMT</div>
                    <div className="font-body text-sm font-medium">
                      {bet.kelly_amount != null ? "$" + bet.kelly_amount.toFixed(0) : "-"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-body text-xs text-gray-500">CONFIDENCE</div>
                    <ConfidenceBadge confidence={bet.confidence} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function BonusPicksPanel({ bonusPicks }) {
  if (!bonusPicks.length) return <EmptyState />;

  const sorted = [...bonusPicks].sort(
    (a, b) => (b.conversion_score || 0) - (a.conversion_score || 0)
  );

  return (
    <div className="grid gap-3">
      {sorted.map((pick, i) => {
        const team = findTeam(pick.team || pick.underdog);
        return (
          <Card key={pick.game_id || i}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-700 text-white font-display text-sm">
                    {i + 1}
                  </div>
                  {team && <TeamLogo team={team} size={28} />}
                  <div>
                    <div className="font-body text-sm font-medium">
                      {pick.team || pick.underdog || "Unknown"}
                    </div>
                    <div className="font-body text-xs text-gray-500">
                      {pick.matchup || pick.game || ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-body text-xs text-gray-500">CONV SCORE</div>
                    <div className="font-body text-sm font-medium">
                      {pick.conversion_score != null ? pick.conversion_score.toFixed(0) : "-"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-body text-xs text-gray-500">ODDS</div>
                    <div className="font-body text-sm font-medium text-green-700">
                      {pick.best_odds || pick.underdog_odds || "-"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-body text-xs text-gray-500">CONFIDENCE</div>
                    <ConfidenceBadge confidence={pick.confidence} />
                  </div>
                </div>
              </div>
              {pick.guidance && (
                <div className="mt-3 px-3 py-2 bg-gray-50 rounded font-body text-xs text-gray-700">
                  {pick.guidance}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Predictions({ predictions, valueBets, bonusPicks, loading, lastUpdated }) {
  const [activeTab, setActiveTab] = useState("predictions");

  const hasPredictions = predictions.length > 0;
  const hasValueBets = valueBets.length > 0;
  const hasBonusPicks = bonusPicks.length > 0;
  const hasData = hasPredictions || hasValueBets || hasBonusPicks;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display tracking-wider text-gray-900">MODEL PICKS</h1>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="font-body text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {loading && (
            <span className="font-body text-xs text-gray-400 animate-pulse">Loading...</span>
          )}
        </div>
      </div>

      {hasData && (
        <div className="flex items-center gap-1 mb-6">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 font-display text-sm tracking-wider transition-colors cursor-pointer rounded",
                activeTab === tab.id
                  ? "bg-red-700 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {tab.label}
              {tab.id === "value" && hasValueBets && (
                <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded">
                  {valueBets.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === "predictions" && <PredictionsTable predictions={predictions} />}
      {activeTab === "value" && <ValueBetsPanel valueBets={valueBets} />}
      {activeTab === "bonus" && <BonusPicksPanel bonusPicks={bonusPicks} />}
    </div>
  );
}
