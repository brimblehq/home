import { useState } from "react";
import { Modal, ModalHeader, ModalFooter, ModalCancelButton, ModalContinueButton } from "./modal";
import { dashInputClassName } from "./dash-input";

interface AddBucketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (name: string, region?: string) => Promise<{ bucket: any; token?: string }>;
}

export function AddBucketModal({ open, onOpenChange, onContinue }: AddBucketModalProps) {
  const [bucketName, setBucketName] = useState("");
  const [bucketRegion, setBucketRegion] = useState("Global");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleContinue() {
    const normalizedName = bucketName.trim().toLowerCase();
    
    if (!normalizedName) {
      setError("Bucket name is required.");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(normalizedName)) {
      setError("Bucket name can only contain lowercase letters, numbers, and hyphens.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const result = await onContinue(normalizedName, bucketRegion === "Global" ? undefined : bucketRegion);
      setSuccessToken(result?.token || null);
    } catch (e: any) {
      setError(e.message || "Failed to create bucket");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!successToken) return;
    await navigator.clipboard.writeText(successToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setBucketName("");
      setBucketRegion("Global");
      setError(null);
      setSuccessToken(null);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  if (successToken) {
    return (
      <Modal open={open} onOpenChange={handleOpenChange} width={480}>
        <ModalHeader title="Bucket Created!" description="Your storage bucket is ready to use" />

        <div className="flex flex-col gap-4 px-6 pb-5 pt-4">
          <div className="flex items-center gap-2 rounded-[4px] bg-[#22c55e]/10 px-3 py-2">
            <svg className="h-4 w-4 shrink-0 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-[#22c55e]">Bucket created successfully</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium leading-5 text-dash-text-strong">Your API Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-[4px] bg-[#1a1a2e] px-3 py-2.5 font-mono text-xs text-[#e2e8f0] break-all select-all">
                {successToken}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-[4px] border border-dash-border px-3 py-2 text-xs font-medium text-dash-text-body transition-colors hover:bg-dash-bg-elevated"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="flex items-center gap-1 text-xs text-[#f59e0b]">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Save this key now. You won't be able to see it again.
            </p>
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => handleOpenChange(false)}
            className="rounded-[4px] bg-[#3c6ce7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#345cc7]"
          >
            Done
          </button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} width={450}>
      <ModalHeader title="Create Bucket" description="Create a new storage bucket for your workspace" />

      <div className="flex flex-col gap-4 px-6 pb-5 pt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm leading-5 tracking-[-0.0224px] text-dash-text-strong">Bucket Name</label>
          <input
            type="text"
            placeholder="my-awesome-bucket"
            value={bucketName}
            onChange={(e) => {
              setBucketName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleContinue();
              }
            }}
            autoFocus
            className={`${dashInputClassName} w-full ${
              error
                ? "shadow-[0px_0px_0px_1px_#e1291d,0px_0px_0px_3px_rgba(225,41,29,0.15)] dark:shadow-[0px_0px_0px_1px_#e1291d,0px_0px_0px_3px_rgba(225,41,29,0.15)]"
                : "input-focus"
            }`}
          />
          {error && <p className="text-sm font-light leading-5 text-[#e1291d]">{error}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm leading-5 tracking-[-0.0224px] text-dash-text-strong">Region</label>
          <select
            value={bucketRegion}
            onChange={(e) => setBucketRegion(e.target.value)}
            className={`${dashInputClassName} w-full input-focus cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-8`}
          >
            <option value="Global">Global (Automatic)</option>
            <option value="US East (N. Virginia)">US East (N. Virginia)</option>
            <option value="EU (Frankfurt)">EU (Frankfurt)</option>
          </select>
        </div>
      </div>

      <ModalFooter>
        <ModalCancelButton />
        <ModalContinueButton
          onClick={() => {
            void handleContinue();
          }}
          disabled={!bucketName.trim() || submitting}
          loading={submitting}
          loadingLabel="Creating..."
        >
          Create Bucket
        </ModalContinueButton>
      </ModalFooter>
    </Modal>
  );
}
