import { useMemo } from "react";

export default function Ticker({ messages }) {
  const tickerText = useMemo(() => {
    return messages.join("     //     ");
  }, [messages]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-10 bg-[#0a0a0a] border-t border-border overflow-hidden flex items-center">
      <div
        className="whitespace-nowrap font-body text-sm text-accent tracking-wide"
        style={{
          animation: `ticker-scroll ${Math.max(20, messages.length * 8)}s linear infinite`,
        }}
      >
        <span className="inline-block px-8">{tickerText}</span>
        <span className="inline-block px-8">{tickerText}</span>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
