import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Plus,
  Globe,
  Users,
} from "lucide-react";
import { House } from "@phosphor-icons/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/use-theme";
import { DashButton } from "../shared/dash-button";
import { useScoutBar } from "../../contexts/scoutbar-context";
import config from "@/config";
import type { SettingsSidebarSnapshot } from "@/backend/settings";
import type { Workspace } from "@/backend/workspaces";
import { toTitleCase } from "@/utils/dashboard";

const allProjects = [
  "Kemdirimdesign",
  "Audioly",
  "Cool-Projects",
];

function ProjectSwitcher({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium text-dash-text-faded hover:text-dash-text-strong transition-colors"
      >
        {projectId}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-50 mt-2 w-[200px] origin-top-left overflow-clip rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg shadow-[0px_2px_3px_rgba(0,0,0,0.06)]"
          >
            {/* Project list */}
            <div className="flex flex-col gap-2 border-b-[0.5px] border-dash-border px-3.5 py-2">
              {allProjects.map((name) => (
                <Link
                  key={name}
                  to={`/projects/${name.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="flex h-8 items-center pl-px pr-2 text-sm text-dash-text-strong hover:text-dash-text-body transition-colors"
                >
                  {name}
                </Link>
              ))}
            </div>
            {/* Create project */}
            <Link
              to="/projects/new"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center gap-2 bg-dash-bg-elevated px-3.5 text-sm text-dash-text-faded hover:text-dash-text-body transition-colors"
            >
              <Plus className="size-4" />
              Create project
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkspaceSwitcher({
  profile,
  workspaces,
  pathname,
  searchStr,
}: {
  profile: SettingsSidebarSnapshot["profile"] | null;
  workspaces: Workspace[];
  pathname: string;
  searchStr: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const personalAvatar =
    profile?.avatarUrl ||
    `${config.avatarUrl}/adventurer-neutral/svg?seed=${encodeURIComponent(
      profile?.username || profile?.firstName || profile?.email || "user",
    )}`;

  const personalName =
    profile?.username ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.email ||
    "Personal Account";
  const personalDisplayName = toTitleCase(personalName);
  const personalWorkspaceLabel = `${personalDisplayName}'s Workspace`;
  const params = new URLSearchParams(searchStr || "");
  const activeWorkspaceSlug = params.get("workspace");
  const activeTeam =
    workspaces.find((team) => team.slug === activeWorkspaceSlug) ?? null;

  const activeWorkspaceAvatar = activeTeam?.avatarUrl
    ? activeTeam.avatarUrl
    : activeTeam
      ? `${config.avatarUrl}/initials/svg?seed=${encodeURIComponent(activeTeam.name)}`
      : personalAvatar;

  const activeWorkspaceLabel = activeTeam
    ? `${toTitleCase(activeTeam.name)}'s Workspace`
    : personalWorkspaceLabel;

  const navigateWithWorkspace = (workspaceSlug?: string) => {
    const nextParams = new URLSearchParams(searchStr || "");

    if (workspaceSlug) {
      nextParams.set("workspace", workspaceSlug);
    } else {
      nextParams.delete("workspace");
    }

    const nextSearch = nextParams.toString();
    const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;

    navigate({ to: nextUrl as any });
  };

  const filteredTeams = workspaces.filter((team) => {
    const text = query.trim().toLowerCase();
    if (!text) {
      return true;
    }

    return team.name.toLowerCase().includes(text);
  });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-dash-text-strong"
      >
        <img src={activeWorkspaceAvatar} alt="" className="size-6 rounded-full object-cover" />
        <span>{activeWorkspaceLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChevronDown className="size-4 text-dash-text-strong" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-50 mt-2 w-[243px] origin-top-left overflow-clip rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg shadow-[0px_2px_4px_-4px_rgba(0,0,0,0.07)]"
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b-[0.5px] border-dash-border bg-dash-bg-elevated px-2 py-2">
              <Search className="size-4 text-dash-text-extra-faded" />
              <input
                type="text"
                placeholder="Find team"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm text-dash-text-strong outline-none placeholder:text-dash-text-extra-faded"
              />
            </div>

            {/* Personal Accounts */}
            <div className="border-b-[0.5px] border-dash-border px-2 pb-4 pt-2">
              <div className="py-2">
                <span className="text-xs text-dash-text-extra-faded dark:text-dash-text-faded">Personal Accounts</span>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  navigateWithWorkspace();
                }}
                className={`flex w-full items-center gap-2 rounded px-px py-1 transition-colors hover:bg-dash-bg-elevated ${
                  !activeTeam ? "bg-dash-bg-elevated" : ""
                }`}
              >
                <img
                  src={personalAvatar}
                  alt=""
                  className="size-6 shrink-0 rounded-full object-cover"
                />
                <span className="text-sm text-dash-text-body dark:text-dash-text-strong">
                  {personalWorkspaceLabel}
                </span>
              </button>
            </div>

            {/* Teams */}
            <div className="border-b-[0.5px] border-dash-border px-2 pb-4 pt-2">
              <div className="py-2">
                <span className="text-xs text-dash-text-extra-faded dark:text-dash-text-faded">Teams</span>
              </div>
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => {
                  const teamAvatar =
                    team.avatarUrl ||
                    `${config.avatarUrl}/initials/svg?seed=${encodeURIComponent(team.name)}`;

                  return (
                    <button
                      key={team.id || team.name}
                      onClick={() => {
                        setOpen(false);
                        if (team.slug) {
                          navigateWithWorkspace(team.slug);
                        }
                      }}
                      className={`flex w-full items-center gap-2 rounded px-px py-1 transition-colors hover:bg-dash-bg-elevated ${
                        activeTeam?.slug === team.slug ? "bg-dash-bg-elevated" : ""
                      }`}
                    >
                      <img
                        src={teamAvatar}
                        alt=""
                        className="size-6 shrink-0 rounded-full object-cover"
                      />
                      <span className="text-sm text-dash-text-body dark:text-dash-text-strong">
                        {`${toTitleCase(team.name)}'s Workspace`}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-px py-1 text-sm text-dash-text-extra-faded">
                  No teams found
                </div>
              )}
            </div>
            {/* Home + Create workspace */}
            <div className="flex flex-col border-t-[0.5px] border-dash-border bg-dash-bg-elevated">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/projects" });
                }}
                className="flex h-10 w-full items-center gap-2 px-3.5 text-sm text-dash-text-faded transition-colors hover:text-dash-text-body"
              >
                <House className="size-4" weight="fill" />
                Home
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/workspace/new" });
                }}
                className="flex h-10 w-full items-center gap-2 px-3.5 text-sm text-dash-text-faded transition-colors hover:text-dash-text-body"
              >
                <Plus className="size-4" />
                Create workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const environments = ["Production", "Preview", "Development", "Staging"];

function EnvironmentDropdown() {
  const [selected, setSelected] = useState("Production");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <DashButton onClick={() => setOpen(!open)}>
        {selected}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </DashButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[180px] origin-top-right overflow-clip rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg py-1 shadow-[0px_2px_4px_-4px_rgba(0,0,0,0.07)]"
          >
            {environments.map((env) => (
              <button
                key={env}
                onClick={() => {
                  setSelected(env);
                  setOpen(false);
                }}
                className={`mx-1 flex w-[calc(100%-8px)] items-center rounded-[2px] px-2 py-1.5 text-sm transition-colors hover:bg-dash-bg-elevated ${
                  env === selected
                    ? "font-medium text-dash-text-strong"
                    : "font-light text-dash-text-faded"
                }`}
              >
                {env}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Notifications ─── */

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: "1", message: "Deployment successful for audioly", time: "2 min ago", read: false },
  { id: "2", message: "Domain kemdirim.com has been verified", time: "1 hour ago", read: false },
  { id: "3", message: "New team member joined Brimble Team", time: "3 hours ago", read: true },
  { id: "4", message: "Payment processed successfully", time: "1 day ago", read: true },
  { id: "5", message: "Build failed for portfolio-v2", time: "2 days ago", read: true },
];

function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-dash-text-faded hover:text-dash-text-strong transition-colors"
      >
        <span className="relative">
          <Bell className="size-4 fill-current" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[#ef2f1f] text-[8px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </span>
        <span>Notifications</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[340px] origin-top-right overflow-clip rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg shadow-[0px_2px_8px_rgba(0,0,0,0.08)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-[0.5px] border-dash-border px-4 py-3">
              <span className="text-sm font-medium text-dash-text-strong">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#4879f8] transition-colors hover:text-[#3a6ae6]"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-dash-bg-elevated"
                >
                  <span className={`mt-1.5 size-[6px] shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-[#ef2f1f]"}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={`text-sm leading-[1.4] ${n.read ? "font-light text-dash-text-faded" : "text-dash-text-strong"}`}>
                      {n.message}
                    </span>
                    <span className="text-xs text-dash-text-extra-faded">
                      {n.time}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const createMenuItems = [
  { label: "Create project", icon: Plus },
  { label: "Register domain", icon: Globe },
  { label: "Create team", icon: Users },
];

function CreateDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-stretch">
        <button className="flex items-center gap-1 rounded-l border border-[#3964d5] bg-[#4879f8] py-[5px] pl-3 pr-2 text-sm font-medium text-white shadow-[0px_1px_2px_rgba(18,18,23,0.05)]">
          <img src="/icons/plus-white.svg" alt="" className="size-4" />
          Create
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center rounded-r border border-l-0 border-[#3964d5] bg-[#4879f8] px-1.5 shadow-[0px_1px_2px_rgba(18,18,23,0.05)]"
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <ChevronDown className="size-4 text-white" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[200px] origin-top-right overflow-clip rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg py-1 shadow-[0px_2px_4px_-4px_rgba(0,0,0,0.07)]"
          >
            {createMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setOpen(false);
                    if (item.label === "Create project") navigate({ to: "/projects/new" });
                    if (item.label === "Register domain") navigate({ to: "/domains/buy" });
                    if (item.label === "Create team") navigate({ to: "/workspace/new" });
                  }}
                  className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[2px] px-2 py-1.5 text-sm font-light text-dash-text-body dark:text-dash-text-strong transition-colors hover:bg-dash-bg-elevated"
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Topbar({
  onSettingsClick,
  settingsSnapshot,
  workspaces,
}: {
  onSettingsClick: () => void;
  settingsSnapshot?: SettingsSidebarSnapshot | null;
  workspaces?: Workspace[];
}) {
  const { theme, toggleTheme } = useTheme();
  const { open: openScoutBar } = useScoutBar();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  const isWorkspaceNew = /^\/workspace\/new/.test(pathname);
  return (
    <div data-topbar className="flex shrink-0 flex-col bg-dash-bg">
      {/* Top row: search + notifications */}
      <div className="border-b border-dash-border-soft">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between py-3">
          <div
            onClick={openScoutBar}
            className="flex cursor-pointer items-center gap-2 text-dash-text-extra-faded transition-colors hover:text-dash-text-faded"
          >
            <Search className="size-4" />
            <span className="text-sm">Search workspace or use cmd + k</span>
            <kbd className="ml-1 rounded border border-dash-border-soft px-1.5 py-0.5 text-[10px] font-medium leading-none text-dash-text-extra-faded">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center gap-4 text-dash-text-faded">
            <NotificationsDropdown />
            <a href="mailto:hello@brimble.app" className="flex items-center gap-1.5 text-sm hover:text-dash-text-strong transition-colors">
              <HelpCircle className="size-4" />
              <span>Help</span>
            </a>
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-1.5 text-sm transition-colors hover:text-dash-text-strong"
            >
              <img
                src="/icons/settings.svg"
                alt=""
                className="size-4 shrink-0 dark:invert dark:sepia dark:saturate-[3] dark:hue-rotate-[345deg] dark:opacity-80"
              />
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 text-sm hover:text-dash-text-strong"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb row */}
      <div className="border-b border-dash-border-soft">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between py-3">
          <div className="flex items-center">
            <WorkspaceSwitcher
              profile={settingsSnapshot?.profile ?? null}
              workspaces={workspaces ?? []}
              pathname={pathname}
              searchStr={searchStr}
            />
            <span className="mx-2 text-sm text-dash-text-faded">/</span>
            {isWorkspaceNew ? (
              <span className="text-sm font-medium text-dash-text-faded">New Workspace</span>
            ) : projectId ? (
              projectId === "new" ? (
                <span className="text-sm font-medium text-dash-text-faded">New Project</span>
              ) : (
                <ProjectSwitcher projectId={projectId} />
              )
            ) : (
              <span className="text-sm font-medium text-dash-text-faded">Home</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Environment selector */}
            <EnvironmentDropdown />
            {/* Create split button */}
            <CreateDropdown />
          </div>
        </div>
      </div>
    </div>
  );
}
