import { createFileRoute } from "@tanstack/react-router";
import { DomainList, type Domain } from "../../../../components/shared/domain-list";
import { TabHeader } from "../../../../components/shared/tab-header";

export const Route = createFileRoute("/projects/$projectId/domains/")({
  component: ProjectDomainsPage,
});

const domains: Domain[] = [
  {
    name: "www.audioly.brimble.app",
    project: "Audioly",
    status: "Active",
    addedAt: "Added 2 months ago",
    addedBy: "By Kemdirim Akujuobi",
  },
  {
    name: "audioly.com",
    project: "Audioly",
    status: "Failed",
    addedAt: "Added 2 months ago",
    addedBy: "By Kemdirim Akujuobi",
  },
  {
    name: "app.audioly.com",
    project: "Audioly",
    status: "Active",
    addedAt: "Added 1 month ago",
    addedBy: "By Kemdirim Akujuobi",
  },
];

function ProjectDomainsPage() {
  const { projectId } = Route.useParams();

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 py-8">
      <TabHeader title="Project domains">
        Manage all your domains on this project. You get a default
        ".brimble.com" domain with each project you deploy.
      </TabHeader>

      <DomainList domains={domains} basePath={`/projects/${projectId}/domains`} />
    </div>
  );
}
