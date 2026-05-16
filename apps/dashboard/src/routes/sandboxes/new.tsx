import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ArrowLeft, Plus, X } from "lucide-react";
import { DashButton } from "@/components/shared/dash-button";
import { DashInput, dashInputClassName } from "@/components/shared/dash-input";
import { Dropdown } from "@/components/shared/dropdown";
import { ToggleSwitch } from "@/components/shared/toggle-switch";
import { RangeSlider } from "@/components/shared/range-slider";
import { DiskSizeSelect } from "@/components/shared/disk-size-select";
import { hapticToast as toast } from "@/utils/haptic-toast";
import { useHaptics } from "@/hooks/use-haptics";
import { withWorkspaceQuery } from "@/utils/topbar-navigation";
import { DESTROY_TIMEOUTS, IDLE_TIMEOUTS, SANDBOX_TEMPLATES } from "@/lib/sandboxes/mock-data";
import { listRegionsServerFn } from "@/server/regions/actions";
import type { Region } from "@/backend/regions";

export const Route = createFileRoute("/sandboxes/new")({
  component: NewSandboxPage,
});

interface SandboxFormValues {
  name: string;
  description: string;
  template: string;
  region: string;
  cpu: number;
  memoryGb: number;
  diskSize: string;
  autoStop: boolean;
  idleTimeoutId: string;
  autoDestroy: boolean;
  destroyTimeoutId: string;
  oneShot: boolean;
  blockOutbound: boolean;
  envVars: { key: string; value: string }[];
}

type RegionOption = { id: string; label: string; isDefault: boolean };

function buildRegionLabel(region: Region) {
  const country = region.country?.trim();
  if (country) {
    return `${region.name} (${country})`;
  }
  return region.name;
}

const sandboxFormSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(3, "Name should be at least 3 characters")
    .max(48, "Name should be less than 49 characters")
    .matches(/^[a-zA-Z][a-zA-Z0-9 _-]*$/, "Letters, numbers, spaces, hyphens, and underscores only")
    .required("Sandbox name is required"),
  description: Yup.string().trim().max(160, "Keep descriptions under 160 characters"),
  template: Yup.string().required("Template is required"),
  region: Yup.string().required("Region is required"),
  cpu: Yup.number().min(0.25).max(8).required(),
  memoryGb: Yup.number().min(0.5).max(16).required(),
  diskSize: Yup.string().required(),
  autoStop: Yup.boolean(),
  idleTimeoutId: Yup.string(),
  autoDestroy: Yup.boolean(),
  destroyTimeoutId: Yup.string(),
  oneShot: Yup.boolean(),
  blockOutbound: Yup.boolean(),
});

const initialValues: SandboxFormValues = {
  name: "",
  description: "",
  template: SANDBOX_TEMPLATES[0]?.id ?? "",
  region: "",
  cpu: 1,
  memoryGb: 2,
  diskSize: "10",
  autoStop: true,
  idleTimeoutId: "30m",
  autoDestroy: false,
  destroyTimeoutId: "30d",
  oneShot: false,
  blockOutbound: false,
  envVars: [],
};

function NewSandboxPage() {
  const navigate = useNavigate();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const workspace = (() => {
    const params = new URLSearchParams(searchStr || "");
    const value = params.get("workspace")?.trim();
    return value || undefined;
  })();
  const listRegions = useServerFn(listRegionsServerFn as any) as (args: {
    data?: { type?: "web" | "database" | "sandbox"; enabled?: boolean; workspace?: string };
  }) => Promise<Region[]>;
  const haptics = useHaptics();
  const [submitting, setSubmitting] = useState(false);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);

  const formik = useFormik<SandboxFormValues>({
    initialValues,
    validationSchema: sandboxFormSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      haptics.medium();
      await new Promise((resolve) => setTimeout(resolve, 700));
      toast.success(`Sandbox "${values.name}" queued (mock)`);
      setSubmitting(false);
      void navigate({ to: withWorkspaceQuery({ pathname: "/sandboxes", searchStr }) as any });
    },
  });

  const { values, errors, touched, setFieldValue, handleChange, handleBlur, handleSubmit } = formik;

  useEffect(() => {
    let active = true;

    void listRegions({ data: { type: "sandbox", enabled: true, workspace } })
      .then((items) => {
        if (!active || !Array.isArray(items)) {
          return;
        }

        const mapped = items
          .filter((region) => region.enabled !== false)
          .map((region) => ({
            id: region.id,
            label: buildRegionLabel(region),
            isDefault: Boolean(region.default),
          }));
        setRegionOptions(mapped);
      })
      .catch(() => {
        if (active) {
          setRegionOptions([]);
        }
      });

    return () => {
      active = false;
    };
  }, [listRegions, workspace]);

  useEffect(() => {
    if (!regionOptions.length) {
      return;
    }

    if (!values.region || !regionOptions.some((option) => option.id === values.region)) {
      const defaultRegion = regionOptions.find((option) => option.isDefault) ?? regionOptions[0];
      void setFieldValue("region", defaultRegion.id);
    }
  }, [regionOptions, setFieldValue, values.region]);

  function addEnvVar() {
    haptics.selection();
    void setFieldValue("envVars", [...values.envVars, { key: "", value: "" }]);
  }

  function updateEnvVar(index: number, field: "key" | "value", next: string) {
    const draft = values.envVars.map((entry, i) => (i === index ? { ...entry, [field]: next } : entry));
    void setFieldValue("envVars", draft);
  }

  function removeEnvVar(index: number) {
    haptics.selection();
    void setFieldValue(
      "envVars",
      values.envVars.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-[680px]">
        <div className="mb-8">
          <Link
            to={withWorkspaceQuery({ pathname: "/sandboxes", searchStr }) as any}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-dash-text-faded transition-colors hover:text-dash-text-strong"
          >
            <ArrowLeft className="size-4" />
            Back to sandboxes
          </Link>
          <h1 className="text-xl font-medium text-dash-text-strong">New sandbox</h1>
          <p className="mt-1 text-sm text-dash-text-faded">
            Configure a fresh environment for your code or AI agent. You can change resources and configuration after creation.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Section title="Basics" description="Identify this sandbox for your team.">
            <Field label="Sandbox name" error={touched.name ? errors.name : undefined}>
              <DashInput
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="research-agent"
                autoFocus
              />
            </Field>

            <Field label="Description" hint="Optional · helps teammates know what this sandbox is for.">
              <textarea
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="A short summary of this sandbox's purpose."
                rows={3}
                className={`${dashInputClassName} resize-none`}
              />
            </Field>
          </Section>

          <Divider />

          <Section title="Runtime" description="Pick a base image and where it runs.">
            <Field label="Template">
              <Dropdown
                value={values.template}
                options={SANDBOX_TEMPLATES.map((entry) => ({ id: entry.id, label: entry.label }))}
                onChange={(id) => void setFieldValue("template", id)}
              />
            </Field>

            <Field label="Region">
              <Dropdown
                value={values.region}
                options={regionOptions}
                onChange={(id) => void setFieldValue("region", id)}
                searchable
              />
            </Field>
          </Section>

          <Divider />

          <Section title="Resources" description="Allocate compute, memory, and storage.">
            <Field label="vCPU">
              <RangeSlider
                value={values.cpu}
                onChange={(next) => void setFieldValue("cpu", next)}
                min={0.25}
                max={8}
                step={0.25}
                unit=" vCPU"
              />
            </Field>

            <Field label="Memory">
              <RangeSlider
                value={values.memoryGb}
                onChange={(next) => void setFieldValue("memoryGb", next)}
                min={0.5}
                max={16}
                step={0.5}
                unit=" GB"
              />
            </Field>

            <DiskSizeSelect label="Persistent disk" value={values.diskSize} onChange={(id) => void setFieldValue("diskSize", id)} />
          </Section>

          <Divider />

          <Section title="Secrets" description="Stored securely on Brimble and injected on sandbox.">
            <div className="flex flex-col gap-2">
              {values.envVars.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="KEY"
                    value={entry.key}
                    onChange={(event) => updateEnvVar(i, "key", event.target.value)}
                    className={`${dashInputClassName} flex-1 font-family-mono text-[13px] uppercase`}
                  />
                  <input
                    type="text"
                    placeholder="value"
                    value={entry.value}
                    onChange={(event) => updateEnvVar(i, "value", event.target.value)}
                    className={`${dashInputClassName} flex-1 font-family-mono text-[13px]`}
                  />
                  <button
                    type="button"
                    onClick={() => removeEnvVar(i)}
                    aria-label="Remove secret"
                    className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-dash-text-faded transition-colors hover:text-dash-text-strong"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEnvVar}
              className="flex items-center gap-1.5 self-start text-sm text-[#4879f8] transition-colors hover:text-[#3a6ae6]"
            >
              <Plus className="size-3.5" />
              Add secret
            </button>
          </Section>

          <Divider />

          <Section title="Lifecycle" description="Control how this sandbox sleeps and gets cleaned up.">
            <ToggleRow
              title="Stop when idle"
              description="Pause the sandbox after a period of inactivity."
              checked={values.autoStop}
              onChange={(next) => void setFieldValue("autoStop", next)}
            />
            {values.autoStop ? (
              <Field label="Idle timeout">
                <Dropdown
                  value={values.idleTimeoutId}
                  options={IDLE_TIMEOUTS.map((entry) => ({ id: entry.id, label: entry.label }))}
                  onChange={(id) => void setFieldValue("idleTimeoutId", id)}
                />
              </Field>
            ) : null}

            <ToggleRow
              title="Auto-destroy"
              description="Permanently delete the sandbox after extended inactivity."
              checked={values.autoDestroy}
              onChange={(next) => void setFieldValue("autoDestroy", next)}
            />
            {values.autoDestroy ? (
              <Field label="Destroy after">
                <Dropdown
                  value={values.destroyTimeoutId}
                  options={DESTROY_TIMEOUTS.map((entry) => ({ id: entry.id, label: entry.label }))}
                  onChange={(id) => void setFieldValue("destroyTimeoutId", id)}
                />
              </Field>
            ) : null}

            <ToggleRow
              title="One-shot sandbox"
              description="Delete this sandbox the first time it stops."
              checked={values.oneShot}
              onChange={(next) => void setFieldValue("oneShot", next)}
            />
          </Section>

          <Divider />

          <Section title="Network" description="Lock down how this sandbox is reached.">
            <ToggleRow
              title="Block outbound network"
              description="Disable all outgoing internet access from this sandbox."
              checked={values.blockOutbound}
              onChange={(next) => void setFieldValue("blockOutbound", next)}
            />
          </Section>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Link
              to={withWorkspaceQuery({ pathname: "/sandboxes", searchStr }) as any}
              className="text-sm text-dash-text-faded transition-colors hover:text-dash-text-strong"
            >
              Cancel
            </Link>
            <DashButton variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create sandbox"}
            </DashButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-dash-text-strong">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-dash-text-faded">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div
      className={`flex flex-col gap-1 ${
        error
          ? "[&_.input-base]:!shadow-[0_0_0_1px_#ef2f1f,0_0_0_3px_rgba(239,47,31,0.15)] [&_textarea]:!shadow-[0_0_0_1px_#ef2f1f,0_0_0_3px_rgba(239,47,31,0.15)]"
          : ""
      }`}
    >
      <label className="text-sm text-dash-text-body">{label}</label>
      {children}
      {error ? <p className="text-xs text-[#f05252]">{error}</p> : hint ? <p className="text-xs text-dash-text-faded">{hint}</p> : null}
    </div>
  );
}

function Divider() {
  return <hr className="my-6 border-dash-border-soft" />;
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm leading-5 text-dash-text-strong">{title}</p>
        <p className="text-xs leading-[1.4] text-dash-text-faded">{description}</p>
      </div>
      <div className="mt-0.5 shrink-0">
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}
