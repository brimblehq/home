import { createFileRoute } from "@tanstack/react-router";
import { Terminal } from "@phosphor-icons/react";

export const Route = createFileRoute("/sandboxes/$sandboxId/terminal")({
  staleTime: 60_000,
  preloadStaleTime: 60_000,
  component: SandboxTerminalPanel,
});

function SandboxTerminalPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[4px] border-[0.5px] border-dashed border-dash-border-soft py-16">
      <Terminal size={40} weight="fill" className="text-dash-text-faded/50" />
      <p className="text-sm text-dash-text-faded">Terminal is coming soon.</p>
    </div>
  );
}
