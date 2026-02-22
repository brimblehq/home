import { motion } from "motion/react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import beeHero from "@/assets/images/bee-hero.png";
import arrowRight from "@/assets/icons/arrow-right.svg";

export function Hero() {
  return (
    <section className="bg-brimble-surface transition-colors duration-300 px-6 pb-16 pt-24">
      <div className="mx-auto flex max-w-[720px] flex-col items-start gap-10">
        <motion.img
          src={beeHero}
          alt=""
          className="h-[250px] w-auto brightness-[1.02] mix-blend-multiply dark:brightness-100 dark:invert dark:mix-blend-screen dark:opacity-85"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -8, 0],
          }}
          transition={{
            opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            },
          }}
        />
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <motion.h1
              className="font-heading text-[44px] font-medium leading-[50px] tracking-[-0.576px] text-brimble-black"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {siteConfig.hero.heading}
            </motion.h1>
            <motion.p
              className="text-pretty font-body text-base leading-[21px] tracking-[-0.32px] text-black/60 dark:text-white/60"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {siteConfig.hero.subtitle}
            </motion.p>
          </div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button
              variant="pill"
              size="sm"
              className="flex-1 gap-2 transition-transform duration-150 hover:scale-[1.01] active:scale-[0.98]"
            >
              {siteConfig.hero.primaryCta}
              <img src={arrowRight} alt="" className="size-3 dark:brightness-0" />
            </Button>
            <Button
              variant="ghost-nav"
              size="sm"
              className="transition-opacity duration-150 hover:opacity-70"
            >
              {siteConfig.hero.secondaryCta}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
