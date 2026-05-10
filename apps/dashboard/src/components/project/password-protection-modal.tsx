import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowsClockwise, Eye, EyeSlash } from "@phosphor-icons/react";
import { hapticToast as toast } from "@/utils/haptic-toast";
import { generateStrongPassword } from "@/utils/password";
import { useHaptics } from "@/hooks/use-haptics";
import { setProjectPasswordProtectionServerFn } from "@/server/projects/actions";
import { Modal, ModalCancelButton, ModalContinueButton, ModalFooter, ModalHeader } from "@/components/shared/modal";
import { dashInputClassName } from "@/components/shared/dash-input";

const MIN_PASSWORD_LENGTH = 6;

interface PasswordProtectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "enable" | "disable";
  projectId: string;
  workspace?: string;
  onSuccess: () => void | Promise<void>;
}

export function PasswordProtectionModal({ open, onOpenChange, mode, projectId, workspace, onSuccess }: PasswordProtectionModalProps) {
  const setPasswordProtection = useServerFn(setProjectPasswordProtectionServerFn as any) as (args: {
    data: { workspace?: string; projectId: string; passwordEnabled: boolean; password?: string };
  }) => Promise<{ id: string; passwordEnabled: boolean }>;
  const haptics = useHaptics();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShowPassword(false);
      setSubmitting(false);
    }
  }, [open]);

  const passwordTooShort = mode === "enable" && password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit = mode === "disable" || password.length >= MIN_PASSWORD_LENGTH;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await setPasswordProtection({
        data: {
          workspace,
          projectId,
          passwordEnabled: mode === "enable",
          ...(mode === "enable" ? { password } : {}),
        },
      });
      toast.success(mode === "enable" ? "Password protection enabled" : "Password protection disabled");
      await onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password protection");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalHeader
        title={mode === "enable" ? "Enable password protection" : "Disable password protection"}
        description={
          mode === "enable"
            ? "Visitors will be asked for this password before they can access this project's domains."
            : "Visitors will no longer need a password to access this project."
        }
      />
      {mode === "enable" && (
        <div className="flex flex-col gap-4 px-6 pb-5 pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-dash-text-strong">Visitor password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoFocus
                autoComplete="new-password"
                className={`${dashInputClassName} pr-[72px]`}
              />
              <div className="absolute inset-y-0 right-1.5 my-auto flex h-7 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateStrongPassword();
                    setPassword(generated);
                    setShowPassword(true);
                    haptics.light();
                  }}
                  title="Generate a strong password"
                  aria-label="Generate a strong password"
                  className="flex size-7 items-center justify-center rounded-[4px] text-dash-text-faded transition-colors hover:bg-dash-bg-elevated hover:text-dash-text-strong"
                >
                  <ArrowsClockwise className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="flex size-7 items-center justify-center rounded-[4px] text-dash-text-faded transition-colors hover:bg-dash-bg-elevated hover:text-dash-text-strong"
                >
                  {showPassword ? <EyeSlash className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
            {passwordTooShort ? (
              <p className="text-xs text-[#ef2f1f]">Password must be at least {MIN_PASSWORD_LENGTH} characters.</p>
            ) : (
              <p className="text-xs text-dash-text-faded">Share this password with anyone who should be able to view the site.</p>
            )}
          </div>
        </div>
      )}
      <ModalFooter>
        <ModalCancelButton />
        <ModalContinueButton
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          loading={submitting}
          loadingLabel={mode === "enable" ? "Enabling..." : "Disabling..."}
        >
          {mode === "enable" ? "Enable" : "Disable"}
        </ModalContinueButton>
      </ModalFooter>
    </Modal>
  );
}
