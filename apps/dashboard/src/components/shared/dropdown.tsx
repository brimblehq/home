import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export interface DropdownOption {
  id: string;
  label: string;
}

type ObjectProps = {
  value: string;
  options: DropdownOption[];
  onChange: (id: string) => void;
  renderOption?: never;
};

type StringProps = {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  renderOption?: (v: string) => string;
};

type DropdownProps = (ObjectProps | StringProps) & {
  placeholder?: string;
  className?: string;
};

export function Dropdown({
  value,
  options,
  onChange,
  placeholder,
  className,
  renderOption,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const isObject = options.length > 0 && typeof options[0] === "object";

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("scroll", updatePos, { capture: true, passive: true });
    window.addEventListener("resize", updatePos, { passive: true });
    return () => {
      window.removeEventListener("scroll", updatePos, { capture: true });
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const displayLabel = isObject
    ? (options as DropdownOption[]).find((o) => o.id === value)?.label
    : renderOption
      ? renderOption(value)
      : value;

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between input-base input-focus px-3 py-2.5 text-sm leading-6 text-dash-text-strong placeholder:text-[#9ca3af] ${className ?? ""}`}
      >
        <span className={displayLabel ? "" : "text-[#9ca3af]"}>
          {displayLabel || placeholder || "Select..."}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease }}
        >
          <ChevronDown className="size-3.5 text-dash-text-faded" />
        </motion.span>
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                data-dropdown-menu
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.2, ease }}
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  zIndex: 9999,
                  pointerEvents: "auto",
                }}
                className="max-h-[200px] overflow-y-auto overflow-x-clip rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg py-1 shadow-[0px_2px_4px_-4px_rgba(0,0,0,0.07)]"
              >
                {isObject
                  ? (options as DropdownOption[]).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          (onChange as (id: string) => void)(opt.id);
                          setOpen(false);
                        }}
                        className={`flex w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-dash-bg-elevated ${
                          opt.id === value
                            ? "font-medium text-dash-text-strong"
                            : "text-dash-text-faded"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))
                  : (options as string[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          (onChange as (v: string) => void)(opt);
                          setOpen(false);
                        }}
                        className={`flex w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-dash-bg-elevated ${
                          opt === value
                            ? "font-medium text-dash-text-strong"
                            : "text-dash-text-faded"
                        }`}
                      >
                        {renderOption ? renderOption(opt) : opt}
                      </button>
                    ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
