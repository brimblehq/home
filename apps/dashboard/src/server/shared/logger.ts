import { createConsola, LogLevels } from "consola";

const LOG_LEVEL_MAP: Record<string, number> = {
  debug: LogLevels.debug,
  info: LogLevels.info,
  warn: LogLevels.warn,
  error: LogLevels.error,
  silent: LogLevels.silent,
};

function resolveLogLevel(): number {
  const env = process.env.LOG_LEVEL?.trim().toLowerCase() ?? "";
  if (env && env in LOG_LEVEL_MAP) return LOG_LEVEL_MAP[env];
  return process.env.NODE_ENV === "production" ? LogLevels.info : LogLevels.debug;
}

export const logger = createConsola({
  level: resolveLogLevel(),
  formatOptions: {
    compact: true,
    depth: 4,
  },
});

export const authLogger = logger.withTag("auth");
export const domainsLogger = logger.withTag("domains");
export const domainsDnsLogger = logger.withTag("domains.dns");
export const projectsLogger = logger.withTag("projects");
export const workspacesLogger = logger.withTag("workspaces");
export const mcpLogger = logger.withTag("mcp");
export const teamsLogger = logger.withTag("teams");
export const paymentsLogger = logger.withTag("payments");
export const deploymentsLogger = logger.withTag("deployments");
export const settingsLogger = logger.withTag("settings");
export const scalingLogger = logger.withTag("scaling");
export const pricingLogger = logger.withTag("pricing");

export function createModuleLogger(tag: string) {
  return logger.withTag(tag);
}
