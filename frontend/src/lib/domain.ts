import type {
  AppState,
  Customer,
  Invoice,
  Line,
  OrderRisk,
  Page,
  Policy,
  Product,
  RiskLevel,
  Role,
  SalesOrder,
  Stage,
  TriggeredRule,
  User,
} from "@/types";
import { formatINR } from "@/lib/format";

export const TAX_RATE = 0.18;
export const VERSION = 2;

export const COMPANY = {
  legal: "Air Dive Technologies Pvt. Ltd.",
  short: "Air Dive",
  line: "Environmental intelligence systems",
  address: "14, 4th Cross, Indiranagar, Bengaluru 560038",
  gstin: "29AADCA9182Q1Z7",
  email: "billing@airdive.example",
  phone: "+91 80 4567 2200",
  bank: "Sample Bank",
  account: "XXXXXX4412",
  ifsc: "SAMP0004412",
};

export const TERMS =
  "Prices in INR. GST extra at 18%. Goods remain the property of Air Dive Technologies until paid in full. Installation is scheduled after approval and inventory reservation. Orders above the high-value threshold, or discounts above policy, require independent approval.";

export const STAGES: Stage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

export function priceLines(lines: Line[], discountPct: number) {
  const gross = Math.round(lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0));
  const discountAmt = Math.round((gross * discountPct) / 100);
  const net = gross - discountAmt;
  const tax = Math.round(net * TAX_RATE);
  const total = net + tax;
  return { gross, discountAmt, net, tax, total };
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 17) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

export function evaluateRules(input: {
  gross: number;
  discountPct: number;
  payable: number;
  outstanding: number;
  creditLimit: number;
  overdueInvoices: number;
  stockShort: boolean;
  recentOrders: number;
  policy: Policy;
}): TriggeredRule[] {
  const rules: TriggeredRule[] = [];
  if (input.gross > input.policy.highValue) {
    rules.push({
      code: "HIGH_VALUE",
      category: "High-Value Transaction",
      detail: `Order exceeds ${formatINR(input.policy.highValue)}.`,
      likelihood: 4,
      impact: 4,
      score: 16,
      level: "High",
    });
  }
  if (input.discountPct > input.policy.discountPct) {
    rules.push({
      code: "DISCOUNT",
      category: "Discount Risk",
      detail: `Discount exceeds ${input.policy.discountPct}%.`,
      likelihood: 3,
      impact: 4,
      score: 12,
      level: "High",
    });
  }
  if (input.outstanding + input.payable > input.creditLimit) {
    rules.push({
      code: "CREDIT",
      category: "Credit Risk",
      detail: "Outstanding amount exceeds customer credit limit.",
      likelihood: 5,
      impact: 5,
      score: 25,
      level: "Critical",
    });
  }
  if (input.overdueInvoices > 0) {
    rules.push({
      code: "PAYMENT",
      category: "Payment Risk",
      detail: "Customer has overdue invoices.",
      likelihood: 3,
      impact: 3,
      score: 9,
      level: "Medium",
    });
  }
  if (input.stockShort) {
    rules.push({
      code: "INVENTORY",
      category: "Inventory Risk",
      detail: "Required quantity exceeds available stock.",
      likelihood: 4,
      impact: 3,
      score: 12,
      level: "High",
    });
  }
  if (input.recentOrders >= 3) {
    rules.push({
      code: "FREQUENCY",
      category: "Transaction Frequency",
      detail: "Unusual order frequency in the last 30 days.",
      likelihood: 2,
      impact: 2,
      score: 4,
      level: "Low",
    });
  }
  return rules;
}

export function summarizeRules(rules: TriggeredRule[]): { level: OrderRisk; score: number } {
  if (!rules.length) return { level: "None", score: 0 };
  const top = rules.reduce((a, b) => (a.score >= b.score ? a : b));
  return { level: top.level, score: top.score };
}

export function invoiceDisplayStatus(inv: Invoice, now = new Date()): Invoice["status"] {
  if (inv.status === "Paid" || inv.status === "Draft") return inv.status;
  if ((inv.status === "Issued" || inv.status === "Partially Paid" || inv.status === "Overdue") && new Date(inv.due) < now && inv.outstanding > 0) {
    return "Overdue";
  }
  return inv.status;
}

export function userById(state: AppState, id?: string) {
  return state.users.find((u) => u.id === id);
}

export function userName(state: AppState, id?: string) {
  if (id === "system") return "System";
  return userById(state, id)?.name ?? "—";
}

export function customerById(state: AppState, id?: string) {
  return state.customers.find((c) => c.id === id);
}

export function productById(state: AppState, id?: string) {
  return state.products.find((p) => p.id === id);
}

export function currentUser(state: AppState) {
  return state.users.find((u) => u.id === state.userId) ?? state.users[0];
}

export function pickApprover(users: User[], createdBy: string, level: OrderRisk) {
  const manager = users.find((u) => u.role === "Sales Manager") ?? users[0];
  const compliance = users.find((u) => u.role === "Compliance Officer") ?? manager;
  if (level === "Critical") return compliance.id;
  if (level === "High" || level === "Medium") {
    if (createdBy === manager.id) return compliance.id;
    return manager.id;
  }
  return manager.id;
}

export type Perm =
  | "customers.write"
  | "orders.create"
  | "orders.approve"
  | "orders.approve.critical"
  | "payments.record"
  | "inventory.write"
  | "purchases.receive"
  | "policy.write"
  | "users.manage"
  | "audit.view";

const MATRIX: Record<Role, Perm[]> = {
  Admin: [
    "customers.write",
    "orders.create",
    "orders.approve",
    "orders.approve.critical",
    "payments.record",
    "inventory.write",
    "purchases.receive",
    "policy.write",
    "users.manage",
    "audit.view",
  ],
  "Sales Executive": ["customers.write", "orders.create"],
  "Sales Manager": ["customers.write", "orders.create", "orders.approve", "audit.view"],
  Finance: ["payments.record", "audit.view"],
  "Inventory Manager": ["inventory.write", "purchases.receive"],
  "Compliance Officer": ["orders.approve.critical", "policy.write", "audit.view"],
};

export function can(role: Role, perm: Perm) {
  return MATRIX[role].includes(perm);
}

export const PERMISSION_ROWS: { perm: Perm; label: string }[] = [
  { perm: "customers.write", label: "Manage customers & pipeline" },
  { perm: "orders.create", label: "Create quotations & orders" },
  { perm: "orders.approve", label: "Approve standard risk" },
  { perm: "orders.approve.critical", label: "Approve critical risk" },
  { perm: "payments.record", label: "Record payments" },
  { perm: "inventory.write", label: "Adjust inventory" },
  { perm: "purchases.receive", label: "Receive purchases" },
  { perm: "policy.write", label: "Edit risk policy" },
  { perm: "users.manage", label: "Manage users" },
  { perm: "audit.view", label: "View audit log" },
];

export const ROLES: Role[] = [
  "Admin",
  "Sales Executive",
  "Sales Manager",
  "Finance",
  "Inventory Manager",
  "Compliance Officer",
];

export function reservedQty(state: AppState, productId: string, exceptOrderId?: string) {
  return state.orders
    .filter((o) => o.id !== exceptOrderId && o.inventoryStatus === "Reserved")
    .reduce((sum, order) => sum + order.lines.filter((l) => l.productId === productId).reduce((a, l) => a + l.qty, 0), 0);
}

export function stockOf(state: AppState, productId: string, exceptOrderId?: string) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) {
    return { onHand: 0, reserved: 0, available: 0, reorder: 0, status: "Out of Stock" as const, name: "Unknown", sku: "—" };
  }
  const reserved = reservedQty(state, productId, exceptOrderId);
  const available = Math.max(0, product.onHand - reserved);
  const status = available <= 0 ? "Out of Stock" : available <= product.reorder ? "Low Stock" : "In Stock";
  return { onHand: product.onHand, reserved, available, reorder: product.reorder, status, name: product.name, sku: product.sku, kind: product.kind };
}

export function overdueCount(state: AppState, customerId: string) {
  return state.invoices.filter((inv) => inv.customerId === customerId && invoiceDisplayStatus(inv) === "Overdue").length;
}

export function recentOrderCount(state: AppState, customerId: string, exceptId?: string) {
  const cutoff = Date.now() - 30 * 86400000;
  return state.orders.filter(
    (o) => o.customerId === customerId && o.id !== exceptId && new Date(o.createdAt).getTime() >= cutoff,
  ).length;
}

export function rulesFor(state: AppState, customer: Customer, lines: Line[], discountPct: number, exceptOrderId?: string) {
  const priced = priceLines(lines, discountPct);
  const stockShort = lines.some((line) => {
    const stock = stockOf(state, line.productId, exceptOrderId);
    return line.qty > stock.available;
  });
  return evaluateRules({
    gross: priced.gross,
    discountPct,
    payable: priced.total,
    outstanding: customer.outstanding,
    creditLimit: customer.creditLimit,
    overdueInvoices: overdueCount(state, customer.id),
    stockShort,
    recentOrders: recentOrderCount(state, customer.id, exceptOrderId),
    policy: state.policy,
  });
}

export type StageState = "completed" | "current" | "pending" | "blocked";

export function orderLifecycle(order: SalesOrder, hasInvoice: boolean, paid: boolean, partial: boolean, accounted: boolean) {
  const approved = order.approvalStatus === "Approved" || order.approvalStatus === "Not Required";
  const rejected = order.approvalStatus === "Rejected";
  const reserved = order.inventoryStatus === "Reserved" || order.inventoryStatus === "Fulfilled";
  const backordered = order.inventoryStatus === "Backordered";

  const approval: StageState = approved ? "completed" : rejected ? "blocked" : "current";
  let inventory: StageState = "pending";
  if (reserved) inventory = "completed";
  else if (backordered || rejected) inventory = "blocked";
  else if (approved) inventory = "current";

  let invoice: StageState = "pending";
  if (hasInvoice) invoice = "completed";
  else if (rejected || backordered) invoice = "blocked";
  else if (reserved) invoice = "current";

  let payment: StageState = "pending";
  if (paid) payment = "completed";
  else if (partial || hasInvoice) payment = "current";
  else if (rejected) payment = "blocked";

  let accounting: StageState = "pending";
  if (accounted) accounting = "completed";
  else if (paid) accounting = "current";
  else if (rejected) accounting = "blocked";

  return [
    { key: "quotation", label: "Quotation", state: "completed" as StageState },
    { key: "sales_order", label: "Sales Order", state: "completed" as StageState },
    { key: "risk", label: "Risk Evaluation", state: "completed" as StageState },
    { key: "approval", label: "Approval", state: approval },
    { key: "inventory", label: "Inventory Reservation", state: inventory },
    { key: "invoice", label: "Invoice", state: invoice },
    { key: "payment", label: "Payment", state: payment },
    { key: "accounting", label: "Accounting", state: accounting },
  ];
}

export function lifecycleNote(order: SalesOrder, approver?: User) {
  if (order.approvalStatus === "Pending") {
    return `Approval is the current stage. Waiting on ${approver?.name ?? "the designated approver"}. The creator cannot approve their own order.`;
  }
  if (order.approvalStatus === "Changes Requested") {
    return order.changeNote ? `Changes requested: ${order.changeNote}` : "Changes requested before approval can continue.";
  }
  if (order.approvalStatus === "Rejected") {
    return order.rejectReason ? `Approval blocked. ${order.rejectReason}` : "Approval was rejected. Downstream stages are blocked.";
  }
  if (order.inventoryStatus === "Backordered") {
    return "Approved, but inventory could not be reserved. Raise stock before invoicing.";
  }
  if (order.paymentStatus === "Paid") return "Cycle complete. Receipt posted and the audit trail is current.";
  if (order.paymentStatus === "Unpaid" || order.paymentStatus === "Partial") {
    return "Invoice is issued. Record the receipt in Finance to clear the receivable and close accounting.";
  }
  if (order.approvalStatus === "Not Required") return "No policy rule fired. The order can be released to fulfillment.";
  if (order.approvalStatus === "Approved" && order.inventoryStatus === "Not Reserved") {
    return "Approved. Reserve inventory and issue the invoice to continue.";
  }
  return "Transaction is moving through the connected CRM, ERP and risk workflow.";
}

export function approvalGate(user: User, order: SalesOrder): "ok" | "sod" | "role" | "closed" {
  if (order.approvalStatus === "Approved" || order.approvalStatus === "Not Required" || order.approvalStatus === "Rejected") {
    return "closed";
  }
  if (user.id === order.createdBy) return "sod";
  if (user.role === "Admin" || user.id === order.approverId) return "ok";
  return "role";
}

export function scenarioSteps(state: AppState): { n: string; title: string; detail: string; done: boolean; page: Page; id?: string }[] {
  const order = state.orders.find((o) => o.id === "SO-1042");
  const invoice = state.invoices.find((i) => i.orderId === "SO-1042");
  const paid = invoice ? state.payments.some((p) => p.invoiceId === invoice.id && p.status === "Cleared") : false;
  const sod = state.audit.some((a) => a.entityId === "SO-1042" && a.action === "Approval Attempt");
  const approved = order?.approvalStatus === "Approved";
  const reserved = order?.inventoryStatus === "Reserved" || order?.inventoryStatus === "Fulfilled";
  const accounted = invoice ? state.ledger.some((l) => l.reference === invoice.id && l.account === "Bank") : false;
  const pendingOrBeyond = !!order && order.approvalStatus !== "Not Required";
  return [
    { n: "01", title: "Create customer", detail: "ABC Hospitality", done: true, page: "customer" as const, id: "CUS-1004" },
    { n: "02", title: "Create opportunity", detail: "OPP-318 · AirSense rollout", done: true, page: "pipeline" as const, id: "OPP-318" },
    { n: "03", title: "Generate quotation", detail: "QT-2041 · 25% discount", done: true, page: "quotation" as const, id: "QT-2041" },
    { n: "04", title: "Create sales order", detail: "SO-1042 · ₹7,00,000 · 25%", done: !!order, page: "order" as const, id: "SO-1042" },
    { n: "05", title: "System detects risk", detail: "2 rules · high value + discount", done: (order?.rules.filter((r) => r.code === "HIGH_VALUE" || r.code === "DISCOUNT").length ?? 0) >= 2 || !!approved, page: "case" as const, id: "SO-1042" },
    { n: "06", title: "Pending manager approval", detail: "Status held for an independent approver", done: pendingOrBeyond || !!approved, page: "approvals" as const, id: undefined },
    { n: "07", title: "Creator attempts approval", detail: "Sign in as Aarav Mehta and attempt it", done: sod, page: "case" as const, id: "SO-1042" },
    { n: "08", title: "Segregation of Duties", detail: "Creator cannot approve their own high-risk order", done: sod, page: "audit" as const, id: "SO-1042" },
    { n: "09", title: "Manager approves", detail: "Sign in as Kiran Bhati · Sales Manager", done: !!approved, page: "case" as const, id: "SO-1042" },
    { n: "10", title: "Inventory reservation", detail: "Required 10 · available 25 · reserve 10", done: !!reserved, page: "inventory" as const, id: undefined },
    { n: "11", title: "Invoice generated", detail: invoice?.id ?? "Issued with approval", done: !!invoice, page: invoice ? "invoice" : "order", id: invoice?.id ?? "SO-1042" },
    { n: "12", title: "Payment recorded", detail: "Sign in as Meera Shah · Finance", done: paid, page: invoice ? "invoice" : "payments", id: invoice?.id },
    { n: "13", title: "Accounting entry created", detail: "Bank receipt clears the receivable", done: accounted, page: "accounts" as const, id: invoice?.id },
    { n: "14", title: "Audit trail updated", detail: "Who, what, when, previous, new", done: accounted, page: "audit" as const, id: "SO-1042" },
  ];
}

export function openPipelineValue(state: AppState) {
  return state.opportunities.filter((o) => o.stage !== "Won" && o.stage !== "Lost").reduce((s, o) => s + o.value, 0);
}

export function weightedPipeline(state: AppState) {
  return state.opportunities
    .filter((o) => o.stage !== "Won" && o.stage !== "Lost")
    .reduce((s, o) => s + Math.round((o.value * o.probability) / 100), 0);
}

export function outstandingTotal(state: AppState) {
  return state.invoices.reduce((s, i) => s + i.outstanding, 0);
}

export function arBalance(state: AppState) {
  return state.ledger
    .filter((l) => l.account === "Accounts Receivable")
    .reduce((s, l) => s + l.debit - l.credit, 0);
}

export function hardwareStock(state: AppState) {
  const hardware = state.products.filter((p) => p.kind === "Hardware");
  let available = 0;
  let reserved = 0;
  let low = 0;
  hardware.forEach((p) => {
    const stock = stockOf(state, p.id);
    available += stock.available;
    reserved += stock.reserved;
    if (stock.status === "Low Stock") low += 1;
  });
  return { available, reserved, low, skus: hardware.length };
}

export function relatedIds(state: AppState, customerId: string) {
  const ids = new Set<string>([customerId]);
  state.orders.filter((o) => o.customerId === customerId).forEach((o) => ids.add(o.id));
  state.quotations.filter((q) => q.customerId === customerId).forEach((q) => ids.add(q.id));
  state.invoices.filter((i) => i.customerId === customerId).forEach((i) => ids.add(i.id));
  state.opportunities.filter((o) => o.customerId === customerId).forEach((o) => ids.add(o.id));
  state.payments.filter((p) => p.customerId === customerId).forEach((p) => ids.add(p.id));
  return ids;
}

export function agingBucket(due: string, outstanding: number) {
  if (outstanding <= 0) return "Paid";
  const days = Math.floor((Date.now() - new Date(due).getTime()) / 86400000);
  if (days <= 0) return "Current";
  if (days <= 30) return "1–30";
  if (days <= 60) return "31–60";
  return "60+";
}

export function productLine(product: Product, qty: number, unitPrice = product.price): Line {
  return { productId: product.id, name: product.name, sku: product.sku, qty, unitPrice };
}
