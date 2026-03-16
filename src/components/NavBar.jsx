import { useRef } from "react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { id: "setup", label: "SETUP" },
  { id: "auction", label: "AUCTION" },
  { id: "bracket", label: "BRACKET" },
  { id: "scoreboard", label: "SCORES" },
];

export default function NavBar({
  screen,
  onNavigate,
  muted,
  onToggleMute,
  onExport,
  onImport,
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-[800px] mx-auto px-4 h-12 flex items-center justify-between">
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
                    ? "text-accent border-b-2 border-accent"
                    : "text-text-muted hover:text-text",
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
            className="px-2 py-1 text-xs font-body text-text-muted hover:text-text transition-colors cursor-pointer"
            title="Export backup"
          >
            SAVE
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-xs font-body text-text-muted hover:text-text transition-colors cursor-pointer"
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
            onClick={onToggleMute}
            className="px-2 py-1 text-xs font-body text-text-muted hover:text-text transition-colors cursor-pointer"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "UNMUTE" : "MUTE"}
          </button>
        </div>
      </div>
    </nav>
  );
}
