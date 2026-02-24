import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import type { AuthSession } from "@/backend";
import config from "@/config";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: isProduction,
  path: "/",
};

export function getServerAccessToken(): string | null {
  return getCookie(config.accessTokenCookie) ?? null;
}

export function setServerAuthCookies(session: AuthSession) {
  if (session.accessToken) {
    setCookie(config.accessTokenCookie, session.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 14,
    });
  }

  if (session.refreshToken) {
    setCookie(config.refreshTokenCookie, session.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30 * 12,
    });
  }
}

export function clearServerAuthCookies() {
  deleteCookie(config.accessTokenCookie, cookieOptions);
  deleteCookie(config.refreshTokenCookie, cookieOptions);
}

