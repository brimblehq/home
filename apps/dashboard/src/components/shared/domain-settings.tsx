import { Link } from "@tanstack/react-router";
import { Copy, Share2, Reply, Plus, AlertCircle, ChevronDown, Pencil } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { FolderTrashIcon } from "./folder-trash-icon";
import { WarningModal } from "./warning-modal";

const dnsRecordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"];

export interface DnsRecord {
  type: string;
  name: string;
  ttl: string;
  value: string;
}

export interface DomainInfo {
  domainName: string;
  registrar: string;
  nameserversType: string;
  expirationDate: string;
  creator: string;
  dnsRecords: DnsRecord[];
  nameservers: string[];
  nameserverWarning?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-dash-text-body transition-colors hover:text-dash-text-strong"
      title="Copy"
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#34d399]">
          <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}

function AddDnsRecordModal({
  open,
  onOpenChange,
  domainName,
  editingRecord,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
  editingRecord?: DnsRecord | null;
}) {
  const isEditing = !!editingRecord;
  const [name, setName] = useState(editingRecord?.name ?? "");
  const [type, setType] = useState(editingRecord?.type ?? "CNAME");
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(editingRecord?.value ?? "");
  const [ttl, setTtl] = useState(editingRecord?.ttl ?? "");

  useEffect(() => {
    if (!typeOpen) return;
    function handleClick(e: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(e.target as Node))
        setTypeOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [typeOpen]);

  function handleSubmit() {
    // TODO: wire to API
    onOpenChange(false);
    setName("");
    setType("");
    setValue("");
    setTtl("");
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{
                  duration: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="fixed left-1/2 top-1/2 z-50 flex w-[500px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-visible rounded-lg border-[0.5px] border-dash-border bg-dash-bg shadow-[0px_2px_3px_rgba(0,0,0,0.06),inset_0px_-3px_2px_rgba(245,245,245,0.3)] dark:shadow-[0px_2px_3px_rgba(0,0,0,0.2)]"
              >
                {/* Header */}
                <div className="flex flex-col gap-0.5 rounded-t-lg border-b-[0.5px] border-dash-border bg-dash-bg-elevated px-6 py-4">
                  <Dialog.Title className="text-base leading-[1.4] tracking-[-0.096px] text-dash-text-strong">
                    {isEditing ? "Edit DNS Record" : "Add DNS Record"}
                  </Dialog.Title>
                  <Dialog.Description className="text-sm font-light leading-[1.3] text-dash-text-faded">
                    {isEditing ? `Update record for ${domainName}` : `Connect to ${domainName}`}
                  </Dialog.Description>
                </div>

                {/* Form fields */}
                <div className="flex flex-col gap-4 overflow-visible px-6 pb-5 pt-4">
                  <FormField label="Name" placeholder="Name" value={name} onChange={setName} />

                  {/* Type dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm leading-5 tracking-[-0.022px] text-dash-text-strong">
                      Type
                    </label>
                    <div ref={typeRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setTypeOpen(!typeOpen)}
                        className="input-base input-focus flex w-full items-center justify-between px-2 py-1.5 text-[13px] leading-5 text-dash-text-strong"
                      >
                        <span>{type || "Select type"}</span>
                        <ChevronDown className={`size-4 text-dash-text-faded transition-transform duration-200 ${typeOpen ? "rotate-180" : ""}`} />
                      </button>
                      {typeOpen && (
                        <div className="absolute left-0 top-[calc(100%+4px)] z-10 w-full overflow-clip rounded-[6px] border-[0.5px] border-dash-border bg-dash-bg py-1 shadow-[0px_4px_16px_rgba(0,0,0,0.08)]">
                          {dnsRecordTypes.map((t) => (
                            <button
                              key={t}
                              onClick={() => {
                                setType(t);
                                setTypeOpen(false);
                              }}
                              className={`flex w-full items-center px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-dash-bg-elevated ${
                                t === type
                                  ? "font-medium text-dash-text-strong"
                                  : "font-light text-dash-text-faded"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <FormField label="Value" placeholder="Value" value={value} onChange={setValue} />
                  <FormField label="TTL" placeholder="1 Hour" value={ttl} onChange={setTtl} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t-[0.5px] border-dash-border px-4 py-4">
                  <Dialog.Close asChild>
                    <button className="flex h-[34px] items-center rounded-[4px] border border-dash-border bg-dash-bg px-3.5 text-sm font-medium text-dash-text-strong shadow-[0px_1px_2px_rgba(18,18,23,0.05)] transition-colors hover:bg-dash-bg-elevated">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleSubmit}
                    className="flex items-center rounded-[4px] border border-[#232931] bg-gradient-to-b from-[#545459] via-[#45454b] to-[#2d2d32] px-4 py-[5px] text-sm font-medium text-white shadow-[0px_1px_2px_rgba(18,18,23,0.05)] transition-opacity hover:opacity-90"
                  >
                    {isEditing ? "Save Changes" : "Continue"}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm leading-5 tracking-[-0.022px] text-dash-text-strong">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base input-focus px-2 py-1.5 text-[13px] leading-5 text-dash-text-strong placeholder:text-[#9ca3af] dark:placeholder:text-dash-text-extra-faded"
      />
    </div>
  );
}

export function DomainSettings({
  domain,
  backPath,
}: {
  domain: DomainInfo;
  backPath: string;
}) {
  const [records, setRecords] = useState(domain.dnsRecords);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteRecord = useCallback((index: number) => {
    const record = records[index];
    setRecords((prev) => prev.filter((_, i) => i !== index));

    const promise = new Promise<void>((resolve) => setTimeout(resolve, 800));

    toast.promise(promise, {
      loading: "Deleting DNS record…",
      success: "DNS record deleted",
      error: () => {
        setRecords((prev) => {
          const next = [...prev];
          next.splice(index, 0, record);
          return next;
        });
        return "Failed to delete DNS record";
      },
    });
  }, [records]);

  return (
    <div className="flex flex-col">
      {/* Sub-bar: Back + domain name + action icons */}
      <div className="flex items-center justify-between border-b-[0.5px] border-dash-border px-8 py-2">
        <div className="flex items-center gap-16">
          <Link
            to={backPath}
            className="text-sm text-dash-text-faded underline transition-colors hover:text-dash-text-strong"
          >
            Back
          </Link>
          <span className="text-sm font-medium text-dash-text-body">
            {domain.domainName}
          </span>
        </div>
        <div className="flex items-center gap-4 px-3.5">
          <button className="text-dash-text-faded transition-colors hover:text-dash-text-strong">
            <Share2 className="size-4" />
          </button>
          <button className="text-dash-text-faded transition-colors hover:text-dash-text-strong">
            <Reply className="size-4" />
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="transition-opacity hover:opacity-70"
          >
            <FolderTrashIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 py-8">
        {/* Domain info card */}
        <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border p-6">
          <div className="flex items-start justify-between">
            <InfoColumn label="Registrar" value={domain.registrar} />
            <InfoColumn label="Nameservers" value={domain.nameserversType} />
            <InfoColumn label="Expiration date" value={domain.expirationDate} />
            <InfoColumn label="Creator" value={domain.creator} />
          </div>
        </div>

        {/* DNS Records section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-medium leading-5 tracking-[-0.026px] text-dash-text-body dark:text-white">
                DNS Records
              </h2>
              <p className="text-sm font-light leading-[1.3] text-dash-text-faded">
                Manage the domain name system for your domain "
                <span className="font-normal text-dash-text-body">
                  {domain.domainName}
                </span>
                "
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRecord(null);
                setAddRecordOpen(true);
              }}
              className="flex items-center gap-1 rounded-[4px] border border-[#232931] bg-gradient-to-b from-[#545459] via-[#45454b] to-[#2d2d32] px-3 py-[5px] text-sm font-medium text-white shadow-[0px_1px_2px_rgba(18,18,23,0.05)] transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              <span className="px-1">Add a New Record</span>
            </button>
          </div>

          <hr className="border-dash-border" />
        </div>

        {/* DNS Records table */}
        <div className="flex flex-col gap-2">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-3.5">
            <span className="text-xs font-medium leading-5 tracking-[-0.019px] text-dash-text-body">
              Type
            </span>
            <span className="text-xs font-medium leading-5 tracking-[-0.019px] text-dash-text-body">
              Name
            </span>
            <span className="text-xs font-medium leading-5 tracking-[-0.019px] text-dash-text-body">
              TTL
            </span>
            <span className="text-xs font-medium leading-5 tracking-[-0.019px] text-dash-text-body">
              Value
            </span>
            <span className="w-[76px]" />
          </div>

          {/* DNS rows */}
          <div className="overflow-clip rounded-[2px] border-[0.5px] border-dash-border">
            {records.map((record, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2 bg-dash-bg-elevated px-3.5 py-2.5 ${
                  i < records.length - 1
                    ? "border-b-[0.5px] border-dash-border"
                    : ""
                }`}
              >
                <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                  {record.type}
                </span>
                <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                  {record.name}
                </span>
                <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                  {record.ttl}
                </span>
                <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                  {record.value}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingRecord(record);
                      setAddRecordOpen(true);
                    }}
                    className="rounded-[4px] p-1 text-dash-text-faded transition-colors hover:bg-dash-bg hover:text-dash-text-body"
                    title="Edit record"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRecord(i)}
                    className="rounded-[4px] p-1 transition-opacity hover:opacity-70"
                    title="Delete record"
                  >
                    <FolderTrashIcon className="size-3.5" />
                  </button>
                  <CopyButton text={record.value} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nameservers section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-medium leading-5 tracking-[-0.026px] text-dash-text-body dark:text-white">
              Nameservers
            </h2>
            <p className="max-w-[720px] text-sm font-light leading-[1.3] text-dash-text-faded">
              To use Brimble Name Servers, Kindly enable DNS for this domain. It
              can always be disabled too from the Domains Page. Point your domain
              nameservers of "
              <span className="font-normal text-dash-text-body">
                {domain.domainName}
              </span>
              " to Brimble name servers listed below.
            </p>
          </div>

          <hr className="border-dash-border" />
        </div>

        {/* Nameserver warning banner */}
        {domain.nameserverWarning && (
          <div className="flex items-center gap-3 rounded-[4px] bg-[#fff8f0] px-4 py-3 dark:bg-[#2a2118]">
            <AlertCircle className="size-5 shrink-0 text-[#e89c30]" />
            <span className="text-sm text-dash-text-body">
              {domain.nameserverWarning}
            </span>
          </div>
        )}

        {/* Nameservers table */}
        <div className="overflow-clip rounded-[2px] border-[0.5px] border-dash-border">
          {domain.nameservers.map((ns, i) => (
            <div
              key={ns}
              className={`flex items-center justify-between bg-dash-bg-elevated px-3.5 py-2.5 ${
                i < domain.nameservers.length - 1
                  ? "border-b-[0.5px] border-dash-border"
                  : ""
              }`}
            >
              <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                {ns}
              </span>
              <CopyButton text={ns} />
            </div>
          ))}
        </div>
      </div>

      {/* Add DNS Record Modal */}
      <AddDnsRecordModal
        key={editingRecord ? `edit-${editingRecord.name}` : "add"}
        open={addRecordOpen}
        onOpenChange={(v) => {
          setAddRecordOpen(v);
          if (!v) setEditingRecord(null);
        }}
        domainName={domain.domainName}
        editingRecord={editingRecord}
      />

      {/* Delete Domain Modal */}
      <WarningModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Domain"
        description={`Are you sure you want to delete "${domain.domainName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          // TODO: handle domain deletion
        }}
      />
    </div>
  );
}

function InfoColumn({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-[200px] flex-col gap-1">
      <span className="text-sm font-light leading-[1.3] text-dash-text-faded">
        {label}
      </span>
      <span className="text-sm tracking-[-0.084px] text-dash-text-body">
        {value}
      </span>
    </div>
  );
}
