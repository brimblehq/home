import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
import { IDLE_TIMEOUTS, SANDBOX_REGIONS, SANDBOX_TEMPLATES } from "@/lib/sandboxes/mock-data";

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
  envVars: { key: string; value: string }[];
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
});

const initialValues: SandboxFormValues = {
  name: "",
  description: "",
  template: SANDBOX_TEMPLATES[0]?.id ?? "",
  region: SANDBOX_REGIONS[0]?.id ?? "",
  cpu: 1,
  memoryGb: 2,
  diskSize: "10",
  autoStop: true,
  idleTimeoutId: "30m",
  envVars: [],
};

function NewSandboxPage() {
  const navigate = useNavigate();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const haptics = useHaptics();
  const [submitting, setSubmitting] = useState(false);

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
              options={SANDBOX_REGIONS.map((entry) => ({ id: entry.id, label: entry.label }))}
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

          <DiskSizeSelect
            label="Persistent disk"
            value={values.diskSize}
            onChange={(id) => void setFieldValue("diskSize", id)}
          />
        </Section>

        <Divider />

        <Section title="Secrets" description="Stored securely on Brimble and injected at runtime.">
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

        <Section title="Auto-stop" description="Pause the sandbox when it's been idle for a while.">
          <div className="flex items-center justify-between rounded-[4px] bg-dash-bg-elevated px-3 py-2.5">
            <div>
              <p className="text-sm text-dash-text-strong">Stop when idle</p>
              <p className="text-xs text-dash-text-faded">Recommended for sandboxes that handle bursty traffic.</p>
            </div>
            <ToggleSwitch
              checked={values.autoStop}
              onChange={(next) => void setFieldValue("autoStop", next)}
            />
          </div>

          {values.autoStop ? (
            <Field label="Idle timeout">
              <Dropdown
                value={values.idleTimeoutId}
                options={IDLE_TIMEOUTS.map((entry) => ({ id: entry.id, label: entry.label }))}
                onChange={(id) => void setFieldValue("idleTimeoutId", id)}
              />
            </Field>
          ) : null}
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
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

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
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
