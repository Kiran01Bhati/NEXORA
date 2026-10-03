import { useState } from "react";
import { COMPANY, arBalance, hardwareStock, invoiceDisplayStatus, lifecycleNote, orderLifecycle, stockOf, userById, userName } from "@/lib/domain";
import { formatDate, formatINR, fromNow } from "@/lib/format";
import { useApp } from "@/store/store";
import { Icon } from "@/components/icons";
import { Lifecycle } from "@/components/lifecycle";
import { PaymentForm } from "@/components/forms";
import { DecisionPanel, InventoryCard } from "@/components/risk-case";
import { BackLink, Button, Card, CardHeader, DataTable, ErrorState, Field, FilterBar, Kpi, Modal, Mono, PageHeader, SearchBox, SelectInput, StatusBadge, TextInput } from "@/components/ui";
import type { Invoice, SalesOrder } from "@/types";

export function ProductsPage() {
  const { state, navigate } = useApp();
  const [q, setQ] = useState("");
  const rows = state.products.filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader eyebrow="ERP" title="Products" subtitle="Catalog Air Dive sells. Stock position lives on Inventory." />
      <FilterBar><SearchBox value={q} onChange={setQ} placeholder="Search products" /></FilterBar>
      <Card>
        <DataTable
          columns={[
            { key: "name", header: "Product", sort: (r) => r.name, render: (r) => <div><div className="font-medium">{r.name}</div><Mono>{r.sku}</Mono></div> },
            { key: "cat", header: "Category", render: (r) => r.category },
            { key: "kind", header: "Type", render: (r) => r.kind },
            { key: "price", header: "List price", align: "right" as const, sort: (r) => r.price, render: (r) => formatINR(r.price) },
            { key: "hand", header: "On hand", align: "right" as const, render: (r) => r.onHand },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          onRow={() => navigate({ page: "inventory" })}
          loading={state.ui.refreshing}
        />
      </Card>
    </div>
  );
}

export function InventoryPage() {
  const { state, adjustStock, user } = useApp();
  const stock = hardwareStock(state);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [edit, setEdit] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const rows = state.products
    .map((p) => ({ ...p, ...stockOf(state, p.id) }))
    .filter((p) => (status === "All" || p.status === status) && `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));
  const canEdit = user.role === "Inventory Manager" || user.role === "Admin";
  return (
    <div>
      <PageHeader eyebrow="ERP" title="Inventory" subtitle="Available stock is on-hand minus reservations. Reserved units stay visually separate until fulfillment." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total products" value={state.products.length} hint={`${stock.skus} hardware SKUs`} icon="box" />
        <Kpi label="Available stock" value={stock.available} hint="Hardware units free to promise" icon="warehouse" />
        <Kpi label="Reserved stock" value={stock.reserved} hint="Allocated to approved orders" icon="layers" />
        <Kpi label="Low stock" value={stock.low} hint="At or below reorder" icon="alert" />
      </div>
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search SKU or product" />
        <SelectInput className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["All", "In Stock", "Low Stock", "Out of Stock"].map((s) => <option key={s}>{s}</option>)}
        </SelectInput>
      </FilterBar>
      <Card>
        <DataTable
          columns={[
            { key: "p", header: "Product", render: (r) => <div><div className="font-medium">{r.name}</div><Mono>{r.sku}</Mono></div> },
            { key: "sku", header: "Kind", render: (r) => r.kind },
            { key: "av", header: "Available", align: "right" as const, sort: (r) => r.available, render: (r) => <span className="font-medium tabular-nums">{r.available}</span> },
            { key: "rs", header: "Reserved", align: "right" as const, render: (r) => <span className="font-medium text-amber-700 tabular-nums">{r.reserved}</span> },
            { key: "re", header: "Reorder level", align: "right" as const, render: (r) => r.reorder },
            { key: "bar", header: "Position", render: (r) => <StockBar available={r.available} reserved={r.reserved} /> },
            { key: "st", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "act", header: "", render: (r) => canEdit ? <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEdit(r.id); setQty(String(r.onHand)); }}>Adjust</Button> : null },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          loading={state.ui.refreshing}
        />
      </Card>
      <div className="mt-2 flex gap-4 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><i className="h-2 w-3 rounded-sm bg-[#3A86FF]" /> Available</span><span className="inline-flex items-center gap-1"><i className="h-2 w-3 rounded-sm bg-amber-400" /> Reserved</span></div>
      <Modal open={!!edit} title="Adjust on-hand" onClose={() => setEdit(null)} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={() => { if (edit) adjustStock(edit, Number(qty)); setEdit(null); }}>Save</Button></>}>
        <Field label="On-hand quantity" hint="Does not change existing reservations."><TextInput type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}

function StockBar({ available, reserved }: { available: number; reserved: number }) {
  const total = available + reserved || 1;
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
      <div className="flex h-full">
        <div className="bg-[#3A86FF]" style={{ width: `${(available / total) * 100}%` }} />
        <div className="bg-amber-400" style={{ width: `${(reserved / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function PurchasesPage() {
  const { state, receivePurchase, user } = useApp();
  const can = user.role === "Inventory Manager" || user.role === "Admin";
  return (
    <div>
      <PageHeader eyebrow="ERP" title="Purchases" subtitle="Inbound supply that restores stock. Receiving is limited to inventory." />
      <Card>
        <DataTable
          columns={[
            { key: "id", header: "PO", render: (r) => <Mono className="text-[#0B132B]">{r.id}</Mono> },
            { key: "vendor", header: "Vendor", render: (r) => r.vendor },
            { key: "product", header: "Product", render: (r) => state.products.find((p) => p.id === r.productId)?.name ?? r.productId },
            { key: "qty", header: "Qty", align: "right" as const, render: (r) => r.qty },
            { key: "value", header: "Value", align: "right" as const, sort: (r) => r.value, render: (r) => formatINR(r.value) },
            { key: "exp", header: "Expected", render: (r) => formatDate(r.expected) },
            { key: "owner", header: "Owner", render: (r) => userName(state, r.ownerId) },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "act", header: "", render: (r) => can && r.status !== "Received" ? <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); receivePurchase(r.id); }}>Receive</Button> : null },
          ]}
          rows={state.purchases}
          rowKey={(r) => r.id}
          loading={state.ui.refreshing}
        />
      </Card>
    </div>
  );
}

export function OrdersPage() {
  const { state, navigate, openQuick } = useApp();
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("All");
  const rows = state.orders.filter((o) => {
    const customer = state.customers.find((c) => c.id === o.customerId)?.company ?? "";
    return (risk === "All" || o.riskLevel === risk) && `${o.id} ${customer}`.toLowerCase().includes(q.toLowerCase());
  });
  return (
    <div>
      <PageHeader eyebrow="ERP" title="Sales orders" subtitle="The control point between a quotation and cash. Risk, approval, stock and billing stay on the order." actions={<Button onClick={() => openQuick("order")}>New sales order</Button>} />
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search orders" />
        <SelectInput className="w-40" value={risk} onChange={(e) => setRisk(e.target.value)}>
          {["All", "None", "Low", "Medium", "High", "Critical"].map((s) => <option key={s}>{s}</option>)}
        </SelectInput>
      </FilterBar>
      <Card>
        <DataTable
          columns={[
            { key: "id", header: "Order ID", sort: (r: SalesOrder) => r.id, render: (r: SalesOrder) => <div className="flex items-center gap-2"><Mono className="text-[#0B132B]">{r.id}</Mono>{r.id === "SO-1042" && <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-600/15 ring-inset">Scenario</span>}</div> },
            { key: "customer", header: "Customer", render: (r: SalesOrder) => state.customers.find((c) => c.id === r.customerId)?.company },
            { key: "value", header: "Order value", align: "right" as const, sort: (r: SalesOrder) => r.gross, render: (r: SalesOrder) => formatINR(r.gross) },
            { key: "disc", header: "Discount", align: "right" as const, render: (r: SalesOrder) => `${r.discountPct}%` },
            { key: "risk", header: "Risk status", render: (r: SalesOrder) => <StatusBadge status={r.riskLevel} /> },
            { key: "appr", header: "Approval", render: (r: SalesOrder) => <StatusBadge status={r.approvalStatus} /> },
            { key: "inv", header: "Inventory", render: (r: SalesOrder) => <StatusBadge status={r.inventoryStatus} /> },
            { key: "pay", header: "Payment", render: (r: SalesOrder) => <StatusBadge status={r.paymentStatus} /> },
            { key: "by", header: "Created by", render: (r: SalesOrder) => userName(state, r.createdBy) },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          onRow={(r) => navigate({ page: "order", id: r.id })}
          loading={state.ui.refreshing}
        />
      </Card>
    </div>
  );
}

export function OrderPage() {
  const { state, navigate, back } = useApp();
  const order = state.orders.find((o) => o.id === state.view.id);
  if (!order) return <ErrorState title="Order not found" body="That sales order is not in the workspace." onBack={back} />;
  const customer = state.customers.find((c) => c.id === order.customerId);
  const invoice = state.invoices.find((i) => i.orderId === order.id || i.id === order.invoiceId);
  const approver = userById(state, order.approverId);
  const paid = invoice?.status === "Paid" || order.paymentStatus === "Paid";
  const partial = invoice?.status === "Partially Paid" || order.paymentStatus === "Partial";
  const accounted = invoice ? state.ledger.some((l) => l.reference === invoice.id && l.account === "Bank") : false;
  const stages = orderLifecycle(order, !!invoice, paid, !!partial, accounted);
  const trail = state.audit.filter((a) => a.entityId === order.id || a.entityId === invoice?.id).slice(0, 6);
  return (
    <div className="space-y-4">
      <BackLink label="Sales orders" onClick={() => navigate({ page: "orders" })} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-semibold tracking-tight">{order.id}</h1>
            <StatusBadge status={order.approvalStatus} />
            <StatusBadge status={order.riskLevel} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{customer?.company} · created by {userName(state, order.createdBy)} · {fromNow(order.createdAt)}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate({ page: "case", id: order.id })}>Open risk case</Button>
      </div>
      {order.rules.length > 0 && order.approvalStatus === "Pending" && (
        <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3">
          <span className="w-1 shrink-0 rounded-full bg-rose-500" />
          <div>
            <div className="text-sm font-semibold text-rose-900">{order.riskLevel} risk detected</div>
            <p className="text-sm text-rose-800/80">{order.rules.length} rules triggered. Status is pending manager approval.</p>
          </div>
        </div>
      )}
      <Lifecycle stages={stages} note={lifecycleNote(order, approver)} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_340px]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Order lines</h2>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400"><th className="py-2">Product</th><th>Qty</th><th className="text-right">Unit</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.sku} className="border-t border-[#F1F4F8]"><td className="py-2">{line.name}<div className="text-xs text-slate-400">{line.sku}</div></td><td>{line.qty}</td><td className="text-right tabular-nums">{formatINR(line.unitPrice)}</td><td className="text-right tabular-nums">{formatINR(line.qty * line.unitPrice)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <Line k="Order value" v={formatINR(order.gross)} />
            <Line k={`Discount ${order.discountPct}%`} v={formatINR(order.discountAmt)} />
            <Line k="Net" v={formatINR(order.net)} />
            <Line k="GST 18%" v={formatINR(order.tax)} />
            <Line k="Amount payable" v={formatINR(order.total)} strong />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">{order.terms}</p>
        </Card>
        <div className="space-y-4">
          <DecisionPanel orderId={order.id} />
          <InventoryCard orderId={order.id} />
          <Card className="p-4 text-sm">
            <h3 className="text-sm font-semibold">Linked records</h3>
            <div className="mt-2 space-y-1.5">
              <LinkRow label="Customer" value={customer?.company ?? "—"} onClick={() => navigate({ page: "customer", id: order.customerId })} />
              <LinkRow label="Quotation" value={order.quotationId ?? "Direct order"} onClick={order.quotationId ? () => navigate({ page: "quotation", id: order.quotationId }) : undefined} />
              <LinkRow label="Invoice" value={invoice?.id ?? "Not issued"} onClick={invoice ? () => navigate({ page: "invoice", id: invoice.id }) : undefined} />
              <LinkRow label="Audit" value="View trail" onClick={() => navigate({ page: "audit", id: order.id })} />
            </div>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader title="Audit excerpt" subtitle="Who changed this order, from what, to what." />
        <div className="divide-y divide-[#F1F4F8] px-4 pb-3">
          {trail.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div><span className="font-medium">{a.userName}</span> · {a.action}</div>
              <div className="text-slate-500">{a.previous} → {a.next}</div>
              <div className="text-xs text-slate-400">{formatDate(a.at)}</div>
            </div>
          ))}
          {trail.length === 0 && <p className="py-4 text-sm text-slate-500">No audit entries yet.</p>}
        </div>
      </Card>
    </div>
  );
}

export function InvoicesPage() {
  const { state, navigate } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const rows = state.invoices.filter((i) => {
    const display = invoiceDisplayStatus(i);
    const customer = state.customers.find((c) => c.id === i.customerId)?.company ?? "";
    return (status === "All" || display === status) && `${i.id} ${customer}`.toLowerCase().includes(q.toLowerCase());
  });
  return (
    <div>
      <PageHeader eyebrow="ERP" title="Invoices" subtitle="Receivables issued from approved orders, or opening balances already on the books." />
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search invoices" />
        <SelectInput className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["All", "Draft", "Issued", "Partially Paid", "Paid", "Overdue"].map((s) => <option key={s}>{s}</option>)}
        </SelectInput>
      </FilterBar>
      <Card>
        <DataTable
          columns={[
            { key: "id", header: "Invoice", render: (r: Invoice) => <Mono className="text-[#0B132B]">{r.id}</Mono> },
            { key: "customer", header: "Customer", render: (r: Invoice) => state.customers.find((c) => c.id === r.customerId)?.company },
            { key: "order", header: "Order", render: (r: Invoice) => r.orderId ?? "—" },
            { key: "amount", header: "Amount", align: "right" as const, sort: (r: Invoice) => r.amount, render: (r: Invoice) => formatINR(r.amount) },
            { key: "due", header: "Due date", sort: (r: Invoice) => r.due, render: (r: Invoice) => formatDate(r.due) },
            { key: "paid", header: "Paid", align: "right" as const, render: (r: Invoice) => formatINR(r.paid) },
            { key: "out", header: "Outstanding", align: "right" as const, render: (r: Invoice) => formatINR(r.outstanding) },
            { key: "status", header: "Status", render: (r: Invoice) => <StatusBadge status={invoiceDisplayStatus(r)} /> },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          onRow={(r) => navigate({ page: "invoice", id: r.id })}
          loading={state.ui.refreshing}
        />
      </Card>
    </div>
  );
}

export function InvoicePage() {
  const { state, navigate, back, setUser } = useApp();
  const invoice = state.invoices.find((i) => i.id === state.view.id);
  const [pay, setPay] = useState(false);
  if (!invoice) return <ErrorState title="Invoice not found" body="This invoice is not in the workspace." onBack={back} />;
  const customer = state.customers.find((c) => c.id === invoice.customerId);
  const display = invoiceDisplayStatus(invoice);
  const finance = state.userId === "USR-04" || state.users.find((u) => u.id === state.userId)?.role === "Admin" || state.users.find((u) => u.id === state.userId)?.role === "Finance";
  return (
    <div>
      <BackLink label="Invoices" onClick={() => navigate({ page: "invoices" })} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-[22px] font-semibold">{invoice.id}</h1>
          <p className="text-sm text-slate-500">{customer?.company}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}><Icon name="printer" className="h-3.5 w-3.5" />Print</Button>
          {invoice.outstanding > 0 && <Button variant="blue" onClick={() => setPay(true)}>Record payment</Button>}
        </div>
      </div>
      {!finance && invoice.outstanding > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 no-print">
          Recording a receipt requires the Finance role. You are signed in as {userName(state, state.userId)}.
          <Button className="ml-3" size="sm" variant="secondary" onClick={() => setUser("USR-04")}>Switch to Meera Shah</Button>
        </div>
      )}
      <article className="print-sheet relative overflow-hidden rounded-xl border border-[#E6EAF1] bg-white">
        <div className="h-1.5 bg-[#0B132B]" />
        {display === "Paid" && <div className="pointer-events-none absolute top-24 right-10 rotate-[-8deg] rounded-md border-2 border-emerald-600/30 px-3 py-1 text-sm font-semibold tracking-[0.2em] text-emerald-600/50">PAID</div>}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.16em]">AIR DIVE</div>
              <div className="text-sm text-slate-500">{COMPANY.legal}</div>
              <div className="mt-1 text-xs text-slate-400">{COMPANY.address}<br />GSTIN {COMPANY.gstin}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Tax invoice</div>
              <div className="text-lg font-semibold">{invoice.id}</div>
              <div className="mt-1"><StatusBadge status={display} /></div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 border-y border-[#E6EAF1] py-4 text-sm sm:grid-cols-3">
            <div><div className="text-xs text-slate-400">Bill to</div><div className="font-medium">{customer?.company}</div><div className="text-slate-500">{customer?.contact}</div><div className="text-slate-500">{customer?.gstin}</div></div>
            <div><div className="text-xs text-slate-400">Issued</div><div>{formatDate(invoice.issuedAt)}</div><div className="mt-2 text-xs text-slate-400">Due</div><div>{formatDate(invoice.due)}</div></div>
            <div><div className="text-xs text-slate-400">Order</div><div>{invoice.orderId ?? "Opening balance"}</div></div>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400"><th className="py-2">Description</th><th>Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.sku + line.name} className="border-t border-[#F1F4F8]"><td className="py-2">{line.name}<div className="text-xs text-slate-400">{line.sku}</div></td><td>{line.qty}</td><td className="text-right tabular-nums">{formatINR(line.unitPrice)}</td><td className="text-right tabular-nums">{formatINR(line.qty * line.unitPrice)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <Line k="Amount" v={formatINR(invoice.amount)} />
            <Line k="Paid" v={formatINR(invoice.paid)} />
            <Line k="Outstanding" v={formatINR(invoice.outstanding)} strong />
          </div>
          <div className="mt-6 rounded-lg bg-[#F8FAFC] p-3 text-xs text-slate-500">
            Sample settlement account · {COMPANY.bank} · {COMPANY.account} · {COMPANY.ifsc}. Not a live payment instruction.
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Prepared in NEXORA</p>
        </div>
      </article>
      <Modal open={pay} title="Record payment" onClose={() => setPay(false)}><PaymentForm invoiceId={invoice.id} onDone={() => setPay(false)} /></Modal>
    </div>
  );
}

export function PaymentsPage() {
  const { state, navigate } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <PageHeader eyebrow="ERP" title="Payments" subtitle="Cash receipts applied to invoices. Posting is a finance control." actions={<Button onClick={() => setOpen(true)}>Record payment</Button>} />
      <Card>
        <DataTable
          columns={[
            { key: "id", header: "Payment ID", render: (r) => <Mono className="text-[#0B132B]">{r.id}</Mono> },
            { key: "inv", header: "Invoice", render: (r) => r.invoiceId },
            { key: "customer", header: "Customer", render: (r) => state.customers.find((c) => c.id === r.customerId)?.company },
            { key: "amount", header: "Amount", align: "right" as const, sort: (r) => r.amount, render: (r) => formatINR(r.amount) },
            { key: "method", header: "Method", render: (r) => r.method },
            { key: "date", header: "Date", sort: (r) => r.date, render: (r) => formatDate(r.date) },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={state.payments}
          rowKey={(r) => r.id}
          onRow={(r) => navigate({ page: "invoice", id: r.invoiceId })}
          loading={state.ui.refreshing}
        />
      </Card>
      <Modal open={open} title="Record payment" onClose={() => setOpen(false)}><PaymentForm onDone={() => setOpen(false)} /></Modal>
    </div>
  );
}

export function AccountsPage() {
  const { state } = useApp();
  const debits = state.ledger.reduce((s, l) => s + l.debit, 0);
  const credits = state.ledger.reduce((s, l) => s + l.credit, 0);
  const ar = arBalance(state);
  const asc = [...state.ledger].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  let running = 0;
  const withBal = asc.map((line) => {
    if (line.account === "Accounts Receivable") running += line.debit - line.credit;
    return { ...line, balance: running };
  });
  const rows = [...withBal].reverse();
  return (
    <div>
      <PageHeader eyebrow="ERP" title="Accounts" subtitle="A working ledger, not a full accounting suite. Receivables stay tied to open invoices." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Kpi label="Total debits" value={formatINR(debits, true)} hint="All journal lines" icon="book" />
        <Kpi label="Total credits" value={formatINR(credits, true)} hint="Should match debits" icon="scale" />
        <Kpi label="Receivables" value={formatINR(ar, true)} hint="Accounts receivable balance" icon="card" />
      </div>
      <Card>
        <DataTable
          pageSize={12}
          columns={[
            { key: "date", header: "Date", render: (r) => formatDate(r.date) },
            { key: "ref", header: "Reference", render: (r) => <Mono className="text-[#0B132B]">{r.reference}</Mono> },
            { key: "acct", header: "Account", render: (r) => r.account },
            { key: "desc", header: "Description", render: (r) => r.description },
            { key: "dr", header: "Debit", align: "right" as const, render: (r) => r.debit ? formatINR(r.debit) : "—" },
            { key: "cr", header: "Credit", align: "right" as const, render: (r) => r.credit ? formatINR(r.credit) : "—" },
            { key: "bal", header: "Balance", align: "right" as const, render: (r) => r.account === "Accounts Receivable" ? formatINR(r.balance) : "—" },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          loading={state.ui.refreshing}
        />
      </Card>
    </div>
  );
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? "border-t border-[#E6EAF1] pt-2 font-semibold" : "text-slate-600"}`}><span>{k}</span><span className="tabular-nums">{v}</span></div>;
}
function LinkRow({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <button className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left hover:bg-slate-50" onClick={onClick} disabled={!onClick}>
      <span className="text-slate-500">{label}</span>
      <span className={onClick ? "font-medium text-[#1D6FE0]" : "font-medium"}>{value}</span>
    </button>
  );
}
