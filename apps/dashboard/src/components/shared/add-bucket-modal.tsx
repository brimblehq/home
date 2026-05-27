import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Modal, ModalHeader, ModalFooter, ModalCancelButton, ModalContinueButton } from "./modal";
import { dashInputClassName } from "./dash-input";
import { Dropdown, type DropdownOption } from "./dropdown";

interface AddBucketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (data: { name: string; description: string; region: string; isPublic: boolean }) => Promise<{ bucket: any; token?: string }>;
}

const regionOptions: DropdownOption[] = [
  { id: "Global", label: "Global (Automatic)" },
  { id: "US East (N. Virginia)", label: "US East (N. Virginia)" },
  { id: "EU (Frankfurt)", label: "EU (Frankfurt)" },
];

export function AddBucketModal({ open, onOpenChange, onContinue }: AddBucketModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [bucketName, setBucketName] = useState("");
  const [description, setDescription] = useState("");
  const [bucketRegion, setBucketRegion] = useState("Global");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    const normalizedName = bucketName.trim().toLowerCase();

    if (!normalizedName) {
      setError("Bucket name is required.");
      setStep(1);
      return;
    }

    if (!/^[a-z0-9-]+$/.test(normalizedName)) {
      setError("Bucket name can only contain lowercase letters, numbers, and hyphens.");
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const result = await onContinue({
        name: normalizedName,
        description: description.trim(),
        region: bucketRegion === "Global" ? "" : bucketRegion,
        isPublic,
      });
      setSuccessToken(result?.token || null);
    } catch (e: any) {
      setError(e.message || "Failed to create bucket");
      setStep(1);
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
      setStep(1);
      setBucketName("");
      setDescription("");
      setBucketRegion("Global");
      setIsPublic(false);
      setError(null);
      setSuccessToken(null);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  if (successToken) {
    return (
      <Modal open={open} onOpenChange={handleOpenChange} width={500}>
        <ModalHeader title="Bucket created" description="Your storage bucket is ready to use" />

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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Save this key now. You won't be able to see it again.
            </p>
          </div>
        </div>

        <ModalFooter>
          <span />
          <ModalContinueButton onClick={() => handleOpenChange(false)}>Done</ModalContinueButton>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} width={500}>
      <ModalHeader title="Create storage bucket" description="Create a new object storage bucket for your project." />

      <div className="flex items-center gap-2 px-6 py-3 text-sm">
        <span className={step === 1 ? "font-medium text-dash-text-strong" : "text-dash-text-faded"}>Bucket Details</span>
        <span className="h-px w-4 bg-dash-border" />
        <span className={step === 2 ? "font-medium text-dash-text-strong" : "text-dash-text-faded"}>Bucket Visibility</span>
      </div>

      <motion.div layout className="px-6 pb-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            {step === 1 ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-dash-text-strong">Name</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={bucketName}
                    onChange={(e) => {
                      setBucketName(e.target.value);
                      if (error) setError(null);
                    }}
                    autoFocus
                    className={dashInputClassName}
                  />
                  {error && <p className="text-xs text-[#e1291d]">{error}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-dash-text-strong">Description</label>
                  <input
                    type="text"
                    placeholder="Enter a description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={dashInputClassName}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-dash-text-strong">Storage location</label>
                  <Dropdown value={bucketRegion} options={regionOptions} onChange={setBucketRegion} placeholder="Select region" />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-light leading-[1.5] text-dash-text-faded">Choose who can access the files in this bucket.</p>

                <VisibilityOption
                  selected={isPublic}
                  onSelect={() => setIsPublic(true)}
                  title="Public"
                  description="Files are accessible publicly using direct URLs."
                />
                <VisibilityOption
                  selected={!isPublic}
                  onSelect={() => setIsPublic(false)}
                  title="Private"
                  description="Files require authentication or secure access tokens."
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <ModalFooter>
        <ModalCancelButton />
        {step === 1 ? (
          <ModalContinueButton onClick={() => setStep(2)} disabled={!bucketName.trim()}>
            Next
          </ModalContinueButton>
        ) : (
          <ModalContinueButton onClick={handleCreate} loading={submitting} loadingLabel="Creating...">
            Create storage bucket
          </ModalContinueButton>
        )}
      </ModalFooter>
    </Modal>
  );
}

function VisibilityOption({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start justify-between gap-3 rounded-[6px] border px-4 py-3 text-left transition-colors ${
        selected ? "border-[#4879f8] bg-[#4879f8]/[0.06]" : "border-dash-border hover:bg-dash-bg-elevated"
      }`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dash-text-strong">{title}</span>
        <span className="text-xs font-light text-dash-text-faded">{description}</span>
      </div>
      <div
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-[#4879f8] bg-[#4879f8]" : "border-dash-border"
        }`}
      >
        {selected ? <div className="size-2 rounded-full bg-white" /> : null}
      </div>
    </button>
  );
}
