import type { AuthSession } from "@/backend";
import config from "@/config";

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;

  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Strict${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict`;
}

export function persistAuthSession(session: AuthSession) {
  if (session.accessToken) {
    setCookie(config.accessTokenCookie, session.accessToken, config.accessTokenTtl);
  }

  if (session.refreshToken) {
    setCookie(config.refreshTokenCookie, session.refreshToken, config.refreshTokenTtl);
  }
}

export function clearAuthSessionCookies() {
  clearCookie(config.accessTokenCookie);
  clearCookie(config.refreshTokenCookie);
}

