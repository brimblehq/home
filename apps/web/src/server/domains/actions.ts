import { createServerFn } from "@tanstack/react-start";

export interface DomainSaleSearchResult {
  domainName: string;
  purchasable: boolean;
  purchasePrice?: number;
  renewalPrice?: number;
}

function readEnv(key: string): string | undefined {
  const fromVite =
    typeof import.meta !== "undefined"
      ? ((import.meta as ImportMeta).env?.[key] as string | undefined)
      : undefined;

  if (fromVite) return fromVite;

  const maybeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  if (maybeProcess?.env) {
    return maybeProcess.env[key];
  }

  return undefined;
}

function getSearchEndpoint() {
  const gatewayUrl =
    readEnv("NEXT_PUBLIC_GATEWAY_URL") ??
    readEnv("VITE_GATEWAY_URL") ??
    "https://api.brimble.io";

  return `${gatewayUrl.replace(/\/$/, "")}/core/v1/domains/sale/search`;
}

function getErrorMessage(payload: any): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  return "Domain search failed";
}

export const searchDomainSaleServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as { name?: string; limit?: number } | undefined;
  const name = payload?.name?.trim().toLowerCase();
  const limit =
    typeof payload?.limit === "number" && payload.limit > 0
      ? Math.floor(payload.limit)
      : undefined;

  if (!name) {
    return [] as DomainSaleSearchResult[];
  }

  const response = await fetch(getSearchEndpoint(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      ...(limit ? { limit } : {}),
    }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(json));
  }

  const root = json?.data?.data ?? json?.data ?? json ?? [];
  const rows = Array.isArray(root) ? root : [];

  return rows
    .map((row: any) => {
      const domainName =
        typeof row?.domainName === "string"
          ? row.domainName
          : typeof row?.name === "string"
            ? row.name
            : "";

      if (!domainName) {
        return null;
      }

      return {
        domainName,
        purchasable: Boolean(row?.purchasable),
        purchasePrice:
          typeof row?.purchasePrice === "number" ? row.purchasePrice : undefined,
        renewalPrice:
          typeof row?.renewalPrice === "number" ? row.renewalPrice : undefined,
      } satisfies DomainSaleSearchResult;
    })
    .filter(
      (item: DomainSaleSearchResult | null): item is DomainSaleSearchResult =>
        item !== null,
    );
});
