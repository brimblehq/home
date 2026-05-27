import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { hapticToast as toast } from "@/utils/haptic-toast";
import { useWorkspaceRole } from "@/contexts/workspace-role-context";
import { Plus } from "lucide-react";
import { BucketList, type Bucket } from "../../components/shared/bucket-list";
import { AddBucketModal } from "../../components/shared/add-bucket-modal";
import { BucketStatsRow } from "../../components/shared/bucket-stats-row";
import { PageHeader } from "../../components/shared/page-header";
import { GlossyButton } from "../../components/shared/glossy-button";
import { formatRelativeTime } from "@/utils/dashboard";
import { parseTextSearchValue, parseWorkspaceSearchValue, workspacePageLoaderDeps } from "@/utils/workspace-route-search";
import { invalidateActiveMatches } from "@/utils/router-invalidate";
import type { PaginatedBucketsResponse } from "@/backend/storage";
import { listBucketsServerFn, createBucketServerFn, deleteBucketServerFn, createBucketTokenServerFn } from "@/server/storage/actions";

export const Route = createFileRoute("/buckets/")({
  staleTime: 60_000,
  preloadStaleTime: 60_000,
  validateSearch: (search: Record<string, unknown>) => {
    const next: { workspace?: string; q?: string } = {};
    const workspace = parseWorkspaceSearchValue(search.workspace);
    const q = parseTextSearchValue(search.q);

    if (workspace) {
      next.workspace = workspace;
    }
    if (q) {
      next.q = q;
    }
    return next;
  },
  loaderDeps: ({ search }) => ({
    ...workspacePageLoaderDeps(search),
    q: parseTextSearchValue(search.q),
  }),
  loader: async ({ deps }) => {
    const workspace = deps.workspace;

    const buckets = await (
      listBucketsServerFn as unknown as (input: { data: { workspace?: string; q?: string } }) => Promise<PaginatedBucketsResponse>
    )({
      data: { workspace, q: deps.q },
    }).catch(
      () =>
        ({
          items: [],
          currentPage: 1,
          totalPages: 1,
        }) as PaginatedBucketsResponse,
    );

    return {
      workspace,
      bucketsResult: buckets,
    };
  },
  component: BucketsPage,
  pendingComponent: () => <div className="p-8 text-center text-sm text-gray-500">Loading buckets...</div>,
});

function mapBucketToRow(bucket: any): Bucket {
  const addedAtSource = bucket.updatedAt || bucket.createdAt || new Date().toISOString();
  return {
    id: bucket.id || bucket._id,
    name: bucket.name,
    projectId: bucket.projectId,
    region: bucket.region,
    createdAt: formatRelativeTime(addedAtSource),
    objectCount: bucket.objectCount ?? 0,
    storageUsed: bucket.storage_used ?? 0,
    quota: bucket.quota ?? 1 * 1024 * 1024 * 1024,
  };
}

function BucketsPage() {
  const { canWrite } = useWorkspaceRole();
  const router = useRouter();
  const search = Route.useSearch();
  const { bucketsResult, workspace } = Route.useLoaderData() as any;
  const [addBucketOpen, setAddBucketOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search.q ?? "");
  const [rows, setRows] = useState<Bucket[]>(() => (bucketsResult?.items || []).map(mapBucketToRow));

  const createBucket = useServerFn(createBucketServerFn as any) as (args: {
    data: { workspace?: string; name: string; region?: string; isPublic?: boolean };
  }) => Promise<any>;
  const createToken = useServerFn(createBucketTokenServerFn as any) as (args: {
    data: { workspace?: string; bucketId: string; name?: string };
  }) => Promise<any>;
  const deleteBucket = useServerFn(deleteBucketServerFn as any) as (args: {
    data: { workspace?: string; bucketId: string };
  }) => Promise<{ success: boolean }>;

  useEffect(() => {
    setRows((bucketsResult?.items || []).map(mapBucketToRow));
  }, [bucketsResult?.items]);

  useEffect(() => {
    setSearchQuery(search.q ?? "");
  }, [search.q]);

  async function handleAddBucket(data: {
    name: string;
    description: string;
    region: string;
    isPublic: boolean;
  }): Promise<{ bucket: any; token?: string }> {
    if (!canWrite) {
      throw new Error("You don't have permission to manage buckets in this workspace.");
    }

    const created = await createBucket({
      data: {
        workspace,
        name: data.name,
        region: data.region,
        isPublic: data.isPublic,
      },
    });

    const bucketId = created?.id || created?._id;
    let token: string | undefined;

    if (bucketId) {
      try {
        const tokenResult = await createToken({
          data: { workspace, bucketId: bucketId, name: "Default key" },
        });
        token = tokenResult?.data?.token || (tokenResult as any)?.token;
      } catch {
        // Token generation failed but bucket was created
      }

      setRows((prev) => [mapBucketToRow(created), ...prev]);
      invalidateActiveMatches(router);
    }

    return { bucket: created, token };
  }

  async function handleDeleteBucket(bucket: Bucket) {
    if (!canWrite) {
      throw new Error("You don't have permission to manage buckets in this workspace.");
    }
    if (!bucket.id) throw new Error("Bucket ID is missing");

    await deleteBucket({
      data: { workspace, bucketId: bucket.id, force: true },
    });

    setRows((prev) => prev.filter((row) => row.id !== bucket.id));
    toast.success("Bucket deleted successfully");
    invalidateActiveMatches(router);
  }

  const isEmptyState = rows.length === 0 && !searchQuery;
  const totalFiles = rows.reduce((acc, row) => acc + (row.objectCount || 0), 0);
  const totalStorageUsed = rows.reduce((acc, row) => acc + (row.storageUsed || 0), 0);
  const maxQuota = rows.length > 0 ? Math.max(...rows.map((row) => row.quota || 0)) : 1 * 1024 * 1024 * 1024;

  if (isEmptyState) {
    return (
      <div className="max-w-[1000px]">
        <PageHeader title="Object Storage" image="/images/lamp.svg">
          Store, organize, and manage application assets, user uploads, media files, and static content from a unified object storage
          system.
        </PageHeader>

        <hr className="border-dash-border-soft mb-8 -mx-4 md:-mx-10" />

        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <h3 className="text-base font-medium leading-5 tracking-[-0.03px] text-dash-text-strong">Object storage</h3>
          <p className="mt-2 text-center text-sm font-light leading-[1.5] text-dash-text-extra-faded">
            Store, organize, and manage application <br />
            assets, user uploads,
          </p>

          {canWrite && (
            <GlossyButton className="mt-6" onClick={() => setAddBucketOpen(true)}>
              Create bucket
            </GlossyButton>
          )}
        </div>

        {canWrite && <AddBucketModal open={addBucketOpen} onOpenChange={setAddBucketOpen} onContinue={handleAddBucket} />}
      </div>
    );
  }

  return (
    <div className="max-w-[1000px]">
      <div className="flex items-center justify-between">
        <PageHeader title="Object Storage" image="/images/lamp.svg">
          Store, organize, and manage application assets, user uploads, media files, and static content from a unified object storage
          system.
        </PageHeader>

        {canWrite && (
          <GlossyButton onClick={() => setAddBucketOpen(true)}>
            <Plus className="size-4" />
            Create Bucket
          </GlossyButton>
        )}
      </div>

      <hr className="border-dash-border-soft mb-8 -mx-4 md:-mx-10" />

      <BucketStatsRow totalBuckets={rows.length} totalFiles={totalFiles} totalStorageUsed={totalStorageUsed} quota={maxQuota} />

      <div className="mt-4">
        <BucketList
          buckets={rows}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onDeleteBucket={canWrite ? handleDeleteBucket : undefined}
          onCreate={canWrite ? () => setAddBucketOpen(true) : undefined}
        />
      </div>

      {canWrite && <AddBucketModal open={addBucketOpen} onOpenChange={setAddBucketOpen} onContinue={handleAddBucket} />}
    </div>
  );
}
