import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { siteConfig } from "@/config/site";

const buildLines = [
  { text: "$ brimble deploy --prod", className: "text-white/60" },
  { text: "▸ Detecting framework…  Next.js", className: "text-white/35" },
  { text: "▸ Installing deps…      done", className: "text-white/35" },
  { text: "▸ Compiling bundles…    done", className: "text-white/35" },
];

const LINE_DELAY = 0.35;
const LINE_STAGGER = 0.16;
const USAGE_DELAY = LINE_DELAY + buildLines.length * LINE_STAGGER + 0.08;
const BAR_DELAY = USAGE_DELAY + 0.15;
const BAR_DURATION = 1.0;
const SUCCESS_DELAY = BAR_DELAY + BAR_DURATION - 0.15;
const CURSOR_DELAY = SUCCESS_DELAY + 0.3;

export function CodePreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="border-t border-[#e6e6e6] dark:border-white/10 bg-brimble-surface px-6 py-20 transition-colors duration-300">
      <div ref={ref} className="mx-auto flex max-w-[720px] flex-col items-center gap-14">
        {/* Terminal Window */}
        <motion.div
          className="w-full overflow-hidden rounded-[13.25px] bg-[#222528] shadow-[var(--shadow-dark-big)]"
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Title bar */}
          <div className="relative h-[29px] bg-[#222528] px-3 pt-2">
            <div className="flex gap-[6.6px]">
              <span className="size-[10px] rounded-full bg-[#ff5f57]" />
              <span className="size-[10px] rounded-full bg-[#febc2e]" />
              <span className="size-[10px] rounded-full bg-[#28c840]" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex flex-col">
              <div className="h-[0.83px] w-full bg-[#282c2f]" />
              <div className="h-[0.83px] w-full bg-[#0c0b10]" />
              <div className="h-[0.83px] w-full bg-[#2f3338]" />
            </div>
          </div>

          {/* Build log content */}
          <div className="border-t border-[#31363a] px-3 pb-4 pt-3">
            {/* Build step lines — staggered slide-in */}
            {buildLines.map((line, i) => (
              <motion.p
                key={i}
                className={`font-mono text-xs leading-5 tracking-[-0.02px] ${line.className}`}
                initial={{ opacity: 0, x: -8 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.3,
                  delay: LINE_DELAY + i * LINE_STAGGER,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {line.text}
              </motion.p>
            ))}

            {/* Usage indicator */}
            <motion.p
              className="mt-1 font-mono text-xs uppercase leading-5 tracking-[-0.02px] text-[#ff9b01]"
              initial={{ opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.3,
                delay: USAGE_DELAY,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              23GB used / 25GB
            </motion.p>

            {/* Progress bar fill */}
            <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-[#28c840]"
                initial={{ width: "0%" }}
                animate={isInView ? { width: "100%" } : {}}
                transition={{
                  duration: BAR_DURATION,
                  delay: BAR_DELAY,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>

            {/* Success line with spring checkmark */}
            <motion.div
              className="mt-2 flex items-center gap-1.5"
              initial={{ opacity: 0, y: 4 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.4,
                delay: SUCCESS_DELAY,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <motion.span
                className="inline-flex size-[14px] items-center justify-center rounded-full bg-[#28c840]/20"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 14,
                  delay: SUCCESS_DELAY + 0.08,
                }}
              >
                <span className="text-[8px] leading-none text-[#28c840]">✓</span>
              </motion.span>
              <p className="font-mono text-xs leading-5 tracking-[-0.02px] text-[#28c840]">Deployed → app.brimble.io</p>
            </motion.div>

            {/* Blinking cursor */}
            <motion.span
              className="mt-1 inline-block h-[13px] w-[7px] rounded-[1px] bg-white/50"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: [0, 1, 1, 0, 0] } : {}}
              transition={{
                delay: CURSOR_DELAY,
                duration: 1,
                repeat: Infinity,
                times: [0, 0.01, 0.5, 0.51, 1],
                ease: "linear",
              }}
            />
          </div>
        </motion.div>

        {/* Text Content */}
        <div className="flex w-full flex-col gap-6">
          <motion.h2
            className="text-balance font-heading text-[48px] font-medium leading-[54px] tracking-[-0.576px] text-brimble-black"
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {siteConfig.codePreview.heading}
          </motion.h2>
          <motion.div
            className="flex gap-6"
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {siteConfig.codePreview.descriptions.map((desc, i) => (
              <p
                key={i}
                className="flex-1 text-pretty font-body text-base leading-[21px] tracking-[-0.32px] text-black/60 dark:text-white/60"
              >
                {desc}
              </p>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
