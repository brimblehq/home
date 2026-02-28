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

export function getServerRefreshToken(): string | null {
  return getCookie(config.refreshTokenCookie) ?? null;
}

export function setServerAuthCookies(session: AuthSession) {
  if (session.accessToken) {
    setCookie(config.accessTokenCookie, session.accessToken, {
      ...cookieOptions,
      maxAge: config.accessTokenTtl,
    });
  }

  if (session.refreshToken) {
    setCookie(config.refreshTokenCookie, session.refreshToken, {
      ...cookieOptions,
      maxAge: config.refreshTokenTtl,
    });
  }
}

export function clearServerAuthCookies() {
  deleteCookie(config.accessTokenCookie, cookieOptions);
  deleteCookie(config.refreshTokenCookie, cookieOptions);
}

