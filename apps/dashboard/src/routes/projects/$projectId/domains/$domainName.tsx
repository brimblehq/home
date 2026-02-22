import { createFileRoute } from "@tanstack/react-router";
import {
  DomainSettings,
  type DomainInfo,
} from "../../../../components/shared/domain-settings";

export const Route = createFileRoute("/projects/$projectId/domains/$domainName")(
  {
    component: ProjectDomainSettingsPage,
  },
);

function ProjectDomainSettingsPage() {
  const { projectId, domainName } = Route.useParams();

  // Mock data — replace with real API call
  const domain: DomainInfo = {
    domainName: decodeURIComponent(domainName),
    registrar: "Custom domain",
    nameserversType: "Custom domain",
    expirationDate: "NA",
    creator: "Kemdirim Akujuobi",
    dnsRecords: [
      { name: "site.com", type: "CNAME", ttl: "1day", value: "157.90.225.125" },
      { name: "site.com", type: "CNAME", ttl: "1day", value: "157.90.225.125" },
    ],
    nameservers: ["ns1.brimble.io", "ns2.brimble.io"],
    nameserverWarning:
      "You are currently using the wrong nameservers. Please use the provided nameservers below",
  };

  return (
    <DomainSettings
      domain={domain}
      backPath={`/projects/${projectId}/domains`}
    />
  );
}
