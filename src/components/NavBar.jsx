import { useRef } from "react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { id: "setup", label: "SETUP" },
  { id: "auction", label: "AUCTION" },
  { id: "bracket", label: "BRACKET" },
  { id: "scoreboard", label: "SCORES" },
  { id: "predictions", label: "PICKS" },
];

export default function NavBar({
  screen,
  onNavigate,
  muted,
  onToggleMute,
  onExport,
  onImport,
  onReset,
  auctionPhase,
}) {
  const fileInputRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = "";
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 shadow-sm backdrop-blur border-b border-border">
      <div className="w-full px-6 h-10 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const disabled = item.id === "auction" && auctionPhase === "pre";
            return (
              <button
                key={item.id}
                onClick={() => !disabled && onNavigate(item.id)}
                disabled={disabled}
                className={cn(
                  "px-3 py-1.5 font-display text-sm tracking-wider transition-colors cursor-pointer",
                  screen === item.id
                    ? "text-red-700 border-b-2 border-red-700"
                    : "text-gray-500 hover:text-gray-900",
                  disabled && "opacity-30 cursor-not-allowed"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="px-2 py-1 text-xs font-body text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            title="Export backup"
          >
            SAVE
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-xs font-body text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            title="Import backup"
          >
            LOAD
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => {
              if (window.confirm("Reset everything? This clears all auction data.")) {
                onReset();
              }
            }}
            className="px-2 py-1 text-xs font-body text-red-600 hover:text-red-800 transition-colors cursor-pointer"
            title="Reset everything"
          >
            RESET
          </button>
          <button
            onClick={onToggleMute}
            className="px-2 py-1 text-xs font-body text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "UNMUTE" : "MUTE"}
          </button>
        </div>
      </div>
    </nav>
  );
}
