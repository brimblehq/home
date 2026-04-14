import { useState, useEffect } from "react";

interface LogoColors {
  from: string;
  to: string;
  logoBg: string;
}

/**
 * Extracts the dominant color from a logo image and derives gradient colors.
 * Falls back to null if the image can't be loaded or analyzed.
 */
export function useLogoColor(imageUrl?: string): LogoColors | null {
  const [colors, setColors] = useState<LogoColors | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColors(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;

      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue;
          const brightness = (r + g + b) / 3;
          if (brightness > 230 || brightness < 25) continue;

          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;

          if (!buckets[key]) {
            buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
          }
          buckets[key].r += r;
          buckets[key].g += g;
          buckets[key].b += b;
          buckets[key].count += 1;
        }

        let dominant = { r: 100, g: 140, b: 230 };
        let maxCount = 0;

        for (const bucket of Object.values(buckets)) {
          if (bucket.count > maxCount) {
            maxCount = bucket.count;
            dominant = {
              r: Math.round(bucket.r / bucket.count),
              g: Math.round(bucket.g / bucket.count),
              b: Math.round(bucket.b / bucket.count),
            };
          }
        }

        // Boost saturation for more vivid gradients
        const { h, s, l } = rgbToHsl(dominant.r, dominant.g, dominant.b);
        const boostedS = Math.min(1, s * 1.3 + 0.1);
        const fromHsl = hslToHex(h, boostedS, Math.min(0.6, Math.max(0.45, l)));
        // Shift hue slightly for the "to" color
        const toHsl = hslToHex((h + 30) % 360, boostedS, Math.min(0.55, Math.max(0.35, l - 0.05)));
        // Dark muted version for logo background
        const bgHsl = hslToHex(h, Math.min(0.4, s * 0.6), 0.15);

        if (!cancelled) {
          setColors({ from: fromHsl, to: toHsl, logoBg: bgHsl });
        }
      } catch {
        // Canvas tainted or other error — keep null
      }
    };

    img.onerror = () => {
      // Keep null on failure
    };

    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return colors;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
