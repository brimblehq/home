export type ClientGeoInfo = {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
};

let cached: ClientGeoInfo | null = null;
let pending: Promise<ClientGeoInfo | null> | null = null;

export function getClientGeo(): Promise<ClientGeoInfo | null> {
  if (cached) return Promise.resolve(cached);
  if (typeof window === "undefined") return Promise.resolve(null);

  if (!pending) {
    pending = fetch("https://ipinfo.io/json", { signal: AbortSignal.timeout(3000) })
      .then((res) => res.json())
      .then((data) => {
        cached = {
          ip: data.ip ?? "",
          city: data.city,
          region: data.region,
          country: data.country,
          timezone: data.timezone,
        };
        return cached;
      })
      .catch(() => null);
  }

  return pending;
}

export function getCachedClientGeo() {
  return cached;
}
