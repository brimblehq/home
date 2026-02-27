/* ── Payment method ── */

export interface PaymentMethodCard {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: PaymentMethodCard;
  is_default: boolean;
  created_at: string;
}

/* ── Subscription ── */

export interface Subscription {
  id: string;
  plan: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method?: string;
}

/* ── Plan specs ── */

export interface PlanSpec {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
}

/* ── Invoices ── */

export interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  period_start: string;
  period_end: string;
  invoice_pdf?: string;
  created_at: string;
}

export interface InvoicePage {
  items: Invoice[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/* ── Bill estimate ── */

export interface BillEstimateLineItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface BillEstimate {
  current_usage: number;
  projected_total: number;
  line_items: BillEstimateLineItem[];
  next_billing_date: string;
}

/* ── Setup intent ── */

export interface SetupIntentResult {
  client_secret: string;
}

/* ── Mutation inputs ── */

export interface AddPaymentMethodInput {
  payment_method: string;
}

export interface CreateSubscriptionInput {
  plan_id: string;
  payment_method_id: string;
}

export interface SwapPlanInput {
  plan_id: string;
}

export interface PurchaseInput {
  items: Array<{ id: string; quantity?: number }>;
  payment_method_id: string;
}

export interface UpdateSpendingLimitInput {
  monthly_limit: number;
}

export interface UpdateTeamSubscriptionInput {
  team_id: string;
  members?: number;
  concurrent_builds?: number;
}

/* ── Purchase result (SCA handling) ── */

export interface PurchaseResult {
  success: boolean;
  requires_action?: boolean;
  payment_intent_client_secret?: string;
}

/* ── API interface ── */

export interface PaymentsApi {
  listPaymentMethods(): Promise<PaymentMethod[]>;
  createSetupIntent(): Promise<SetupIntentResult>;
  addPaymentMethod(input: AddPaymentMethodInput): Promise<PaymentMethod>;
  removePaymentMethod(id: string): Promise<void>;
  setDefaultPaymentMethod(id: string): Promise<void>;
  getSubscription(): Promise<Subscription | null>;
  createSubscription(input: CreateSubscriptionInput): Promise<Subscription>;
  swapPlan(input: SwapPlanInput): Promise<Subscription>;
  cancelSubscription(): Promise<void>;
  listPlans(): Promise<PlanSpec[]>;
  getBillEstimate(): Promise<BillEstimate>;
  listInvoices(page?: number, perPage?: number): Promise<InvoicePage>;
  purchase(input: PurchaseInput): Promise<PurchaseResult>;
  updateSpendingLimit(input: UpdateSpendingLimitInput): Promise<void>;
  updateTeamSubscription(input: UpdateTeamSubscriptionInput): Promise<void>;
}
