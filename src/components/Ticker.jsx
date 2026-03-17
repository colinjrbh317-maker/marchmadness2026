import { Marquee } from "@/components/ui/marquee";

export default function Ticker({ messages }) {
  const duration = `${Math.max(20, messages.length * 8)}s`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-10 bg-gray-900 border-t border-border overflow-hidden flex items-center pointer-events-none">
      <Marquee
        pauseOnHover={false}
        className="[--gap:0rem] p-0"
        style={{ "--duration": duration }}
      >
        {messages.map((msg, i) => (
          <span
            key={i}
            className="whitespace-nowrap font-body text-sm text-white tracking-wide px-4"
          >
            {msg}
            <span className="px-4 opacity-50">{"//"}</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
