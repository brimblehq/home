import config from "@/config";
import { createBackendApi } from ".";

function readAccessTokenCookie(): string | null {
  if (typeof document === "undefined") return null;

  const key = `${config.accessTokenCookie}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(key));

  if (!match) return null;
  return decodeURIComponent(match.slice(key.length));
}

export const backendApi = createBackendApi({
  baseUrl: config.apiUrl,
  getAccessToken: readAccessTokenCookie,
});
