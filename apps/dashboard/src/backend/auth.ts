import type { ApiClient } from "./types";
import type {
  AuthApi,
  AuthSession,
  LoginInput,
  SignupInput,
  UserLookupInput,
  UserLookupResult,
  VerifyEmailCodeInput,
} from "./auth/types";
export type {
  AuthApi,
  AuthSession,
  AuthUser,
  LoginInput,
  SignupInput,
  UserLookupInput,
  UserLookupResult,
  VerifyEmailCodeInput,
} from "./auth/types";

export function createAuthApi(client: ApiClient): AuthApi {
  const endpoints = {
    login: "/auth/beta/login",
    signup: "/auth/beta/signup",
    verifyEmail: "/auth/beta/verify-email",
    refresh: "/auth/beta/refresh",
    logoutAuth: "/auth/beta/logout",
    me: "/auth/user/me",
    lookup: "/auth/beta/lookup",
  } as const;

  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  const mapSession = (payload: any): AuthSession => {
    const data = payload?.data?.data ?? payload?.data ?? payload;
    const firstName = data?.first_name ?? data?.firstName;
    const lastName = data?.last_name ?? data?.lastName;

    return {
      accessToken: data?.access_token ?? data?.accessToken,
      refreshToken: data?.refresh_token ?? data?.refreshToken,
      user: {
        id: String(data?.id ?? ""),
        email: String(data?.email ?? ""),
        username: data?.username,
        firstName,
        lastName,
        company: data?.company,
        name: [firstName, lastName].filter(Boolean).join(" ") || data?.name,
        onboarded: Boolean(data?.onboard?.user ?? data?.onboarded),
      },
    };
  };

  return {
    async login(input) {
      await client.request(endpoints.login, {
        method: "POST",
        body: { email: normalizeEmail(input.email) },
      });
    },
    async signup(input) {
      await client.request(endpoints.signup, {
        method: "POST",
        body: {
          email: normalizeEmail(input.email),
          username: input.username.trim(),
          first_name: input.firstName?.trim() || input.username.trim(),
          last_name: input.lastName?.trim() || undefined,
          company: input.company?.trim() || undefined,
        },
      });
    },
    async verifyEmailCode(input) {
      const response = await client.request(endpoints.verifyEmail, {
        method: "POST",
        body: {
          email: normalizeEmail(input.email),
          access_code: input.code,
        },
      });

      return mapSession(response);
    },
    async resendCode(email) {
      await client.request(endpoints.login, {
        method: "POST",
        body: { email: normalizeEmail(email) },
      });
    },
    async lookup(input) {
      let query: { email: string } | { username: string } | null = null;

      if (input.email?.trim()) {
        query = { email: normalizeEmail(input.email) };
      } else if (input.username?.trim()) {
        query = { username: input.username.trim() };
      }

      if (!query) {
        return { available: false, message: "Email or username is required" };
      }

      try {
        await client.request(endpoints.lookup, {
          method: "GET",
          query,
        });
        return { available: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Lookup request failed";
        return { available: false, message };
      }
    },
    async refreshTokens(refreshToken) {
      const response = await client.request(endpoints.refresh, {
        method: "POST",
        body: { refresh_token: refreshToken },
        headers: { Authorization: "" },
      });
      return mapSession(response);
    },
    async logout(refreshToken?) {
      await client.request(endpoints.logoutAuth, {
        method: "POST",
        body: refreshToken ? { refresh_token: refreshToken } : {},
      });
    },
    async getCurrentSession() {
      try {
        const response = await client.request(endpoints.me, {
          method: "GET",
        });
        return mapSession(response);
      } catch (error: any) {
        if (error?.status === 401 || error?.status === 403) {
          return null;
        }

        throw error;
      }
    },
  };
}
