import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { WarningModal } from "@/components/shared/warning-modal";
import { hapticToast as toast } from "@/utils/haptic-toast";
import { destroySandboxServerFn } from "@/server/sandboxes/actions";

interface DestroySandboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sandboxId: string;
  sandboxName: string;
  template: string;
  persistent: boolean;
  onDestroyRequested: () => void;
}

export function DestroySandboxModal({
  open,
  onOpenChange,
  sandboxId,
  sandboxName,
  template,
  persistent,
  onDestroyRequested,
}: DestroySandboxModalProps) {
  const destroySandbox = useServerFn(destroySandboxServerFn);
  const router = useRouter();
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmName("");
    }
  }, [open]);

  async function handleConfirm() {
    try {
      await destroySandbox({ data: { sandboxId } });
      toast.success(`${sandboxName} is being destroyed`);
      onDestroyRequested();
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to destroy sandbox");
      throw error;
    }
  }

  const description = persistent
    ? `This permanently shuts down ${template} and kills running processes. Files in /workspace remain on the attached volume and can be re-attached to a new sandbox.`
    : `This permanently shuts down ${template} and kills running processes. All data outside the attached volume will be lost.`;

  return (
    <WarningModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Destroy sandbox "${sandboxName}"?`}
      description={description}
      confirmLabel="Destroy sandbox"
      confirmLoadingLabel="Destroying..."
      confirmDisabled={confirmName !== sandboxName}
      onConfirm={handleConfirm}
    >
      <div className="flex flex-col gap-2 text-left">
        <label className="text-sm leading-5 text-dash-text-faded">
          Type <span className="font-medium text-dash-text-strong">{sandboxName}</span> to confirm
        </label>
        <input
          type="text"
          value={confirmName}
          onChange={(event) => setConfirmName(event.target.value)}
          placeholder={sandboxName}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="input-base input-focus-red w-full px-3 py-2.5 text-sm leading-6 text-dash-text-strong placeholder:text-[#9ca3af]"
        />
      </div>
    </WarningModal>
  );
}
