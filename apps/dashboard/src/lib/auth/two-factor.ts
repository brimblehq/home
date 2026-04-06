export interface TwoFactorChallenge {
  challengeToken: string;
  expiresIn: number;
}

const DEFAULT_TWO_FACTOR_EXPIRES_IN = 300;

function toPositiveInt(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TWO_FACTOR_EXPIRES_IN;
  }
  return parsed;
}

export function extractTwoFactorChallenge(payload: unknown): TwoFactorChallenge | null {
  const data = payload as
    | {
        requires_2fa?: boolean;
        requires2fa?: boolean;
        requiresTwoFactor?: boolean;
        challenge_token?: string;
        challengeToken?: string;
        expires_in?: number | string;
        expiresIn?: number | string;
      }
    | null
    | undefined;

  const challengeToken = String(
    data?.challenge_token ?? data?.challengeToken ?? "",
  ).trim();
  const requiresTwoFactor = Boolean(
    data?.requires_2fa ?? data?.requires2fa ?? data?.requiresTwoFactor,
  );

  if (!requiresTwoFactor && !challengeToken) {
    return null;
  }

  if (!challengeToken) {
    return null;
  }

  return {
    challengeToken,
    expiresIn: toPositiveInt(data?.expires_in ?? data?.expiresIn),
  };
}

export function parseTwoFactorChallengeHash(hash: string): TwoFactorChallenge | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) {
    return null;
  }

  const params = new URLSearchParams(raw);
  const challengeToken = params.get("challenge_token")?.trim();
  if (!challengeToken) {
    return null;
  }

  return {
    challengeToken,
    expiresIn: toPositiveInt(params.get("expires_in")),
  };
}

export function buildTwoFactorChallengeUrl(
  challenge: TwoFactorChallenge,
  opts?: { next?: string | null },
): string {
  const next = opts?.next?.trim();
  const search = next ? `?next=${encodeURIComponent(next)}` : "";
  const hash = new URLSearchParams({
    challenge_token: challenge.challengeToken,
    expires_in: String(toPositiveInt(challenge.expiresIn)),
  }).toString();

  return `/2fa${search}#${hash}`;
}
