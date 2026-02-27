import { useCallback, useSyncExternalStore } from "react";
import { Theme } from "../types/enums";

const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? Theme.Dark : Theme.Light;
}

function getServerSnapshot(): Theme {
  return Theme.Light;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === Theme.Dark);
  localStorage.setItem("theme", t);
  for (const cb of listeners) cb();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = document.documentElement.classList.contains("dark") ? Theme.Dark : Theme.Light;
    applyTheme(current === Theme.Dark ? Theme.Light : Theme.Dark);
  }, []);

  return { theme, setTheme, toggleTheme };
}
