import { useEffect, useRef, useState } from "react";
import { MOCK_TERMINAL_LINES, type TerminalLine } from "@/lib/sandboxes/mock-data";

const lineColor: Record<TerminalLine["level"], string> = {
  stdout: "text-white/65",
  stderr: "text-[#ff9b01]",
  command: "text-[#7fb6ff]",
  system: "text-white/35",
};

export function SandboxTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>(MOCK_TERMINAL_LINES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const next: TerminalLine[] = [
      ...lines,
      { id: `cmd-${Date.now()}`, level: "command", text: trimmed },
      {
        id: `sys-${Date.now() + 1}`,
        level: "system",
        text: "Mocked output · backend not yet connected",
      },
    ];
    setLines(next);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[4px] bg-[#222528]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-[1.55]">
        {lines.map((line) => (
          <div key={line.id} className={`whitespace-pre-wrap break-words ${lineColor[line.level]}`}>
            {line.level === "command" ? <span className="mr-2 text-white/40">▸</span> : null}
            {line.text}
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-white/10 px-4 py-2 font-mono text-xs"
      >
        <span className="text-white/40">▸</span>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Run a command…"
          className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
