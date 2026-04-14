import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { siteConfig } from "@/config/site";
import { Button } from "@brimble/ui";

export function Onboarding() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeTab, setActiveTab] = useState(0);
  const tab = siteConfig.onboarding.tabs[activeTab];

  return (
    <section className="bg-brimble-surface transition-colors duration-300 px-6 py-14">
      <div ref={ref} className="mx-auto flex max-w-[720px] flex-col items-center gap-10">
        {/* Heading */}
        <motion.h2
          className="max-w-[501px] text-balance text-center font-heading text-[48px] font-medium leading-[54px] tracking-[-0.576px] text-brimble-black"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {siteConfig.onboarding.heading}
        </motion.h2>

        {/* Tabs + Card */}
        <motion.div
          className="flex w-full flex-col items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Tab buttons */}
          <div className="flex items-center gap-4">
            {siteConfig.onboarding.tabs.map((t, i) => (
              <Button
                key={i}
                variant="pill-light"
                size="sm"
                className={`transition-all duration-200 ${
                  activeTab === i ? "bg-brimble-black text-white dark:bg-white dark:text-black shadow-[var(--shadow-button)]" : ""
                }`}
                onClick={() => setActiveTab(i)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {/* Dark card */}
          <div className="w-full overflow-hidden rounded-3xl bg-brimble-black dark:bg-[#1a1c1e] dark:border dark:border-white/10">
            <motion.div
              key={activeTab}
              className="flex flex-col gap-2 p-10"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-body text-xl font-medium leading-[30px] tracking-[-0.24px] text-[#fafafa]">
                <span className="text-white/50">{tab.step}.</span> {tab.title}
              </p>
              <p className="max-w-[414px] font-body text-base leading-[21px] tracking-[-0.32px] text-[#70757c]">{tab.description}</p>
            </motion.div>
            {/* Empty space matching Figma's tall card */}
            <div className="h-[300px]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
