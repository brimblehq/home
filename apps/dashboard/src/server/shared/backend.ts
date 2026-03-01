import { createBackendApi, type BackendApi } from "@/backend";
import config from "@/config";
import {
  getServerAccessToken,
  getServerRefreshToken,
  setServerAuthCookies,
  clearServerAuthCookies,
} from "@/server/auth/cookies";

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

export function getServerBackendApi() {
  return createBackendApi({
    baseUrl: config.apiUrl,
    getAccessToken: getServerAccessToken,
  });
}

export async function withTokenRefresh<T>(
  fn: (api: BackendApi) => Promise<T>,
): Promise<T> {
  const accessToken = getServerAccessToken();
  const refreshToken = getServerRefreshToken();

  if (!accessToken && refreshToken) {
    console.info("[auth] withTokenRefresh bootstrap refresh start", {
      hasAccessToken: false,
      hasRefreshToken: true,
    });

    try {
      const bootstrapApi = getServerBackendApi();
      const session = await bootstrapApi.auth.refreshTokens(refreshToken);
      setServerAuthCookies(session);

      console.info("[auth] withTokenRefresh bootstrap refresh success", {
        hasNewAccessToken: Boolean(session.accessToken),
        hasNewRefreshToken: Boolean(session.refreshToken),
        userId: session.user?.id ?? null,
      });

      const freshApi = createBackendApi({
        baseUrl: config.apiUrl,
        getAccessToken: () => session.accessToken ?? null,
      });

      return await fn(freshApi);
    } catch (error: any) {
      console.warn("[auth] withTokenRefresh bootstrap refresh failed", {
        ...getErrorMeta(error),
        hasRefreshToken: true,
      });
      clearServerAuthCookies();
    }
  }

  const api = getServerBackendApi();
  try {
    return await fn(api);
  } catch (error: any) {
    if (error?.status !== 401) {
      throw error;
    }

    console.warn("[auth] withTokenRefresh request returned 401", {
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(getServerRefreshToken()),
      ...getErrorMeta(error),
    });

    const refreshToken = getServerRefreshToken();
    if (!refreshToken) {
      console.warn("[auth] withTokenRefresh cannot retry after 401: missing refresh token");
      throw error;
    }

    try {
      console.info("[auth] withTokenRefresh retry refresh start", {
        hasRefreshToken: true,
      });

      const session = await api.auth.refreshTokens(refreshToken);
      setServerAuthCookies(session);

      console.info("[auth] withTokenRefresh retry refresh success", {
        hasNewAccessToken: Boolean(session.accessToken),
        hasNewRefreshToken: Boolean(session.refreshToken),
        userId: session.user?.id ?? null,
      });

      const freshApi = createBackendApi({
        baseUrl: config.apiUrl,
        getAccessToken: () => session.accessToken ?? null,
      });
      return await fn(freshApi);
    } catch (refreshError: any) {
      console.warn("[auth] withTokenRefresh retry refresh failed", {
        ...getErrorMeta(refreshError),
        hasRefreshToken: true,
      });
      clearServerAuthCookies();
      throw error;
    }
  }
}
