import { Route as RootRoute } from "@/routes/__root";

export function WelcomeSection() {
  const { settingsSnapshot } = RootRoute.useLoaderData() ?? ({} as any);
  const firstName = settingsSnapshot?.profile?.firstName?.trim() || "there";

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-dash-text-strong">{`Welcome ${firstName},`}</h1>
      <p className="mt-1 max-w-[552px] text-sm text-dash-text-faded">
        This is your deployment home base. Review recent activity, monitor key usage, and jump back into your top projects quickly.
      </p>
    </div>
  );
}
