import { useState, useCallback, useRef } from "react";

const STORAGE_PREFIX = "brimble:push-notifications";

function storageKey(workspace?: string | null): string {
  const scope = workspace?.trim() || "__personal__";
  return `${STORAGE_PREFIX}:${scope}`;
}

export function isPushEnabled(workspace?: string | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey(workspace)) === "true";
  } catch {
    return false;
  }
}

export function setPushEnabled(enabled: boolean, workspace?: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(workspace), String(enabled));
  } catch {
    // localStorage may be unavailable
  }
}

export function usePushNotification(workspace?: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && window.Notification) {
      return window.Notification.permission;
    }
    return "denied";
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !window.Notification) {
      return "denied";
    }
    const result = await window.Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendNotification = useCallback(
    ({ title, body, onClick }: { title: string; body: string; onClick?: () => void }) => {
      if (typeof window === "undefined" || !window.Notification) return;
      if (window.Notification.permission !== "granted") return;
      if (!isPushEnabled(workspace)) return;

      const notification = new window.Notification(title, {
        body,
        icon: "/images/brimble.svg",
        badge: "/images/brimble.svg",
      });

      notification.onclick = () => {
        window.focus();
        onClick?.();
      };

      timeoutRef.current = setTimeout(() => notification.close(), 10_000);

      notification.addEventListener("close", () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      });
    },
    [workspace],
  );

  return { permission, requestPermission, sendNotification };
}
