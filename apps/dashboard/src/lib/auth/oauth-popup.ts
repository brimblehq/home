import { Realtime } from "ably";
import config from "@/config";

export type OauthProvider = "github" | "google";

export interface OauthAuthEventPayload {
  access_token: string;
  refresh_token?: string;
  id?: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  onboard?: {
    user?: boolean;
  };
}

const OAUTH_DEVICE_ID_KEY = "brimble.oauth.device_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

export function getOauthDeviceId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.sessionStorage.getItem(OAUTH_DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = randomId();
  window.sessionStorage.setItem(OAUTH_DEVICE_ID_KEY, next);
  return next;
}

function buildOauthUrl(provider: OauthProvider, deviceId: string) {
  const base = config.authApiUrl.endsWith("/")
    ? config.authApiUrl
    : `${config.authApiUrl}/`;
  const url = new URL(`signin/${provider}`, base);
  url.searchParams.set("device", deviceId);
  url.searchParams.set("type", "signin");
  return url.toString();
}

export async function startOauthPopup(
  provider: OauthProvider,
  opts?: { timeoutMs?: number },
): Promise<OauthAuthEventPayload> {
  const deviceId = getOauthDeviceId();
  const timeoutMs = opts?.timeoutMs ?? 120_000;

  const popup = window.open(
    buildOauthUrl(provider, deviceId),
    "_blank",
    "width=600,height=600",
  );

  if (!popup) {
    throw new Error("Popup blocked. Please allow popups and try again.");
  }

  const ably = new Realtime({
    authUrl: `${config.apiUrl}/v1/ably/token?clientId=${deviceId}`,
    clientId: deviceId,
  });

  const channel = ably.channels.get(deviceId);

  return await new Promise<OauthAuthEventPayload>((resolve, reject) => {
    let settled = false;

    let popupPollId: ReturnType<typeof setInterval> | undefined;

    const cleanup = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (popupPollId !== undefined) {
        clearInterval(popupPollId);
      }

      try {
        channel.unsubscribe("auth");
      } catch {
        // noop
      }

      try {
        ably.close();
      } catch {
        // noop
      }
    };

    const finish = (fn: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      fn();
    };

    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error("OAuth login timed out. Please try again.")));
    }, timeoutMs);

    popupPollId = setInterval(() => {
      if (popup.closed) {
        finish(() => reject(new Error("Sign-in window was closed.")));
      }
    }, 500);

    channel.subscribe("auth", (message: any) => {
      const data = message?.data as OauthAuthEventPayload | undefined;

      if (!data?.access_token) {
        finish(() => reject(new Error("Invalid OAuth response from server.")));
        return;
      }

      finish(() => resolve(data));
    });
  });
}
