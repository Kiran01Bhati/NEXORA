import type { Page } from "@/types";

export interface NavItem {
  page: Page;
  label: string;
  icon: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  { label: "Overview", items: [{ page: "dashboard", label: "Dashboard", icon: "grid" }] },
  {
    label: "CRM",
    items: [
      { page: "customers", label: "Customers", icon: "users" },
      { page: "leads", label: "Leads", icon: "target" },
      { page: "opportunities", label: "Opportunities", icon: "briefcase" },
      { page: "pipeline", label: "Sales Pipeline", icon: "kanban" },
      { page: "quotations", label: "Quotations", icon: "file" },
      { page: "interactions", label: "Interactions", icon: "chat" },
    ],
  },
  {
    label: "ERP",
    items: [
      { page: "products", label: "Products", icon: "box" },
      { page: "inventory", label: "Inventory", icon: "warehouse" },
      { page: "purchases", label: "Purchases", icon: "cart" },
      { page: "orders", label: "Sales Orders", icon: "receipt" },
      { page: "invoices", label: "Invoices", icon: "file" },
      { page: "payments", label: "Payments", icon: "card" },
      { page: "accounts", label: "Accounts", icon: "book" },
    ],
  },
  {
    label: "Risk Management",
    items: [
      { page: "risk", label: "Risk Dashboard", icon: "shield" },
      { page: "register", label: "Risk Register", icon: "flag" },
      { page: "alerts", label: "Alerts", icon: "alert" },
      { page: "approvals", label: "Approvals", icon: "check" },
    ],
  },
  {
    label: "Insights",
    items: [
      { page: "reports", label: "Reports", icon: "chart" },
      { page: "analytics", label: "Analytics", icon: "pie" },
    ],
  },
  {
    label: "Administration",
    items: [
      { page: "users", label: "Users", icon: "user" },
      { page: "roles", label: "Roles & Permissions", icon: "key" },
      { page: "hierarchy", label: "Approval Hierarchy", icon: "git" },
      { page: "audit", label: "Audit Logs", icon: "scroll" },
    ],
  },
];

const TITLES: Partial<Record<Page, string>> = {
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
  alert: "Alert",
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

export function pageTitle(page: Page) {
  return TITLES[page] ?? "NEXORA";
}

export function navPage(page: Page): Page {
  if (page === "customer") return "customers";
  if (page === "quotation") return "quotations";
  if (page === "order") return "orders";
  if (page === "invoice") return "invoices";
  if (page === "alert" || page === "case") return "approvals";
  return page;
}
