import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../../components/shared/page-header";
import { ProjectCard } from "../../components/shared/project-card";
import type { Project } from "../../components/shared/project-card";
import { CreateProjectCard } from "../../components/shared/create-project-card";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});

const projects: Project[] = [
  {
    name: "Kemdirimdesign",
    commitMessage: "Merge pull request #40 from Cool-Projects/fix101",
    branch: "master",
    updatedAt: "23h ago",
  },
  {
    name: "Kemdirimdesign",
    commitMessage: "Merge pull request #40 from Cool-Projects/fix101",
    branch: "master",
    updatedAt: "23h ago",
  },
  {
    name: "Kemdirimdesign",
    commitMessage: "Merge pull request #40 from Cool-Projects/fix101",
    branch: "main",
    updatedAt: "2d ago",
  },
  {
    name: "Kemdirimdesign",
    commitMessage: "Merge pull request #40 from Cool-Projects/fix101",
    branch: "main",
    updatedAt: "5d ago",
  },
];

function ProjectsPage() {
  return (
    <div className="max-w-[1000px]">
      <PageHeader title="Projects" image="/images/bee.svg">
        Welcome to faster frontend deployments! You have used{" "}
        <span className="font-normal text-dash-text-body">4/10</span> of your
        free deployments, you can upgrade to a Pro plan to access unlimited
        deployments.
      </PageHeader>

      <hr className="border-dash-border-soft mb-8 -mx-4 md:-mx-10" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <ProjectCard key={i} project={project} />
        ))}
        <CreateProjectCard className="col-span-1 sm:col-span-2" />
      </div>
    </div>
  );
}
