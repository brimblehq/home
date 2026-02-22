import { Link } from "@tanstack/react-router";
import { Copy, Share2, Reply, Trash2, Plus, AlertCircle, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";

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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("CNAME");
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState("");

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
                <div className="flex flex-col gap-0.5 border-b-[0.5px] border-dash-border bg-dash-bg-elevated px-6 py-4">
                  <Dialog.Title className="text-base leading-[1.4] tracking-[-0.096px] text-dash-text-strong">
                    Add DNS Record
                  </Dialog.Title>
                  <Dialog.Description className="text-sm font-light leading-[1.3] text-dash-text-faded">
                    Connect to {domainName}
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
                        className="flex w-full items-center justify-between rounded-[6px] bg-[#f9fafb] px-2 py-1.5 text-[13px] leading-5 text-dash-text-strong shadow-[0px_1px_2px_rgba(3,7,18,0.12),0px_0px_0px_1px_rgba(3,7,18,0.08)] outline-none focus:shadow-[0px_1px_2px_rgba(3,7,18,0.12),0px_0px_0px_1px_rgba(3,7,18,0.08),0px_0px_0px_3px_rgba(72,121,248,0.15)] dark:bg-[#1a1c1e] dark:shadow-[0px_1px_2px_rgba(0,0,0,0.3),0px_0px_0px_1px_rgba(255,255,255,0.08)] dark:focus:shadow-[0px_1px_2px_rgba(0,0,0,0.3),0px_0px_0px_1px_rgba(255,255,255,0.08),0px_0px_0px_3px_rgba(72,121,248,0.2)]"
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
                    Continue
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
        className="rounded-[6px] bg-[#f9fafb] px-2 py-1.5 text-[13px] leading-5 text-dash-text-strong shadow-[0px_1px_2px_rgba(3,7,18,0.12),0px_0px_0px_1px_rgba(3,7,18,0.08)] outline-none placeholder:text-[#9ca3af] focus:shadow-[0px_1px_2px_rgba(3,7,18,0.12),0px_0px_0px_1px_rgba(3,7,18,0.08),0px_0px_0px_3px_rgba(72,121,248,0.15)] dark:bg-[#1a1c1e] dark:shadow-[0px_1px_2px_rgba(0,0,0,0.3),0px_0px_0px_1px_rgba(255,255,255,0.08)] dark:placeholder:text-dash-text-extra-faded dark:focus:shadow-[0px_1px_2px_rgba(0,0,0,0.3),0px_0px_0px_1px_rgba(255,255,255,0.08),0px_0px_0px_3px_rgba(72,121,248,0.2)]"
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
  const [addRecordOpen, setAddRecordOpen] = useState(false);

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
          <button className="text-dash-text-faded transition-colors hover:text-dash-text-strong">
            <Trash2 className="size-4" />
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
              <h2 className="text-base font-medium leading-5 tracking-[-0.026px] text-dash-text-body">
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
              onClick={() => setAddRecordOpen(true)}
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
              TIL
            </span>
            <span className="text-xs font-medium leading-5 tracking-[-0.019px] text-dash-text-body">
              Value
            </span>
            <span className="w-4" />
          </div>

          {/* DNS rows */}
          <div className="overflow-clip rounded-[2px] border-[0.5px] border-dash-border">
            {domain.dnsRecords.map((record, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2 bg-dash-bg-elevated px-3.5 py-2.5 ${
                  i < domain.dnsRecords.length - 1
                    ? "border-b-[0.5px] border-dash-border"
                    : ""
                }`}
              >
                <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                  {record.name}
                </span>
                <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                  {record.type}
                </span>
                <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                  {record.ttl}
                </span>
                <span className="font-mono text-sm font-light leading-5 tracking-[-0.022px] text-dash-text-body">
                  {record.value}
                </span>
                <CopyButton text={record.value} />
              </div>
            ))}
          </div>
        </div>

        {/* Nameservers section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-medium leading-5 tracking-[-0.026px] text-dash-text-body">
              Nameservers
            </h2>
            <p className="max-w-[560px] text-sm font-light leading-[1.3] text-dash-text-faded">
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
        open={addRecordOpen}
        onOpenChange={setAddRecordOpen}
        domainName={domain.domainName}
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
