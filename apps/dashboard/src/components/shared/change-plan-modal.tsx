import { useState } from "react";
import { Modal, ModalHeader, ModalFooter, ModalCancelButton, ModalContinueButton } from "./modal";
import { Dropdown } from "./dropdown";

export const billingPlans = [
  { name: "Free", price: 0 },
  { name: "Hacker", price: 7 },
  { name: "Pro", price: 19 },
];

export function ChangePlanModal({
  open,
  onOpenChange,
  currentPlan,
  onChangePlan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  onChangePlan: (plan: string) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState("");
  const currentIdx = billingPlans.findIndex((p) => p.name === currentPlan);
  const selectedIdx = billingPlans.findIndex((p) => p.name === selectedPlan);
  const selectedObj = billingPlans[selectedIdx];
  const currentObj = billingPlans[currentIdx];

  const isUpgrade = selectedIdx > currentIdx;
  const isDowngrade = selectedIdx !== -1 && selectedIdx < currentIdx;

  const dropdownOptions = billingPlans
    .filter((p) => p.name !== currentPlan)
    .map((p) => ({
      id: p.name,
      label: p.price === 0 ? `${p.name} — Free` : `${p.name} — $${p.price}/mo`,
    }));

  const buttonLabel = isUpgrade
    ? "Upgrade"
    : isDowngrade
      ? "Downgrade"
      : "Confirm change";

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelectedPlan("");
        onOpenChange(v);
      }}
      width={420}
    >
      <ModalHeader
        title="Change plan"
        description="Select a new plan. See full plan details on the pricing page."
      />

      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm leading-5 tracking-[-0.0224px] text-dash-text-body">
            New plan
          </label>
          <Dropdown
            value={selectedPlan}
            options={dropdownOptions}
            onChange={setSelectedPlan}
            placeholder="Select a plan..."
          />
        </div>

        {selectedObj && currentObj && (
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-5 text-dash-text-faded">
              {isUpgrade
                ? `You'll be charged $${selectedObj.price}/mo, up from $${currentObj.price}/mo. Changes take effect immediately.`
                : `Your plan will change to ${selectedObj.name} (${selectedObj.price === 0 ? "Free" : `$${selectedObj.price}/mo`}) at the end of your billing period.`}
            </p>
            {isDowngrade && (
              <div className="rounded-[4px] bg-[#f5a623]/[0.06] px-3 py-2.5 dark:bg-[#f5a623]/[0.08]">
                <p className="text-sm leading-[1.4] text-[#b37a10] dark:text-[#f5a623]">
                  If you have more projects than the new plan allows, your existing projects won't be deleted, but you won't be able to create new ones until you're within the limit.
                </p>
              </div>
            )}
          </div>
        )}

        <a
          href="/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#4879f8] hover:underline"
        >
          Compare all plans &rarr;
        </a>
      </div>

      <ModalFooter>
        <ModalCancelButton />
        <ModalContinueButton
          disabled={!selectedPlan}
          onClick={() => {
            if (selectedPlan) {
              onChangePlan(selectedPlan);
              setSelectedPlan("");
            }
          }}
        >
          {buttonLabel}
        </ModalContinueButton>
      </ModalFooter>
    </Modal>
  );
}
