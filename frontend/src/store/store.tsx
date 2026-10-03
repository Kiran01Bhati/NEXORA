import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createInitialState } from "@/data/seed";
import { VERSION, currentUser } from "@/lib/domain";
import {
  acknowledgeAlert,
  addCustomer,
  addInteraction,
  addLead,
  addQuotation,
  adjustStock,
  approveOrder,
  attemptApproval,
  closeDecision,
  convertLead,
  convertQuotation,
  createOrder,
  dismissToast,
  goBack,
  inviteUser,
  markAllNotices,
  markNotice,
  moveOpportunity,
  navigate,
  patchUi,
  pruneToasts,
  pushToast,
  receivePurchase,
  recordPayment,
  reevaluate,
  rejectOrder,
  releaseOrder,
  requestChanges,
  resetDemo,
  setPolicy,
  setUser,
} from "@/store/actions";
import type {
  AppState,
  CustomerInput,
  InteractionInput,
  LeadInput,
  OrderInput,
  PaymentInput,
  QuoteInput,
  QuickType,
  Role,
  Toast,
  View,
} from "@/types";

const KEY = "nexora.v1";

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as { version?: number; data?: AppState };
    if (parsed.version !== VERSION || !parsed.data?.orders || !parsed.data.customers) return createInitialState();
    const fresh = createInitialState();
    return {
      ...fresh,
      ...parsed.data,
      toasts: [],
      ui: {
        ...fresh.ui,
        sidebarCollapsed: !!parsed.data.ui?.sidebarCollapsed,
        bannerDismissed: !!parsed.data.ui?.bannerDismissed,
      },
    };
  } catch {
    return createInitialState();
  }
}

interface Api {
  state: AppState;
  user: ReturnType<typeof currentUser>;
  navigate: (view: View) => void;
  back: () => void;
  setUser: (id: string) => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  setUi: (patch: Partial<AppState["ui"]>) => void;
  openQuick: (type: QuickType) => void;
  markNotice: (id: string) => void;
  markAllNotices: () => void;
  acknowledgeAlert: (id: string) => void;
  setPolicy: (policy: AppState["policy"]) => void;
  reevaluate: () => void;
  addCustomer: (input: CustomerInput) => void;
  addLead: (input: LeadInput) => void;
  convertLead: (id: string) => void;
  moveOpportunity: (id: string, stage: AppState["opportunities"][number]["stage"]) => void;
  addInteraction: (input: InteractionInput) => void;
  addQuotation: (input: QuoteInput) => void;
  convertQuotation: (id: string) => void;
  createOrder: (input: OrderInput) => void;
  attemptApproval: (orderId: string) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  requestChanges: (orderId: string, note: string) => void;
  releaseOrder: (orderId: string) => void;
  recordPayment: (input: PaymentInput) => void;
  receivePurchase: (id: string) => void;
  adjustStock: (productId: string, onHand: number) => void;
  inviteUser: (input: { name: string; email: string; role: Role }) => void;
  resetDemo: () => void;
  refresh: () => void;
  closeDecision: () => void;
}

const Ctx = createContext<Api | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());

  useEffect(() => {
    const { toasts, ui, ...data } = state;
    const payload = {
      version: VERSION,
      data: { ...data, toasts: [], ui: { ...ui, decision: null, commandOpen: false, notifOpen: false, quickOpen: false, scenarioOpen: false, mobileNav: false, refreshing: false } },
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  }, [state]);

  useEffect(() => {
    const id = window.setInterval(() => setState((s) => pruneToasts(s)), 700);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      customers: "Customers",
      customer: "Customer",
      leads: "Leads",
      opportunities: "Opportunities",
      pipeline: "Sales Pipeline",
      quotations: "Quotations",
      quotation: "Quotation",
      interactions: "Interactions",
      products: "Products",
      inventory: "Inventory",
      purchases: "Purchases",
      orders: "Sales Orders",
      order: "Sales Order",
      invoices: "Invoices",
      invoice: "Invoice",
      payments: "Payments",
      accounts: "Accounts",
      risk: "Risk Dashboard",
      register: "Risk Register",
      alerts: "Alerts",
      approvals: "Approvals",
      case: "Risk Case",
      reports: "Reports",
      analytics: "Analytics",
      users: "Users",
      roles: "Roles & Permissions",
      hierarchy: "Approval Hierarchy",
      audit: "Audit Logs",
      settings: "Settings",
    };
    document.title = `${titles[state.view.page] ?? "NEXORA"} · NEXORA`;
  }, [state.view.page]);

  const api = useMemo<Api>(() => {
    const run = (fn: (s: AppState) => AppState) => setState(fn);
    return {
      state,
      user: currentUser(state),
      navigate: (view) => run((s) => navigate(s, view)),
      back: () => run(goBack),
      setUser: (id) => run((s) => setUser(s, id)),
      toast: (message, tone) => run((s) => pushToast(s, message, tone)),
      dismissToast: (id) => run((s) => dismissToast(s, id)),
      setUi: (patch) => run((s) => patchUi(s, patch)),
      openQuick: (type) => run((s) => patchUi(s, { quickOpen: true, quickType: type, commandOpen: false })),
      markNotice: (id) => run((s) => markNotice(s, id)),
      markAllNotices: () => run(markAllNotices),
      acknowledgeAlert: (id) => run((s) => acknowledgeAlert(s, id)),
      setPolicy: (policy) => run((s) => setPolicy(s, policy)),
      reevaluate: () => run(reevaluate),
      addCustomer: (input) => run((s) => addCustomer(s, input)),
      addLead: (input) => run((s) => addLead(s, input)),
      convertLead: (id) => run((s) => convertLead(s, id)),
      moveOpportunity: (id, stage) => run((s) => moveOpportunity(s, id, stage)),
      addInteraction: (input) => run((s) => addInteraction(s, input)),
      addQuotation: (input) => run((s) => addQuotation(s, input)),
      convertQuotation: (id) => run((s) => convertQuotation(s, id)),
      createOrder: (input) => run((s) => createOrder(s, input)),
      attemptApproval: (id) => run((s) => attemptApproval(s, id)),
      approveOrder: (id) => run((s) => approveOrder(s, id)),
      rejectOrder: (id, reason) => run((s) => rejectOrder(s, id, reason)),
      requestChanges: (id, note) => run((s) => requestChanges(s, id, note)),
      releaseOrder: (id) => run((s) => releaseOrder(s, id)),
      recordPayment: (input) => run((s) => recordPayment(s, input)),
      receivePurchase: (id) => run((s) => receivePurchase(s, id)),
      adjustStock: (productId, onHand) => run((s) => adjustStock(s, productId, onHand)),
      inviteUser: (input) => run((s) => inviteUser(s, input)),
      resetDemo: () => {
        localStorage.removeItem(KEY);
        setState(resetDemo());
      },
      refresh: () => {
        setState((s) => patchUi(s, { refreshing: true }));
        window.setTimeout(() => setState((s) => patchUi(s, { refreshing: false })), 700);
      },
      closeDecision: () => run(closeDecision),
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
