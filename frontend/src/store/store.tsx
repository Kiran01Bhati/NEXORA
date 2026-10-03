import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createInitialState } from "@/data/seed";
import { VERSION, currentUser } from "@/lib/domain";
import {
  acknowledgeAlert,
  addCustomer,
  addInteraction,
  adjustStock,
  approveOrder,
  attemptApproval,
  closeDecision,
  convertQuotation,
  createOrder,
  dismissToast,
  goBack,
  inviteUser,
  markAllNotices,
  markNotice,
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
  updateLead: (id: string, input: Partial<LeadInput>) => void;
  deleteLead: (id: string) => void;
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
    Promise.all([
      fetch("http://localhost:5000/api/leads").then((r) => r.json()),
      fetch("http://localhost:5000/api/opportunities").then((r) => r.json()),
      fetch("http://localhost:5000/api/quotations").then((r) => r.json()),
    ])
      .then(([leads, opportunities, quotations]) => {
        setState((s) => ({
          ...s,
          ...(Array.isArray(leads) && { leads }),
          ...(Array.isArray(opportunities) && { opportunities }),
          ...(Array.isArray(quotations) && { quotations }),
        }));
      })
      .catch(console.error);
  }, []);

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
      addLead: async (input) => {
        try {
          const res = await fetch("http://localhost:5000/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...input, ownerId: state.userId }),
          });
          if (res.ok) {
            const lead = await res.json();
            setState((s) => ({ ...s, leads: [lead, ...s.leads] }));
            api.toast(`Lead created successfully`, "success");
            api.navigate({ page: "leads" });
          } else {
            api.toast("Failed to create lead", "danger");
          }
        } catch (e) {
          api.toast("API error", "danger");
        }
      },
      updateLead: async (id, input) => {
        try {
          const res = await fetch(`http://localhost:5000/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          if (res.ok) {
            const updated = await res.json();
            setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? updated : l)) }));
            api.toast("Lead updated", "success");
          } else {
            api.toast("Failed to update lead", "danger");
          }
        } catch (e) {
          api.toast("API error", "danger");
        }
      },
      deleteLead: async (id) => {
        try {
          const res = await fetch(`http://localhost:5000/api/leads/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
            api.toast("Lead deleted", "success");
          } else {
            api.toast("Failed to delete lead", "danger");
          }
        } catch (e) {
          api.toast("API error", "danger");
        }
      },
      convertLead: async (id) => {
        try {
          const res = await fetch(`http://localhost:5000/api/leads/${id}/convert`, {
            method: "POST",
          });
          if (res.ok) {
            const { lead, opportunity, customer } = await res.json();
            setState((s) => {
              const customers = s.customers.some((c) => c.id === customer.id) ? s.customers : [customer, ...s.customers];
              return {
                ...s,
                leads: s.leads.map((l) => (l.id === id ? lead : l)),
                opportunities: [opportunity, ...s.opportunities],
                customers,
              };
            });
            api.toast(`${id} converted to ${opportunity.id}`, "success");
            api.navigate({ page: "pipeline", id: opportunity.id });
          } else {
            api.toast("Failed to convert lead", "danger");
          }
        } catch (e) {
          api.toast("API error", "danger");
        }
      },
      moveOpportunity: async (id, stage) => {
        try {
          const res = await fetch(`http://localhost:5000/api/opportunities/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stage, probability: stage === "Won" ? 100 : stage === "Lost" ? 0 : undefined }),
          });
          if (res.ok) {
            const opp = await res.json();
            setState((s) => ({
              ...s,
              opportunities: s.opportunities.map((o) => (o.id === id ? opp : o)),
            }));
            api.toast(`Moved to ${stage}`, "success");
          } else {
            api.toast("Failed to move opportunity", "danger");
          }
        } catch (e) {
          api.toast("API error", "danger");
        }
      },
      addInteraction: (input) => run((s) => addInteraction(s, input)),
      addQuotation: async (input) => {
        try {
          const res = await fetch("http://localhost:5000/api/quotations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...input, createdBy: state.userId }),
          });
          if (res.ok) {
            const quotation = await res.json();
            setState((s) => ({ ...s, quotations: [quotation, ...s.quotations] }));
            api.toast(`Quotation issued`, "success");
            api.navigate({ page: "quotation", id: quotation.id });
          } else {
            api.toast("Failed to create quotation", "danger");
          }
        } catch (e) {
          api.toast("API error", "danger");
        }
      },
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
