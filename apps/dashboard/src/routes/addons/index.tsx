import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { SearchFilterBar } from "../../components/shared/search-filter-bar";
import { FilterDropdown } from "../../components/shared/filter-dropdown";
import { DashButton } from "../../components/shared/dash-button";
import { AddonCard } from "../../components/shared/addon-card";
import { NumberPagination } from "../../components/shared/pagination";
import type { DiscoverAddon } from "@/utils/discover-mcp";
import { mapMcpTemplateToAddon } from "@/utils/discover-mcp";
import { listMcpTemplatesServerFn } from "@/server/mcp/actions";
import type { McpServerListResult } from "@/backend/mcp";
import { parsePositivePageSearchValue } from "@/utils/workspace-route-search";

const ADDONS_PAGE_SIZE = 18;

export const Route = createFileRoute("/addons/")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  validateSearch: (search: Record<string, unknown>) => {
    const next: { page?: number } = {};
    const page = parsePositivePageSearchValue(search.page);
    if (page && page > 1) {
      next.page = page;
    }
    return next;
  },
  loaderDeps: ({ search }) => ({
    page: parsePositivePageSearchValue(search.page) ?? 1,
  }),
  loader: async ({ deps }) => {
    const page = deps.page;
    const offset = (page - 1) * ADDONS_PAGE_SIZE;
    const result = await (listMcpTemplatesServerFn as unknown as (input: {
      data?: { limit?: number; offset?: number };
    }) => Promise<McpServerListResult>)({
      data: { limit: ADDONS_PAGE_SIZE, offset },
    });

    const addons = result.servers.map(mapMcpTemplateToAddon);
    const total = result.pagination.total ?? addons.length;
    const totalPages = Math.max(1, Math.ceil(total / ADDONS_PAGE_SIZE));

    return {
      addons,
      total,
      page,
      totalPages,
      provider: result.provider,
    };
  },
  component: AddonsPage,
});

const ease = [0.16, 1, 0.3, 1] as const;


function matchesSearch(addon: DiscoverAddon, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    addon.name.toLowerCase().includes(normalized) ||
    addon.description.toLowerCase().includes(normalized)
  );
}

function AddonGrid({ items, delayOffset = 0 }: { items: DiscoverAddon[]; delayOffset?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((addon, i) => (
        <motion.div
          key={addon.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04 * (i + delayOffset), ease }}
        >
          <AddonCard addon={addon} />
        </motion.div>
      ))}
    </div>
  );
}

function AddonsPage() {
  const navigate = useNavigate({ from: "/addons/" });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const routeSearch = Route.useSearch();
  const { addons, total, page, totalPages } = Route.useLoaderData();

  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(addons.map((a) => a.category).filter(Boolean))).sort();
    return [
      { label: "All Categories", value: "all" },
      ...cats.map((c) => ({ label: c, value: c })),
    ];
  }, [addons]);

  const filteredAddons = useMemo(() => {
    let result = addons;
    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category === categoryFilter);
    }
    if (search.trim()) {
      result = result.filter((addon) => matchesSearch(addon, search));
    }
    return result;
  }, [addons, search, categoryFilter]);
  const isFiltering = search.trim().length > 0 || categoryFilter !== "all";

  return (
    <div className="px-4 py-8 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="relative overflow-clip rounded-[4px] border-[0.5px] border-dash-border-soft"
      >
        <div className="relative z-10 px-8 py-8">
          <h2 className="text-base font-medium tracking-[-0.03px] text-dash-text-strong">
            Discover MCP Servers
          </h2>
          <p className="mt-1 max-w-[560px] text-sm font-light leading-[1.3] text-dash-text-extra-faded">
            Browse deployable MCP servers from the marketplace and connect them to your Brimble
            projects.
          </p>
          <div className="mt-4">
            <DashButton size="sm" disabled>
              {total} server{total === 1 ? "" : "s"} available
            </DashButton>
          </div>
        </div>
        <img
          src="/images/addons-curve.svg"
          alt=""
          className="pointer-events-none absolute right-0 top-0 hidden h-full lg:block dark:brightness-[3]"
        />
      </motion.div>

      <div className="mt-6">
        <SearchFilterBar
          value={search}
          onChange={setSearch}
          placeholder="Search MCP servers..."
          rightSlot={
            <FilterDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              placeholder="All Categories"
              dropdownWidth={200}
              align="right"
            />
          }
        />
      </div>

      {isFiltering ? (
        <div className="mt-6">
          <p className="mb-3 text-xs text-dash-text-extra-faded">
            {filteredAddons.length} result{filteredAddons.length !== 1 ? "s" : ""}
          </p>
          {filteredAddons.length ? (
            <AddonGrid items={filteredAddons} />
          ) : (
            <div className="py-12 text-center text-sm text-dash-text-faded">
              No MCP servers match your filters.
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-medium text-dash-text-strong">Marketplace</h3>
            {addons.length ? (
              <>
                <AddonGrid items={addons} />
                <div className="mt-6 flex justify-end">
                  <NumberPagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(nextPage) => {
                      navigate({
                        to: "/addons",
                        search: {
                          ...routeSearch,
                          page: nextPage === 1 ? undefined : nextPage,
                        },
                      });
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-dash-text-faded">
                No MCP servers available right now.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
