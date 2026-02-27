import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPaymentMethodsServerFn,
  getSubscriptionServerFn,
  getBillEstimateServerFn,
  getPaymentInvoicesServerFn,
  getPlanSpecsServerFn,
  createSetupIntentServerFn,
  addPaymentMethodServerFn,
  removePaymentMethodServerFn,
  setDefaultPaymentMethodServerFn,
  createSubscriptionServerFn,
  swapPlanServerFn,
  cancelSubscriptionServerFn,
  purchaseServerFn,
  updateSpendingLimitServerFn,
} from "@/server/payments/actions";

/* ── Query key factory ── */

export const paymentKeys = {
  all: ["payments"] as const,
  methods: () => [...paymentKeys.all, "methods"] as const,
  subscription: () => [...paymentKeys.all, "subscription"] as const,
  estimate: () => [...paymentKeys.all, "estimate"] as const,
  invoices: (page: number) => [...paymentKeys.all, "invoices", page] as const,
  plans: () => [...paymentKeys.all, "plans"] as const,
};

/* ── Typed server function callers ── */

const getInvoices = getPaymentInvoicesServerFn as unknown as (args: {
  data: { page?: number; per_page?: number };
}) => Promise<any>;

const addMethod = addPaymentMethodServerFn as unknown as (args: {
  data: { payment_method: string };
}) => Promise<any>;

const removeMethod = removePaymentMethodServerFn as unknown as (args: {
  data: { payment_method_id: string };
}) => Promise<any>;

const setDefault = setDefaultPaymentMethodServerFn as unknown as (args: {
  data: { payment_method_id: string };
}) => Promise<any>;

const createSub = createSubscriptionServerFn as unknown as (args: {
  data: { plan_id: string; payment_method_id: string };
}) => Promise<any>;

const swap = swapPlanServerFn as unknown as (args: {
  data: { plan_id: string };
}) => Promise<any>;

const purchase = purchaseServerFn as unknown as (args: {
  data: { items: Array<{ id: string; quantity?: number }>; payment_method_id: string };
}) => Promise<any>;

const updateLimit = updateSpendingLimitServerFn as unknown as (args: {
  data: { monthly_limit: number };
}) => Promise<any>;

/* ── Queries ── */

export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentKeys.methods(),
    queryFn: () => getPaymentMethodsServerFn(),
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: paymentKeys.subscription(),
    queryFn: () => getSubscriptionServerFn(),
  });
}

export function useBillEstimate() {
  return useQuery({
    queryKey: paymentKeys.estimate(),
    queryFn: () => getBillEstimateServerFn(),
  });
}

export function useInvoices(page: number) {
  return useQuery({
    queryKey: paymentKeys.invoices(page),
    queryFn: () => getInvoices({ data: { page } }),
    placeholderData: (prev: any) => prev,
  });
}

export function usePlanSpecs() {
  return useQuery({
    queryKey: paymentKeys.plans(),
    queryFn: () => getPlanSpecsServerFn(),
  });
}

/* ── Mutations ── */

export function useCreateSetupIntent() {
  return useMutation({
    mutationFn: () => createSetupIntentServerFn(),
  });
}

export function useAddPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      addMethod({ data: { payment_method: paymentMethodId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
  });
}

export function useRemovePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      removeMethod({ data: { payment_method_id: paymentMethodId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      setDefault({ data: { payment_method_id: paymentMethodId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { plan_id: string; payment_method_id: string }) =>
      createSub({ data: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.subscription() });
      void qc.invalidateQueries({ queryKey: paymentKeys.methods() });
      void qc.invalidateQueries({ queryKey: paymentKeys.estimate() });
    },
  });
}

export function useSwapPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => swap({ data: { plan_id: planId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.subscription() });
      void qc.invalidateQueries({ queryKey: paymentKeys.estimate() });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelSubscriptionServerFn(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.subscription() });
    },
  });
}

export function usePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { items: Array<{ id: string; quantity?: number }>; payment_method_id: string }) =>
      purchase({ data: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.estimate() });
      void qc.invalidateQueries({ queryKey: paymentKeys.invoices(1) });
    },
  });
}

export function useUpdateSpendingLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (monthlyLimit: number) =>
      updateLimit({ data: { monthly_limit: monthlyLimit } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.estimate() });
    },
  });
}
