import type { ApiClient, ApiListResponse } from "./types";

export interface DomainRecord {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  active: boolean;
  enabled?: boolean;
  isCustom?: boolean;
  isExpired?: boolean;
  purchased?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  redirect?: {
    url?: string;
    status?: number;
  } | null;
}

export interface DomainDetailDnsRecord {
  id: string;
  name: string;
  type: string;
  value: string;
  ttl?: number;
  isProxied?: boolean;
}

export interface DomainDetailsRecord extends DomainRecord {
  registrar?: string;
  creatorName?: string;
  expiresAt?: string;
  nameservers?: string[];
  nameserver?: {
    expected: string[];
    actual: string[];
  } | null;
  dnsRecords: DomainDetailDnsRecord[];
}

export interface PaginatedDomainsResponse extends ApiListResponse<DomainRecord> {
  currentPage: number;
  totalPages: number;
}

export interface ListDomainsInput {
  projectName?: string;
  q?: string;
  page?: number;
  teamId?: string;
}

export interface AddDomainInput {
  name: string;
  projectId?: string;
  teamId?: string;
}

export interface UpdateDomainInput {
  id: string;
  name?: string;
  redirect?: {
    url?: string;
    status?: number;
  } | null;
  teamId?: string;
}

export interface SearchDomainResult {
  domainName: string;
  purchasable: boolean;
  purchasePrice?: number;
  renewalPrice?: number;
}

export interface DomainsApi {
  list(input?: ListDomainsInput): Promise<PaginatedDomainsResponse>;
  getStatus(domainName: string, input?: { teamId?: string }): Promise<DomainRecord | null>;
  getByName(
    domainName: string,
    input?: { teamId?: string },
  ): Promise<DomainDetailsRecord | null>;
  add(input: AddDomainInput): Promise<DomainRecord>;
  update(input: UpdateDomainInput): Promise<DomainRecord>;
  transfer(input: { domainId: string; projectId: string; teamId?: string }): Promise<void>;
  searchSale(domainName: string): Promise<SearchDomainResult[]>;
  verify(domainId: string): Promise<DomainRecord>;
  remove(input: { domainId: string; projectId?: string; teamId?: string }): Promise<void>;
}

function mapDomainRecord(domain: any): DomainRecord | null {
  let name = "";
  if (typeof domain?.name === "string") {
    name = domain.name.trim();
  }
  if (!name && typeof domain?.whois?.name === "string") {
    name = domain.whois.name.trim();
  }
  if (!name) {
    return null;
  }

  let projectId: string | undefined;
  let projectName: string | undefined;
  if (domain?.project && typeof domain.project === "object") {
    if (domain.project.id != null || domain.project._id != null) {
      projectId = String(domain.project.id ?? domain.project._id);
    }
    if (typeof domain.project.name === "string" && domain.project.name.trim()) {
      projectName = domain.project.name.trim();
    }
  } else if (typeof domain?.project === "string" && domain.project.trim()) {
    projectId = domain.project.trim();
  }

  let createdByName: string | undefined;
  let firstName = "";
  if (typeof domain?.whois?.user?.first_name === "string") {
    firstName = domain.whois.user.first_name.trim();
  }

  let lastName = "";
  if (typeof domain?.whois?.user?.last_name === "string") {
    lastName = domain.whois.user.last_name.trim();
  }
  if (firstName || lastName) {
    createdByName = `${firstName} ${lastName}`.trim();
  }

  let active = false;
  if (typeof domain?.active === "boolean") {
    active = domain.active;
  } else if (typeof domain?.enabled === "boolean") {
    active = domain.enabled;
  }

  let enabled: boolean | undefined;
  if (typeof domain?.enabled === "boolean") {
    enabled = domain.enabled;
  }

  let isCustom: boolean | undefined;
  if (typeof domain?.isCustom === "boolean") {
    isCustom = domain.isCustom;
  } else if (typeof domain?.is_custom === "boolean") {
    isCustom = domain.is_custom;
  } else {
    const lowerName = name.toLowerCase();
    const isBrimbleManagedDefault =
      lowerName.endsWith(".brimble.app") || lowerName.endsWith(".brimble.io");

    if (isBrimbleManagedDefault) {
      isCustom = false;
    }
  }

  let isExpired: boolean | undefined;
  if (typeof domain?.isExpired === "boolean") {
    isExpired = domain.isExpired;
  }

  let purchased: boolean | undefined;
  if (typeof domain?.purchased === "boolean") {
    purchased = domain.purchased;
  }

  let redirect: DomainRecord["redirect"] = null;
  if (domain?.redirect && typeof domain.redirect === "object") {
    let status: number | undefined;
    if (typeof domain.redirect.status === "number") {
      status = domain.redirect.status;
    }

    let url: string | undefined;
    if (typeof domain.redirect.url === "string" && domain.redirect.url.trim()) {
      url = domain.redirect.url.trim();
    }

    redirect = { url, status };
  }

  let createdAt: string | undefined;
  if (typeof domain?.createdAt === "string") {
    createdAt = domain.createdAt;
  } else if (typeof domain?.created_at === "string") {
    createdAt = domain.created_at;
  }

  let updatedAt: string | undefined;
  if (typeof domain?.updatedAt === "string") {
    updatedAt = domain.updatedAt;
  } else if (typeof domain?.updated_at === "string") {
    updatedAt = domain.updated_at;
  }

  return {
    id: String(domain?.id ?? domain?._id ?? name),
    name,
    projectId,
    projectName,
    active,
    enabled,
    isCustom,
    isExpired,
    purchased,
    createdAt,
    updatedAt,
    createdByName,
    redirect,
  };
}

function mapDomainDetailsRecord(domain: any): DomainDetailsRecord | null {
  const base = mapDomainRecord(domain);
  if (!base) {
    return null;
  }

  let registrar: string | undefined;
  if (typeof domain?.whois?.registrar === "string" && domain.whois.registrar.trim()) {
    registrar = domain.whois.registrar.trim();
  }

  let creatorName: string | undefined;
  let firstName = "";
  if (typeof domain?.whois?.user?.first_name === "string") {
    firstName = domain.whois.user.first_name.trim();
  }
  let lastName = "";
  if (typeof domain?.whois?.user?.last_name === "string") {
    lastName = domain.whois.user.last_name.trim();
  }
  if (firstName || lastName) {
    creatorName = `${firstName} ${lastName}`.trim();
  }

  let expiresAt: string | undefined;
  if (typeof domain?.whois?.expires_at === "string" && domain.whois.expires_at.trim()) {
    expiresAt = domain.whois.expires_at.trim();
  } else if (
    typeof domain?.whois?.renewal_date === "string" &&
    domain.whois.renewal_date.trim()
  ) {
    expiresAt = domain.whois.renewal_date.trim();
  }

  let nameservers: string[] = [];
  if (Array.isArray(domain?.nameservers)) {
    nameservers = domain.nameservers
      .map((item: unknown) => {
        if (typeof item === "string") {
          return item.trim();
        }
        return "";
      })
      .filter(Boolean);
  }

  let nameserver: DomainDetailsRecord["nameserver"] = null;
  if (domain?.nameserver && typeof domain.nameserver === "object") {
    let expected: string[] = [];
    if (Array.isArray(domain.nameserver.expected)) {
      expected = domain.nameserver.expected
        .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }

    let actual: string[] = [];
    if (Array.isArray(domain.nameserver.actual)) {
      actual = domain.nameserver.actual
        .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }

    nameserver = { expected, actual };
  }

  let dnsRecords: DomainDetailDnsRecord[] = [];
  if (Array.isArray(domain?.dns)) {
    dnsRecords = domain.dns
      .map((record: any) => {
        let name = "";
        if (typeof record?.name === "string") {
          name = record.name.trim();
        }

        let type = "";
        if (typeof record?.type === "string") {
          type = record.type.trim();
        }

        let value = "";
        if (typeof record?.value === "string") {
          value = record.value.trim();
        }

        if (!name && !type && !value) {
          return null;
        }

        let ttl: number | undefined;
        if (typeof record?.ttl === "number") {
          ttl = record.ttl;
        }

        let isProxied: boolean | undefined;
        if (typeof record?.isProxied === "boolean") {
          isProxied = record.isProxied;
        } else if (typeof record?.is_proxied === "boolean") {
          isProxied = record.is_proxied;
        }

        return {
          id: String(record?.id ?? record?._id ?? `${type}:${name}:${value}`),
          name,
          type,
          value,
          ttl,
          isProxied,
        } satisfies DomainDetailDnsRecord;
      })
      .filter((record: DomainDetailDnsRecord | null): record is DomainDetailDnsRecord => {
        return record !== null;
      });
  }

  return {
    ...base,
    registrar,
    creatorName,
    expiresAt,
    nameservers,
    nameserver,
    dnsRecords,
  };
}

export function createDomainsApi(client: ApiClient): DomainsApi {
  const listEndpoint = "/core/v1/domains";

  return {
    async list(input) {
      const response = await client.request<any>(listEndpoint, {
        method: "GET",
        query: {
          name: input?.projectName,
          q: input?.q,
          page: input?.page,
          teamId: input?.teamId,
        },
      });

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      let rawDomains: any[] = [];
      if (Array.isArray(root?.domains)) {
        rawDomains = root.domains;
      } else if (Array.isArray(root)) {
        rawDomains = root;
      }

      const items = rawDomains
        .map((domain: any) => mapDomainRecord(domain))
        .filter((domain: DomainRecord | null): domain is DomainRecord => domain !== null);

      let currentPage = 1;
      if (typeof root?.currentPage === "number") {
        currentPage = root.currentPage;
      } else if (typeof root?.current_page === "number") {
        currentPage = root.current_page;
      }

      let totalPages = 1;
      if (typeof root?.totalPages === "number") {
        totalPages = root.totalPages;
      } else if (typeof root?.total_pages === "number") {
        totalPages = root.total_pages;
      }

      let total: number | undefined;
      if (typeof root?.total === "number") {
        total = root.total;
      } else if (typeof root?.overallTotalDomains === "number") {
        total = root.overallTotalDomains;
      } else if (typeof root?.count === "number") {
        total = root.count;
      }

      return {
        items,
        currentPage,
        totalPages,
        total,
      };
    },

    async getStatus(domainName, input) {
      const response = await client.request<any>(
        `${listEndpoint}/${encodeURIComponent(domainName)}/status`,
        {
          method: "GET",
          query: {
            teamId: input?.teamId,
          },
        },
      );

      const root = response?.data?.data ?? response?.data ?? response ?? null;
      if (!root) {
        return null;
      }

      return mapDomainRecord(root);
    },

    async getByName(domainName, input) {
      const response = await client.request<any>(
        `${listEndpoint}/${encodeURIComponent(domainName)}`,
        {
          method: "GET",
          query: {
            teamId: input?.teamId,
          },
        },
      );

      const root = response?.data?.data ?? response?.data ?? response ?? null;
      if (!root) {
        return null;
      }

      return mapDomainDetailsRecord(root);
    },

    async add(input) {
      const response = await client.request<any>(
        `${listEndpoint}/${input.projectId ? encodeURIComponent(input.projectId) : ""}`,
        {
          method: "POST",
          body: {
            name: input.name,
            teamId: input.teamId,
          },
        },
      );

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const mapped = mapDomainRecord(root);
      if (!mapped) {
        throw new Error("Invalid domain response");
      }

      return mapped;
    },

    async update(input) {
      const response = await client.request<any>(
        `${listEndpoint}/${encodeURIComponent(input.id)}`,
        {
          method: "PATCH",
          body: {
            name: input.name,
            redirect: input.redirect,
            teamId: input.teamId,
          },
        },
      );

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const mapped = mapDomainRecord(root);
      if (!mapped) {
        throw new Error("Invalid domain response");
      }

      return mapped;
    },

    async transfer(input) {
      await client.request<any>(
        `${listEndpoint}/${encodeURIComponent(input.domainId)}/transfer/${encodeURIComponent(input.projectId)}`,
        {
          method: "POST",
          body: {
            teamId: input.teamId,
          },
        },
      );
    },

    async searchSale(domainName) {
      const response = await client.request<any>("/core/v1/domains/sale/search", {
        method: "POST",
        body: {
          name: domainName,
        },
      });

      const root = response?.data?.data ?? response?.data ?? response ?? [];
      const items = Array.isArray(root) ? root : [];

      return items
        .map((item: any) => {
          let name = "";
          if (typeof item?.domainName === "string") {
            name = item.domainName;
          } else if (typeof item?.name === "string") {
            name = item.name;
          }
          if (!name) {
            return null;
          }

          return {
            domainName: name,
            purchasable: Boolean(item?.purchasable),
            purchasePrice:
              typeof item?.purchasePrice === "number" ? item.purchasePrice : undefined,
            renewalPrice:
              typeof item?.renewalPrice === "number" ? item.renewalPrice : undefined,
          } satisfies SearchDomainResult;
        })
        .filter((item: SearchDomainResult | null): item is SearchDomainResult => item !== null);
    },

    async verify() {
      throw new Error("Not implemented: domains.verify");
    },

    async remove(input) {
      const domainId = input.domainId.trim();
      if (!domainId) {
        throw new Error("Domain id is required");
      }

      let path = `${listEndpoint}/${encodeURIComponent(domainId)}`;
      if (input.projectId && input.projectId.trim()) {
        path = `${path}/${encodeURIComponent(input.projectId.trim())}`;
      }

      await client.request<any>(path, {
        method: "DELETE",
        query: {
          teamId: input.teamId,
        },
      });
    },
  };
}
