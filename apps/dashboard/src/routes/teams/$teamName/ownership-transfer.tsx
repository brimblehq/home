import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamName/ownership-transfer")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/",
      search: { workspace: params.teamName, transferOwnership: "1" },
    });
  },
});
