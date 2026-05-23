import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { hapticToast as toast } from "@/utils/haptic-toast";
import { useWorkspaceRole } from "@/contexts/workspace-role-context";
import { PageHeader } from "../../components/shared/page-header";
import { BucketList, type Bucket } from "../../components/shared/bucket-list";
import { AddBucketModal } from "../../components/shared/add-bucket-modal";
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
    data: { workspace?: string; name: string; region?: string };
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

  async function handleAddBucket(name: string, region?: string): Promise<{ bucket: any; token?: string }> {
    if (!canWrite) {
      throw new Error("You don't have permission to manage buckets in this workspace.");
    }

    const created = await createBucket({
      data: { workspace, name, region },
    });

    const bucketId = created?._id || created?.id;
    let token: string | undefined;

    if (bucketId) {
      try {
        const tokenResult = await createToken({
          data: { workspace, bucketId, name: `${name}-token` },
        });
        token = tokenResult?.token;
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
      data: { workspace, bucketId: bucket.id },
    });

    setRows((prev) => prev.filter((row) => row.id !== bucket.id));
    toast.success("Bucket deleted successfully");
    invalidateActiveMatches(router);
  }

  return (
    <div className="flex max-w-[1000px] flex-col gap-4 py-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Storage Buckets" image="/images/lamp.svg">
          Manage your object storage buckets. Store and deliver files securely across your workspace.
        </PageHeader>

        {canWrite && (
          <button
            onClick={() => setAddBucketOpen(true)}
            className="flex items-center gap-2 rounded-[4px] bg-[#3c6ce7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#345cc7]"
          >
            Create Bucket
          </button>
        )}
      </div>

      <div className="mt-4">
        <BucketList
          buckets={rows}
          basePath="/buckets"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onDeleteBucket={canWrite ? handleDeleteBucket : undefined}
        />
      </div>

      {canWrite && <AddBucketModal open={addBucketOpen} onOpenChange={setAddBucketOpen} onContinue={handleAddBucket} />}
    </div>
  );
}
