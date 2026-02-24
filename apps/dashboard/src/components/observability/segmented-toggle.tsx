export function SegmentedToggle({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center rounded-[4px] border-[0.5px] border-dash-border p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-[3px] px-3 py-1 text-xs font-medium transition-colors ${
            opt === value
              ? "bg-dash-bg-elevated text-dash-text-strong"
              : "text-dash-text-faded hover:text-dash-text-body"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
