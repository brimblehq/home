import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { cn, Button } from "@brimble/ui";
import { siteConfig } from "@/config/site";
import { ChevronDown, Globe, Database, Sparkles } from "lucide-react";
import balloons from "@/assets/images/balloons.png";

const stepIcons = [Globe, Database, Sparkles];

export function Steps() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="bg-brimble-surface transition-colors duration-300 px-6 py-20">
      <div ref={ref} className="mx-auto flex max-w-[720px] flex-col gap-14">
        {/* Stacking Cards + Expand Button */}
        <div className="flex flex-col items-center gap-5">
          {/* Card Stack */}
          <div className="relative flex w-full flex-col items-center">
            {siteConfig.steps.map((step, i) => {
              const isStacked = !expanded && i > 0;

              return (
                <motion.div
                  key={i}
                  className={cn(
                    "relative flex w-full items-center gap-3.5 rounded-3xl p-4 shadow-[0px_0px_1px_0px_rgba(0,0,0,0.3),0px_2px_2px_0px_rgba(0,0,0,0.08)] dark:shadow-[0px_0px_1px_0px_rgba(255,255,255,0.1),0px_2px_2px_0px_rgba(0,0,0,0.3)]",
                    i === 0 && "z-30 bg-brimble-surface dark:bg-[#1e2023]",
                    i === 1 && "z-20 bg-[#fafafa] dark:bg-[#1a1c1e]",
                    i === 2 && "z-10 bg-[#f7f7f7] dark:bg-[#161819]"
                  )}
                  initial={{ opacity: 0, y: 20 + i * 8 }}
                  animate={
                    isInView
                      ? {
                          opacity: 1,
                          y: 0,
                          marginTop: isStacked ? -76 : i === 0 ? 0 : 12,
                          width: isStacked
                            ? `${100 - i * 7}%`
                            : "100%",
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.6,
                    delay: expanded ? i * 0.06 : i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                    marginTop: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                    width: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  }}
                  whileHover={
                    !isStacked
                      ? { scale: 1.01, transition: { duration: 0.2 } }
                      : undefined
                  }
                >
                  <motion.div
                    className="flex size-[60px] shrink-0 items-center justify-center rounded-2xl bg-[#222528] dark:bg-white/15"
                    animate={{ opacity: isStacked ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {(() => {
                      const Icon = stepIcons[i];
                      return <Icon className="size-6 text-white" strokeWidth={1.5} />;
                    })()}
                  </motion.div>
                  <motion.div
                    className="flex flex-col"
                    animate={{ opacity: isStacked ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="font-body text-xl font-medium leading-[30px] tracking-[-0.24px] text-black dark:text-white">
                      {step.title}
                    </p>
                    <p className="font-body text-base leading-[21px] tracking-[-0.32px] text-black/60 dark:text-white/60">
                      {step.description}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Expand / Collapse button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button
              variant="pill-light"
              size="sm"
              className="gap-1.5 rounded-full transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Collapse" : "Expand"}
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex"
              >
                <ChevronDown className="size-3.5" />
              </motion.span>
            </Button>
          </motion.div>
        </div>

        {/* Heading + Description */}
        <motion.div
          className="flex flex-col items-start gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-balance font-heading text-[48px] font-medium leading-[54px] tracking-[-0.576px] text-brimble-black">
            {siteConfig.stepsSection.heading}
          </h2>
          <p className="text-pretty font-body text-base leading-[21px] tracking-[-0.32px] text-black/60 dark:text-white/60">
            {siteConfig.stepsSection.description}
          </p>
        </motion.div>

        {/* Balloon illustration */}
        <div className="brightness-[1.02] mix-blend-multiply dark:brightness-100 dark:invert dark:mix-blend-screen dark:opacity-85">
          <motion.img
            src={balloons}
            alt=""
            className="mx-auto w-full"
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </section>
  );
}
