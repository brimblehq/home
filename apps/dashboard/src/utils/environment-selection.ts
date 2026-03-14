export interface EnvironmentIdentity {
  _id: string;
  isDefault?: boolean;
}

function findDefaultEnvironmentId(environments: EnvironmentIdentity[]): string | undefined {
  return (environments.find((environment) => environment.isDefault) ?? environments[0])?._id;
}

export function resolveEnvironmentId(input: {
  requestedEnvironmentId?: string;
  preferredEnvironmentId?: string | null;
  environments: EnvironmentIdentity[];
}): string | undefined {
  const { requestedEnvironmentId, preferredEnvironmentId, environments } = input;

  if (requestedEnvironmentId === "all") {
    return undefined;
  }

  if (requestedEnvironmentId) {
    return environments.some((environment) => environment._id === requestedEnvironmentId)
      ? requestedEnvironmentId
      : findDefaultEnvironmentId(environments);
  }

  if (
    preferredEnvironmentId &&
    environments.some((environment) => environment._id === preferredEnvironmentId)
  ) {
    return preferredEnvironmentId;
  }

  return findDefaultEnvironmentId(environments);
}

export function hasExplicitEnvironmentSelection(environmentId?: string): boolean {
  return Boolean(environmentId && environmentId !== "all");
}
