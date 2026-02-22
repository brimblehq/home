import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { siteConfig } from "@/config/site";
import trainStation from "@/assets/images/train-station.png";

import slackIcon from "@/assets/icons/slack.png";
import githubIcon from "@/assets/icons/github.png";
import stripeIcon from "@/assets/icons/stripe.png";
import miroIcon from "@/assets/icons/miro.svg";
import weathersparkIcon from "@/assets/icons/weatherspark.svg";

const integrations = [
  {
    name: "Stripe",
    icon: stripeIcon,
    bg: "#635bff",
    position: { right: "10%", top: "-3%" },
  },
  {
    name: "WeatherSpark",
    icon: weathersparkIcon,
    bg: "#4977cb",
    position: { left: "2%", top: "24%" },
  },
  {
    name: "GitHub",
    icon: githubIcon,
    bg: "#050505",
    position: { right: "5%", top: "40%" },
  },
  {
    name: "Miro",
    icon: miroIcon,
    bg: "#ffd02f",
    position: { left: "-4%", top: "53%" },
  },
  {
    name: "Slack",
    icon: slackIcon,
    bg: "#4a154b",
    position: { right: "10%", top: "62%" },
  },
];

export function Integrations() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-brimble-surface transition-colors duration-300 px-6 py-20">
      <div ref={ref} className="mx-auto flex max-w-[720px] flex-col gap-6">
        {/* Illustration with floating icons */}
        <div className="relative">
          <motion.img
            src={trainStation}
            alt=""
            className="w-full brightness-[1.02] mix-blend-multiply dark:brightness-100 dark:invert dark:mix-blend-screen dark:opacity-85"
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
          {integrations.map((item, i) => (
            <motion.div
              key={item.name}
              className="absolute flex size-[94px] items-center justify-center rounded-full border-[0.5px] border-[#b7b7b7] dark:border-white/20 bg-gradient-to-b from-white to-[#f2f2f2] dark:from-[#2a2d30] dark:to-[#1a1c1e] shadow-[var(--shadow-big)]"
              style={item.position}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.2 + i * 0.1,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
            >
              <div
                className="flex size-[80px] items-center justify-center overflow-hidden rounded-full border border-[#e6e6e6] dark:border-white/10"
                style={{ backgroundColor: item.bg }}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="size-[53px] rounded-[13px] object-contain"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Text Content */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-balance font-heading text-[48px] font-medium leading-[54px] tracking-[-0.576px] text-brimble-black">
            {siteConfig.integrations.heading}
          </h2>
          <p className="text-pretty font-body text-base leading-[21px] tracking-[-0.32px] text-brimble-black/60">
            {siteConfig.integrations.description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
