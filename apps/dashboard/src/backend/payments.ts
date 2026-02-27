import config from "@/config";
import type { ApiClient } from "./types";
import type {
  PaymentsApi,
  PaymentMethod,
  SetupIntentResult,
  AddPaymentMethodInput,
  Subscription,
  CreateSubscriptionInput,
  SwapPlanInput,
  PlanSpec,
  BillEstimate,
  InvoicePage,
  PurchaseInput,
  PurchaseResult,
  UpdateSpendingLimitInput,
  UpdateTeamSubscriptionInput,
} from "./payments/types";

export type { PaymentsApi } from "./payments/types";
export type {
  PaymentMethod,
  PaymentMethodCard,
  SetupIntentResult,
  AddPaymentMethodInput,
  Subscription,
  CreateSubscriptionInput,
  SwapPlanInput,
  PlanSpec,
  BillEstimate,
  BillEstimateLineItem,
  Invoice,
  InvoicePage,
  PurchaseInput,
  PurchaseResult,
  UpdateSpendingLimitInput,
  UpdateTeamSubscriptionInput,
} from "./payments/types";

function unwrapData<T = any>(payload: any): T {
  if (payload?.data?.data !== undefined) return payload.data.data as T;
  if (payload?.data !== undefined) return payload.data as T;
  return payload as T;
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createPaymentsApi(client: ApiClient): PaymentsApi {
  const base = config.paymentApiUrl;

  return {
    async listPaymentMethods(): Promise<PaymentMethod[]> {
      const res = await client.request<any>(`${base}/payment/payment-methods`, {
        method: "GET",
      });
      const data = unwrapData<any>(res);
      return Array.isArray(data) ? data : (data?.payment_methods ?? []);
    },

    async createSetupIntent(): Promise<SetupIntentResult> {
      const res = await client.request<any>(`${base}/payment/setup-intent`, {
        method: "POST",
      });
      const data = unwrapData<any>(res);
      return { client_secret: String(data?.client_secret ?? "") };
    },

    async addPaymentMethod(input: AddPaymentMethodInput): Promise<PaymentMethod> {
      const res = await client.request<any>(`${base}/payment/payment-method`, {
        method: "POST",
        body: { payment_method: input.payment_method },
      });
      return unwrapData<PaymentMethod>(res);
    },

    async removePaymentMethod(id: string): Promise<void> {
      await client.request(`${base}/payment/payment-method/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },

    async setDefaultPaymentMethod(id: string): Promise<void> {
      await client.request(`${base}/payment/default-payment-method`, {
        method: "PUT",
        body: { payment_method_id: id },
      });
    },

    async getSubscription(): Promise<Subscription | null> {
      try {
        const res = await client.request<any>(`${base}/subscriptions/current`, {
          method: "GET",
        });
        const data = unwrapData<any>(res);
        if (!data || !data.id) return null;
        return data as Subscription;
      } catch {
        return null;
      }
    },

    async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
      const res = await client.request<any>(`${base}/subscriptions`, {
        method: "POST",
        body: {
          plan_id: input.plan_id,
          payment_method_id: input.payment_method_id,
        },
        headers: { "Idempotency-Key": generateIdempotencyKey() },
      });
      return unwrapData<Subscription>(res);
    },

    async swapPlan(input: SwapPlanInput): Promise<Subscription> {
      const res = await client.request<any>(`${base}/subscriptions/swap`, {
        method: "PUT",
        body: { plan_id: input.plan_id },
      });
      return unwrapData<Subscription>(res);
    },

    async cancelSubscription(): Promise<void> {
      await client.request(`${base}/subscriptions/cancel`, {
        method: "POST",
      });
    },

    async listPlans(): Promise<PlanSpec[]> {
      const res = await client.request<any>(`${base}/plans`, {
        method: "GET",
      });
      const data = unwrapData<any>(res);
      return Array.isArray(data) ? data : (data?.plans ?? []);
    },

    async getBillEstimate(): Promise<BillEstimate> {
      const res = await client.request<any>(`${base}/billing/estimate`, {
        method: "GET",
      });
      return unwrapData<BillEstimate>(res);
    },

    async listInvoices(page = 1, perPage = 10): Promise<InvoicePage> {
      const res = await client.request<any>(`${base}/invoices`, {
        method: "GET",
        query: { page, per_page: perPage },
      });
      const data = unwrapData<any>(res);
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      return {
        items,
        page: Number(data?.page ?? page),
        per_page: Number(data?.per_page ?? perPage),
        total: Number(data?.total ?? items.length),
        total_pages: Number(data?.total_pages ?? 1),
      };
    },

    async purchase(input: PurchaseInput): Promise<PurchaseResult> {
      const res = await client.request<any>(`${base}/purchases`, {
        method: "POST",
        body: {
          items: input.items,
          payment_method_id: input.payment_method_id,
        },
        headers: { "Idempotency-Key": generateIdempotencyKey() },
      });
      const data = unwrapData<any>(res);
      return {
        success: Boolean(data?.success),
        requires_action: data?.requires_action,
        payment_intent_client_secret: data?.payment_intent_client_secret,
      };
    },

    async updateSpendingLimit(input: UpdateSpendingLimitInput): Promise<void> {
      await client.request(`${base}/spending-limit`, {
        method: "PUT",
        body: { monthly_limit: input.monthly_limit },
      });
    },

    async updateTeamSubscription(input: UpdateTeamSubscriptionInput): Promise<void> {
      await client.request(`${base}/teams/${encodeURIComponent(input.team_id)}/subscription`, {
        method: "PUT",
        body: {
          ...(input.members !== undefined ? { members: input.members } : {}),
          ...(input.concurrent_builds !== undefined ? { concurrent_builds: input.concurrent_builds } : {}),
        },
      });
    },
  };
}
