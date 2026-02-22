import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, GitBranch, Folder } from "lucide-react";
import { DashButton } from "../../../components/shared/dash-button";
import { TabHeader } from "../../../components/shared/tab-header";
import { RootDirectoryDrawer } from "../../../components/project/root-directory-drawer";

export const Route = createFileRoute("/projects/$projectId/configuration")({
  component: ConfigurationPage,
});

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
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm leading-5 tracking-[-0.02px] text-dash-text-strong">
        {label}
      </label>
      <Comp
        onClick={onClick}
        className={`flex h-[34px] items-center overflow-clip rounded-[4px] border-[0.5px] border-dash-btn-outline-border bg-dash-bg pl-3.5 pr-2 ${onClick ? "transition-colors hover:border-dash-text-extra-faded" : ""}`}
      >
        {icon && (
          <span className="mr-2 shrink-0 text-dash-text-faded">{icon}</span>
        )}
        <span className="text-sm font-light leading-[22px] tracking-[-0.02px] text-dash-text-faded">
          {value}
        </span>
      </Comp>
    </div>
  );
}

function ConfigurationPage() {
  const [projectName, setProjectName] = useState("frontend-web");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rootDir, setRootDir] = useState("Github/Main");

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4 py-8">
      <TabHeader title="Configuration">
        Set environment-specific config and secrets (such as API keys), then
        read those values from your code.{" "}
        <a href="#" className="text-[#4879f8] underline">
          Learn more
        </a>
      </TabHeader>

      <hr className="border-dash-border" />

      {/* Project name card */}
      <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border">
        <div className="flex flex-col gap-1.5 px-3.5 pb-6 pt-4">
          <label className="text-sm leading-5 tracking-[-0.02px] text-dash-text-strong">
            Project name
          </label>
          <div className="flex items-start gap-3.5">
            <div className="flex flex-1 items-stretch">
              {/* Prefix */}
              <div className="flex items-center rounded-l-[4px] border-[0.5px] border-r-0 border-[#d0d5dd] bg-dash-bg-elevated px-3.5">
                <span className="whitespace-nowrap text-sm leading-5 tracking-[-0.02px] text-dash-text-faded opacity-60">
                  brimble.com/this-project/
                </span>
              </div>
              {/* Editable input */}
              <div className="flex flex-1 items-center gap-2 rounded-r-[4px] border-[0.5px] border-[#d0d5dd] bg-dash-bg px-3.5">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-transparent py-[6px] text-sm font-light leading-5 tracking-[-0.02px] text-dash-text-strong outline-none"
                />
                <ChevronDown className="size-4 shrink-0 text-dash-text-faded" />
              </div>
            </div>
            {/* Save button */}
            <DashButton
              className="border-[#e5e5e5] text-[#e5e5e5] shadow-none"
              disabled
            >
              Save
            </DashButton>
          </div>
        </div>
      </div>

      {/* Project config card */}
      <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border">
        <div className="flex flex-col gap-4 border-b-[0.5px] border-dash-border-soft px-3.5 pb-6 pt-4">
          <ConfigInput
            label="Branch to deploy"
            icon={<GitBranch className="size-4" />}
            value="Main"
          />
          <ConfigInput
            label="Root directory"
            icon={<Folder className="size-5" />}
            value={rootDir}
            onClick={() => setDrawerOpen(true)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm leading-5 tracking-[-0.02px] text-dash-text-strong">
              Frameworks
            </label>
            <div className="flex h-[34px] items-center overflow-clip rounded-[4px] border-[0.5px] border-dash-btn-outline-border bg-dash-bg pl-3.5 pr-2">
              <div className="flex items-center gap-2">
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"
                  alt="React"
                  className="size-4"
                />
                <span className="text-sm font-light leading-[1.4] tracking-[-0.28px] text-dash-text-strong">
                  React JS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced settings */}
      <div className="mt-4 flex flex-col gap-4">
        <h3 className="text-base font-medium tracking-[-0.03px] text-dash-text-strong">
          Advanced settings
        </h3>

        <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border-soft">
          <div className="flex flex-col gap-4 px-3.5 pb-6 pt-4">
            {/* Maintenance mode */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <h4 className="text-base tracking-[-0.03px] text-dash-text-strong">
                  Toggle Maintenance mode
                </h4>
                <p className="max-w-[600px] text-sm font-light leading-[1.3] text-dash-text-faded">
                  Maintenance mode allows your team perform upgrades and tests
                  without deploying to production. Learn about{" "}
                  <a href="#" className="text-[#008cff] underline">
                    Maintenance mode.
                  </a>
                </p>
              </div>
              <DashButton className="shrink-0">
                Turn on maintenance mode
              </DashButton>
            </div>

            <hr className="border-dash-border" />

            {/* Redeploy project */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <h4 className="text-base tracking-[-0.03px] text-dash-text-strong">
                  Redeploy project
                </h4>
                <p className="text-sm font-light leading-[1.3] text-dash-text-faded">
                  Redeploy{" "}
                  <span className="font-normal text-dash-text-strong">
                    brimble.com/this-project/frontend-web
                  </span>
                </p>
              </div>
              <button className="shrink-0 rounded-[4px] border border-[#232931] bg-gradient-to-b from-[#545459] via-[#45454b] to-[#2d2d32] px-4 py-[5px] text-sm font-medium text-white shadow-[0px_1px_2px_rgba(18,18,23,0.05)]">
                Redeploy !
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Root directory drawer */}
      <RootDirectoryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSelect={(path) => setRootDir(`Github/${path}`)}
      />
    </div>
  );
}
