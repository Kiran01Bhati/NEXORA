import { useMemo, useState } from "react";
import { relatedIds, userName } from "@/lib/domain";
import { COMPANY } from "@/lib/domain";
import { formatDate, formatINR, fromNow } from "@/lib/format";
import { useApp } from "@/store/store";
import { CustomerForm, InteractionForm, LeadForm, QuoteForm } from "@/components/forms";
import { Icon } from "@/components/icons";
import { BackLink, Button, Card, DataTable, Drawer, EmptyState, ErrorState, FilterBar, Modal, Mono, PageHeader, SearchBox, SelectInput, StatusBadge, Tabs, Timeline, type Column } from "@/components/ui";
import type { Lead, Opportunity, Stage } from "@/types";
import { STAGES } from "@/lib/domain";

export function CustomersPage() {
  const { state, navigate } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const rows = state.customers.filter((c) => {
    const blob = `${c.company} ${c.contact} ${c.email} ${c.city}`.toLowerCase();
    return (status === "All" || c.status === status) && blob.includes(q.toLowerCase());
  });
  const columns: Column<(typeof rows)[number]>[] = [
    { key: "customer", header: "Customer", sort: (r) => r.company, render: (r) => <div><div className="font-medium">{r.company}</div><div className="text-xs text-slate-500">{r.city} · {r.industry}</div></div> },
    { key: "contact", header: "Contact", render: (r) => <div><div>{r.contact}</div><div className="text-xs text-slate-500">{r.email}</div></div> },
    { key: "phone", header: "Phone", render: (r) => r.phone },
    { key: "credit", header: "Credit limit", align: "right", sort: (r) => r.creditLimit, render: (r) => formatINR(r.creditLimit) },
    { key: "out", header: "Outstanding", align: "right", sort: (r) => r.outstanding, render: (r) => <span className={r.outstanding > r.creditLimit ? "font-medium text-rose-700" : ""}>{formatINR(r.outstanding)}</span> },
    { key: "owner", header: "Owner", render: (r) => userName(state, r.ownerId) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "last", header: "Last activity", sort: (r) => r.lastActivity, render: (r) => fromNow(r.lastActivity) },
  ];
  return (
    <div>
      <PageHeader eyebrow="CRM" title="Customers" subtitle="Accounts Air Dive sells to, with credit exposure visible beside the relationship." actions={<Button onClick={() => setOpen(true)}><Icon name="plus" className="h-3.5 w-3.5" />Add customer</Button>} />
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search company, contact, city" />
        <SelectInput className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["All", "Active", "On Hold", "Prospect"].map((s) => <option key={s}>{s}</option>)}
        </SelectInput>
      </FilterBar>
      <Card><DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRow={(r) => navigate({ page: "customer", id: r.id })} loading={state.ui.refreshing} /></Card>
      <Modal open={open} title="Add customer" onClose={() => setOpen(false)} wide><CustomerForm onDone={() => setOpen(false)} /></Modal>
    </div>
  );
}

export function CustomerPage() {
  const { state, navigate, back } = useApp();
  const customer = state.customers.find((c) => c.id === state.view.id);
  const [tab, setTab] = useState("Overview");
  const [log, setLog] = useState(false);
  if (!customer) return <ErrorState title="Customer not found" body="That account is not in this workspace." onBack={back} />;
  const opps = state.opportunities.filter((o) => o.customerId === customer.id);
  const quotes = state.quotations.filter((q) => q.customerId === customer.id);
  const orders = state.orders.filter((o) => o.customerId === customer.id);
  const invoices = state.invoices.filter((i) => i.customerId === customer.id);
  const payments = state.payments.filter((p) => p.customerId === customer.id);
  const notes = state.interactions.filter((i) => i.customerId === customer.id);
  const ids = relatedIds(state, customer.id);
  const activity = state.audit.filter((a) => ids.has(a.entityId));
  const util = customer.creditLimit ? customer.outstanding / customer.creditLimit : 0;
  const risks = state.risks.filter((r) => r.customerId === customer.id && (r.status === "Open" || r.status === "Monitoring"));
  return (
    <div>
      <BackLink label="Customers" onClick={() => navigate({ page: "customers" })} />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-semibold tracking-tight">{customer.company}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{customer.contact} · {customer.industry} · {customer.city}</p>
        </div>
        <Button variant="secondary" onClick={() => setLog(true)}>Log interaction</Button>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Credit limit" value={formatINR(customer.creditLimit)} />
        <Stat label="Outstanding" value={formatINR(customer.outstanding)} />
        <Stat label="Utilization" value={`${Math.round(util * 100)}%`} />
        <Stat label="Owner" value={userName(state, customer.ownerId)} />
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${util > 1 ? "bg-rose-500" : util > 0.8 ? "bg-amber-500" : "bg-[#3A86FF]"}`} style={{ width: `${Math.min(100, util * 100)}%` }} />
      </div>
      <Card>
        <div className="px-2">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "Overview", label: "Overview" },
              { id: "Opportunities", label: "Opportunities", count: opps.length },
              { id: "Quotations", label: "Quotations", count: quotes.length },
              { id: "Orders", label: "Orders", count: orders.length },
              { id: "Invoices", label: "Invoices", count: invoices.length },
              { id: "Payments", label: "Payments", count: payments.length },
              { id: "Interactions", label: "Interactions", count: notes.length },
              { id: "Activity", label: "Activity", count: activity.length },
            ]}
          />
        </div>
        <div className="p-4">
          {tab === "Overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info k="Email" v={customer.email} />
                <Info k="Phone" v={customer.phone} />
                <Info k="GSTIN" v={customer.gstin} />
                <Info k="Customer since" v={formatDate(customer.since)} />
                <Info k="Last activity" v={fromNow(customer.lastActivity)} />
                <Info k="ID" v={customer.id} />
              </dl>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Open risks</div>
                {risks.length === 0 && <p className="mt-2 text-sm text-slate-500">No open risk on this account.</p>}
                <div className="mt-2 space-y-2">
                  {risks.map((r) => (
                    <button key={r.id} onClick={() => navigate({ page: r.transaction.startsWith("SO-") ? "case" : "register", id: r.transaction.startsWith("SO-") ? r.transaction : r.id })} className="flex w-full items-center justify-between rounded-lg border border-[#E6EAF1] px-3 py-2 text-left hover:bg-slate-50">
                      <span><span className="block text-sm font-medium">{r.category}</span><span className="text-xs text-slate-500">{r.transaction}</span></span>
                      <StatusBadge status={r.level} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === "Opportunities" && <Mini rows={opps.map((o) => [o.id, o.name, formatINR(o.value), o.stage])} onOpen={(id) => navigate({ page: "pipeline", id })} />}
          {tab === "Quotations" && <Mini rows={quotes.map((q) => [q.id, formatINR(q.gross), `${q.discountPct}%`, q.status])} onOpen={(id) => navigate({ page: "quotation", id })} />}
          {tab === "Orders" && <Mini rows={orders.map((o) => [o.id, formatINR(o.gross), o.riskLevel, o.approvalStatus])} onOpen={(id) => navigate({ page: "order", id })} />}
          {tab === "Invoices" && <Mini rows={invoices.map((i) => [i.id, formatINR(i.amount), formatINR(i.outstanding), i.status])} onOpen={(id) => navigate({ page: "invoice", id })} />}
          {tab === "Payments" && (payments.length ? <Mini rows={payments.map((p) => [p.id, p.invoiceId, formatINR(p.amount), p.method])} /> : <EmptyState title="No payments" body="Receipts posted against this customer will appear here." />)}
          {tab === "Interactions" && (notes.length ? <Timeline items={notes.map((n) => ({ title: `${n.type} · ${n.subject}`, meta: `${userName(state, n.ownerId)} · ${fromNow(n.at)}`, body: n.body }))} /> : <EmptyState title="No interactions" body="Calls, emails and meetings with this account will show as a timeline." action={<Button size="sm" onClick={() => setLog(true)}>Log interaction</Button>} />)}
          {tab === "Activity" && <Timeline items={activity.slice(0, 12).map((a) => ({ title: a.action, meta: `${a.userName} · ${a.entityId} · ${fromNow(a.at)}`, body: `${a.previous} → ${a.next}`, tone: a.status === "Rejected" ? "danger" : a.status === "Warning" ? "warning" : "info" }))} />}
        </div>
      </Card>
      <Modal open={log} title="Log interaction" onClose={() => setLog(false)}><InteractionForm customerId={customer.id} onDone={() => setLog(false)} /></Modal>
    </div>
  );
}

export function LeadsPage() {
  const { state, convertLead } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const rows = state.leads.filter((l) => (status === "All" || l.status === status) && `${l.name} ${l.company} ${l.source}`.toLowerCase().includes(q.toLowerCase()));
  const columns: Column<Lead>[] = [
    { key: "lead", header: "Lead", sort: (r) => r.name, render: (r) => <div><div className="font-medium">{r.name}</div><Mono>{r.id}</Mono></div> },
    { key: "company", header: "Company", sort: (r) => r.company, render: (r) => r.company },
    { key: "source", header: "Source", render: (r) => r.source },
    { key: "owner", header: "Owner", render: (r) => userName(state, r.ownerId) },
    { key: "value", header: "Value", align: "right", sort: (r) => r.value, render: (r) => formatINR(r.value) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "last", header: "Last contact", render: (r) => r.lastContact ? fromNow(r.lastContact) : "—" },
    { key: "created", header: "Created", sort: (r) => r.createdAt, render: (r) => formatDate(r.createdAt) },
    { key: "act", header: "", render: (r) => r.status !== "Converted" && r.status !== "Lost" ? <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); convertLead(r.id); }}>Convert</Button> : null },
  ];
  return (
    <div>
      <PageHeader eyebrow="CRM" title="Leads" subtitle="Qualify interest before it becomes an opportunity." actions={<Button onClick={() => setOpen(true)}>Add lead</Button>} />
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search leads" />
        <SelectInput className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["All", "New", "Contacted", "Qualified", "Converted", "Lost"].map((s) => <option key={s}>{s}</option>)}
        </SelectInput>
      </FilterBar>
      <Card><DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={state.ui.refreshing} /></Card>
      <Modal open={open} title="Add lead" onClose={() => setOpen(false)}><LeadForm onDone={() => setOpen(false)} /></Modal>
    </div>
  );
}

export function OpportunitiesPage() {
  const { state, navigate } = useApp();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("All");
  const rows = state.opportunities.filter((o) => (stage === "All" || o.stage === stage) && o.name.toLowerCase().includes(q.toLowerCase()));
  const columns: Column<Opportunity>[] = [
    { key: "name", header: "Opportunity", sort: (r) => r.name, render: (r) => <div><div className="font-medium">{r.name}</div><Mono>{r.id}</Mono></div> },
    { key: "customer", header: "Customer", render: (r) => state.customers.find((c) => c.id === r.customerId)?.company ?? "—" },
    { key: "value", header: "Value", align: "right", sort: (r) => r.value, render: (r) => formatINR(r.value) },
    { key: "prob", header: "Probability", align: "right", sort: (r) => r.probability, render: (r) => `${r.probability}%` },
    { key: "stage", header: "Stage", render: (r) => <StatusBadge status={r.stage} /> },
    { key: "owner", header: "Owner", render: (r) => userName(state, r.ownerId) },
    { key: "close", header: "Expected close", sort: (r) => r.closeDate, render: (r) => formatDate(r.closeDate) },
  ];
  return (
    <div>
      <PageHeader eyebrow="CRM" title="Opportunities" subtitle="Weighted commercial pipeline before a quotation is issued." actions={<Button variant="secondary" onClick={() => navigate({ page: "pipeline" })}>Open board</Button>} />
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search opportunities" />
        <SelectInput className="w-44" value={stage} onChange={(e) => setStage(e.target.value)}>
          {["All", ...STAGES].map((s) => <option key={s}>{s}</option>)}
        </SelectInput>
      </FilterBar>
      <Card><DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRow={(r) => navigate({ page: "pipeline", id: r.id })} loading={state.ui.refreshing} /></Card>
    </div>
  );
}

export function PipelinePage() {
  const { state, moveOpportunity, navigate } = useApp();
  const [active, setActive] = useState<Opportunity | null>(state.opportunities.find((o) => o.id === state.view.id) ?? null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  return (
    <div>
      <PageHeader eyebrow="CRM" title="Sales pipeline" subtitle="Drag a card to change stage. Won and lost leave the open pipeline value." />
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const cards = state.opportunities.filter((o) => o.stage === stage);
          const value = cards.reduce((s, o) => s + o.value, 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setDragOver(stage); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveOpportunity(id, stage);
                setDragOver(null);
              }}
              className={`w-[230px] shrink-0 rounded-xl border bg-[#F8FAFC] p-2 ${dragOver === stage ? "border-[#3A86FF]" : "border-[#E6EAF1]"}`}
            >
              <div className="flex items-center justify-between px-1.5 py-1">
                <span className="text-xs font-semibold">{stage}</span>
                <span className="text-[11px] text-slate-400">{cards.length} · {formatINR(value, true)}</span>
              </div>
              <div className="mt-1 space-y-2">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
                    onClick={() => setActive(card)}
                    className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm ${state.view.id === card.id ? "border-[#3A86FF]" : "border-[#E6EAF1]"}`}
                  >
                    <div className="text-[13px] font-medium leading-snug">{card.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{state.customers.find((c) => c.id === card.customerId)?.company}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold tabular-nums">{formatINR(card.value, true)}</span>
                      <span className="text-slate-400">{card.probability}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Drawer open={!!active} title={active?.name ?? "Opportunity"} onClose={() => setActive(null)}>
        {active && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-500">Customer</span><button className="font-medium text-[#1D6FE0]" onClick={() => navigate({ page: "customer", id: active.customerId })}>{state.customers.find((c) => c.id === active.customerId)?.company}</button></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Value</span><span className="font-semibold">{formatINR(active.value)}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Owner</span><span>{userName(state, active.ownerId)}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Expected close</span><span>{formatDate(active.closeDate)}</span></div>
            <label className="block text-xs font-medium text-slate-500">Stage
              <select className="mt-1 h-10 w-full rounded-lg border border-[#E6EAF1] px-3 text-sm" value={active.stage} onChange={(e) => { moveOpportunity(active.id, e.target.value as Stage); setActive({ ...active, stage: e.target.value as Stage }); }}>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <Button onClick={() => navigate({ page: "quotations" })} variant="secondary">View quotations</Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export function QuotationsPage() {
  const { state, navigate } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rows = state.quotations.filter((qt) => `${qt.id} ${state.customers.find((c) => c.id === qt.customerId)?.company ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader eyebrow="CRM" title="Quotations" subtitle="Commercial documents that can convert into a controlled sales order." actions={<Button onClick={() => setOpen(true)}>New quotation</Button>} />
      <FilterBar><SearchBox value={q} onChange={setQ} placeholder="Search quotations" /></FilterBar>
      <Card>
        <DataTable
          columns={[
            { key: "id", header: "Quote number", render: (r) => <Mono className="text-[#0B132B]">{r.id}</Mono> },
            { key: "customer", header: "Customer", render: (r) => state.customers.find((c) => c.id === r.customerId)?.company },
            { key: "opp", header: "Opportunity", render: (r) => r.opportunityId ?? "—" },
            { key: "amount", header: "Amount", align: "right" as const, sort: (r) => r.gross, render: (r) => formatINR(r.gross) },
            { key: "disc", header: "Discount", align: "right" as const, render: (r) => `${r.discountPct}%` },
            { key: "valid", header: "Valid until", render: (r) => formatDate(r.validUntil) },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "by", header: "Created by", render: (r) => userName(state, r.createdBy) },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          onRow={(r) => navigate({ page: "quotation", id: r.id })}
          loading={state.ui.refreshing}
        />
      </Card>
      <Modal open={open} title="New quotation" onClose={() => setOpen(false)} wide><QuoteForm onDone={() => setOpen(false)} /></Modal>
    </div>
  );
}

export function QuotationPage() {
  const { state, navigate, back, convertQuotation } = useApp();
  const quote = state.quotations.find((q) => q.id === state.view.id);
  if (!quote) return <ErrorState title="Quotation not found" body="This document is not in the workspace." onBack={back} />;
  const customer = state.customers.find((c) => c.id === quote.customerId);
  return (
    <div>
      <BackLink label="Quotations" onClick={() => navigate({ page: "quotations" })} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold">{quote.id}</h1>
          <p className="text-sm text-slate-500">{customer?.company} · {quote.status}</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => window.print()}><Icon name="printer" className="h-3.5 w-3.5" />Print</Button>
          {quote.status === "Converted" ? <Button onClick={() => navigate({ page: "order", id: quote.orderId })}>View sales order</Button> : <Button variant="blue" onClick={() => convertQuotation(quote.id)}>Convert to sales order</Button>}
        </div>
      </div>
      <article className="print-sheet relative overflow-hidden rounded-xl border border-[#E6EAF1] bg-white">
        <div className="h-1.5 bg-[#0B132B]" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.16em] text-[#0B132B]">AIR DIVE</div>
              <div className="text-sm text-slate-500">{COMPANY.legal}</div>
              <div className="mt-1 text-xs text-slate-400">{COMPANY.address}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Quotation</div>
              <div className="text-lg font-semibold">{quote.id}</div>
              <div className="mt-1"><StatusBadge status={quote.status} /></div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 border-y border-[#E6EAF1] py-4 sm:grid-cols-3 text-sm">
            <div><div className="text-xs text-slate-400">Bill to</div><div className="font-medium">{customer?.company}</div><div className="text-slate-500">{customer?.contact}</div><div className="text-slate-500">{customer?.city}</div></div>
            <div><div className="text-xs text-slate-400">Valid until</div><div>{formatDate(quote.validUntil)}</div></div>
            <div><div className="text-xs text-slate-400">Prepared by</div><div>{userName(state, quote.createdBy)}</div></div>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400"><th className="py-2">Product</th><th>Qty</th><th className="text-right">Unit price</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {quote.lines.map((line) => (
                <tr key={line.sku} className="border-t border-[#F1F4F8]"><td className="py-2">{line.name}<div className="text-xs text-slate-400">{line.sku}</div></td><td>{line.qty}</td><td className="text-right tabular-nums">{formatINR(line.unitPrice)}</td><td className="text-right tabular-nums">{formatINR(line.qty * line.unitPrice)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <Tot k="Subtotal" v={quote.gross} />
            <Tot k={`Discount ${quote.discountPct}%`} v={-quote.discountAmt} />
            <Tot k="Taxable value" v={quote.net} />
            <Tot k="GST 18%" v={quote.tax} />
            <div className="flex justify-between border-t border-[#E6EAF1] pt-2 font-semibold"><span>Total</span><span className="tabular-nums">{formatINR(quote.total)}</span></div>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-slate-500">{quote.terms}</p>
          <p className="mt-4 text-[11px] text-slate-400">Prepared in NEXORA · {COMPANY.short} workspace</p>
        </div>
      </article>
    </div>
  );
}

export function InteractionsPage() {
  const { state } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rows = state.interactions.filter((i) => `${i.subject} ${i.body}`.toLowerCase().includes(q.toLowerCase()));
  const grouped = useMemo(() => rows, [rows]);
  return (
    <div>
      <PageHeader eyebrow="CRM" title="Interactions" subtitle="Calls, meetings and notes that sit on the customer record." actions={<Button onClick={() => setOpen(true)}>Log interaction</Button>} />
      <FilterBar><SearchBox value={q} onChange={setQ} placeholder="Search interactions" /></FilterBar>
      <Card className="p-4">
        {grouped.length === 0 ? <EmptyState title="No interactions" body="Log a call or meeting to start the timeline." /> : <Timeline items={grouped.map((n) => ({ title: `${n.type} · ${n.subject}`, meta: `${state.customers.find((c) => c.id === n.customerId)?.company} · ${userName(state, n.ownerId)} · ${fromNow(n.at)}`, body: n.body }))} />}
      </Card>
      <Modal open={open} title="Log interaction" onClose={() => setOpen(false)}><InteractionForm onDone={() => setOpen(false)} /></Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#E6EAF1] bg-white px-4 py-3"><div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}
function Info({ k, v }: { k: string; v: string }) {
  return <div><div className="text-xs text-slate-400">{k}</div><div className="mt-0.5 font-medium">{v}</div></div>;
}
function Mini({ rows, onOpen }: { rows: string[][]; onOpen?: (id: string) => void }) {
  if (!rows.length) return <EmptyState title="No records" body="Nothing linked to this customer yet." />;
  return (
    <div className="divide-y divide-[#F1F4F8]">
      {rows.map((row) => (
        <button key={row[0]} className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:bg-slate-50" onClick={() => onOpen?.(row[0])}>
          <span className="font-medium">{row[0]}</span>
          <span className="truncate text-slate-500">{row.slice(1).join(" · ")}</span>
        </button>
      ))}
    </div>
  );
}
function Tot({ k, v }: { k: string; v: number }) {
  return <div className="flex justify-between text-slate-600"><span>{k}</span><span className="tabular-nums">{formatINR(v)}</span></div>;
}
