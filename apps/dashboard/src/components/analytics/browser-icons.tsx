import { SiArc, SiBrave, SiFirefoxbrowser, SiOpera, SiSafari, SiSamsung, SiVivaldi } from "@icons-pack/react-simple-icons";
import { Globe } from "lucide-react";

function ChromeIcon({ className = "size-4" }: { className?: string }) {
  return <img src="/icons/chrome.svg" alt="Chrome" className={className} />;
}

function EdgeIcon({ className = "size-4" }: { className?: string }) {
  return <img src="/icons/edge.svg" alt="Microsoft Edge" className={className} />;
}

export function BrowserIcon({ name, className = "size-4" }: { name: string; className?: string }) {
  const n = (name || "").toLowerCase();
  const props = { className, color: "default" as const };

  if ((n.includes("chrome") && !n.includes("chromium")) || n.includes("crios")) return <ChromeIcon className={className} />;
  if (n.includes("edge")) return <EdgeIcon className={className} />;
  if (n.includes("firefox")) return <SiFirefoxbrowser {...props} />;
  if (n.includes("safari")) return <SiSafari {...props} />;
  if (n.includes("opera")) return <SiOpera {...props} />;
  if (n.includes("brave")) return <SiBrave {...props} />;
  if (n.includes("samsung")) return <SiSamsung {...props} />;
  if (n.includes("vivaldi")) return <SiVivaldi {...props} />;
  if (n.includes("arc")) return <SiArc {...props} />;
  return <Globe className={`${className} text-dash-text-extra-faded`} />;
}
