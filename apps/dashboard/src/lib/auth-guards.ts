import { redirect } from "@tanstack/react-router";
import { getCurrentSessionServerFn, refreshSessionServerFn } from "@/server/auth/actions";

const publicRoutes = new Set<string>(["/login", "/signup"]);

let cachedSession: unknown = undefined;
let cacheTimestamp = 0;
const SESSION_CACHE_MS = 60_000;

function buildNextPath(pathname: string, search?: string) {
  if (!search) {
    return pathname;
  }

  if (search.startsWith("?")) {
    return `${pathname}${search}`;
  }

  return `${pathname}?${search}`;
}

export function invalidateSessionCache() {
  cachedSession = undefined;
  cacheTimestamp = 0;
}

export async function enforceRouteAuth(pathname: string, search?: string) {
  const isPublicRoute = publicRoutes.has(pathname);

  const now = Date.now();
  let session: unknown;

  if (cachedSession !== undefined && now - cacheTimestamp < SESSION_CACHE_MS) {
    session = cachedSession;
  } else {
    session = await getCurrentSessionServerFn();

    if (!session) {
      session = await refreshSessionServerFn();
    }

    cachedSession = session || null;
    cacheTimestamp = now;
  }

  if (!session && !isPublicRoute) {
    invalidateSessionCache();
    throw redirect({
      to: "/login",
      search: {
        next: buildNextPath(pathname, search),
      },
    });
  }

  if (session && isPublicRoute) {
    throw redirect({ to: "/" });
  }

  return { session };
}

