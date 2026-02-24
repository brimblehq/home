import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { subHours } from "date-fns";
import config from "@/config";
import { getAccessTokenServerFn } from "@/server/auth/actions";

export interface LiveApplicationLogEntry {
  rawTimestampNs: string;
  epochMs: number;
  message: string;
  labels: Record<string, string>;
}

interface UseLiveApplicationLogsInput {
  container: string;
  searchQuery?: string | null;
  start?: Date;
  end?: Date;
  enabled?: boolean;
  limit?: number;
}

interface LokiStreamPayload {
  streams?: Array<{
    stream?: Record<string, string>;
    values?: Array<[string, string]>;
  }>;
}

function buildLokiQuery(input: { container: string; searchQuery?: string | null }) {
  const base = `{container="${input.container}"}`;
  const rawSearch = input.searchQuery?.trim();

  if (!rawSearch) {
    return base;
  }

  const escaped = rawSearch
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[()]/g, "")
    .replace(/\n/g, " ");

  return `${base} |~ "(?i)${escaped}"`;
}

function nsStringToEpochMs(raw: string): number {
  if (!raw) {
    return 0;
  }

  try {
    return Number(BigInt(raw) / 1000000n);
  } catch {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      return 0;
    }
    return Math.floor(parsed / 1_000_000);
  }
}

function parseSocketPayload(payload: unknown): LiveApplicationLogEntry[] {
  let parsed: LokiStreamPayload | null = null;

  if (typeof payload === "string") {
    try {
      parsed = JSON.parse(payload) as LokiStreamPayload;
    } catch {
      return [];
    }
  } else if (payload && typeof payload === "object") {
    parsed = payload as LokiStreamPayload;
  }

  const streams = Array.isArray(parsed?.streams) ? parsed.streams : [];
  const items: LiveApplicationLogEntry[] = [];

  for (const stream of streams) {
    const labels =
      stream.stream && typeof stream.stream === "object" ? stream.stream : {};
    const values = Array.isArray(stream.values) ? stream.values : [];

    for (const tuple of values) {
      if (!Array.isArray(tuple) || tuple.length < 2) {
        continue;
      }

      const rawTimestampNs = String(tuple[0] ?? "");
      const message = String(tuple[1] ?? "");
      if (!message.trim()) {
        continue;
      }

      items.push({
        rawTimestampNs,
        epochMs: nsStringToEpochMs(rawTimestampNs),
        message,
        labels,
      });
    }
  }

  return items;
}

function mergeUniqueLogs(
  current: LiveApplicationLogEntry[],
  incoming: LiveApplicationLogEntry[],
): LiveApplicationLogEntry[] {
  if (incoming.length === 0) {
    return current;
  }

  const map = new Map<string, LiveApplicationLogEntry>();

  for (const item of current) {
    map.set(`${item.rawTimestampNs}:${item.message}`, item);
  }

  for (const item of incoming) {
    map.set(`${item.rawTimestampNs}:${item.message}`, item);
  }

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    if (a.epochMs !== b.epochMs) {
      return a.epochMs - b.epochMs;
    }
    return a.rawTimestampNs.localeCompare(b.rawTimestampNs);
  });

  return merged.slice(-1000);
}

export function useLiveApplicationLogs(input: UseLiveApplicationLogsInput) {
  const [logs, setLogs] = useState<LiveApplicationLogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastTailKeyRef = useRef("");
  const pendingLogsRef = useRef<LiveApplicationLogEntry[]>([]);
  const isPausedRef = useRef(false);
  const [pendingLogsCount, setPendingLogsCount] = useState(0);

  const enabled = Boolean(input.enabled && input.container.trim());

  const lokiQuery = useMemo(
    () =>
      buildLokiQuery({
        container: input.container.trim(),
        searchQuery: input.searchQuery,
      }),
    [input.container, input.searchQuery],
  );

  const MAX_RANGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  const rangeStartMs = useMemo(() => {
    if (input.start instanceof Date) {
      return input.start.getTime();
    }

    return subHours(new Date(), 1).getTime();
  }, [input.start]);

  const rangeEndMs = useMemo(() => {
    if (!(input.end instanceof Date)) return null;

    const endMs = input.end.getTime();
    // Cap range to 30 days — Loki rejects anything larger
    if (endMs - rangeStartMs > MAX_RANGE_MS) {
      return rangeStartMs + MAX_RANGE_MS;
    }

    return endMs;
  }, [input.end, rangeStartMs]);

  const emitTail = useCallback(
    (force = false) => {
      const socket = socketRef.current;

      if (!enabled || !socket || !socket.connected) {
        return;
      }

      const params = {
        query: lokiQuery,
        start: String(rangeStartMs * 1_000_000),
        limit: String(input.limit ?? 150),
        delay_for: "0",
      };

      if (rangeEndMs !== null) {
        (params as Record<string, string>).end = String(rangeEndMs * 1_000_000);
      }

      const tailKey = JSON.stringify(params);

      if (!force && tailKey === lastTailKeyRef.current) {
        return;
      }

      lastTailKeyRef.current = tailKey;
      socket.emit("tail", params);
    },
    [enabled, input.limit, lokiQuery, rangeEndMs, rangeStartMs],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    pendingLogsRef.current = [];
    setPendingLogsCount(0);
    lastTailKeyRef.current = "";
  }, []);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
    if (pendingLogsRef.current.length > 0) {
      setLogs((prev) => mergeUniqueLogs(prev, pendingLogsRef.current));
      pendingLogsRef.current = [];
      setPendingLogsCount(0);
    }
    emitTail(true);
  }, [emitTail]);

  const reconnect = useCallback(() => {
    clearLogs();
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    setError(null);
    if (!socket.connected) {
      socket.connect();
      return;
    }

    emitTail(true);
  }, [clearLogs, emitTail]);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      setIsConnecting(false);
      return;
    }

    let cancelled = false;
    let socket: Socket | null = null;

    setIsConnecting(true);
    setError(null);

    (async () => {
      let token: string | null = null;
      try {
        token = await (getAccessTokenServerFn as unknown as (input: { data?: undefined }) => Promise<string | null>)({ data: undefined });
      } catch {
        // continue without token
      }

      if (cancelled) return;

      const parsed = new URL(config.logsSocketUrl);
      const pathPrefix = parsed.pathname === "/" ? "" : parsed.pathname;

      socket = io(`${parsed.origin}/loki`, {
        transports: ["websocket", "polling"],
        timeout: 10_000,
        reconnection: true,
        path: `${pathPrefix}/socket.io/`,
        auth: token ? { token } : undefined,
      });

      socketRef.current = socket;

      const handleConnect = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        lastTailKeyRef.current = "";
        if (!isPausedRef.current) {
          emitTail(true);
        }
      };

      const handleLogs = (payload: unknown) => {
        const items = parseSocketPayload(payload);
        if (items.length === 0) return;

        if (isPausedRef.current) {
          pendingLogsRef.current = mergeUniqueLogs(pendingLogsRef.current, items);
          setPendingLogsCount(pendingLogsRef.current.length);
          return;
        }

        setLogs((prev) => mergeUniqueLogs(prev, items));
      };

      function extractMessage(value: unknown): string {
        if (typeof value === "string") return value;
        if (value instanceof Error) return value.message;
        if (value && typeof value === "object" && "message" in value) return String((value as any).message);
        return "";
      }

      const handleDisconnect = (reason?: unknown) => {
        setIsConnected(false);
        setIsConnecting(false);
        const msg = extractMessage(reason);
        if (msg) {
          setError(msg);
          // Server rejected the query — stop reconnecting
          if (socket) {
            socket.disconnect();
          }
        }
        lastTailKeyRef.current = "";
      };

      const handleError = (evt: unknown) => {
        setIsConnected(false);
        setIsConnecting(false);
        setError(extractMessage(evt) || "Unable to stream application logs");
      };

      socket.on("connect", handleConnect);
      socket.on("connected", handleConnect);
      socket.on("logs", handleLogs);
      socket.on("disconnect", handleDisconnect);
      socket.on("disconnected", handleDisconnect);
      socket.on("error", handleError);
      socket.on("connect_error", handleError);
    })();

    return () => {
      cancelled = true;
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [emitTail, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    clearLogs();
    if (!isPausedRef.current) {
      emitTail(true);
    }
  }, [clearLogs, emitTail, enabled, input.container, lokiQuery, rangeEndMs, rangeStartMs]);

  return {
    logs,
    isPaused,
    isConnected,
    isConnecting,
    error,
    pendingLogsCount,
    clearLogs,
    pause,
    resume,
    reconnect,
  };
}
