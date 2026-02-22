export interface Project {
  name: string;
  commitMessage: string;
  branch: string;
  updatedAt: string;
}

import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";

export function ProjectCard({ project }: { project: Project }) {
  const slug = project.name.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link to={`/projects/${slug}`} className="block">
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex cursor-pointer flex-col overflow-clip rounded-[4px] border-[0.5px] border-dash-border"
    >
      {/* Project name + commit message */}
      <div className="flex flex-col gap-0.5 px-3.5 pt-3 pb-2 text-sm tracking-[-0.02px]">
        <span className="font-medium leading-5 text-dash-text-strong">
          {project.name}
        </span>
        <span className="font-light leading-[22px] text-dash-text-faded">
          {project.commitMessage}
        </span>
      </div>

      {/* Branch with git icon + vertical line */}
      <div className="relative flex items-center gap-2 px-3 pb-1 pt-0.5">
        {/* Vertical line above icon */}
        <div className="absolute left-[23px] top-[-6px] h-[16px] w-px bg-dash-border" />
        {/* Git icon */}
        <img src="/icons/git-circle.svg" alt="" className="size-6 shrink-0" />
        <span className="text-sm tracking-[-0.02px] text-dash-text-strong">
          From {project.branch}
        </span>
      </div>

      {/* Updated timestamp */}
      <div className="flex h-10 items-center border-t-[0.5px] border-dash-border px-3.5">
        <span className="font-mono text-xs uppercase leading-[18px] tracking-[-0.02px] text-dash-text-extra-faded opacity-80">
          Updated {project.updatedAt}
        </span>
      </div>
    </motion.div>
    </Link>
  );
}
