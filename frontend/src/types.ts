export type Role =
  | "Admin"
  | "Sales Executive"
  | "Sales Manager"
  | "Finance"
  | "Inventory Manager"
  | "Compliance Officer";

export type Page =
  | "dashboard"
  | "customers"
  | "customer"
  | "leads"
  | "opportunities"
  | "pipeline"
  | "quotations"
  | "quotation"
  | "interactions"
  | "products"
  | "inventory"
  | "purchases"
  | "orders"
  | "order"
  | "invoices"
  | "invoice"
  | "payments"
  | "accounts"
  | "risk"
  | "register"
  | "alerts"
  | "alert"
  | "approvals"
  | "case"
  | "reports"
  | "analytics"
  | "users"
  | "roles"
  | "hierarchy"
  | "audit"
  | "settings";

export interface View {
  page: Page;
  id?: string;
}

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type OrderRisk = "None" | RiskLevel;

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  status: "Active" | "Invited";
}

export interface Customer {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  industry: string;
  gstin: string;
  creditLimit: number;
  outstanding: number;
  ownerId: string;
  status: "Active" | "On Hold" | "Prospect";
  lastActivity: string;
  since: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  source: "Website" | "Referral" | "Campaign" | "Event" | "Partner" | "Outbound";
  ownerId: string;
  value: number;
  status: "New" | "Contacted" | "Qualified" | "Converted" | "Lost";
  lastContact: string | null;
  createdAt: string;
  opportunityId?: string;
}

export type Stage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";

export interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  value: number;
  probability: number;
  stage: Stage;
  ownerId: string;
  closeDate: string;
  createdAt: string;
}

export interface Line {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  customerId: string;
  opportunityId?: string;
  lines: Line[];
  discountPct: number;
  gross: number;
  discountAmt: number;
  net: number;
  tax: number;
  total: number;
  status: "Draft" | "Sent" | "Accepted" | "Converted" | "Expired" | "Rejected";
  validUntil: string;
  createdBy: string;
  createdAt: string;
  orderId?: string;
  terms: string;
}

export type RuleCode = "HIGH_VALUE" | "DISCOUNT" | "CREDIT" | "INVENTORY" | "PAYMENT" | "FREQUENCY";

export interface TriggeredRule {
  code: RuleCode;
  category: string;
  detail: string;
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
}

export interface Reservation {
  productId: string;
  name: string;
  sku: string;
  required: number;
  availableBefore: number;
  reserved: number;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  quotationId?: string;
  opportunityId?: string;
  lines: Line[];
  discountPct: number;
  gross: number;
  discountAmt: number;
  net: number;
  tax: number;
  total: number;
  rules: TriggeredRule[];
  riskLevel: OrderRisk;
  riskScore: number;
  approvalStatus: "Not Required" | "Pending" | "Approved" | "Rejected" | "Changes Requested";
  inventoryStatus: "Not Reserved" | "Reserved" | "Backordered" | "Fulfilled";
  paymentStatus: "Not Invoiced" | "Unpaid" | "Partial" | "Paid";
  createdBy: string;
  approverId: string;
  createdAt: string;
  terms: string;
  changeNote?: string;
  rejectReason?: string;
  sodAttempts: { at: string; userId: string }[];
  reservation?: Reservation[];
  invoiceId?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  kind: "Hardware" | "License" | "Service";
  price: number;
  onHand: number;
  reorder: number;
}

export interface Purchase {
  id: string;
  vendor: string;
  productId: string;
  qty: number;
  value: number;
  status: "Draft" | "Ordered" | "Partial" | "Received";
  expected: string;
  ownerId: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  orderId?: string;
  amount: number;
  paid: number;
  outstanding: number;
  status: "Draft" | "Issued" | "Partially Paid" | "Paid" | "Overdue";
  issuedAt: string;
  due: string;
  lines: Line[];
  discountPct: number;
  gross: number;
  discountAmt: number;
  net: number;
  tax: number;
  notes?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  method: "NEFT" | "RTGS" | "UPI" | "Card" | "Cheque";
  date: string;
  status: "Cleared" | "Pending" | "Failed";
  reference: string;
  recordedBy: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  reference: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
}

export interface Risk {
  id: string;
  code: string;
  category: string;
  transaction: string;
  transactionType: string;
  customerId?: string;
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  ownerId: string;
  status: "Open" | "Monitoring" | "Mitigated" | "Closed" | "Accepted";
  treatment: string;
  detail: string;
  createdAt: string;
  source: "engine" | "recorded";
}

export interface Alert {
  id: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  title: string;
  body: string;
  at: string;
  status: "Open" | "Acknowledged" | "Resolved";
  page: Page;
  entityId?: string;
}

export interface Interaction {
  id: string;
  customerId: string;
  type: "Call" | "Email" | "Meeting" | "Note" | "Demo";
  subject: string;
  body: string;
  ownerId: string;
  at: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  previous: string;
  next: string;
  status: "Success" | "Rejected" | "Warning" | "Info";
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  page: Page;
  entityId?: string;
  tone: "danger" | "warning" | "info" | "success";
}

export interface Policy {
  highValue: number;
  discountPct: number;
  creditWarnPct: number;
}

export interface Decision {
  title: string;
  kicker?: string;
  body: string;
  tone: "success" | "danger" | "warning" | "info";
  primaryLabel?: string;
  primaryPage?: Page;
  primaryId?: string;
}

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "danger" | "warning" | "info";
  at: number;
}

export type QuickType = "customer" | "lead" | "quote" | "order" | "payment" | "interaction";

export interface UiState {
  commandOpen: boolean;
  notifOpen: boolean;
  quickOpen: boolean;
  scenarioOpen: boolean;
  sidebarCollapsed: boolean;
  mobileNav: boolean;
  refreshing: boolean;
  decision: Decision | null;
  quickType: QuickType;
  bannerDismissed: boolean;
}

export interface AppState {
  version: number;
  userId: string;
  view: View;
  history: View[];
  customers: Customer[];
  leads: Lead[];
  opportunities: Opportunity[];
  quotations: Quotation[];
  orders: SalesOrder[];
  products: Product[];
  purchases: Purchase[];
  invoices: Invoice[];
  payments: Payment[];
  ledger: LedgerEntry[];
  risks: Risk[];
  alerts: Alert[];
  interactions: Interaction[];
  audit: AuditEntry[];
  notices: Notice[];
  users: User[];
  policy: Policy;
  toasts: Toast[];
  ui: UiState;
}

export interface CustomerInput {
  company: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  industry: string;
  creditLimit: number;
  gstin?: string;
}

export interface LeadInput {
  name: string;
  company: string;
  email: string;
  source: Lead["source"];
  value: number;
}

export interface QuoteInput {
  customerId: string;
  opportunityId?: string;
  productId: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  validUntil: string;
}

export interface OrderInput {
  customerId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  opportunityId?: string;
}

export interface PaymentInput {
  invoiceId: string;
  amount: number;
  method: Payment["method"];
  reference: string;
  date: string;
}

export interface InteractionInput {
  customerId: string;
  type: Interaction["type"];
  subject: string;
  body: string;
}
