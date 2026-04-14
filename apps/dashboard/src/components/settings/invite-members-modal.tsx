import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus } from "lucide-react";
import { Modal, ModalHeader, ModalFooter, ModalCancelButton, ModalContinueButton } from "../shared/modal";
import { RoleDropdown } from "../shared/role-dropdown";
import { formatUsdMonthly } from "@/utils/billing";
import { usePricing } from "@/contexts/pricing-context";

interface InviteRow {
  id: number;
  email: string;
  role: string;
}

let nextId = 1;

interface InviteMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMembers?: number;
  includedSeats?: number;
  currentUserEmail?: string | null;
  onInvite?: (emails: string[]) => Promise<void> | void;
}

export function InviteMembersModal({
  open,
  onOpenChange,
  currentMembers = 1,
  includedSeats = 3,
  currentUserEmail,
  onInvite,
}: InviteMembersModalProps) {
  const [rows, setRows] = useState<InviteRow[]>([{ id: nextId++, email: "", role: "Member" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxRows = 4;

  function addRow() {
    setRows((prev) => (prev.length >= maxRows ? prev : [...prev, { id: nextId++, email: "", role: "Member" }]));
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function updateRow(id: number, field: "email" | "role", value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  const pricing = usePricing();
  const seatPrice = pricing.team.costPerMember;
  const filledRows = rows.filter((r) => r.email.trim().length > 0);
  const normalizedCurrentUserEmail = currentUserEmail?.trim().toLowerCase() ?? "";
  const selfInviteRowIds = new Set(
    rows
      .filter((row) => {
        const normalizedEmail = row.email.trim().toLowerCase();
        return Boolean(normalizedEmail && normalizedCurrentUserEmail && normalizedEmail === normalizedCurrentUserEmail);
      })
      .map((row) => row.id),
  );
  const newSeats = filledRows.length;
  const remainingFreeSeats = Math.max(0, includedSeats - currentMembers);
  const paidSeats = Math.max(0, newSeats - remainingFreeSeats);
  const extraCost = paidSeats * seatPrice;
  const totalMembers = currentMembers + newSeats;

  useEffect(() => {
    if (!open) {
      setRows([{ id: nextId++, email: "", role: "Member" }]);
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit() {
    if (selfInviteRowIds.size > 0) {
      return;
    }

    const emails = filledRows.map((row) => row.email.trim());
    if (!emails.length || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onInvite?.(emails);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} width={520} className="overflow-visible">
      <ModalHeader title="Invite team members" description="They'll receive an email invitation to join this workspace." />

      <div className="flex flex-col gap-4 px-6 py-5">
        {/* Invite rows */}
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  name={`invite-email-${row.id}`}
                  placeholder="colleague@company.com"
                  value={row.email}
                  onChange={(e) => updateRow(row.id, "email", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRow();
                    }
                  }}
                  className={
                    selfInviteRowIds.has(row.id)
                      ? "flex-1 rounded-[6px] px-3 py-2.5 text-sm leading-6 text-dash-text-strong placeholder:text-[#9ca3af] shadow-[0px_0px_0px_1px_#e1291d,0px_0px_0px_3px_rgba(225,41,29,0.15)] outline-none"
                      : "input-base input-focus flex-1 px-3 py-2.5 text-sm leading-6 text-dash-text-strong placeholder:text-[#9ca3af]"
                  }
                />
                <RoleDropdown value={row.role} onChange={(v) => updateRow(row.id, "role", v)} />
                <button
                  onClick={() => removeRow(row.id)}
                  className="flex size-[38px] shrink-0 items-center justify-center rounded-[6px] text-dash-text-faded transition-colors hover:bg-dash-bg-elevated hover:text-dash-text-strong"
                >
                  <X className="size-4" />
                </button>
              </div>
              {selfInviteRowIds.has(row.id) ? (
                <p className="text-xs text-[#e1291d]">You can&apos;t invite yourself to this workspace.</p>
              ) : null}
            </div>
          ))}
        </div>

        {/* Add another */}
        {rows.length < maxRows && (
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 self-start text-sm text-[#4879f8] transition-colors hover:text-[#3a6ae6]"
          >
            <Plus className="size-3.5" />
            Add another
          </button>
        )}

        {/* Cost preview */}
        <AnimatePresence initial={false}>
          {newSeats > 0 && (
            <motion.div
              key="cost-preview"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-1 py-1">
                {remainingFreeSeats > 0 && newSeats <= remainingFreeSeats ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4">
                    <span className="text-sm text-dash-text-faded">
                      {newSeats} new {newSeats === 1 ? "seat" : "seats"} (included in plan)
                    </span>
                    <span className="text-sm font-medium text-dash-text-strong">No extra cost</span>
                  </div>
                ) : (
                  <>
                    {remainingFreeSeats > 0 && (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4">
                        <span className="text-sm text-dash-text-faded">
                          {remainingFreeSeats} {remainingFreeSeats === 1 ? "seat" : "seats"} (included in plan)
                        </span>
                        <span className="text-sm font-medium text-dash-text-strong">Free</span>
                      </div>
                    )}
                    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 ${remainingFreeSeats > 0 ? "mt-1" : ""}`}>
                      <span className="text-sm text-dash-text-faded">
                        {paidSeats} extra {paidSeats === 1 ? "seat" : "seats"} &times; {formatUsdMonthly(seatPrice)}/seat
                      </span>
                      <span className="text-sm font-medium text-dash-text-strong">+{formatUsdMonthly(extraCost)}/month</span>
                    </div>
                  </>
                )}
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 border-t border-dash-border-soft pt-2">
                  <span className="text-xs text-dash-text-faded">
                    Total seats ({totalMembers} of {Math.max(includedSeats, totalMembers)})
                  </span>
                  <span className="text-xs font-medium text-dash-text-strong">
                    {extraCost > 0 ? `+${formatUsdMonthly(extraCost)}/month` : "Included"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ModalFooter>
        <ModalCancelButton />
        <ModalContinueButton
          disabled={newSeats === 0 || selfInviteRowIds.size > 0}
          loading={isSubmitting}
          loadingLabel="Sending..."
          onClick={() => {
            void handleSubmit();
          }}
        >
          Send invitations
        </ModalContinueButton>
      </ModalFooter>
    </Modal>
  );
}
