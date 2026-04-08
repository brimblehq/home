import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { AnimatePresence, motion } from "motion/react";
import { SegmentedToggle } from "@/components/observability/segmented-toggle";
import { useTheme } from "@/hooks/use-theme";
import { Theme } from "@/types/enums";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO 3166-1 alpha-2 → full topojson country `name` (covers the most common entries
// returned by Umami; missing entries fall through with no highlight).
const ISO2_TO_NAME: Record<string, string> = {
  US: "United States of America",
  GB: "United Kingdom",
  NG: "Nigeria",
  CA: "Canada",
  MX: "Mexico",
  BW: "Botswana",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  BR: "Brazil",
  AR: "Argentina",
  IN: "India",
  CN: "China",
  JP: "Japan",
  KR: "South Korea",
  AU: "Australia",
  NZ: "New Zealand",
  ZA: "South Africa",
  KE: "Kenya",
  EG: "Egypt",
  TR: "Turkey",
  RU: "Russia",
  PL: "Poland",
  SE: "Sweden",
  FI: "Finland",
  NO: "Norway",
  DK: "Denmark",
  IE: "Ireland",
  PT: "Portugal",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  TH: "Thailand",
  ID: "Indonesia",
  PH: "Philippines",
  MY: "Malaysia",
  VN: "Vietnam",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  IL: "Israel",
};

export interface CountryVisitor {
  code: string;
  visitors: number;
}

function buildCountryMap(countries: CountryVisitor[]): {
  byName: Record<string, number>;
  max: number;
} {
  const byName: Record<string, number> = {};
  let max = 0;
  for (const c of countries) {
    const name = ISO2_TO_NAME[c.code.toUpperCase()];
    if (!name) continue;
    byName[name] = (byName[name] ?? 0) + c.visitors;
    if (byName[name] > max) max = byName[name];
  }
  return { byName, max };
}

function fillFor(visitors: number | undefined, max: number, isDark: boolean): string {
  if (!visitors || max <= 0) return isDark ? "#1a2230" : "#eef2f7";
  const intensity = Math.min(1, visitors / max);
  const alpha = 0.25 + intensity * 0.65;
  return `rgba(255, 122, 0, ${alpha})`;
}

function FlatMap({ countries }: { countries: CountryVisitor[] }) {
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const stroke = isDark ? "#3b6cf3" : "#9bb6ee";
  const { byName, max } = buildCountryMap(countries);

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ scale: 130, center: [0, 25] }}
      width={980}
      height={420}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const name = geo.properties?.name as string | undefined;
            const visitors = name ? byName[name] : undefined;
            const fill = fillFor(visitors, max, isDark);
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill,
                    stroke,
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                  hover: {
                    fill: "rgba(255, 122, 0, 0.95)",
                    stroke,
                    strokeWidth: 0.5,
                    outline: "none",
                    cursor: "pointer",
                  },
                  pressed: {
                    fill: "rgba(255, 122, 0, 1)",
                    stroke,
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}

const SIZE = 600;

function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: SIZE * 2,
      height: SIZE * 2,
      phi: 0,
      theta: 0.2,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: isDark ? 6 : 4,
      baseColor: isDark ? [0.82, 0.83, 0.88] : [0.4, 0.42, 0.48],
      markerColor: isDark ? [0.82, 0.83, 0.88] : [0.4, 0.42, 0.48],
      glowColor: isDark ? [0.13, 0.14, 0.18] : [0.86, 0.87, 0.92],
      markers: [],
    } as any);

    function animate() {
      if (pointerInteracting.current === null) {
        phiRef.current += 0.003;
      }
      (globe as any).update({
        phi: phiRef.current + pointerInteractionMovement.current,
      });
      frame = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(frame);
      globe.destroy();
    };
  }, [isDark]);

  return (
    <div
      style={{
        height: "100%",
        maxWidth: "100%",
        position: "relative",
        aspectRatio: "1 / 1",
      }}
    >
      <canvas
        ref={canvasRef}
        width={SIZE * 2}
        height={SIZE * 2}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta / 200;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta / 100;
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "grab",
          contain: "layout paint size",
          touchAction: "none",
        }}
      />
    </div>
  );
}

export function VisitorsMap({ countries = [] }: { countries?: CountryVisitor[] }) {
  const [mode, setMode] = useState<"Map" | "Globe">("Map");

  return (
    <div className="flex flex-col rounded-[4px] border-[0.5px] border-dash-border">
      <div className="flex flex-col gap-2 border-b-[0.5px] border-dash-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-dash-text-strong">Where your visitors are</h3>
          <p className="text-xs font-light text-dash-text-faded">
            {mode === "Map"
              ? "Geographic distribution over the last 7 days"
              : "Drag to rotate · last 7 days"}
          </p>
        </div>
        <SegmentedToggle
          options={["Map", "Globe"]}
          value={mode}
          onChange={(v) => setMode(v as "Map" | "Globe")}
        />
      </div>
      <div
        className="relative flex w-full items-center justify-center overflow-hidden bg-dash-bg-elevated px-4 py-6"
        style={{ height: 460 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-full w-full items-center justify-center"
          >
            {mode === "Map" ? <FlatMap countries={countries} /> : <Globe />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
