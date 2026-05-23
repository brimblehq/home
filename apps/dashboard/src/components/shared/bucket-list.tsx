import { useState, useRef, useEffect } from "react";
import { MoreVertical, Database } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SearchFilterBar } from "./search-filter-bar";
import { FolderTrashIcon } from "./folder-trash-icon";
import { WarningModal } from "./warning-modal";

export interface Bucket {
  id: string;
  name: string;
  projectId?: string;
  region?: string;
  createdAt: string;
  objectCount?: number;
}

interface BucketMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

function BucketActionsMenu({ items }: { items: BucketMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="text-dash-text-faded transition-colors hover:text-dash-text-strong">
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[160px] overflow-clip rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg py-1 shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
          {items.map((item, index) => {
            const showDivider = Boolean(item.danger) && index > 0;
            return (
              <div key={item.id}>
                {showDivider ? <hr className="my-1 border-dash-border-soft" /> : null}
                <button
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-dash-bg-elevated ${
                    item.danger ? "text-red-500" : "text-dash-text-body"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BucketList({
  buckets,
  searchQuery: searchQueryProp,
  onSearchQueryChange,
  searchLoading = false,
  onDeleteBucket,
}: {
  buckets: Bucket[];
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  searchLoading?: boolean;
  onDeleteBucket?: (bucket: Bucket) => Promise<void>;
}) {
  const [searchQueryInternal, setSearchQueryInternal] = useState("");
  const [deletingBucket, setDeletingBucket] = useState<Bucket | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  
  const searchQuery = searchQueryProp ?? searchQueryInternal;
  const setSearchQuery = onSearchQueryChange ?? setSearchQueryInternal;

  const filtered = buckets.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

  function actionsFor(bucket: Bucket) {
    const items: BucketMenuItem[] = [];

    items.push({
      id: "delete",
      label: "Delete bucket",
      icon: <FolderTrashIcon className="size-3.5" />,
      danger: true,
      onClick: () => {
        setDeleteConfirmName("");
        setDeletingBucket(bucket);
      },
    });

    return { items };
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <SearchFilterBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search buckets"
          loading={searchLoading}
          className="flex-1"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-[4px] bg-dash-bg-elevated/40">
          <div className="flex size-8 items-center justify-center rounded-full bg-dash-bg-elevated text-dash-text-faded">
            <Database className="size-4" />
          </div>
          <span className="text-sm text-dash-text-faded">{buckets.length === 0 ? "No buckets yet" : "No buckets found"}</span>
        </div>
      )}

      {/* Buckets */}
      {filtered.length > 0 && (
        <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border">
          <table className="w-full border-collapse">
            <tbody>
              {filtered.map((bucket, i) => {
                const actions = actionsFor(bucket);
                return (
                  <tr
                    key={bucket.id}
                    className={`h-[68px] transition-colors hover:bg-dash-bg-elevated ${
                      i !== filtered.length - 1 ? "border-b-[0.5px] border-dash-border" : ""
                    }`}
                  >
                    <td className="py-2 pl-3.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Database className="size-4 text-dash-text-faded" />
                          <Link to={`/buckets/${bucket.id}`} className="text-sm font-medium tracking-[-0.084px] text-dash-text-body hover:text-[#3c6ce7] hover:underline">
                            {bucket.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-dash-text-faded">Region: {bucket.region || "Global"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="w-auto py-2 sm:w-[140px]">
                      <span className="text-sm font-light leading-5 tracking-[-0.02px] text-dash-text-body">
                        {bucket.objectCount ?? 0} {(bucket.objectCount ?? 0) === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="w-[180px] py-2">
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-sm tracking-[-0.084px] text-dash-text-body">Created</span>
                        <span className="text-sm font-light leading-[1.3] text-dash-text-extra-faded">{bucket.createdAt}</span>
                      </div>
                    </td>
                    <td className="w-10 pr-3.5 text-right">
                      <BucketActionsMenu {...actions} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <WarningModal
        open={Boolean(deletingBucket)}
        onOpenChange={(open) => {
          if (!open) setDeletingBucket(null);
        }}
        title="Delete this bucket?"
        description={`This action cannot be undone. All objects inside ${deletingBucket?.name} will be permanently deleted.`}
        confirmLabel="Delete bucket"
        cancelLabel="Cancel"
        confirmDisabled={deleteConfirmName !== deletingBucket?.name || deleting}
        onConfirm={async () => {
          if (deleting || !deletingBucket || !onDeleteBucket) return;
          try {
            setDeleting(true);
            await onDeleteBucket(deletingBucket);
            setDeletingBucket(null);
          } finally {
            setDeleting(false);
          }
        }}
      >
        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm leading-5 text-dash-text-faded">
            Type <span className="font-medium text-dash-text-strong">{deletingBucket?.name}</span> to confirm
          </label>
          <input
            type="text"
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder={deletingBucket?.name}
            className="input-base input-focus-red w-full px-3 py-2.5 text-sm leading-6 text-dash-text-strong placeholder:text-[#9ca3af]"
          />
        </div>
      </WarningModal>
    </div>
  );
}
