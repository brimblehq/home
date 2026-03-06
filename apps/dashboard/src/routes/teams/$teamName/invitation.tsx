import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamName/invitation")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/",
      search: { workspace: params.teamName },
    });
  },
});
