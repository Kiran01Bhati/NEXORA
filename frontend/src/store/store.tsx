import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createInitialState } from "@/data/seed";
import { VERSION, currentUser } from "@/lib/domain";
import {
  apiClient,
  normalizeInvoice,
  normalizeOpportunity,
  normalizePayment,
  normalizeQuotation,
  normalizeSalesOrder,
} from "@/lib/api";
import {
  acknowledgeAlert,
  addCustomer,
  addInteraction,
  adjustStock,
  approveOrder as localApproveOrder,
  attemptApproval,
  closeDecision,
  convertLead as localConvertLead,
  convertQuotation as localConvertQuotation,
  createOrder as localCreateOrder,
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
  recordPayment as localRecordPayment,
  reevaluate,
  rejectOrder as localRejectOrder,
  releaseOrder as localReleaseOrder,
  requestChanges as localRequestChanges,
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
  syncLedger: () => void;
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

  const fetchBackendData = async () => {
    try {
      const [leadsRes, oppsRes, quotesRes, ordersRes, invoicesRes, paymentsRes, ledgerRes] =
        await Promise.allSettled([
          apiClient.leads.list(),
          apiClient.opportunities.list(),
          apiClient.quotations.list(),
          apiClient.orders.list(),
          apiClient.invoices.list(),
          apiClient.payments.list(),
          apiClient.accounting.ledger(),
        ]);

      setState((s) => {
        let leads = s.leads;
        if (leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value)) {
          leads = leadsRes.value;
        }

        let opportunities = s.opportunities;
        if (oppsRes.status === "fulfilled" && Array.isArray(oppsRes.value)) {
          opportunities = oppsRes.value.map(normalizeOpportunity);
        }

        let quotations = s.quotations;
        if (quotesRes.status === "fulfilled" && Array.isArray(quotesRes.value)) {
          quotations = quotesRes.value.map(normalizeQuotation);
        }

        let orders = s.orders;
        if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
          orders = ordersRes.value.map(normalizeSalesOrder);
        }

        let invoices = s.invoices;
        if (invoicesRes.status === "fulfilled" && Array.isArray(invoicesRes.value)) {
          invoices = invoicesRes.value.map(normalizeInvoice);
        }

        let payments = s.payments;
        if (paymentsRes.status === "fulfilled" && Array.isArray(paymentsRes.value)) {
          payments = paymentsRes.value.map(normalizePayment);
        }

        let ledger = s.ledger;
        if (ledgerRes.status === "fulfilled" && ledgerRes.value?.entries && Array.isArray(ledgerRes.value.entries)) {
          ledger = ledgerRes.value.entries;
        }

        return {
          ...s,
          leads,
          opportunities,
          quotations,
          orders,
          invoices,
          payments,
          ledger,
        };
      });
    } catch (err) {
      console.error("Backend fetch error:", err);
    }
  };

  useEffect(() => {
    fetchBackendData();
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
          const lead = await apiClient.leads.create({ ...input, ownerId: state.userId });
          setState((s) => ({ ...s, leads: [lead, ...s.leads] }));
          api.toast(`Lead created successfully`, "success");
          api.navigate({ page: "leads" });
        } catch (e: any) {
          console.warn("Backend addLead error, falling back locally:", e);
          run((s) => addCustomer(s, input as any));
          api.toast(e.message || "Saved locally", "info");
        }
      },

      updateLead: async (id, input) => {
        try {
          const updated = await apiClient.leads.update(id, input);
          setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? updated : l)) }));
          api.toast("Lead updated", "success");
        } catch (e: any) {
          console.warn("Backend updateLead error:", e);
          setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, ...input } : l)) }));
          api.toast("Lead updated locally", "info");
        }
      },

      deleteLead: async (id) => {
        try {
          await apiClient.leads.delete(id);
          setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
          api.toast("Lead deleted", "success");
        } catch (e: any) {
          console.warn("Backend deleteLead error:", e);
          setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
          api.toast("Lead removed locally", "info");
        }
      },

      convertLead: async (id) => {
        try {
          const { lead, opportunity, customer } = await apiClient.leads.convert(id);
          setState((s) => {
            const customers = s.customers.some((c) => c.id === customer.id) ? s.customers : [customer, ...s.customers];
            return {
              ...s,
              leads: s.leads.map((l) => (l.id === id ? lead : l)),
              opportunities: [normalizeOpportunity(opportunity), ...s.opportunities],
              customers,
            };
          });
          api.toast(`${id} converted to ${opportunity.id}`, "success");
          api.navigate({ page: "pipeline", id: opportunity.id });
        } catch (e) {
          console.warn("Backend convertLead error, running locally:", e);
          run((s) => localConvertLead(s, id));
        }
      },

      moveOpportunity: async (id, stage) => {
        try {
          const opp = await apiClient.opportunities.update(id, {
            stage,
            probability: stage === "Won" ? 100 : stage === "Lost" ? 0 : undefined,
          });
          setState((s) => ({
            ...s,
            opportunities: s.opportunities.map((o) => (o.id === id ? normalizeOpportunity(opp) : o)),
          }));
          api.toast(`Moved to ${stage}`, "success");
        } catch (e) {
          console.warn("Backend moveOpportunity error, falling back locally:", e);
          setState((s) => ({
            ...s,
            opportunities: s.opportunities.map((o) => (o.id === id ? { ...o, stage } : o)),
          }));
          api.toast(`Moved to ${stage}`, "info");
        }
      },

      addInteraction: (input) => run((s) => addInteraction(s, input)),

      addQuotation: async (input) => {
        try {
          const raw = await apiClient.quotations.create({ ...input, createdBy: state.userId });
          const quotation = normalizeQuotation(raw);
          setState((s) => ({ ...s, quotations: [quotation, ...s.quotations] }));
          api.toast(`Quotation issued: ${quotation.id}`, "success");
          api.navigate({ page: "quotation", id: quotation.id });
        } catch (e) {
          console.warn("Backend addQuotation error, falling back locally:", e);
          run((s) => {
            const nextState = localConvertQuotation(s, input.customerId);
            return nextState;
          });
        }
      },

      convertQuotation: async (id) => {
        const quote = state.quotations.find((q) => q.id === id);
        if (!quote) return;
        try {
          const rawOrder = await apiClient.orders.create({
            quotationId: id,
            customerId: quote.customerId,
            createdBy: state.userId,
          });
          const order = normalizeSalesOrder(rawOrder);
          setState((s) => ({
            ...s,
            orders: [order, ...s.orders.filter((o) => o.id !== order.id)],
            quotations: s.quotations.map((q) => (q.id === id ? { ...q, status: "Converted", orderId: order.id } : q)),
          }));
          api.toast(`Quotation converted to Sales Order ${order.id}`, "success");
          api.navigate({ page: "order", id: order.id });
        } catch (e) {
          console.warn("Backend convertQuotation error, falling back locally:", e);
          run((s) => localConvertQuotation(s, id));
        }
      },

      createOrder: async (input) => {
        try {
          const raw = await apiClient.orders.create({
            customerId: input.customerId,
            lines: [{ productId: input.productId, qty: input.qty, unitPrice: input.unitPrice }],
            discountPct: input.discountPct,
            opportunityId: input.opportunityId,
            createdBy: state.userId,
          });
          const order = normalizeSalesOrder(raw);
          setState((s) => ({
            ...s,
            orders: [order, ...s.orders],
          }));
          api.toast(`Sales Order ${order.id} created`, "success");
          api.navigate({ page: "order", id: order.id });
        } catch (e) {
          console.warn("Backend createOrder error, running locally:", e);
          run((s) => localCreateOrder(s, input));
        }
      },

      attemptApproval: (id) => run((s) => attemptApproval(s, id)),

      approveOrder: async (orderId) => {
        try {
          const updatedRaw = await apiClient.orders.update(orderId, { approvalStatus: "Approved" });
          const updatedOrder = normalizeSalesOrder(updatedRaw);

          // Auto-issue invoice on approval
          let createdInvoice: any = null;
          try {
            const rawInv = await apiClient.invoices.create({ orderId });
            createdInvoice = normalizeInvoice(rawInv);
          } catch (invErr) {
            console.warn("Auto-invoice creation note:", invErr);
          }

          setState((s) => ({
            ...s,
            orders: s.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
            invoices: createdInvoice ? [createdInvoice, ...s.invoices.filter((i) => i.id !== createdInvoice.id)] : s.invoices,
          }));

          api.toast(`${orderId} approved successfully`, "success");
          if (createdInvoice) {
            api.navigate({ page: "invoice", id: createdInvoice.id });
          }
        } catch (e) {
          console.warn("Backend approveOrder error, falling back locally:", e);
          run((s) => localApproveOrder(s, orderId));
        }
      },

      rejectOrder: async (id, reason) => {
        try {
          const updatedRaw = await apiClient.orders.update(id, { approvalStatus: "Rejected", rejectReason: reason });
          const updatedOrder = normalizeSalesOrder(updatedRaw);
          setState((s) => ({
            ...s,
            orders: s.orders.map((o) => (o.id === id ? updatedOrder : o)),
          }));
          api.toast(`${id} rejected`, "danger");
        } catch (e) {
          console.warn("Backend rejectOrder error, falling back locally:", e);
          run((s) => localRejectOrder(s, id, reason));
        }
      },

      requestChanges: async (id, note) => {
        try {
          const updatedRaw = await apiClient.orders.update(id, { approvalStatus: "Changes Requested", changeNote: note });
          const updatedOrder = normalizeSalesOrder(updatedRaw);
          setState((s) => ({
            ...s,
            orders: s.orders.map((o) => (o.id === id ? updatedOrder : o)),
          }));
          api.toast(`Changes requested on ${id}`, "warning");
        } catch (e) {
          console.warn("Backend requestChanges error, falling back locally:", e);
          run((s) => localRequestChanges(s, id, note));
        }
      },

      releaseOrder: async (id) => {
        try {
          const updatedRaw = await apiClient.orders.update(id, { inventoryStatus: "Reserved" });
          const updatedOrder = normalizeSalesOrder(updatedRaw);
          setState((s) => ({
            ...s,
            orders: s.orders.map((o) => (o.id === id ? updatedOrder : o)),
          }));
          api.toast(`${id} released to fulfillment`, "success");
        } catch (e) {
          console.warn("Backend releaseOrder error, falling back locally:", e);
          run((s) => localReleaseOrder(s, id));
        }
      },

      recordPayment: async (input) => {
        try {
          const res = await apiClient.payments.record({
            invoiceId: input.invoiceId,
            amount: input.amount,
            method: input.method,
            reference: input.reference,
            recordedBy: state.userId,
            date: input.date,
          });

          const payment = normalizePayment(res);
          const updatedInvoice = res.invoice ? normalizeInvoice(res.invoice) : null;

          setState((s) => {
            const nextInvoices = updatedInvoice
              ? s.invoices.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i))
              : s.invoices.map((i) =>
                  i.id === input.invoiceId
                    ? {
                        ...i,
                        paid: i.paid + input.amount,
                        outstanding: Math.max(0, i.outstanding - input.amount),
                        status: i.outstanding - input.amount <= 0 ? "Paid" : "Partially Paid",
                      }
                    : i
                );

            const nextCustomers = s.customers.map((c) =>
              c.id === payment.customerId
                ? { ...c, outstanding: Math.max(0, c.outstanding - input.amount), lastActivity: new Date().toISOString() }
                : c
            );

            return {
              ...s,
              payments: [payment, ...s.payments],
              invoices: nextInvoices,
              customers: nextCustomers,
            };
          });

          // Refresh ledger entries to reflect new receipt
          apiClient.accounting.ledger().then((lRes) => {
            if (lRes?.entries && Array.isArray(lRes.entries)) {
              setState((s) => ({ ...s, ledger: lRes.entries }));
            }
          }).catch(() => {});

          api.toast(`Simulated payment ${payment.reference} recorded against ${input.invoiceId}`, "success");
          api.navigate({ page: "invoice", id: input.invoiceId });
        } catch (e: any) {
          console.warn("Backend recordPayment error, running locally:", e);
          run((s) => localRecordPayment(s, input));
        }
      },

      syncLedger: async () => {
        try {
          const res = await apiClient.accounting.syncLedger();
          const lRes = await apiClient.accounting.ledger();
          if (lRes?.entries && Array.isArray(lRes.entries)) {
            setState((s) => ({ ...s, ledger: lRes.entries }));
          }
          api.toast(`Ledger synchronized: ${res.syncedEntriesCount ?? 0} entries posted`, "success");
        } catch (e: any) {
          console.warn("Backend syncLedger error:", e);
          api.toast("Failed to sync ledger from backend", "danger");
        }
      },

      receivePurchase: (id) => run((s) => receivePurchase(s, id)),
      adjustStock: (productId, onHand) => run((s) => adjustStock(s, productId, onHand)),
      inviteUser: (input) => run((s) => inviteUser(s, input)),
      resetDemo: () => {
        localStorage.removeItem(KEY);
        setState(resetDemo());
      },
      refresh: () => {
        setState((s) => patchUi(s, { refreshing: true }));
        fetchBackendData().finally(() => {
          setState((s) => patchUi(s, { refreshing: false }));
        });
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
