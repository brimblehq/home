import { DashButton } from "../shared/dash-button";

interface Integration {
  name: string;
  description: string;
  gradient: string;
  logo: string;
  logoBg: string;
}

const integrations: Integration[] = [
  {
    name: "Launch Darkly",
    description: "Open source Firebase Alternative",
    gradient: "from-[#ea51bd] to-[#f6b2c9]",
    logo: "🚀",
    logoBg: "#3d2c00",
  },
  {
    name: "Supabass",
    description: "Open source Firebase Alternative",
    gradient: "from-[#e9bd4b] to-[#dce94b]",
    logo: "⚡",
    logoBg: "#1a5c2e",
  },
  {
    name: "MongoDB Atlas",
    description: "Intuitive document-oriented database",
    gradient: "from-[#34a853] to-[#0d6b3e]",
    logo: "🍃",
    logoBg: "#003d22",
  },
];

export function FeaturedIntegrations() {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text-strong">
            Addons
          </h2>
          <p className="mt-1 max-w-md text-sm text-dash-text-faded">
            Install one of our recommended options below or browse the
            integrations marketplace.
          </p>
        </div>
        <DashButton size="sm">
          Browse integrations
        </DashButton>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border-soft"
          >
            {/* Gradient header with browser mockup + logo */}
            <div
              className={`relative h-[101px] overflow-clip bg-gradient-to-b ${integration.gradient} border-b-[0.5px] border-dash-border`}
            >
              {/* Browser window mockup */}
              <div className="absolute top-4 h-[157px] w-[282px] overflow-clip rounded-[4px] border-[0.5px] border-dash-border-soft bg-dash-bg" style={{ left: "calc(50% + 40px)", transform: "translateX(-50%)" }}>
                <div className="flex items-center gap-[3px] px-2.5 py-[6px]">
                  <span className="size-[5px] rounded-full bg-dash-border" />
                  <span className="size-[5px] rounded-full bg-dash-border" />
                  <span className="size-[5px] rounded-full bg-dash-border" />
                </div>
                <div className="mx-[6px] h-px bg-dash-border-soft" />
              </div>

              {/* Circular logo */}
              <div
                className="absolute left-3.5 top-[58px] flex size-8 items-center justify-center rounded-full"
                style={{ backgroundColor: integration.logoBg }}
              >
                <span className="text-xs">{integration.logo}</span>
              </div>
            </div>

            {/* Text content */}
            <div className="px-3.5 pt-3 pb-4">
              <p className="text-sm font-medium leading-5 tracking-[-0.02px] text-dash-text-strong">
                {integration.name}
              </p>
              <p className="mt-0.5 text-sm font-light leading-[22px] tracking-[-0.02px] text-dash-text-faded">
                {integration.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
