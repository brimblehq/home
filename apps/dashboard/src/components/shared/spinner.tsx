import { cn } from "@brimble/ui";

interface SpinnerProps {
  className?: string;
  /** Size in Tailwind units — defaults to "size-4" (16px) */
  size?: string;
}

export function Spinner({ className, size = "size-4" }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn(size, "animate-spin", className)}
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-20"
      />
      <path
        d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
