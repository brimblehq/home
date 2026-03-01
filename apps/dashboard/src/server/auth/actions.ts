import { createServerFn } from "@tanstack/react-start";
import { createBackendApi } from "@/backend";
import type {
  AuthSession,
  LoginInput,
  SignupInput,
  UserLookupInput,
  VerifyEmailCodeInput,
} from "@/backend/auth/types";
import config from "@/config";
import {
  clearServerAuthCookies,
  getServerAccessToken,
  getServerRefreshToken,
  setServerAuthCookies,
} from "./cookies";
import { getServerBackendApi } from "@/server/shared/backend";

function getErrorMeta(error: any) {
  return {
    status: error?.status ?? null,
    message:
      typeof error?.message === "string"
        ? error.message
        : typeof error?.data?.message === "string"
          ? error.data.message
          : null,
  };
}

export const requestLoginOtpServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const input = data as LoginInput;
    await getServerBackendApi().auth.login(input);
    return { ok: true } as const;
  },
);

export const startSignupServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const input = data as SignupInput;
    await getServerBackendApi().auth.signup(input);
    return { ok: true } as const;
  },
);

export const lookupAuthServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const input = data as UserLookupInput;
    return getServerBackendApi().auth.lookup(input);
  },
);

export const resendAuthCodeServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const input = data as LoginInput;
    await getServerBackendApi().auth.resendCode(input.email);
    return { ok: true } as const;
  },
);

export const verifyEmailCodeServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const input = data as VerifyEmailCodeInput;
    const session = await getServerBackendApi().auth.verifyEmailCode(input);
    setServerAuthCookies(session);

    console.info("[auth] verifyEmailCode success", {
      userId: session.user?.id ?? null,
      hasAccessToken: Boolean(session.accessToken),
      hasRefreshToken: Boolean(session.refreshToken),
    });

    return {
      ok: true as const,
      user: session.user,
    };
  },
);

export const logoutServerFn = createServerFn({ method: "POST" }).handler(async () => {
  const refreshToken = getServerRefreshToken();
  console.info("[auth] logout start", {
    hasAccessToken: Boolean(getServerAccessToken()),
    hasRefreshToken: Boolean(refreshToken),
  });

  await getServerBackendApi().auth.logout(refreshToken ?? undefined).catch((error: any) => {
    console.warn("[auth] logout endpoint failed", getErrorMeta(error));
  });

  clearServerAuthCookies();
  console.info("[auth] logout complete");
  return { ok: true } as const;
});

export const getAccessTokenServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return getServerAccessToken();
  },
);

export const getCurrentSessionServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getServerBackendApi().auth.getCurrentSession();

    if (!session) {
      return null;
    }

    return {
      user: session.user,
    };
  },
);

export const refreshSessionServerFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const refreshToken = getServerRefreshToken();
    if (!refreshToken) {
      console.warn("[auth] refreshSession skipped: missing refresh token");
      return null;
    }

    try {
      console.info("[auth] refreshSession start", {
        hasAccessToken: Boolean(getServerAccessToken()),
        hasRefreshToken: true,
      });

      const session = await getServerBackendApi().auth.refreshTokens(refreshToken);
      setServerAuthCookies(session);

      console.info("[auth] refreshSession success", {
        userId: session.user?.id ?? null,
        hasNewAccessToken: Boolean(session.accessToken),
        hasNewRefreshToken: Boolean(session.refreshToken),
      });

      return { user: session.user };
    } catch (error: any) {
      console.warn("[auth] refreshSession failed", getErrorMeta(error));
      clearServerAuthCookies();
      return null;
    }
  },
);

export const finalizeOauthSessionServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const payload = data as {
      accessToken: string;
      refreshToken?: string;
      user?: Partial<AuthSession["user"]>;
    };

    const backendWithOauthToken = createBackendApi({
      baseUrl: config.apiUrl,
      getAccessToken: () => payload.accessToken,
    });

    const currentSession = await backendWithOauthToken.auth.getCurrentSession();

    const session: AuthSession = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user:
        currentSession?.user ?? {
          id: String(payload.user?.id ?? ""),
          email: String(payload.user?.email ?? ""),
          username: payload.user?.username,
          firstName: payload.user?.firstName,
          lastName: payload.user?.lastName,
          company: payload.user?.company,
          name: payload.user?.name,
          onboarded: payload.user?.onboarded,
        },
    };

    setServerAuthCookies(session);

    console.info("[auth] finalizeOauthSession success", {
      userId: session.user?.id ?? null,
      hasAccessToken: Boolean(session.accessToken),
      hasRefreshToken: Boolean(session.refreshToken),
    });

    return {
      ok: true as const,
      user: session.user,
    };
  },
);
