import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Search, Globe } from "lucide-react";
import { Dropdown } from "../../components/shared/dropdown";
import { GlossyButton } from "../../components/shared/glossy-button";
import {
  Modal,
  ModalHeader,
  ModalFooter,
  ModalCancelButton,
} from "../../components/shared/modal";
import { CursorPagination } from "../../components/shared/pagination";

export const Route = createFileRoute("/domains/buy")({
  component: BuyDomainPage,
});

/* ─── Constants ─── */

const ease = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 9;

const inputClass =
  "w-full input-base input-focus px-3 py-2.5 text-sm leading-6 text-dash-text-strong placeholder:text-[#9ca3af]";

/* ─── Types ─── */

interface DomainResult {
  tld: string;
  available: boolean;
  price: number | null;
}

/* ─── Mock TLD Catalog ─── */

const TLD_CATALOG = [
  { tld: "com", price: 12, takenChance: 0.7 },
  { tld: "dev", price: 15, takenChance: 0.3 },
  { tld: "io", price: 45, takenChance: 0.4 },
  { tld: "app", price: 16, takenChance: 0.3 },
  { tld: "ai", price: 70, takenChance: 0.6 },
  { tld: "xyz", price: 2, takenChance: 0.1 },
  { tld: "net", price: 12, takenChance: 0.5 },
  { tld: "org", price: 10, takenChance: 0.4 },
  { tld: "co", price: 30, takenChance: 0.5 },
  { tld: "me", price: 13, takenChance: 0.3 },
  { tld: "sh", price: 48, takenChance: 0.15 },
  { tld: "pro", price: 5, takenChance: 0.15 },
  { tld: "bio", price: 10, takenChance: 0.1 },
  { tld: "info", price: 5, takenChance: 0.4 },
  { tld: "software", price: 20, takenChance: 0.05 },
  { tld: "cloud", price: 23, takenChance: 0.1 },
  { tld: "studio", price: 22, takenChance: 0.1 },
  { tld: "build", price: 28, takenChance: 0.05 },
  { tld: "one", price: 22, takenChance: 0.1 },
  { tld: "tools", price: 18, takenChance: 0.05 },
  { tld: "global", price: 60, takenChance: 0.05 },
  { tld: "academy", price: 22, takenChance: 0.05 },
  { tld: "design", price: 20, takenChance: 0.2 },
  { tld: "world", price: 6, takenChance: 0.05 },
  { tld: "run", price: 7, takenChance: 0.05 },
  { tld: "codes", price: 12, takenChance: 0.05 },
  { tld: "art", price: 79, takenChance: 0.15 },
  { tld: "today", price: 3, takenChance: 0.05 },
  { tld: "digital", price: 3, takenChance: 0.05 },
  { tld: "fun", price: 5, takenChance: 0.1 },
  { tld: "ac", price: 48, takenChance: 0.1 },
  { tld: "tech", price: 50, takenChance: 0.2 },
  { tld: "engineer", price: 14, takenChance: 0.05 },
];

/* ─── Deterministic availability generator ─── */

function generateResults(baseName: string): DomainResult[] {
  return TLD_CATALOG.map(({ tld, price, takenChance }) => {
    const hash =
      (baseName + tld)
        .split("")
        .reduce((a, c) => a + c.charCodeAt(0), 0) % 100;
    const available = hash / 100 >= takenChance;
    return { tld, available, price: available ? price : null };
  });
}

/* ─── Domain Result Card ─── */

function DomainResultCard({
  baseName,
  result,
  index,
  onSelect,
}: {
  baseName: string;
  result: DomainResult;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.03 * index, ease }}
      disabled={!result.available}
      onClick={onSelect}
      className={`flex items-center justify-between rounded-[4px] border-[0.5px] border-dash-border px-3.5 py-3 text-left transition-colors ${
        result.available
          ? "hover:bg-dash-bg-elevated"
          : "cursor-default opacity-50"
      }`}
    >
      <span className="text-sm text-dash-text-body">
        {baseName}.
        <span className="font-medium text-dash-text-strong">{result.tld}</span>
      </span>
      {result.available ? (
        <span className="rounded-full bg-[#34d399]/10 px-2.5 py-0.5 text-xs font-medium text-[#34d399]">
          ${result.price}
        </span>
      ) : (
        <span className="rounded-full bg-dash-bg-elevated px-2.5 py-0.5 text-xs font-medium text-dash-text-faded">
          Taken
        </span>
      )}
    </motion.button>
  );
}

/* ─── Main Page ─── */

function BuyDomainPage() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<DomainResult | null>(
    null,
  );
  const [years, setYears] = useState(1);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginatedResults = results.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  function handleSearch() {
    const base = query.trim().toLowerCase().replace(/\.[a-z]+$/, "");
    if (!base) return;
    setSearchedQuery(base);
    setResults(generateResults(base));
    setHasSearched(true);
    setPage(0);
  }

  return (
    <div className="max-w-[1000px]">
      <div className="mb-8 flex items-center gap-4">
        <div className="hidden shrink-0 brightness-[1.02] mix-blend-multiply dark:invert dark:mix-blend-screen dark:opacity-85 sm:block">
          <img
            src="/images/televison.svg"
            alt=""
            className="size-[80px]"
          />
        </div>
        <div>
          <h2 className="text-base font-medium tracking-[-0.03px] text-dash-text-strong">
            Buy a domain
          </h2>
          <p className="mt-2 max-w-[560px] text-sm font-light leading-[1.3] text-dash-text-extra-faded">
            Search for the perfect domain name for your project. We'll check
            availability across 30+ TLDs and show you pricing instantly.
          </p>
        </div>
      </div>

      <hr className="-ml-4 mb-6 border-dash-border-soft md:-ml-10" />

      {/* Search bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dash-text-extra-faded" />
          <input
            type="text"
            placeholder="Search for a domain name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className={`${inputClass} pl-9`}
            autoFocus
          />
        </div>
        <GlossyButton
          variant="blue"
          onClick={handleSearch}
          disabled={!query.trim()}
          className="shrink-0"
        >
          Search
        </GlossyButton>
      </div>

      {/* Pre-search empty state */}
      {!hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="flex flex-col items-center justify-center py-20"
        >
          <Globe className="mb-4 size-10 text-dash-text-extra-faded opacity-40" />
          <h3 className="mb-1 text-sm font-medium text-dash-text-strong">
            Find your perfect domain
          </h3>
          <p className="max-w-[320px] text-center text-sm text-dash-text-faded">
            Type a domain name above to check availability and pricing across
            30+ TLDs.
          </p>
        </motion.div>
      )}

      {/* Results grid */}
      {hasSearched && (
        <div>
          <p className="mb-3 text-sm text-dash-text-faded">
            Showing results for{" "}
            <span className="font-medium text-dash-text-strong">
              {searchedQuery}
            </span>
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {paginatedResults.map((result, i) => (
              <DomainResultCard
                key={result.tld}
                baseName={searchedQuery}
                result={result}
                index={i}
                onSelect={() => setPurchaseTarget(result)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <CursorPagination
                hasPrevPage={page > 0}
                hasNextPage={page < totalPages - 1}
                onPrev={() => setPage((p) => p - 1)}
                onNext={() => setPage((p) => p + 1)}
                label={`Page ${page + 1} of ${totalPages}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Purchase modal */}
      <Modal
        open={!!purchaseTarget}
        onOpenChange={(open) => {
          if (!open) {
            setPurchaseTarget(null);
            setYears(1);
          }
        }}
        width={420}
      >
        <ModalHeader
          title="Purchase domain"
          description="Complete your domain purchase"
        />

        {purchaseTarget && (
          <div className="flex flex-col gap-4 px-6 py-5">
            {/* Domain + price */}
            <div className="flex items-center justify-between rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg-elevated px-4 py-3">
              <span className="text-sm font-medium text-dash-text-strong">
                {searchedQuery}.{purchaseTarget.tld}
              </span>
              <span className="text-sm font-medium text-[#34d399]">
                ${purchaseTarget.price}/yr
              </span>
            </div>

            {/* Payment method */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-dash-text-faded">
                Payment method
              </label>
              <div className="flex items-center gap-3 rounded-[4px] border-[0.5px] border-dash-border px-3.5 py-2.5">
                <div className="relative h-8 w-[45px] shrink-0 overflow-hidden rounded-[4px] bg-[radial-gradient(circle_at_84%_10%,#5a5454_0%,#383636_55%,#1f1f1f_100%)] shadow-[0px_1px_1px_rgba(0,0,0,0.16),0px_1px_0px_rgba(0,0,0,0.11)]">
                  <div className="absolute left-[5px] top-[12px] h-[7px] w-[10px] rounded-[1.5px] bg-white/10" />
                  <div className="absolute bottom-[5px] right-[5px] flex items-center gap-0.5">
                    <span className="size-[3px] rounded-full bg-[#ea4335]" />
                    <span className="size-[3px] rounded-full bg-[#fbbc05]" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-dash-text-strong">
                    Mastercard
                  </span>
                  <span className="text-xs text-dash-text-faded">
                    ending in 9594
                  </span>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-dash-text-faded">
                Duration
              </label>
              <Dropdown
                value={String(years)}
                options={Array.from({ length: 10 }, (_, i) => ({
                  id: String(i + 1),
                  label: `${i + 1} ${i + 1 === 1 ? "year" : "years"} — $${purchaseTarget.price! * (i + 1)}`,
                }))}
                onChange={(id) => setYears(Number(id))}
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t-[0.5px] border-dash-border pt-3">
              <span className="text-sm text-dash-text-faded">
                Total ({years} {years === 1 ? "year" : "years"})
              </span>
              <span className="text-base font-medium text-dash-text-strong">
                ${purchaseTarget.price! * years}
              </span>
            </div>
          </div>
        )}

        <ModalFooter>
          <ModalCancelButton />
          <GlossyButton
            variant="blue"
            onClick={() => {
              console.log(
                "Purchase:",
                searchedQuery + "." + purchaseTarget?.tld,
              );
              setPurchaseTarget(null);
            }}
          >
            Purchase domain
          </GlossyButton>
        </ModalFooter>
      </Modal>
    </div>
  );
}
