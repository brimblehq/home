import { PageHeader } from "../shared/page-header";
import { ProjectCard } from "../shared/project-card";
import type { Project } from "../shared/project-card";
import { CreateProjectCard } from "../shared/create-project-card";


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

export function DeployedProjects() {
  return (
    <div className="mb-8">
      <PageHeader title="Deployed projects">
        Welcome to faster frontend deployments! You have used{" "}
        <span className="font-semibold text-dash-text-body">4/10</span> of your free
        deployments, you can upgrade to a Pro plan to access unlimited
        deployments.
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <ProjectCard key={i} project={project} />
        ))}
        <CreateProjectCard className="col-span-1 sm:col-span-2" />
      </div>
    </div>
  );
}
