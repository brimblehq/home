import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/sections/hero";
import { CodePreview } from "@/components/sections/code-preview";
import { Steps } from "@/components/sections/steps";
import { Onboarding } from "@/components/sections/onboarding";
import { Features } from "@/components/sections/features";
import { Integrations } from "@/components/sections/integrations";
import { Cta } from "@/components/sections/cta";
import { Socials } from "@/components/sections/socials";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { buildSeoHead } from "@/config/seo";

export const Route = createFileRoute("/")({
  head: () => buildSeoHead(),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-dvh bg-brimble-surface transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <CodePreview />
        <Steps />
        <Onboarding />
        <Features />
        <Integrations />
        <Cta />
        <Socials />
      </main>
      <CookieBanner />
    </div>
  );
}
