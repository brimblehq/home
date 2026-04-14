import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ExternalLink } from "lucide-react";
import { Button } from "@brimble/ui";
import { siteConfig } from "@/config/site";

export function Socials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section className="bg-brimble-surface transition-colors duration-300 px-6 pb-12 pt-4">
      <motion.div
        ref={ref}
        className="mx-auto flex max-w-[720px] flex-col gap-6 rounded-3xl border border-[rgba(152,157,164,0.3)] bg-brimble-air-gray/80 p-6 shadow-[var(--shadow-big)] dark:border-white/10 dark:bg-[#1a1c1e]"
        initial={{ opacity: 0, y: 18 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[1.2px] text-brimble-black/50 dark:text-white/55">Community</p>
          <h3 className="font-heading text-[34px] leading-[38px] tracking-[-0.46px] text-brimble-black dark:text-white">
            {siteConfig.socials.heading}
          </h3>
          <p className="max-w-[520px] font-body text-base leading-[21px] tracking-[-0.2px] text-brimble-black/60 dark:text-white/70">
            {siteConfig.socials.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {siteConfig.socials.links.map((link) => (
            <Button
              key={link.label}
              asChild
              variant="pill-light"
              size="sm"
              className="gap-2 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
