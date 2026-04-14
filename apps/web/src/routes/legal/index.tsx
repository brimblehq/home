import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView } from "motion/react";
import { buildSeoHead } from "@/config/seo";
import { Navbar } from "@/components/layout/navbar";
import { Cta } from "@/components/sections/cta";
import { legalDocuments } from "@/data/legal";

export const Route = createFileRoute("/legal/")({
  head: () =>
    buildSeoHead({
      title: "Legal",
      description: "Access all our legal documentation, policies, and compliance information.",
      path: "/legal",
    }),
  component: LegalHubPage,
});

function LegalHubPage() {
  return (
    <div className="min-h-dvh bg-brimble-surface transition-colors duration-300">
      <Navbar />
      <main>
        <LegalHero />
        <LegalCards />
        <Cta />
      </main>
    </div>
  );
}

/* ─── Hero Section ─── */

function LegalHero() {
  return (
    <section className="bg-brimble-surface transition-colors duration-300 px-6 pb-4 pt-16">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <motion.h1
          className="font-heading text-[48px] font-medium italic leading-[54px] tracking-[-0.576px] text-brimble-black"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          Legal
        </motion.h1>
        <motion.p
          className="max-w-[519px] font-body text-base leading-[21px] tracking-[-0.32px] text-brimble-black/60"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          Access all our legal documentation, policies, and compliance information.
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Cards Grid ─── */

function LegalCards() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-brimble-surface transition-colors duration-300 px-6 py-10">
      <div ref={ref} className="mx-auto grid max-w-[720px] grid-cols-1 gap-4 sm:grid-cols-2">
        {legalDocuments.map((doc, i) => (
          <motion.div
            key={doc.slug}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: 0.15 * i,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Link
              to="/legal/$slug"
              params={{ slug: doc.slug }}
              className="group flex flex-col gap-2 rounded-xl border border-[rgba(152,157,164,0.3)] bg-brimble-surface p-6 transition-colors duration-200 hover:border-[rgba(152,157,164,0.5)] dark:border-white/10 dark:hover:border-white/20"
            >
              <h2 className="font-body text-base font-medium text-brimble-black">{doc.title}</h2>
              <p className="font-body text-sm leading-[1.6] text-brimble-black/60">{doc.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
