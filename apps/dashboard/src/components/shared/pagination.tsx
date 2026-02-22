import { cn } from "@brimble/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

/* ─────────────────────────────────────────────
   Shared styles
   ───────────────────────────────────────────── */

const btnBase = cn(
  "inline-flex items-center justify-center rounded-[4px] text-sm font-medium transition-colors",
  "shadow-[0px_1px_2px_rgba(18,18,23,0.05)]",
  "select-none",
);

const btnOutline = cn(
  btnBase,
  "border border-dash-btn-outline-border bg-dash-btn-outline-bg text-dash-btn-outline-text",
  "hover:bg-dash-bg-elevated",
);

const btnActive = cn(
  btnBase,
  "border border-transparent bg-dash-text-strong text-dash-bg",
);

const btnDisabled = "pointer-events-none opacity-40";

const tapScale = { scale: 0.95 };

/* ─────────────────────────────────────────────
   Number-based pagination
   ───────────────────────────────────────────── */

interface NumberPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Max page buttons visible before ellipsis (default 5) */
  maxVisible?: number;
}

function getPageRange(
  current: number,
  total: number,
  max: number,
): (number | "ellipsis")[] {
  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const siblings = 1;

  // Always include first page
  pages.push(1);

  const leftBound = Math.max(2, current - siblings);
  const rightBound = Math.min(total - 1, current + siblings);

  // Left ellipsis
  if (leftBound > 2) {
    pages.push("ellipsis");
  }

  // Middle range
  for (let i = leftBound; i <= rightBound; i++) {
    pages.push(i);
  }

  // Right ellipsis
  if (rightBound < total - 1) {
    pages.push("ellipsis");
  }

  // Always include last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

export function NumberPagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
}: NumberPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages, maxVisible);
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {/* Previous */}
      <motion.button
        whileTap={isFirst ? undefined : tapScale}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        aria-label="Previous page"
        className={cn(btnOutline, "h-8 gap-1 px-2.5", isFirst && btnDisabled)}
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Prev</span>
      </motion.button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex size-8 items-center justify-center text-sm text-dash-text-faded"
            aria-hidden
          >
            &hellip;
          </span>
        ) : (
          <motion.button
            key={page}
            whileTap={tapScale}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Page ${page}`}
            className={cn(
              "size-8",
              page === currentPage ? btnActive : btnOutline,
            )}
          >
            {page}
          </motion.button>
        ),
      )}

      {/* Next */}
      <motion.button
        whileTap={isLast ? undefined : tapScale}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        aria-label="Next page"
        className={cn(btnOutline, "h-8 gap-1 px-2.5", isLast && btnDisabled)}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" />
      </motion.button>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Cursor-based pagination
   ───────────────────────────────────────────── */

interface CursorPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNext: () => void;
  onPrev: () => void;
  /** Optional center label, e.g. "Page 3" or "Showing 1–10" */
  label?: string;
}

export function CursorPagination({
  hasNextPage,
  hasPrevPage,
  onNext,
  onPrev,
  label,
}: CursorPaginationProps) {
  if (!hasNextPage && !hasPrevPage) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between">
      {/* Previous */}
      <motion.button
        whileTap={hasPrevPage ? tapScale : undefined}
        onClick={onPrev}
        disabled={!hasPrevPage}
        aria-label="Previous page"
        className={cn(
          btnOutline,
          "h-8 gap-1.5 px-3",
          !hasPrevPage && btnDisabled,
        )}
      >
        <ChevronLeft className="size-4" />
        Previous
      </motion.button>

      {/* Center label */}
      {label && (
        <span className="text-sm text-dash-text-faded">{label}</span>
      )}

      {/* Next */}
      <motion.button
        whileTap={hasNextPage ? tapScale : undefined}
        onClick={onNext}
        disabled={!hasNextPage}
        aria-label="Next page"
        className={cn(
          btnOutline,
          "h-8 gap-1.5 px-3",
          !hasNextPage && btnDisabled,
        )}
      >
        Next
        <ChevronRight className="size-4" />
      </motion.button>
    </nav>
  );
}
