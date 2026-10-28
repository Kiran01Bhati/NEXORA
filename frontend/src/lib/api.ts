import type {
  Invoice,
  Lead,
  LedgerEntry,
  Opportunity,
  Payment,
  Quotation,
  SalesOrder,
  Stage,
} from "@/types";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errMsg = `API error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errMsg = errJson.error;
      else if (errJson.errors && Array.isArray(errJson.errors)) errMsg = errJson.errors.join(", ");
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

// Normalization functions to ensure seamless rendering in existing components
export function normalizeOpportunity(raw: any): Opportunity {
  const stageMap: Record<string, Stage> = {
    qualification: "Qualified",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
    lead: "Lead",
  };

  const rawStage = (raw.stage || "").toLowerCase();
  const stage: Stage = stageMap[rawStage] || (raw.stage as Stage) || "Qualified";

  return {
    id: raw.id,
    name: raw.name || raw.title || `Opportunity ${raw.id?.slice?.(0, 6) ?? ""}`,
    customerId: raw.customerId || raw.customer?.id || "",
    value: Number(raw.value ?? raw.estimatedValue ?? 0),
    probability: Number(raw.probability ?? 40),
    stage,
    ownerId: raw.ownerId || raw.owner?.id || "USR-01",
    closeDate: raw.closeDate || raw.expectedCloseDate || new Date().toISOString(),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeQuotation(raw: any): Quotation {
  const lines = (raw.lines || raw.items || []).map((item: any) => ({
    productId: item.productId || "",
    name: item.name || item.product?.name || "Product Item",
    sku: item.sku || item.product?.sku || "SKU-000",
    qty: Number(item.qty ?? item.quantity ?? 1),
    unitPrice: Number(item.unitPrice ?? item.price ?? 0),
  }));

  const subtotal = Number(raw.gross ?? raw.subtotal ?? raw.total ?? 0);
  const discountAmt = Number(raw.discountAmt ?? raw.discount ?? 0);
  const discountPct = Number(raw.discountPct ?? (subtotal > 0 ? Math.round((discountAmt / subtotal) * 100) : 0));
  const net = Number(raw.net ?? subtotal - discountAmt);
  const tax = Number(raw.tax ?? Math.round(net * 0.18));
  const total = Number(raw.total ?? net + tax);

  return {
    id: raw.id,
    customerId: raw.customerId || raw.customer?.id || "",
    opportunityId: raw.opportunityId || undefined,
    lines,
    discountPct,
    gross: subtotal,
    discountAmt,
    net,
    tax,
    total,
    status: raw.status || "Sent",
    validUntil: raw.validUntil || new Date(Date.now() + 14 * 86400000).toISOString(),
    createdBy: raw.createdBy || raw.creator?.id || "USR-01",
    createdAt: raw.createdAt || raw.date || new Date().toISOString(),
    orderId: raw.orderId || undefined,
    terms: raw.terms || "Standard commercial terms apply.",
  };
}

export function normalizeSalesOrder(raw: any): SalesOrder {
  const lines = (raw.lines || []).map((line: any) => ({
    productId: line.productId || "",
    name: line.name || line.product?.name || "Item",
    sku: line.sku || line.product?.sku || "SKU",
    qty: Number(line.qty ?? line.quantity ?? 1),
    unitPrice: Number(line.unitPrice ?? line.product?.price ?? 0),
  }));

  return {
    id: raw.id,
    customerId: raw.customerId || raw.customer?.id || "",
    quotationId: raw.quotationId || undefined,
    opportunityId: raw.opportunityId || undefined,
    lines,
    discountPct: Number(raw.discountPct ?? 0),
    gross: Number(raw.gross ?? 0),
    discountAmt: Number(raw.discountAmt ?? 0),
    net: Number(raw.net ?? 0),
    tax: Number(raw.tax ?? 0),
    total: Number(raw.total ?? 0),
    rules: raw.rules || [],
    riskLevel: raw.riskLevel || "Low",
    riskScore: Number(raw.riskScore ?? 0),
    approvalStatus: raw.approvalStatus || "Not Required",
    inventoryStatus: raw.inventoryStatus || "Not Reserved",
    paymentStatus: raw.paymentStatus || "Not Invoiced",
    createdBy: raw.createdBy || raw.creator?.id || "USR-01",
    approverId: raw.approverId || raw.approver?.id || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    terms: raw.terms || "Prices in INR. GST extra at 18%.",
    changeNote: raw.changeNote || undefined,
    rejectReason: raw.rejectReason || undefined,
    sodAttempts: raw.sodAttempts || [],
    reservation: raw.reservation || undefined,
    invoiceId: raw.invoices?.[0]?.id || raw.invoiceId || undefined,
  };
}

export function normalizeInvoice(raw: any): Invoice {
  let lines = raw.lines;
  if (!lines || lines.length === 0) {
    if (raw.order?.lines && Array.isArray(raw.order.lines)) {
      lines = raw.order.lines.map((l: any) => ({
        productId: l.productId,
        name: l.name || l.product?.name || "Product",
        sku: l.sku || l.product?.sku || "SKU",
        qty: Number(l.qty ?? 1),
        unitPrice: Number(l.unitPrice ?? 0),
      }));
    } else {
      lines = [];
    }
  }

  return {
    id: raw.id,
    customerId: raw.customerId || raw.customer?.id || "",
    orderId: raw.orderId || undefined,
    amount: Number(raw.amount ?? 0),
    paid: Number(raw.paid ?? 0),
    outstanding: Number(raw.outstanding ?? 0),
    status: raw.status || "Issued",
    issuedAt: raw.issuedAt || new Date().toISOString(),
    due: raw.due || new Date(Date.now() + 14 * 86400000).toISOString(),
    lines,
    discountPct: Number(raw.discountPct ?? 0),
    gross: Number(raw.gross ?? raw.amount ?? 0),
    discountAmt: Number(raw.discountAmt ?? 0),
    net: Number(raw.net ?? raw.amount ?? 0),
    tax: Number(raw.tax ?? 0),
    notes: raw.notes || undefined,
  };
}

export function normalizePayment(raw: any): Payment {
  return {
    id: raw.id,
    invoiceId: raw.invoiceId,
    customerId: raw.customerId,
    amount: Number(raw.amount),
    method: raw.method,
    date: raw.date || new Date().toISOString(),
    status: raw.status || "Cleared",
    reference: raw.reference || `REF-${raw.id.slice(0, 8)}`,
    recordedBy: raw.recordedBy || raw.recorder?.id || "USR-04",
  };
}

export const apiClient = {
  // Leads API
  leads: {
    list: () => request<Lead[]>("/api/leads"),
    create: (data: Partial<Lead>) =>
      request<Lead>("/api/leads", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Lead>) =>
      request<Lead>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/leads/${id}`, { method: "DELETE" }),
    convert: (id: string) =>
      request<{ lead: Lead; opportunity: any; customer: any }>(`/api/leads/${id}/convert`, { method: "POST" }),
  },

  // Opportunities API
  opportunities: {
    list: () => request<any[]>("/api/opportunities"),
    create: (data: any) =>
      request<any>("/api/opportunities", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/opportunities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/opportunities/${id}`, { method: "DELETE" }),
  },

  // Quotations API
  quotations: {
    list: () => request<any[]>("/api/quotations"),
    get: (id: string) => request<any>(`/api/quotations/${id}`),
    create: (data: any) =>
      request<any>("/api/quotations", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/quotations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/quotations/${id}`, { method: "DELETE" }),
  },

  // Sales Orders API
  orders: {
    list: () => request<any[]>("/api/orders"),
    get: (id: string) => request<any>(`/api/orders/${id}`),
    create: (data: any) =>
      request<any>("/api/orders", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/orders/${id}`, { method: "DELETE" }),
  },

  // Invoices API
  invoices: {
    list: () => request<any[]>("/api/invoices"),
    get: (id: string) => request<any>(`/api/invoices/${id}`),
    create: (data: any) =>
      request<any>("/api/invoices", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/invoices/${id}`, { method: "DELETE" }),
  },

  // Payments API (with demo identification)
  payments: {
    list: (params?: { invoiceId?: string; customerId?: string; demoOnly?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.invoiceId) q.set("invoiceId", params.invoiceId);
      if (params?.customerId) q.set("customerId", params.customerId);
      if (params?.demoOnly) q.set("demoOnly", "true");
      const qs = q.toString() ? `?${q.toString()}` : "";
      return request<any[]>(`/api/payments${qs}`);
    },
    listDemo: () => request<any[]>("/api/payments/demo"),
    get: (id: string) => request<any>(`/api/payments/${id}`),
    record: (data: {
      invoiceId: string;
      amount: number;
      method?: string;
      reference?: string;
      recordedBy?: string;
      date?: string;
    }) => request<any>("/api/payments", { method: "POST", body: JSON.stringify(data) }),
  },

  // Accounting API
  accounting: {
    summary: (params?: { startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams();
      if (params?.startDate) q.set("startDate", params.startDate);
      if (params?.endDate) q.set("endDate", params.endDate);
      const qs = q.toString() ? `?${q.toString()}` : "";
      return request<any>(`/api/accounting/summary${qs}`);
    },
    receivables: () => request<any>("/api/accounting/receivables"),
    customers: () => request<any[]>("/api/accounting/customers"),
    customerStatement: (customerId: string) =>
      request<any>(`/api/accounting/customers/${customerId}`),
    ledger: (params?: { account?: string; reference?: string; startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams();
      if (params?.account) q.set("account", params.account);
      if (params?.reference) q.set("reference", params.reference);
      if (params?.startDate) q.set("startDate", params.startDate);
      if (params?.endDate) q.set("endDate", params.endDate);
      const qs = q.toString() ? `?${q.toString()}` : "";
      return request<{ summary: any; entries: LedgerEntry[] }>(`/api/accounting/ledger${qs}`);
    },
    createLedgerEntry: (data: {
      account: string;
      description: string;
      reference?: string;
      debit?: number;
      credit?: number;
      date?: string;
    }) => request<LedgerEntry>("/api/accounting/ledger", { method: "POST", body: JSON.stringify(data) }),
    syncLedger: () => request<any>("/api/accounting/ledger/sync", { method: "POST" }),
  },
};

