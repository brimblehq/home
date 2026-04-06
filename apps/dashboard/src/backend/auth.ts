import type { ApiClient } from "./types";
import type {
  AuthApi,
  AuthSession,
  ConfirmDeleteAccountInput,
  TwoFactorCodeInput,
  TwoFactorSetup,
  TwoFactorStatus,
  VerifyEmailCodeResult,
} from "./auth/types";
export type {
  AuthApi,
  AuthSession,
  AuthUser,
  ConfirmDeleteAccountInput,
  LoginInput,
  SignupInput,
  TwoFactorCodeInput,
  TwoFactorSetup,
  TwoFactorStatus,
  UserLookupInput,
  UserLookupResult,
  VerifyEmailCodeInput,
  VerifyEmailCodeResult,
  VerifyTwoFactorChallengeInput,
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
    deleteAccount: "/auth/user/delete-account",
    twoFactorStatus: "/auth/2fa/status",
    twoFactorSetup: "/auth/2fa/setup",
    twoFactorVerifySetup: "/auth/2fa/verify-setup",
    twoFactorDisable: "/auth/2fa/disable",
    twoFactorVerify: "/auth/2fa/verify",
    twoFactorRegenerateRecoveryCodes: "/auth/2fa/recovery-codes/regenerate",
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

  const parseTwoFactorChallenge = (payload: any): VerifyEmailCodeResult | null => {
    const data = payload?.data?.data ?? payload?.data ?? payload;
    const challengeToken = String(
      data?.challenge_token ?? data?.challengeToken ?? "",
    ).trim();
    const requiresTwoFactor = Boolean(
      data?.requires_2fa ?? data?.requiresTwoFactor ?? data?.requires2fa,
    );

    if (!requiresTwoFactor && !challengeToken) {
      return null;
    }

    if (!challengeToken) {
      throw new Error("Two-factor challenge token is missing");
    }

    const expiresIn = Number.parseInt(
      String(data?.expires_in ?? data?.expiresIn ?? "300"),
      10,
    );

    return {
      requiresTwoFactor: true,
      challengeToken,
      expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 300,
    };
  };

  const mapTwoFactorStatus = (payload: any): TwoFactorStatus => {
    const data = payload?.data?.data ?? payload?.data ?? payload;
    return {
      enabled: Boolean(data?.enabled),
      hasRecoveryCodes: Boolean(
        data?.has_recovery_codes ?? data?.hasRecoveryCodes,
      ),
      recoveryCodesRemaining: Number(
        data?.recovery_codes_remaining ?? data?.recoveryCodesRemaining ?? 0,
      ),
    };
  };

  const mapTwoFactorSetup = (payload: any): TwoFactorSetup => {
    const data = payload?.data?.data ?? payload?.data ?? payload;
    const recoveryCodes = Array.isArray(data?.recovery_codes)
      ? data.recovery_codes
      : Array.isArray(data?.recoveryCodes)
        ? data.recoveryCodes
        : [];

    return {
      secret: String(data?.secret ?? ""),
      provisioningUri: String(
        data?.provisioning_uri ?? data?.provisioningUri ?? "",
      ),
      qrCode: String(data?.qr_code ?? data?.qrCode ?? ""),
      recoveryCodes: recoveryCodes
        .map((entry: unknown) => String(entry ?? "").trim())
        .filter(Boolean),
    };
  };

  const mapRecoveryCodes = (payload: any): string[] => {
    const data = payload?.data?.data ?? payload?.data ?? payload;
    const recoveryCodes = Array.isArray(data?.recovery_codes)
      ? data.recovery_codes
      : Array.isArray(data?.recoveryCodes)
        ? data.recoveryCodes
        : [];

    return recoveryCodes
      .map((entry: unknown) => String(entry ?? "").trim())
      .filter(Boolean);
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

      const challenge = parseTwoFactorChallenge(response);
      if (challenge) {
        return challenge;
      }

      return {
        requiresTwoFactor: false,
        session: mapSession(response),
      };
    },
    async verifyTwoFactorChallenge(input) {
      const response = await client.request(endpoints.twoFactorVerify, {
        method: "POST",
        body: {
          challenge_token: input.challengeToken,
          code: String(input.code ?? "").trim(),
        },
        headers: { Authorization: "" },
      });

      return mapSession(response);
    },
    async getTwoFactorStatus() {
      const response = await client.request(endpoints.twoFactorStatus, {
        method: "GET",
      });
      return mapTwoFactorStatus(response);
    },
    async startTwoFactorSetup() {
      const response = await client.request(endpoints.twoFactorSetup, {
        method: "POST",
      });
      return mapTwoFactorSetup(response);
    },
    async verifyTwoFactorSetup(input: TwoFactorCodeInput) {
      await client.request(endpoints.twoFactorVerifySetup, {
        method: "POST",
        body: {
          code: String(input.code ?? "").trim(),
        },
      });
    },
    async disableTwoFactor(input: TwoFactorCodeInput) {
      await client.request(endpoints.twoFactorDisable, {
        method: "POST",
        body: {
          code: String(input.code ?? "").trim(),
        },
      });
    },
    async regenerateTwoFactorRecoveryCodes(input: TwoFactorCodeInput) {
      const response = await client.request(endpoints.twoFactorRegenerateRecoveryCodes, {
        method: "POST",
        body: {
          code: String(input.code ?? "").trim(),
        },
      });
      return mapRecoveryCodes(response);
    },
    async resendCode(email) {
      await client.request(endpoints.login, {
        method: "POST",
        body: { email: normalizeEmail(email) },
      });
    },
    async requestDeleteAccountCode(turnstileToken?: string) {
      await client.request(endpoints.deleteAccount, {
        method: "POST",
        body: { turnstile_token: turnstileToken },
      });
    },
    async confirmDeleteAccount(input: ConfirmDeleteAccountInput) {
      const normalizedCode = String(input.accessCode ?? "").trim();
      await client.request(endpoints.deleteAccount, {
        method: "DELETE",
        body: {
          access_code: Number(normalizedCode),
        },
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
