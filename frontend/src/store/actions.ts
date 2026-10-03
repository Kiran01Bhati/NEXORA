import { createInitialState, defaultUi } from "@/data/seed";
import {
  approvalGate,
  can,
  currentUser,
  customerById,
  pickApprover,
  priceLines,
  productById,
  productLine,
  rulesFor,
  stockOf,
  summarizeRules,
  TERMS,
  userById,
  userName,
} from "@/lib/domain";
import { formatINR } from "@/lib/format";
import type {
  AppState,
  AuditEntry,
  CustomerInput,
  Decision,
  InteractionInput,
  Invoice,
  LeadInput,
  OrderInput,
  PaymentInput,
  QuoteInput,
  Risk,
  SalesOrder,
  Toast,
  View,
} from "@/types";

export function navigate(state: AppState, view: View): AppState {
  return {
    ...state,
    view,
    history: [...state.history, state.view].slice(-30),
    ui: { ...state.ui, commandOpen: false, notifOpen: false, mobileNav: false, quickOpen: false },
  };
}

export function goBack(state: AppState): AppState {
  const history = [...state.history];
  const prev = history.pop();
  if (!prev) return navigate(state, { page: "dashboard" });
  return { ...state, view: prev, history, ui: { ...state.ui, mobileNav: false } };
}

export function setUser(state: AppState, userId: string): AppState {
  const user = userById(state, userId);
  if (!user) return state;
  return pushToast({ ...state, userId }, `Signed in as ${user.name} · ${user.role}`, "info");
}

export function pushToast(state: AppState, message: string, tone: Toast["tone"] = "info"): AppState {
  return {
    ...state,
    toasts: [...state.toasts, { id: nid("TST"), message, tone, at: Date.now() }].slice(-4),
  };
}

export function dismissToast(state: AppState, id: string): AppState {
  return { ...state, toasts: state.toasts.filter((t) => t.id !== id) };
}

export function pruneToasts(state: AppState): AppState {
  const toasts = state.toasts.filter((t) => Date.now() - t.at < 3800);
  if (toasts.length === state.toasts.length) return state;
  return { ...state, toasts };
}

export function patchUi(state: AppState, patch: Partial<AppState["ui"]>): AppState {
  return { ...state, ui: { ...state.ui, ...patch } };
}

export function closeDecision(state: AppState): AppState {
  return { ...state, ui: { ...state.ui, decision: null } };
}

export function markNotice(state: AppState, id: string): AppState {
  return { ...state, notices: state.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) };
}

export function markAllNotices(state: AppState): AppState {
  return { ...state, notices: state.notices.map((n) => ({ ...n, read: true })) };
}

export function acknowledgeAlert(state: AppState, id: string): AppState {
  const alert = state.alerts.find((a) => a.id === id);
  if (!alert) return state;
  const next = {
    ...state,
    alerts: state.alerts.map((a) => (a.id === id ? { ...a, status: "Acknowledged" as const } : a)),
  };
  return pushToast(addAudit(next, "Acknowledged Alert", "Alert", id, alert.status, "Acknowledged", "Info"), `${id} acknowledged`, "info");
}

export function setPolicy(state: AppState, policy: AppState["policy"]): AppState {
  const user = currentUser(state);
  if (!can(user.role, "policy.write")) {
    return pushToast(state, "Only Admin or Compliance can edit risk policy.", "warning");
  }
  const next = addAudit(
    { ...state, policy },
    "Updated Risk Policy",
    "Policy",
    "RISK-POLICY",
    `₹${state.policy.highValue} / ${state.policy.discountPct}%`,
    `₹${policy.highValue} / ${policy.discountPct}%`,
    "Success",
  );
  return pushToast(next, "Risk policy updated. Re-evaluate open orders to apply it.", "success");
}

export function reevaluate(state: AppState): AppState {
  const user = currentUser(state);
  if (!can(user.role, "policy.write") && user.role !== "Sales Manager") {
    return pushToast(state, "Re-evaluation is limited to Compliance, Admin and Sales Manager.", "warning");
  }
  let next = state;
  const pending = state.orders.filter((o) => o.approvalStatus === "Pending" || o.approvalStatus === "Changes Requested");
  pending.forEach((order) => {
    const customer = customerById(next, order.customerId);
    if (!customer) return;
    const rules = rulesFor(next, customer, order.lines, order.discountPct, order.id);
    const summary = summarizeRules(rules);
    const approverId = pickApprover(next.users, order.createdBy, summary.level);
    next = {
      ...next,
      orders: next.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              rules,
              riskLevel: summary.level,
              riskScore: summary.score,
              approverId,
              approvalStatus: summary.level === "None" || summary.level === "Low" ? "Not Required" : o.approvalStatus,
            }
          : o,
      ),
      risks: [
        ...next.risks.filter((r) => !(r.source === "engine" && r.transaction === order.id)),
        ...makeRisks(next, order.id, order.customerId, order.createdBy, rules),
      ],
    };
    next = addAudit(next, "Risk Re-evaluated", "Sales Order", order.id, order.riskLevel, summary.level, "Info");
  });
  return pushToast(next, `Re-evaluated ${pending.length} open order${pending.length === 1 ? "" : "s"}.`, "success");
}

export function addCustomer(state: AppState, input: CustomerInput): AppState {
  const user = currentUser(state);
  if (!can(user.role, "customers.write")) return pushToast(state, "Your role cannot create customers.", "warning");
  if (!input.company.trim() || !input.contact.trim()) return pushToast(state, "Company and contact are required.", "warning");
  const id = nextId(state.customers.map((c) => c.id), "CUS-");
  const now = new Date().toISOString();
  const customer = {
    id,
    company: input.company.trim(),
    contact: input.contact.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim() || "—",
    industry: input.industry.trim() || "General",
    gstin: input.gstin?.trim() || "—",
    creditLimit: Math.max(0, input.creditLimit || 0),
    outstanding: 0,
    ownerId: user.id,
    status: "Active" as const,
    lastActivity: now,
    since: now,
  };
  let next: AppState = { ...state, customers: [customer, ...state.customers] };
  next = addAudit(next, "Created Customer", "Customer", id, "—", customer.company, "Success");
  next = pushToast(next, `${customer.company} added`, "success");
  return navigate(next, { page: "customer", id });
}

export function addLead(state: AppState, input: LeadInput): AppState {
  const user = currentUser(state);
  if (!can(user.role, "customers.write")) return pushToast(state, "Your role cannot create leads.", "warning");
  if (!input.name.trim() || !input.company.trim()) return pushToast(state, "Name and company are required.", "warning");
  const id = nextId(state.leads.map((l) => l.id), "LD-");
  const lead = {
    id,
    name: input.name.trim(),
    company: input.company.trim(),
    email: input.email.trim(),
    source: input.source,
    ownerId: user.id,
    value: Math.max(0, input.value || 0),
    status: "New" as const,
    lastContact: null,
    createdAt: new Date().toISOString(),
  };
  let next: AppState = { ...state, leads: [lead, ...state.leads] };
  next = addAudit(next, "Created Lead", "Lead", id, "—", lead.company, "Success");
  return pushToast(navigate(next, { page: "leads" }), `${id} created`, "success");
}

export function convertLead(state: AppState, id: string): AppState {
  const lead = state.leads.find((l) => l.id === id);
  if (!lead) return state;
  if (lead.status === "Converted") return pushToast(state, "Lead is already converted.", "info");
  if (lead.status === "Lost") return pushToast(state, "Lost leads cannot be converted.", "warning");
  const user = currentUser(state);
  const ensured = ensureCustomerForLead(state, lead.company, lead.name, lead.email, user.id);
  const oppId = nextId(ensured.state.opportunities.map((o) => o.id), "OPP-");
  const close = new Date();
  close.setDate(close.getDate() + 30);
  const opportunity = {
    id: oppId,
    name: `${lead.company} opportunity`,
    customerId: ensured.id,
    value: lead.value,
    probability: 40,
    stage: "Qualified" as const,
    ownerId: lead.ownerId,
    closeDate: close.toISOString(),
    createdAt: new Date().toISOString(),
  };
  let next: AppState = {
    ...ensured.state,
    leads: ensured.state.leads.map((l) => (l.id === id ? { ...l, status: "Converted" as const, opportunityId: oppId, lastContact: new Date().toISOString() } : l)),
    opportunities: [opportunity, ...ensured.state.opportunities],
  };
  next = addAudit(next, "Converted Lead", "Lead", id, lead.status, oppId, "Success");
  return pushToast(navigate(next, { page: "pipeline", id: oppId }), `${id} converted to ${oppId}`, "success");
}

export function moveOpportunity(state: AppState, id: string, stage: AppState["opportunities"][number]["stage"]): AppState {
  const opp = state.opportunities.find((o) => o.id === id);
  if (!opp || opp.stage === stage) return state;
  const probability = stage === "Won" ? 100 : stage === "Lost" ? 0 : opp.probability;
  let next: AppState = {
    ...state,
    opportunities: state.opportunities.map((o) => (o.id === id ? { ...o, stage, probability } : o)),
  };
  next = addAudit(next, "Moved Stage", "Opportunity", id, opp.stage, stage, "Info");
  return pushToast(next, `${id} moved to ${stage}`, "success");
}

export function addInteraction(state: AppState, input: InteractionInput): AppState {
  if (!input.subject.trim()) return pushToast(state, "Subject is required.", "warning");
  const user = currentUser(state);
  const id = nextId(state.interactions.map((i) => i.id), "INT-");
  const item = {
    id,
    customerId: input.customerId,
    type: input.type,
    subject: input.subject.trim(),
    body: input.body.trim(),
    ownerId: user.id,
    at: new Date().toISOString(),
  };
  let next: AppState = {
    ...state,
    interactions: [item, ...state.interactions],
    customers: state.customers.map((c) => (c.id === input.customerId ? { ...c, lastActivity: item.at } : c)),
  };
  next = addAudit(next, "Logged Interaction", "Customer", input.customerId, "—", input.subject.trim(), "Info");
  return pushToast(next, "Interaction logged", "success");
}

export function addQuotation(state: AppState, input: QuoteInput): AppState {
  const user = currentUser(state);
  if (!can(user.role, "orders.create")) return pushToast(state, "Your role cannot create quotations.", "warning");
  const product = productById(state, input.productId);
  const customer = customerById(state, input.customerId);
  if (!product || !customer) return pushToast(state, "Choose a customer and a product.", "warning");
  if (input.qty <= 0) return pushToast(state, "Quantity must be at least 1.", "warning");
  const id = nextId(state.quotations.map((q) => q.id), "QT-");
  const lines = [productLine(product, input.qty, input.unitPrice || product.price)];
  const priced = priceLines(lines, input.discountPct);
  const quotation = {
    id,
    customerId: customer.id,
    opportunityId: input.opportunityId,
    lines,
    discountPct: input.discountPct,
    ...priced,
    status: "Sent" as const,
    validUntil: input.validUntil || new Date(Date.now() + 14 * 86400000).toISOString(),
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    terms: TERMS,
  };
  let next: AppState = { ...state, quotations: [quotation, ...state.quotations] };
  next = addAudit(next, "Generated Quotation", "Quotation", id, "—", formatINR(priced.gross), "Success");
  return pushToast(navigate(next, { page: "quotation", id }), `${id} issued`, "success");
}

export function convertQuotation(state: AppState, id: string): AppState {
  const quote = state.quotations.find((q) => q.id === id);
  if (!quote) return state;
  if (quote.status === "Converted" && quote.orderId) {
    return navigate(state, { page: "order", id: quote.orderId });
  }
  if (quote.status === "Expired" || quote.status === "Rejected") {
    return pushToast(state, "This quotation can no longer be converted.", "warning");
  }
  const user = currentUser(state);
  if (!can(user.role, "orders.create")) return pushToast(state, "Your role cannot create sales orders.", "warning");
  return createOrder(state, {
    customerId: quote.customerId,
    productId: quote.lines[0]?.productId ?? "",
    qty: quote.lines[0]?.qty ?? 1,
    unitPrice: quote.lines[0]?.unitPrice ?? 0,
    discountPct: quote.discountPct,
    opportunityId: quote.opportunityId,
  }, { quotationId: quote.id, lines: quote.lines });
}

export function createOrder(
  state: AppState,
  input: OrderInput,
  extra?: { quotationId?: string; lines?: SalesOrder["lines"] },
): AppState {
  const user = currentUser(state);
  if (!can(user.role, "orders.create")) return pushToast(state, "Your role cannot create sales orders.", "warning");
  const customer = customerById(state, input.customerId);
  const product = productById(state, input.productId);
  if (!customer || (!product && !extra?.lines?.length)) return pushToast(state, "Choose a customer and a product.", "warning");
  const lines = extra?.lines ?? [productLine(product!, input.qty, input.unitPrice || product!.price)];
  if (lines.some((l) => l.qty <= 0)) return pushToast(state, "Quantity must be at least 1.", "warning");
  const priced = priceLines(lines, input.discountPct);
  const rules = rulesFor(state, customer, lines, input.discountPct);
  const summary = summarizeRules(rules);
  const needsApproval = summary.level === "Medium" || summary.level === "High" || summary.level === "Critical";
  const id = nextId(state.orders.map((o) => o.id), "SO-");
  const now = new Date().toISOString();
  const approverId = pickApprover(state.users, user.id, summary.level);
  const order: SalesOrder = {
    id,
    customerId: customer.id,
    quotationId: extra?.quotationId,
    opportunityId: input.opportunityId,
    lines,
    discountPct: input.discountPct,
    ...priced,
    rules,
    riskLevel: summary.level,
    riskScore: summary.score,
    approvalStatus: needsApproval ? "Pending" : "Not Required",
    inventoryStatus: "Not Reserved",
    paymentStatus: "Not Invoiced",
    createdBy: user.id,
    approverId,
    createdAt: now,
    terms: TERMS,
    sodAttempts: [],
  };
  let next: AppState = {
    ...state,
    orders: [order, ...state.orders],
    quotations: extra?.quotationId
      ? state.quotations.map((q) => (q.id === extra.quotationId ? { ...q, status: "Converted" as const, orderId: id } : q))
      : state.quotations,
    risks: [...makeRisks(state, id, customer.id, user.id, rules), ...state.risks],
    customers: state.customers.map((c) => (c.id === customer.id ? { ...c, lastActivity: now } : c)),
  };
  next = addAudit(next, "Created Sales Order", "Sales Order", id, "—", formatINR(priced.gross), "Success");
  if (rules.length) {
    next = addAudit(next, "Risk Detected", "Sales Order", id, "Normal", summary.level, "Warning");
    const alert = {
      id: nextId(next.alerts.map((a) => a.id), "ALT-"),
      severity: summary.level === "Critical" ? "Critical" as const : "High" as const,
      title: `${summary.level} risk on ${id}`,
      body: `${customer.company} · ${formatINR(priced.gross)} · ${rules.length} rule${rules.length > 1 ? "s" : ""} triggered.`,
      at: now,
      status: "Open" as const,
      page: "case" as const,
      entityId: id,
    };
    next = {
      ...next,
      alerts: [alert, ...next.alerts],
      notices: [
        {
          id: nid("NTC"),
          title: "Risk detected",
          body: `${id} · ${rules.length} rule${rules.length > 1 ? "s" : ""} · ${summary.level}`,
          at: now,
          read: false,
          page: "case" as const,
          entityId: id,
          tone: "danger" as const,
        },
        ...next.notices,
      ],
    };
  }
  if (!needsApproval) {
    next = fulfill(next, id);
    return pushToast(navigate(next, { page: "order", id }), `${id} created and released. No policy rule fired.`, "success");
  }
  const decision: Decision = {
    title: rules.length === 1 ? "Risk rule triggered" : `${rules.length} risk rules triggered`,
    kicker: `${id} · Pending manager approval`,
    tone: summary.level === "Critical" ? "danger" : "warning",
    body: `${rules.map((r, i) => `${i + 1}. ${r.category} — ${r.detail}`).join(" ")} Order status is Pending Manager Approval. The creator cannot approve this order.`,
    primaryLabel: "Open risk case",
    primaryPage: "case",
    primaryId: id,
  };
  next = { ...next, ui: { ...next.ui, decision } };
  return pushToast(navigate(next, { page: "case", id }), `${id} is pending manager approval.`, "warning");
}

export function attemptApproval(state: AppState, orderId: string): AppState {
  const user = currentUser(state);
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return pushToast(state, "Order not found.", "danger");
  if (order.approvalStatus === "Approved" || order.approvalStatus === "Not Required") {
    return pushToast(state, "This order is already approved.", "info");
  }
  if (order.approvalStatus === "Rejected") return pushToast(state, "This order was rejected.", "warning");
  const gate = approvalGate(user, order);
  if (gate === "role") {
    const approver = userById(state, order.approverId);
    return {
      ...pushToast(state, "You are not the designated approver.", "warning"),
      ui: {
        ...state.ui,
        decision: {
          title: "Approval unavailable",
          kicker: "Role restriction",
          tone: "warning",
          body: `${user.name} (${user.role}) cannot approve this order. Required approver: ${approver?.name ?? "designated approver"} · ${approver?.role ?? ""}.`,
        },
      },
    };
  }
  if (gate !== "sod" && gate !== "ok") return state;
  if (user.id !== order.createdBy) return approveOrder(state, orderId);
  const now = new Date().toISOString();
  let next: AppState = {
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? { ...o, sodAttempts: [...o.sodAttempts, { at: now, userId: user.id }] } : o)),
  };
  next = addAudit(next, "Approval Attempt", "Sales Order", orderId, "Pending", "Rejected", "Rejected");
  const alertId = nextId(next.alerts.map((a) => a.id), "ALT-");
  next = {
    ...next,
    alerts: [
      {
        id: alertId,
        severity: "High",
        title: `SoD rejection on ${orderId}`,
        body: `${user.name} attempted to approve an order they created. The attempt was rejected.`,
        at: now,
        status: "Open",
        page: "audit",
        entityId: orderId,
      },
      ...next.alerts,
    ],
    ui: {
      ...next.ui,
      decision: {
        title: "Approval rejected",
        kicker: "Segregation of Duties · CTRL-SOD-01",
        tone: "danger",
        body: "Order creator cannot approve their own high-risk order. The attempt was written to the audit log. The order remains Pending Manager Approval.",
        primaryLabel: "View audit log",
        primaryPage: "audit",
        primaryId: orderId,
      },
    },
  };
  return pushToast(next, "Approval rejected — segregation of duties.", "danger");
}

export function approveOrder(state: AppState, orderId: string): AppState {
  const user = currentUser(state);
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return pushToast(state, "Order not found.", "danger");
  if (user.id === order.createdBy) return attemptApproval(state, orderId);
  const gate = approvalGate(user, order);
  if (gate === "role") {
    const approver = userById(state, order.approverId);
    return {
      ...state,
      ui: {
        ...state.ui,
        decision: {
          title: "Approval unavailable",
          kicker: "Role restriction",
          tone: "warning",
          body: `Required approver is ${approver?.name ?? "unassigned"} (${approver?.role ?? "—"}). You are signed in as ${user.name}, ${user.role}.`,
        },
      },
    };
  }
  if (gate === "closed") return pushToast(state, "This order is not awaiting approval.", "info");
  let next = addAudit(state, "Approved Order", "Sales Order", orderId, order.approvalStatus, "Approved", "Success");
  next = {
    ...next,
    orders: next.orders.map((o) => (o.id === orderId ? { ...o, approvalStatus: "Approved" } : o)),
    risks: next.risks.map((r) =>
      r.transaction === orderId && r.status === "Open" ? { ...r, status: "Mitigated", treatment: `Approved by ${user.name}` } : r,
    ),
    alerts: next.alerts.map((a) => (a.entityId === orderId && a.page === "case" ? { ...a, status: "Resolved" } : a)),
    opportunities: next.opportunities.map((o) => (o.id === order.opportunityId ? { ...o, stage: "Won", probability: 100 } : o)),
  };
  next = fulfill(next, orderId);
  const updated = next.orders.find((o) => o.id === orderId);
  const invoice = next.invoices.find((i) => i.orderId === orderId);
  const reserved = updated?.reservation?.[0];
  next = {
    ...next,
    ui: {
      ...next.ui,
      decision: {
        title: "Order approved",
        kicker: orderId,
        tone: "success",
        body: reserved
          ? `Approval recorded. ${reserved.reserved} units reserved from ${reserved.availableBefore} available. ${invoice ? `Invoice ${invoice.id} issued for ${formatINR(invoice.amount)}.` : "Invoice could not be issued."} Record the receipt as Finance to close the cycle.`
          : `Approval recorded. ${updated?.inventoryStatus === "Backordered" ? "Inventory is backordered, so invoicing is held." : "Fulfillment updated."}`,
        primaryLabel: invoice ? "Open invoice" : "View order",
        primaryPage: invoice ? "invoice" : "order",
        primaryId: invoice?.id ?? orderId,
      },
    },
  };
  return pushToast(next, `${orderId} approved. Inventory and invoice updated.`, "success");
}

export function rejectOrder(state: AppState, orderId: string, reason: string): AppState {
  const user = currentUser(state);
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return state;
  if (user.id === order.createdBy) return attemptApproval(state, orderId);
  if (approvalGate(user, order) !== "ok") return pushToast(state, "You cannot reject this order.", "warning");
  let next: AppState = {
    ...state,
    orders: state.orders.map((o) =>
      o.id === orderId ? { ...o, approvalStatus: "Rejected", rejectReason: reason || "Rejected by approver", inventoryStatus: "Not Reserved" } : o,
    ),
    risks: state.risks.map((r) => (r.transaction === orderId && r.status === "Open" ? { ...r, status: "Open", treatment: "Rejected — do not fulfill" } : r)),
  };
  next = addAudit(next, "Rejected Order", "Sales Order", orderId, "Pending", "Rejected", "Rejected");
  return pushToast(next, `${orderId} rejected. Fulfillment is blocked.`, "danger");
}

export function requestChanges(state: AppState, orderId: string, note: string): AppState {
  const user = currentUser(state);
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return state;
  if (user.id === order.createdBy) return attemptApproval(state, orderId);
  if (approvalGate(user, order) !== "ok") return pushToast(state, "You cannot request changes on this order.", "warning");
  let next: AppState = {
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? { ...o, approvalStatus: "Changes Requested", changeNote: note || "Revise commercial terms." } : o)),
  };
  next = addAudit(next, "Requested Changes", "Sales Order", orderId, "Pending", "Changes Requested", "Warning");
  return pushToast(next, `Changes requested on ${orderId}.`, "warning");
}

export function releaseOrder(state: AppState, orderId: string): AppState {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return state;
  if (order.approvalStatus !== "Approved" && order.approvalStatus !== "Not Required") {
    return pushToast(state, "Release is available only after approval.", "warning");
  }
  if (order.inventoryStatus === "Reserved" || order.inventoryStatus === "Fulfilled") {
    return pushToast(state, "Inventory is already reserved.", "info");
  }
  const next = fulfill(state, orderId);
  return pushToast(next, `${orderId} released to fulfillment.`, "success");
}

export function recordPayment(state: AppState, input: PaymentInput): AppState {
  const user = currentUser(state);
  if (!can(user.role, "payments.record")) {
    return {
      ...state,
      ui: {
        ...state.ui,
        decision: {
          title: "Receipt posting restricted",
          kicker: "Finance control · CTRL-FIN-02",
          tone: "warning",
          body: `Recording a payment is limited to Finance. Sales can raise an order, but they cannot clear it. You are signed in as ${user.name}, ${user.role}. Switch to Meera Shah to post this receipt.`,
        },
      },
    };
  }
  const invoice = state.invoices.find((i) => i.id === input.invoiceId);
  if (!invoice) return pushToast(state, "Choose an invoice.", "warning");
  if (input.amount <= 0) return pushToast(state, "Amount must be greater than zero.", "warning");
  if (input.amount > invoice.outstanding) return pushToast(state, "Amount exceeds the outstanding balance.", "warning");
  const id = nextId(state.payments.map((p) => p.id), "PAY-");
  const now = input.date ? new Date(input.date).toISOString() : new Date().toISOString();
  const paid = invoice.paid + input.amount;
  const outstanding = invoice.outstanding - input.amount;
  const status: Invoice["status"] = outstanding <= 0 ? "Paid" : "Partially Paid";
  const payment = {
    id,
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    amount: input.amount,
    method: input.method,
    date: now,
    status: "Cleared" as const,
    reference: input.reference.trim() || `UTR${Date.now().toString().slice(-8)}`,
    recordedBy: user.id,
  };
  let next: AppState = {
    ...state,
    payments: [payment, ...state.payments],
    invoices: state.invoices.map((i) => (i.id === invoice.id ? { ...i, paid, outstanding, status } : i)),
    customers: state.customers.map((c) =>
      c.id === invoice.customerId ? { ...c, outstanding: Math.max(0, c.outstanding - input.amount), lastActivity: now } : c,
    ),
    orders: state.orders.map((o) =>
      o.id === invoice.orderId ? { ...o, paymentStatus: outstanding <= 0 ? "Paid" : "Partial" } : o,
    ),
  };
  next = addLedgerPair(next, now, invoice.id, "Bank", "Accounts Receivable", input.amount, `Receipt ${id} from ${customerById(state, invoice.customerId)?.company ?? "customer"}`);
  next = addAudit(next, "Recorded Payment", "Payment", id, formatINR(invoice.outstanding), formatINR(input.amount), "Success");
  next = addAudit(next, "Journal Posted", "Ledger", id, "—", `Dr Bank / Cr AR ${formatINR(input.amount)}`, "Success");
  if (invoice.orderId) {
    next = addAudit(next, "Updated Order", "Sales Order", invoice.orderId, invoice.status, status, "Success");
  }
  return pushToast(navigate(next, { page: "invoice", id: invoice.id }), `${id} recorded against ${invoice.id}.`, "success");
}

export function receivePurchase(state: AppState, id: string): AppState {
  const user = currentUser(state);
  if (!can(user.role, "purchases.receive")) return pushToast(state, "Only Inventory Manager or Admin can receive stock.", "warning");
  const po = state.purchases.find((p) => p.id === id);
  if (!po) return state;
  if (po.status === "Received") return pushToast(state, "This purchase is already received.", "info");
  const product = productById(state, po.productId);
  let next: AppState = {
    ...state,
    purchases: state.purchases.map((p) => (p.id === id ? { ...p, status: "Received" } : p)),
    products: state.products.map((p) => (p.id === po.productId ? { ...p, onHand: p.onHand + po.qty } : p)),
  };
  next = addAudit(next, "Received Purchase", "Purchase", id, po.status, `+${po.qty} ${product?.sku ?? ""}`, "Success");
  return pushToast(next, `${id} received. ${product?.name ?? "Stock"} increased by ${po.qty}.`, "success");
}

export function adjustStock(state: AppState, productId: string, onHand: number): AppState {
  const user = currentUser(state);
  if (!can(user.role, "inventory.write")) return pushToast(state, "Only Inventory Manager or Admin can adjust stock.", "warning");
  const product = productById(state, productId);
  if (!product) return state;
  if (onHand < 0) return pushToast(state, "On-hand quantity cannot be negative.", "warning");
  let next: AppState = { ...state, products: state.products.map((p) => (p.id === productId ? { ...p, onHand } : p)) };
  next = addAudit(next, "Adjusted Stock", "Product", product.sku, String(product.onHand), String(onHand), "Success");
  return pushToast(next, `${product.sku} on-hand set to ${onHand}.`, "success");
}

export function inviteUser(state: AppState, input: { name: string; email: string; role: AppState["users"][number]["role"] }): AppState {
  const user = currentUser(state);
  if (!can(user.role, "users.manage")) return pushToast(state, "Only Admin can add users.", "warning");
  if (!input.name.trim() || !input.email.trim()) return pushToast(state, "Name and email are required.", "warning");
  const id = nextId(state.users.map((u) => u.id), "USR-");
  const nextUser = { id, name: input.name.trim(), email: input.email.trim(), role: input.role, status: "Invited" as const };
  let next: AppState = { ...state, users: [...state.users, nextUser] };
  next = addAudit(next, "Invited User", "User", id, "—", `${nextUser.name} · ${nextUser.role}`, "Success");
  return pushToast(next, `${nextUser.name} added. In production this would send an invite.`, "success");
}

export function resetDemo(): AppState {
  return createInitialState();
}

function fulfill(state: AppState, orderId: string): AppState {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return state;
  if (state.invoices.some((i) => i.orderId === orderId)) return state;
  const short = order.lines.some((line) => line.qty > stockOf(state, line.productId, orderId).available);
  if (short) {
    return addAudit(
      { ...state, orders: state.orders.map((o) => (o.id === orderId ? { ...o, inventoryStatus: "Backordered" } : o)) },
      "Inventory Backordered",
      "Sales Order",
      orderId,
      "Not Reserved",
      "Backordered",
      "Warning",
    );
  }
  const reservation = order.lines.map((line) => {
    const stock = stockOf(state, line.productId, orderId);
    return {
      productId: line.productId,
      name: line.name,
      sku: line.sku,
      required: line.qty,
      availableBefore: stock.available,
      reserved: line.qty,
    };
  });
  let next: AppState = {
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? { ...o, inventoryStatus: "Reserved", reservation, paymentStatus: "Unpaid" } : o)),
  };
  const reservedSummary = reservation.map((r) => `${r.reserved} ${r.sku}`).join(", ");
  next = addAudit(next, "Inventory Reserved", "Sales Order", orderId, "Not Reserved", reservedSummary, "Success");
  const invId = nextId(next.invoices.map((i) => i.id), "INV-");
  const issuedAt = new Date().toISOString();
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const invoice: Invoice = {
    id: invId,
    customerId: order.customerId,
    orderId,
    amount: order.total,
    paid: 0,
    outstanding: order.total,
    status: "Issued",
    issuedAt,
    due: due.toISOString(),
    lines: order.lines,
    discountPct: order.discountPct,
    gross: order.gross,
    discountAmt: order.discountAmt,
    net: order.net,
    tax: order.tax,
  };
  next = {
    ...next,
    invoices: [invoice, ...next.invoices],
    orders: next.orders.map((o) => (o.id === orderId ? { ...o, invoiceId: invId, paymentStatus: "Unpaid" } : o)),
    customers: next.customers.map((c) =>
      c.id === order.customerId ? { ...c, outstanding: c.outstanding + order.total, lastActivity: issuedAt } : c,
    ),
  };
  next = addAudit(next, "Invoice Generated", "Invoice", invId, "—", formatINR(order.total), "Success");
  next = addLedgerLines(next, issuedAt, invId, [
    { account: "Accounts Receivable", description: `Invoice ${invId}`, debit: order.total, credit: 0 },
    { account: "Sales Revenue", description: `Invoice ${invId}`, debit: 0, credit: order.net },
    { account: "GST Output", description: `Output tax on ${invId}`, debit: 0, credit: order.tax },
  ]);
  next = addAudit(next, "Journal Posted", "Ledger", invId, "—", `Dr AR ${formatINR(order.total)}`, "Success");
  return next;
}

function makeRisks(state: AppState, orderId: string, customerId: string, ownerId: string, rules: SalesOrder["rules"]): Risk[] {
  let n = maxNum(state.risks.map((r) => r.id), "RSK-");
  return rules.map((rule) => {
    n += 1;
    return {
      id: `RSK-${n}`,
      code: rule.code,
      category: rule.category,
      transaction: orderId,
      transactionType: "Sales Order",
      customerId,
      likelihood: rule.likelihood,
      impact: rule.impact,
      score: rule.score,
      level: rule.level,
      ownerId,
      status: "Open" as const,
      treatment: "Require independent approval",
      detail: rule.detail,
      createdAt: new Date().toISOString(),
      source: "engine" as const,
    };
  });
}

function ensureCustomerForLead(state: AppState, company: string, contact: string, email: string, ownerId: string) {
  const existing = state.customers.find((c) => c.company.toLowerCase() === company.toLowerCase());
  if (existing) return { state, id: existing.id };
  const id = nextId(state.customers.map((c) => c.id), "CUS-");
  const now = new Date().toISOString();
  const customer = {
    id,
    company,
    contact,
    email,
    phone: "—",
    city: "—",
    industry: "General",
    gstin: "—",
    creditLimit: 500000,
    outstanding: 0,
    ownerId,
    status: "Prospect" as const,
    lastActivity: now,
    since: now,
  };
  return { state: { ...state, customers: [customer, ...state.customers] }, id };
}

function addLedgerPair(state: AppState, date: string, reference: string, debitAccount: string, creditAccount: string, amount: number, description: string) {
  return addLedgerLines(state, date, reference, [
    { account: debitAccount, description, debit: amount, credit: 0 },
    { account: creditAccount, description, debit: 0, credit: amount },
  ]);
}

function addLedgerLines(
  state: AppState,
  date: string,
  reference: string,
  lines: { account: string; description: string; debit: number; credit: number }[],
) {
  const start = maxNum(state.ledger.map((l) => l.id), "LED-");
  const entries = lines.map((line, index) => ({
    id: `LED-${start + index + 1}`,
    date,
    reference,
    account: line.account,
    description: line.description,
    debit: line.debit,
    credit: line.credit,
  }));
  return { ...state, ledger: [...entries, ...state.ledger] };
}

function addAudit(
  state: AppState,
  action: string,
  entity: string,
  entityId: string,
  previous: string,
  nextValue: string,
  status: AuditEntry["status"],
): AppState {
  const user = currentUser(state);
  const entry: AuditEntry = {
    id: nextId(state.audit.map((a) => a.id), "AUD-"),
    at: new Date().toISOString(),
    userId: user.id,
    userName: action.startsWith("Risk") || action === "Journal Posted" ? userName(state, user.id) : user.name,
    action,
    entity,
    entityId,
    previous,
    next: nextValue,
    status,
  };
  if (action === "Risk Detected" || action === "Risk Re-evaluated") {
    entry.userId = "system";
    entry.userName = "System";
  }
  return { ...state, audit: [entry, ...state.audit] };
}

function nextId(ids: string[], prefix: string) {
  return `${prefix}${maxNum(ids, prefix) + 1}`;
}

function maxNum(ids: string[], prefix: string) {
  return ids.reduce((max, id) => {
    const n = parseInt(id.slice(prefix.length).replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 1000);
}

function nid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function freshUi(collapsed = false, banner = false): AppState["ui"] {
  return { ...defaultUi(), sidebarCollapsed: collapsed, bannerDismissed: banner };
}
