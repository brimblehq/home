import { useState } from "react";
import { LockSimple } from "@phosphor-icons/react";
import { GlossyButton } from "./glossy-button";
import { ChangePlanModal } from "./change-plan-modal";
import { usePlanGate } from "@/hooks/use-plan-gate";

const PLAN_DISPLAY: Record<string, string> = {
  free: "Free",
  hacker: "Hacker",
  developer: "Pro",
  team: "Team",
};

export function PlanUpgradePrompt({
  feature,
  description,
}: {
  feature: string;
  description?: string;
}) {
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const { planKey } = usePlanGate();
  const currentPlan = PLAN_DISPLAY[planKey] ?? "Free";

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <LockSimple
        weight="fill"
        className="mb-4 size-10 text-dash-text-extra-faded opacity-40"
      />
      <h3 className="mb-1 text-sm font-medium text-dash-text-strong">
        {feature} is not available on your current plan
      </h3>
      <p className="mb-5 max-w-[320px] text-center text-sm text-dash-text-faded">
        {description ?? `Upgrade your plan to access ${feature.toLowerCase()}.`}
      </p>
      <GlossyButton variant="blue" onClick={() => setChangePlanOpen(true)}>
        Upgrade plan
      </GlossyButton>

      <ChangePlanModal
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        currentPlan={currentPlan}
      />
    </div>
  );
}
