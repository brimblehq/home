import { createServerFn } from "@tanstack/react-start";
import type { BackendApi } from "@/backend";
import { withTokenRefresh } from "@/server/shared/backend";

async function resolveWorkspaceTeam(api: BackendApi, workspace?: string) {
  const workspaceSlug = workspace?.trim().toLowerCase();
  if (!workspaceSlug) {
    throw new Error("Workspace is required");
  }

  const teams = await api.workspaces.list();
  const match = teams.items.find((item) => item.slug === workspaceSlug);

  if (!match?.id || !match.slug) {
    throw new Error("Workspace team not found");
  }

  return {
    teamId: match.id,
    teamName: match.slug,
  };
}

export const getWorkspaceTeamMembersServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as { workspace?: string } | undefined;
  return withTokenRefresh(async (api) => {
    const { teamId, teamName } = await resolveWorkspaceTeam(api, payload?.workspace);

    try {
      return await api.teams.getByName(teamName);
    } catch {
      return api.teams.getByName(teamId);
    }
  });
});

export const inviteWorkspaceTeamMembersServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        members?: string[];
      }
    | undefined;

  const members = Array.isArray(payload?.members)
    ? payload.members
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean)
    : [];

  if (!members.length) {
    throw new Error("At least one email is required");
  }

  return withTokenRefresh(async (api) => {
    const { teamId } = await resolveWorkspaceTeam(api, payload?.workspace);
    return api.teams.inviteMembers({ teamId, members });
  });
});

export const updateWorkspaceTeamProfileServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        name?: string;
        description?: string;
        avatarUrl?: string;
      }
    | undefined;

  const name = payload?.name?.trim();

  if (!name) {
    throw new Error("Workspace name is required");
  }

  return withTokenRefresh(async (api) => {
    const { teamId } = await resolveWorkspaceTeam(api, payload?.workspace);
    return api.teams.update(teamId, {
      name,
      description: payload?.description,
      avatarUrl: payload?.avatarUrl,
    });
  });
});

export const resendWorkspaceTeamInviteServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        email?: string;
      }
    | undefined;

  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  if (!email) {
    throw new Error("Invite email is required");
  }

  return withTokenRefresh(async (api) => {
    const { teamId } = await resolveWorkspaceTeam(api, payload?.workspace);
    return api.teams.inviteMembers({
      teamId,
      members: [email],
      resend: true,
    });
  });
});

export const removeWorkspaceTeamMemberServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        memberId?: string;
      }
    | undefined;

  const memberId = typeof payload?.memberId === "string" ? payload.memberId.trim() : "";
  if (!memberId) {
    throw new Error("Member ID is required");
  }

  return withTokenRefresh(async (api) => {
    const { teamId } = await resolveWorkspaceTeam(api, payload?.workspace);
    return api.teams.removeMember(teamId, memberId);
  });
});
