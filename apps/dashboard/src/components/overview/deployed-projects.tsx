import { PageHeader } from "../shared/page-header";
import { ProjectCard } from "../shared/project-card";
import type { Project } from "../shared/project-card";
import { CreateProjectCard } from "../shared/create-project-card";

function getCreateCardSpan(projectCount: number) {
  const smRemaining = projectCount % 2 === 0 ? 2 : 2 - (projectCount % 2);
  const lgRemaining = projectCount % 3 === 0 ? 3 : 3 - (projectCount % 3);

  return [
    smRemaining >= 2 ? "sm:col-span-2" : "",
    lgRemaining >= 3 ? "lg:col-span-3" : lgRemaining >= 2 ? "lg:col-span-2" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function DeployedProjects({
  projects,
}: {
  projects: Project[];
}) {
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
        <CreateProjectCard className={getCreateCardSpan(projects.length)} />
      </div>
    </div>
  );
}
