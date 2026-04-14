export type TokenRef =
  | { kind: "shared"; name: string; raw: string; start: number; end: number }
  | { kind: "project"; projectSlug: string; name: string; raw: string; start: number; end: number };

export const REFERENCE_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function hasReferenceTrigger(value: string): boolean {
  return value.includes("{{");
}

export function parseTokens(value: string): TokenRef[] {
  if (!value) return [];
  const out: TokenRef[] = [];
  for (const m of value.matchAll(REFERENCE_PATTERN)) {
    const token = (m[1] ?? "").trim();
    if (!token) continue;
    const raw = m[0];
    const start = m.index ?? 0;
    const end = start + raw.length;

    if (/^shared\./i.test(token)) {
      const name = token.slice(token.indexOf(".") + 1).trim();
      if (name) out.push({ kind: "shared", name, raw, start, end });
      continue;
    }

    if (token.startsWith("@")) {
      const dot = token.indexOf(".");
      if (dot <= 1 || dot === token.length - 1) continue;
      const projectSlug = token.slice(1, dot).trim();
      const name = token.slice(dot + 1).trim();
      if (projectSlug && name) {
        out.push({ kind: "project", projectSlug, name, raw, start, end });
      }
    }
  }
  return out;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export function highlightReferences(value: string): string {
  if (!value) return "";
  const tokens = parseTokens(value);
  const byStart = new Map<number, TokenRef>();
  for (const t of tokens) byStart.set(t.start, t);

  let output = "";
  let i = 0;
  while (i < value.length) {
    const token = byStart.get(i);
    if (token) {
      const cls = "text-dash-syntax";
      output += `<span class="italic ${cls}">${escapeHtml(token.raw)}</span>`;
      i = token.end;
      continue;
    }
    const openIdx = value.indexOf("{{", i);
    if (openIdx === -1) {
      output += escapeHtml(value.slice(i));
      break;
    }
    const closeIdx = value.indexOf("}}", openIdx + 2);
    if (closeIdx === -1) {
      output += escapeHtml(value.slice(i, openIdx));
      output += `<span class="italic text-dash-syntax">${escapeHtml(value.slice(openIdx))}</span>`;
      break;
    }
    output += escapeHtml(value.slice(i, closeIdx + 2));
    i = closeIdx + 2;
  }
  return output;
}

export function detectReferenceTrigger(value: string, cursor: number): { start: number; query: string } | null {
  const before = value.slice(0, cursor);
  const openIdx = before.lastIndexOf("{{");
  if (openIdx === -1) return null;
  const between = before.slice(openIdx + 2);
  if (between.includes("}}")) return null;
  if (/[{}\n]/.test(between)) return null;
  return { start: openIdx, query: between };
}

export interface ReferenceWarning {
  token: string;
  message: string;
}

export interface ReferenceValidationContext {
  sharedVars: Set<string>;
  sharedDisabled: boolean;
  siblingSlugs: Set<string>;
  projectVarsCache: Map<string, Set<string>>;
  currentProjectSlug?: string;
}

export function validateReferences(value: string, ctx: ReferenceValidationContext): ReferenceWarning[] {
  const out: ReferenceWarning[] = [];
  for (const token of parseTokens(value)) {
    if (token.kind === "shared") {
      if (ctx.sharedDisabled) {
        out.push({
          token: token.raw,
          message: "Shared variables are disabled for this project — this token will not resolve.",
        });
      } else if (!ctx.sharedVars.has(token.name)) {
        out.push({
          token: token.raw,
          message: `No shared variable "${token.name}" in this environment.`,
        });
      }
      continue;
    }
    if (ctx.currentProjectSlug && token.projectSlug === ctx.currentProjectSlug) {
      out.push({
        token: token.raw,
        message: "Self-reference — this will resolve to the literal token.",
      });
      continue;
    }
    if (!ctx.siblingSlugs.has(token.projectSlug)) {
      out.push({
        token: token.raw,
        message: `No project "${token.projectSlug}" in this workspace.`,
      });
      continue;
    }
    const cachedVars = ctx.projectVarsCache.get(token.projectSlug);
    if (cachedVars && !cachedVars.has(token.name)) {
      out.push({
        token: token.raw,
        message: `Project "${token.projectSlug}" has no variable "${token.name}".`,
      });
    }
  }
  return out;
}
