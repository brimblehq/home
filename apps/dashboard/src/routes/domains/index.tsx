import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../../components/shared/page-header";
import { DomainList, type Domain } from "../../components/shared/domain-list";

export const Route = createFileRoute("/domains/")({
  component: DomainsPage,
});

const domains: Domain[] = [
  {
    name: "kemdirim.com",
    project: "Third party",
    status: "Active",
    addedAt: "Added 5 months ago",
    addedBy: "By Kemdirim Akujuobi",
  },
  {
    name: "kemdirim.com",
    project: "Third party",
    status: "Active",
    addedAt: "Added 5 months ago",
    addedBy: "By Kemdirim Akujuobi",
  },
  {
    name: "kem.design",
    project: "Third party",
    status: "Failed",
    addedAt: "Added 5 months ago",
    addedBy: "By Kemdirim Akujuobi",
  },
];

function DomainsPage() {
  return (
    <div className="max-w-[1000px]">
      <PageHeader title="Domains">
        Welcome to faster frontend deployments! You have used{" "}
        <span className="font-semibold text-dash-text-body">4/10</span> of your
        free deployments, you can upgrade to a Pro plan to access unlimited
        deployments.
      </PageHeader>

      <DomainList domains={domains} basePath="/domains" />
    </div>
  );
}
