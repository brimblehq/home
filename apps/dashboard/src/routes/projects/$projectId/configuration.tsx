import { useState, useEffect } from "react";
import { createFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import {
  HardDrive,
  Settings,
  Hammer,
  Cpu,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import { FolderOpen } from "@phosphor-icons/react";
import { toast } from "sonner";
import { GlossyButton } from "../../../components/shared/glossy-button";
import { TabHeader } from "../../../components/shared/tab-header";
import { WarningModal } from "../../../components/shared/warning-modal";
import { RootDirectoryDrawer } from "../../../components/project/root-directory-drawer";
import { RangeSlider } from "../../../components/shared/range-slider";
import { Dropdown } from "../../../components/shared/dropdown";
import { ToggleSwitch } from "../../../components/shared/toggle-switch";
import {
  saveProjectGeneralConfigServerFn,
} from "@/server/projects/actions";
import type { FrameworkOption } from "@/backend/frameworks";
import type { RepositoryMetadata } from "@/backend/repositories";
import { listFrameworksServerFn } from "@/server/frameworks/actions";
import { getGithubRepoServerFn } from "@/server/repositories/actions";
import {
  formatMemory,
  normalizeCpuValue,
  normalizeMemoryGbValue,
} from "@/utils/project-configuration";

const parentRoute = getRouteApi("/projects/$projectId");

export const Route = createFileRoute("/projects/$projectId/configuration")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  loader: async ({ context }) => {
    const project = (context as any).project;
    const workspace = (context as any).workspace;

    let repo: RepositoryMetadata | null = null;
    let frameworks: FrameworkOption[] = [];
    const repoName = project?.repo?.fullName || project?.repo?.name;
    const installationId = project?.repo?.installationId;

    const tasks: Promise<void>[] = [];

    tasks.push(
      (listFrameworksServerFn as unknown as (input: {
        data?: undefined;
      }) => Promise<FrameworkOption[] | { result?: FrameworkOption[]; data?: FrameworkOption[] }>)({
        data: undefined,
      })
        .then((items) => {
          let parsedItems: FrameworkOption[] = [];

          if (Array.isArray(items)) {
            parsedItems = items;
          } else if (items && typeof items === "object") {
            if (Array.isArray((items as any).result)) {
              parsedItems = (items as any).result;
            } else if (Array.isArray((items as any).data)) {
              parsedItems = (items as any).data;
            }
          }

          if (Array.isArray(parsedItems)) {
            frameworks = parsedItems;
          } else {
            frameworks = [];
          }
        })
        .catch(() => {
          frameworks = [];
        }),
    );

    if (repoName) {
      tasks.push(
        (getGithubRepoServerFn as unknown as (input: {
          data: { repoName: string; installationId?: number | string };
        }) => Promise<RepositoryMetadata>)({
          data: { repoName, installationId },
        })
          .then((result) => {
            repo = result;
          })
          .catch(() => {
            repo = null;
          }),
      );
    }

    await Promise.all(tasks);

    return { repo, frameworks, workspace };
  },
  component: ConfigurationPage,
});

/* ─── Constants ─── */

const ease = [0.16, 1, 0.3, 1] as const;

const inputClass =
  "w-full input-base input-focus px-3 py-2.5 text-sm leading-6 text-dash-text-strong placeholder:text-[#9ca3af]";

const PERSISTENT_STORAGE_PRICE_PER_GB = 0.25;

const diskSizes = Array.from({ length: 15 }, (_, index) => {
  const size = (index + 1) * 10;
  return {
    id: String(size),
    label: `${size} GB ($${size * PERSISTENT_STORAGE_PRICE_PER_GB}/month)`,
  };
});

const scalingGroupOptions = [
  { id: "", label: "None" },
  { id: "sg-1", label: "Web Frontend" },
  { id: "sg-2", label: "API Workers" },
];

type Section = "general" | "build" | "resources" | "danger";

const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Settings className="size-4" /> },
  { id: "build", label: "Build & Deploy", icon: <Hammer className="size-4" /> },
  { id: "resources", label: "Resources", icon: <Cpu className="size-4" /> },
  {
    id: "danger",
    label: "Danger zone",
    icon: <AlertTriangle className="size-4" />,
  },
];

/* ─── ConfigInput ─── */

function ConfigInput({
  label,
  icon,
  value,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  const isDefault = value === "./" || value === ".";
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-dash-text-strong">{label}</span>
      <Comp
        onClick={onClick}
        className={`flex h-[34px] items-center overflow-clip rounded-[4px] border-[0.5px] border-dash-btn-outline-border bg-dash-bg pl-3.5 pr-2 ${onClick ? "transition-colors hover:border-dash-text-extra-faded" : ""}`}
      >
        {icon && (
          <span className="mr-2 shrink-0 text-dash-text-faded">{icon}</span>
        )}
        <span
          className={`text-sm leading-[22px] tracking-[-0.02px] ${
            isDefault
              ? "font-light text-dash-text-faded"
              : "font-mono text-dash-text-strong"
          }`}
        >
          {value}
        </span>
      </Comp>
    </div>
  );
}

/* ─── Section: General ─── */

function GeneralSection({
  projectName,
  setProjectName,
  branch,
  setBranch,
  branchOptions,
  rootDir,
  onOpenDrawer,
  framework,
  setFramework,
  frameworkOptions,
  saveDisabled,
  saveLoading,
  onSave,
}: {
  projectName: string;
  setProjectName: (v: string) => void;
  branch: string;
  setBranch: (v: string) => void;
  branchOptions: { id: string; label: string }[];
  rootDir: string;
  onOpenDrawer: () => void;
  framework: string;
  setFramework: (v: string) => void;
  frameworkOptions: { id: string; label: string; icon?: string }[];
  saveDisabled: boolean;
  saveLoading: boolean;
  onSave: () => void;
}) {
  return (
    <form
      className="rounded-[4px] border-[0.5px] border-dash-border"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {/* Row 1: Project name */}
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Project name
        </label>
        <div
          className="input-base input-focus-within flex items-stretch overflow-hidden"
          style={!projectName.trim() ? { boxShadow: "0px 1px 2px rgba(239,47,31,0.3), 0px 0px 0px 1px #ef2f1f" } : undefined}
        >
            <div className="flex items-center border-r border-dash-border px-3">
              <span className="whitespace-nowrap text-sm leading-6 text-dash-text-faded">
                brimble.io/
              </span>
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-transparent px-3 py-2.5 text-sm leading-6 text-dash-text-strong outline-none"
            />
          </div>
        {!projectName.trim() && (
          <span className="text-xs text-[#ef2f1f]">
            Project name is required
          </span>
        )}
      </div>

      <hr className="border-dash-border" />

      {/* Row 2: Branch to deploy */}
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Branch to deploy
        </label>
        <Dropdown
          value={branch}
          options={branchOptions}
          onChange={setBranch}
          placeholder="Select branch..."
        />
      </div>

      <hr className="border-dash-border" />

      {/* Row 3: Root directory */}
      <div className="px-4 py-4">
        <ConfigInput
          label="Root directory"
          icon={<FolderOpen size={20} weight="duotone" />}
          value={rootDir}
          onClick={onOpenDrawer}
        />
      </div>

      <hr className="border-dash-border" />

      {/* Row 4: Framework */}
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Framework
        </label>
        <Dropdown
          value={framework}
          options={frameworkOptions}
          onChange={setFramework}
          placeholder="Select framework..."
        />
      </div>

      <hr className="border-dash-border" />

      <div className="flex justify-end px-4 py-4">
        <GlossyButton
          type="submit"
          disabled={saveDisabled || saveLoading}
          loading={saveLoading}
          loadingLabel="Saving..."
        >
          Save
        </GlossyButton>
      </div>
    </form>
  );
}

/* ─── Section: Build & Deploy ─── */

function BuildSection({
  installCmd,
  setInstallCmd,
  buildCmd,
  setBuildCmd,
  startCmd,
  setStartCmd,
  healthCheckPath,
  setHealthCheckPath,
}: {
  installCmd: string;
  setInstallCmd: (v: string) => void;
  buildCmd: string;
  setBuildCmd: (v: string) => void;
  startCmd: string;
  setStartCmd: (v: string) => void;
  healthCheckPath: string;
  setHealthCheckPath: (v: string) => void;
}) {
  return (
    <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border">
      {/* Row 1: Install command */}
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Install command
        </label>
        <input
          type="text"
          value={installCmd}
          onChange={(e) => setInstallCmd(e.target.value)}
          placeholder="npm install"
          className={inputClass}
        />
      </div>

      <hr className="border-dash-border" />

      {/* Row 2: Build command */}
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Build command
        </label>
        <input
          type="text"
          value={buildCmd}
          onChange={(e) => setBuildCmd(e.target.value)}
          placeholder="npm run build"
          className={inputClass}
        />
      </div>

      <hr className="border-dash-border" />

      {/* Row 3: Start command */}
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Start command
        </label>
        <input
          type="text"
          value={startCmd}
          onChange={(e) => setStartCmd(e.target.value)}
          placeholder="npm start"
          className={inputClass}
        />
      </div>

      <hr className="border-dash-border" />

      {/* Row 4: Health check */}
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Health check path
        </label>
        <input
          type="text"
          value={healthCheckPath}
          onChange={(e) => setHealthCheckPath(e.target.value)}
          placeholder="/api/health"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-dash-text-faded">
          Health check endpoint to monitor your application's status
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-end border-t border-dash-border px-4 py-3">
        <GlossyButton disabled>Save</GlossyButton>
      </div>
    </div>
  );
}

/* ─── Section: Resources ─── */

function ResourcesSection({
  cpuValue,
  setCpuValue,
  memoryValue,
  setMemoryValue,
  scalingGroup,
  setScalingGroup,
  diskEnabled,
  setDiskEnabled,
  diskSize,
  setDiskSize,
  mountPath,
  setMountPath,
}: {
  cpuValue: number;
  setCpuValue: (v: number) => void;
  memoryValue: number;
  setMemoryValue: (v: number) => void;
  scalingGroup: string;
  setScalingGroup: (v: string) => void;
  diskEnabled: boolean;
  setDiskEnabled: (v: boolean) => void;
  diskSize: string;
  setDiskSize: (v: string) => void;
  mountPath: string;
  setMountPath: (v: string) => void;
}) {
  return (
    <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border">
      {/* Row 1: CPU */}
      <div className="flex flex-col gap-2 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">CPU</label>
        <p className="text-sm font-light leading-[1.3] text-dash-text-faded">
          CPU resources allocated to each container
        </p>
        <RangeSlider
          value={cpuValue}
          onChange={setCpuValue}
          min={0.5}
          max={8}
          step={0.5}
          unit=" vCPU"
        />
      </div>

      <hr className="border-dash-border" />

      {/* Row 2: Memory */}
      <div className="flex flex-col gap-2 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Memory
        </label>
        <p className="text-sm font-light leading-[1.3] text-dash-text-faded">
          Memory allocated to each container
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <RangeSlider
              value={memoryValue}
              onChange={setMemoryValue}
              min={0.5}
              max={12}
              step={0.5}
              hideValue
            />
          </div>
          <span className="min-w-[52px] text-right text-sm font-medium text-dash-text-strong">
            {formatMemory(memoryValue)}
          </span>
        </div>
      </div>

      <hr className="border-dash-border" />

      {/* Row 3: Scaling group */}
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <label className="text-sm font-medium text-dash-text-strong">
          Scaling group
        </label>
        <p className="text-sm font-light leading-[1.3] text-dash-text-faded">
          Attach to a scaling group for automatic instance management
        </p>
        <Dropdown
          value={scalingGroup}
          options={scalingGroupOptions}
          onChange={setScalingGroup}
          placeholder="Select scaling group..."
        />
      </div>

      <hr className="border-dash-border" />

      {/* Row 4: Persistent storage */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-dash-text-faded" />
            <span className="text-sm font-medium text-dash-text-strong">
              Persistent Storage
            </span>
          </div>
          <ToggleSwitch
            checked={diskEnabled}
            onChange={setDiskEnabled}
            size="sm"
          />
        </div>
        <p className="mt-1 ml-6 text-sm font-light leading-[1.3] text-dash-text-faded">
          Attach a volume that persists across restarts and deployments.
        </p>

        <AnimatePresence>
          {diskEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: "hidden" }}
              animate={{
                opacity: 1,
                height: "auto",
                transitionEnd: { overflow: "visible" },
              }}
              exit={{ overflow: "hidden", opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease }}
            >
              <div className="mt-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-dash-text-faded">
                      Disk size
                    </label>
                    <Dropdown
                      value={diskSize}
                      options={diskSizes}
                      onChange={setDiskSize}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-dash-text-faded">
                      Mount path
                    </label>
                    <input
                      type="text"
                      value={mountPath}
                      onChange={(e) => setMountPath(e.target.value)}
                      placeholder="/mnt/data"
                      className={`${inputClass} font-family-mono text-[13px]`}
                    />
                  </div>
                </div>

                <div className="rounded-[4px] bg-[#4879f8]/[0.04] px-3 py-2.5 dark:bg-[#4879f8]/[0.08]">
                  <p className="text-xs leading-relaxed text-dash-text-body">
                    <span className="font-medium text-[#4879f8]">
                      ${PERSISTENT_STORAGE_PRICE_PER_GB}/GB per month.
                    </span>{" "}
                    Data persists across container restarts and deployments. The
                    volume mounts at{" "}
                    <code className="rounded bg-dash-bg-elevated px-1 py-0.5 font-family-mono text-[11px] text-dash-text-strong">
                      {mountPath || "/mnt/data"}
                    </code>{" "}
                    inside your container.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex justify-end border-t border-dash-border px-4 py-3">
        <GlossyButton disabled>Save</GlossyButton>
      </div>
    </div>
  );
}

/* ─── Section: Danger zone ─── */

function DangerSection({
  maintenanceMode,
  setMaintenanceMode,
  projectName,
}: {
  maintenanceMode: boolean;
  setMaintenanceMode: (v: boolean) => void;
  projectName: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  return (
    <>
      <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border border-t-2 border-t-red-400/40">
        {/* Row 1: Maintenance mode */}
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-dash-text-strong">
              Toggle Maintenance mode
            </h4>
            <p className="text-sm font-light leading-[1.3] text-dash-text-faded">
              Maintenance mode allows your team perform upgrades and tests
              without deploying to production.{" "}
              <a href="#" className="text-[#008cff] underline">
                Learn about Maintenance mode.
              </a>
            </p>
          </div>
          <ToggleSwitch
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
          />
        </div>

        <hr className="border-dash-border" />

        {/* Row 2: Delete project */}
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-dash-text-strong">
              Delete project
            </h4>
            <p className="text-sm font-light leading-[1.3] text-dash-text-faded">
              Permanently delete{" "}
              <span className="font-normal text-dash-text-strong">
                brimble.io/{projectName}
              </span>{" "}
              and all its deployments.
            </p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="shrink-0 rounded-[4px] border border-red-500/30 bg-gradient-to-b from-red-500 via-red-600 to-red-700 px-4 py-[5px] text-sm font-medium text-white shadow-[0px_1px_2px_rgba(18,18,23,0.05)] transition-opacity hover:opacity-90"
          >
            Delete project
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <WarningModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setConfirmText("");
        }}
        title="Delete this project?"
        description="This action cannot be undone. All deployments, domains, and environment variables associated with this project will be permanently deleted."
        confirmLabel="Delete project"
        cancelLabel="Cancel"
        confirmDisabled={confirmText !== projectName}
        onConfirm={() => {
          console.log("Delete project:", projectName);
        }}
      >
        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm leading-5 text-dash-text-faded">
            Type <span className="font-medium text-dash-text-strong">{projectName}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectName}
            className={inputClass}
            autoFocus
          />
        </div>
      </WarningModal>
    </>
  );
}

/* ─── Main Page ─── */

function ConfigurationPage() {
  const { project, workspace } = parentRoute.useLoaderData() as any;
  const { repo, frameworks } = Route.useLoaderData();
  const params = Route.useParams();
  const navigate = useNavigate();
  const saveGeneralConfig = useServerFn(saveProjectGeneralConfigServerFn as any) as (args: {
    data: {
      projectId: string;
      workspace?: string;
      name: string;
      branch?: string;
      rootDirectory?: string;
      framework?: string;
    };
  }) => Promise<{ id?: string; message?: string }>;
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [projectName, setProjectName] = useState(project?.name || "");
  const [branch, setBranch] = useState(project?.repo?.branch || "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rootDir, setRootDir] = useState(project?.rootDirectory || "./");
  const [framework, setFramework] = useState(project?.framework || "");

  // Build settings
  const [installCmd, setInstallCmd] = useState(project?.installCommand || "");
  const [buildCmd, setBuildCmd] = useState(project?.buildCommand || "");
  const [startCmd, setStartCmd] = useState(project?.startCommand || "");

  // Health check
  const [healthCheckPath, setHealthCheckPath] = useState(project?.healthCheckPath || "");

  // Compute resources
  const [cpuValue, setCpuValue] = useState(normalizeCpuValue(project?.specs?.cpu));
  const [memoryValue, setMemoryValue] = useState(
    normalizeMemoryGbValue(project?.specs?.memory),
  );

  // Scaling group
  const [scalingGroup, setScalingGroup] = useState(project?.autoscalingGroup?.id || "");

  // Persistent storage
  const [diskEnabled, setDiskEnabled] = useState(Boolean(project?.diskSize || project?.volumeMount));
  const [diskSize, setDiskSize] = useState(
    String(project?.diskSize || 1),
  );
  const [mountPath, setMountPath] = useState(project?.volumeMount || "");

  // Maintenance mode
  const [maintenanceMode, setMaintenanceMode] = useState(Boolean(project?.maintenance));
  const [repoMetadata, setRepoMetadata] = useState<RepositoryMetadata | null>(repo ?? null);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalBaseline, setGeneralBaseline] = useState(() => ({
    projectName: project?.name || "",
    branch: project?.repo?.branch || "",
    rootDir: project?.rootDirectory || "./",
    framework: project?.framework || "",
  }));
  const frameworkOptions = (() => {
    const mapped = (frameworks || []).map((item) => ({
      id: item.slug,
      label: item.name,
      icon: item.logo,
    }));

    if (!framework) {
      return mapped;
    }

    const exists = mapped.some((item) => item.id === framework);
    if (exists) {
      return mapped;
    }

    return [
      ...mapped,
      {
        id: framework,
        label: framework,
      },
    ];
  })();

  useEffect(() => {
    setProjectName(project?.name || "");
    setBranch(project?.repo?.branch || "");
    setRootDir(project?.rootDirectory || "./");
    setFramework(project?.framework || "");
    setInstallCmd(project?.installCommand || "");
    setBuildCmd(project?.buildCommand || "");
    setStartCmd(project?.startCommand || "");
    setHealthCheckPath(project?.healthCheckPath || "");
    setCpuValue(normalizeCpuValue(project?.specs?.cpu));
    setMemoryValue(normalizeMemoryGbValue(project?.specs?.memory));
    setScalingGroup(project?.autoscalingGroup?.id || "");
    setDiskEnabled(Boolean(project?.diskSize || project?.volumeMount));
    setDiskSize(String(project?.diskSize || 1));
    setMountPath(project?.volumeMount || "");
    setMaintenanceMode(Boolean(project?.maintenance));
    setGeneralBaseline({
      projectName: project?.name || "",
      branch: project?.repo?.branch || "",
      rootDir: project?.rootDirectory || "./",
      framework: project?.framework || "",
    });
  }, [project]);

  useEffect(() => {
    setRepoMetadata(repo ?? null);
  }, [repo]);

  useEffect(() => {
    setRootDir("./");
  }, [branch]);

  const branchOptions = (repoMetadata?.branches || []).map((branchName) => ({
    id: branchName,
    label: branchName,
  }));
  const isGeneralDirty =
    projectName !== generalBaseline.projectName ||
    branch !== generalBaseline.branch ||
    rootDir !== generalBaseline.rootDir ||
    framework !== generalBaseline.framework;
  const isGeneralSaveDisabled = !projectName.trim() || !isGeneralDirty;

  async function handleSaveGeneral() {
    if (isGeneralSaveDisabled || savingGeneral) {
      return;
    }

    try {
      setSavingGeneral(true);

      await saveGeneralConfig({
        data: {
          projectId: project?.id || params.projectId,
          workspace,
          name: projectName.trim(),
          branch,
          rootDirectory: rootDir,
          framework,
        },
      });

      const nextProjectId = projectName.trim();
      if (nextProjectId && nextProjectId !== params.projectId) {
        let nextUrl = `/projects/${encodeURIComponent(nextProjectId)}/configuration`;
        if (workspace) {
          nextUrl = `${nextUrl}?workspace=${encodeURIComponent(workspace)}`;
        }

        await navigate({
          to: nextUrl as any,
          replace: true,
        });
      }

      setGeneralBaseline({
        projectName: projectName.trim(),
        branch,
        rootDir,
        framework,
      });

      toast.success("Configuration saved. Redeploy started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save configuration");
    } finally {
      setSavingGeneral(false);
    }
  }

  const serviceTypeValue = String(project?.serviceType || "").toLowerCase();
  const isDatabaseProject = serviceTypeValue === "database";

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4 py-8">
      <TabHeader title="Configuration">
        {isDatabaseProject
          ? "Manage your database settings, access controls, and compute resources."
          : "Manage your project settings and deployment configuration."}{" "}
        <a href="#" className="text-[#4879f8] underline">
          Learn more
        </a>
      </TabHeader>

      <hr className="border-dash-border" />

      {/* Sidebar + Content layout */}
      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="sticky top-8 flex w-[180px] shrink-0 flex-col gap-0.5 self-start">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-left text-sm transition-colors ${
                s.id === activeSection
                  ? "bg-dash-bg-elevated font-medium text-dash-text-strong"
                  : "text-dash-text-faded hover:bg-dash-bg-elevated/50 hover:text-dash-text-body"
              } ${s.id === "danger" ? "mt-4 text-red-400/80 hover:text-red-400" : ""}`}
            >
              <span
                className={
                  s.id === activeSection
                    ? s.id === "danger"
                      ? "text-red-400"
                      : "text-dash-text-strong"
                    : ""
                }
              >
                {s.icon}
              </span>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease }}
            >
              {activeSection === "general" && (
                <GeneralSection
                  projectName={projectName}
                  setProjectName={setProjectName}
                  branch={branch}
                  setBranch={setBranch}
                  branchOptions={branchOptions}
                  rootDir={rootDir}
                  onOpenDrawer={() => setDrawerOpen(true)}
                  framework={framework}
                  setFramework={setFramework}
                  frameworkOptions={frameworkOptions}
                  saveDisabled={isGeneralSaveDisabled}
                  saveLoading={savingGeneral}
                  onSave={handleSaveGeneral}
                />
              )}
              {activeSection === "build" && (
                <BuildSection
                  installCmd={installCmd}
                  setInstallCmd={setInstallCmd}
                  buildCmd={buildCmd}
                  setBuildCmd={setBuildCmd}
                  startCmd={startCmd}
                  setStartCmd={setStartCmd}
                  healthCheckPath={healthCheckPath}
                  setHealthCheckPath={setHealthCheckPath}
                />
              )}
              {activeSection === "resources" && (
                <ResourcesSection
                  cpuValue={cpuValue}
                  setCpuValue={setCpuValue}
                  memoryValue={memoryValue}
                  setMemoryValue={setMemoryValue}
                  scalingGroup={scalingGroup}
                  setScalingGroup={setScalingGroup}
                  diskEnabled={diskEnabled}
                  setDiskEnabled={setDiskEnabled}
                  diskSize={diskSize}
                  setDiskSize={setDiskSize}
                  mountPath={mountPath}
                  setMountPath={setMountPath}
                />
              )}
              {activeSection === "danger" && (
                <DangerSection
                  maintenanceMode={maintenanceMode}
                  setMaintenanceMode={setMaintenanceMode}
                  projectName={projectName}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Root directory drawer */}
      <RootDirectoryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        repoName={project?.repo?.fullName || project?.repo?.name}
        installationId={project?.repo?.installationId}
        branch={branch}
        selectedPath={rootDir || "./"}
        onSelect={({ path, framework: detectedFramework }) => {
          setRootDir(path || "./");

          if (detectedFramework?.slug) {
            setFramework(detectedFramework.slug);
          }
          if (detectedFramework?.installCommand) {
            setInstallCmd(detectedFramework.installCommand);
          }
          if (detectedFramework?.buildCommand) {
            setBuildCmd(detectedFramework.buildCommand);
          }
          if (detectedFramework?.startCommand) {
            setStartCmd(detectedFramework.startCommand);
          }
        }}
      />
    </div>
  );
}
