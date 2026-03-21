import { toast as sonnerToast } from "sonner";
import { getHapticsEnabled } from "@/hooks/use-haptics";

function vibrate(pattern: number[]) {
  if (!getHapticsEnabled()) return;
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

const VIBRATE = {
  success: [30, 60, 40],
  error: [40, 40, 40, 40, 40],
  warning: [40, 100, 40],
};

export const hapticToast = Object.assign(
  (...args: Parameters<typeof sonnerToast>) => sonnerToast(...args),
  {
    ...sonnerToast,
    success: (...args: Parameters<typeof sonnerToast.success>) => {
      vibrate(VIBRATE.success);
      return sonnerToast.success(...args);
    },
    error: (...args: Parameters<typeof sonnerToast.error>) => {
      vibrate(VIBRATE.error);
      return sonnerToast.error(...args);
    },
    warning: (...args: Parameters<typeof sonnerToast.warning>) => {
      vibrate(VIBRATE.warning);
      return sonnerToast.warning(...args);
    },
  },
);
