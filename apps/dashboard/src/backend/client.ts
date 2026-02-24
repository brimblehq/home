import axios, { type AxiosInstance, type AxiosError } from "axios";
import { BackendApiError } from "./errors";
import type { ApiClient, ApiRequestOptions } from "./types";

export interface BackendClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
}

export interface BackendClient extends ApiClient {
  readonly config: BackendClientConfig;
}

export function createBackendClient(config: BackendClientConfig): BackendClient {
  const http: AxiosInstance = axios.create({
    baseURL: config.baseUrl,
    timeout: 25_000,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const buildUrl = (path: string, query?: ApiRequestOptions["query"]) => {
    let url: URL;

    if (path.startsWith("http")) {
      url = new URL(path);
    } else if (path.startsWith("/")) {
      url = new URL(path, config.baseUrl);
    } else {
      url = new URL(path, `${config.baseUrl.replace(/\/$/, "")}/`);
    }

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  };

  const getErrorMessage = (payload: any, fallback: string) => {
    if (!payload) return fallback;
    if (typeof payload === "string") return payload;
    if (typeof payload?.error === "string") return payload.error;
    if (typeof payload?.message === "string") return payload.message;
    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      const first = payload.errors[0];
      if (typeof first?.msg === "string") return first.msg;
      if (typeof first?.message === "string") return first.message;
    }
    return fallback;
  };

  return {
    config,
    async request<TResponse = unknown, TBody = unknown>(
      path: string,
      options?: ApiRequestOptions<TBody>,
    ): Promise<TResponse> {
      const method = options?.method ?? "GET";
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      };

      const accessToken = await config.getAccessToken?.();
      if (accessToken && !headers.Authorization) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      try {
        const response = await http.request<TResponse>({
          url: buildUrl(path, options?.query),
          method,
          headers,
          signal: options?.signal,
          data: method === "GET" ? undefined : options?.body,
        });

        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<any>;
        const payload = axiosError.response?.data;
        throw new BackendApiError({
          code:
            typeof (payload as any)?.code === "string"
              ? (payload as any).code
              : `HTTP_${axiosError.response?.status ?? 500}`,
          message: getErrorMessage(
            payload,
            axiosError.response?.statusText || axiosError.message || "Request failed",
          ),
          details: payload,
        });
      }
    },
  };
}
