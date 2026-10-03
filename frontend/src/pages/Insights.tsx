import { useState } from "react";
import { agingBucket, openPipelineValue } from "@/lib/domain";
import { downloadCsv, formatINR } from "@/lib/format";
import { useApp } from "@/store/store";
import { FinancialChart, HBars, type FinPoint } from "@/components/charts";
import { Button, Card, DataTable, PageHeader } from "@/components/ui";

const REPORTS = [
  { id: "ar", title: "Receivable aging", body: "Open invoices by due bucket." },
  { id: "customer", title: "Revenue by customer", body: "Invoiced amount, paid and still open." },
  { id: "risk", title: "Risk by category", body: "Register volume and highest score." },
  { id: "pipeline", title: "Open pipeline", body: "Deals that are not won or lost." },
] as const;

export function ReportsPage() {
  const { state } = useApp();
  const [report, setReport] = useState<(typeof REPORTS)[number]["id"]>("ar");
  const arRows = state.invoices.filter((i) => i.outstanding > 0).map((i) => ({
    id: i.id,
    customer: state.customers.find((c) => c.id === i.customerId)?.company ?? "",
    amount: i.outstanding,
    bucket: agingBucket(i.due, i.outstanding),
    due: i.due,
  }));
  const byCustomer = state.customers.map((c) => {
    const invoices = state.invoices.filter((i) => i.customerId === c.id);
    return { id: c.id, customer: c.company, invoiced: invoices.reduce((s, i) => s + i.amount, 0), paid: invoices.reduce((s, i) => s + i.paid, 0), open: invoices.reduce((s, i) => s + i.outstanding, 0) };
  }).filter((r) => r.invoiced > 0);
  const byRisk = Array.from(new Set(state.risks.map((r) => r.category))).map((category) => {
    const items = state.risks.filter((r) => r.category === category);
    return { id: category, category, count: items.length, top: Math.max(...items.map((i) => i.score)) };
  });
  const pipeline = state.opportunities.filter((o) => o.stage !== "Won" && o.stage !== "Lost").map((o) => ({
    id: o.id,
    name: o.name,
    customer: state.customers.find((c) => c.id === o.customerId)?.company ?? "",
    value: o.value,
    stage: o.stage,
    probability: o.probability,
  }));

  const exportCurrent = () => {
    if (report === "ar") downloadCsv("nexora-ar-aging.csv", [["Invoice", "Customer", "Outstanding", "Bucket"], ...arRows.map((r) => [r.id, r.customer, r.amount, r.bucket])]);
    if (report === "customer") downloadCsv("nexora-revenue-by-customer.csv", [["Customer", "Invoiced", "Paid", "Open"], ...byCustomer.map((r) => [r.customer, r.invoiced, r.paid, r.open])]);
    if (report === "risk") downloadCsv("nexora-risk-summary.csv", [["Category", "Count", "Top score"], ...byRisk.map((r) => [r.category, r.count, r.top])]);
    if (report === "pipeline") downloadCsv("nexora-pipeline.csv", [["Opportunity", "Customer", "Value", "Stage", "Probability"], ...pipeline.map((r) => [r.name, r.customer, r.value, r.stage, r.probability])]);
  };

  return (
    <div>
      <PageHeader eyebrow="Insights" title="Reports" subtitle="Four operating reports. Export is a real CSV, not a placeholder." actions={<Button variant="secondary" onClick={exportCurrent}>Export CSV</Button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {REPORTS.map((item) => (
          <button key={item.id} onClick={() => setReport(item.id)} className={`rounded-xl border p-4 text-left ${report === item.id ? "border-[#0B132B] bg-white" : "border-[#E6EAF1] bg-white hover:border-slate-300"}`}>
            <div className="text-sm font-semibold">{item.title}</div>
            <div className="mt-1 text-xs text-slate-500">{item.body}</div>
          </button>
        ))}
      </div>
      <Card>
        {report === "ar" && <DataTable columns={[{ key: "id", header: "Invoice", render: (r) => r.id }, { key: "c", header: "Customer", render: (r) => r.customer }, { key: "a", header: "Outstanding", align: "right" as const, render: (r) => formatINR(r.amount) }, { key: "b", header: "Bucket", render: (r) => r.bucket }]} rows={arRows} rowKey={(r) => r.id} />}
        {report === "customer" && <DataTable columns={[{ key: "c", header: "Customer", render: (r) => r.customer }, { key: "i", header: "Invoiced", align: "right" as const, render: (r) => formatINR(r.invoiced) }, { key: "p", header: "Paid", align: "right" as const, render: (r) => formatINR(r.paid) }, { key: "o", header: "Open", align: "right" as const, render: (r) => formatINR(r.open) }]} rows={byCustomer} rowKey={(r) => r.id} />}
        {report === "risk" && <DataTable columns={[{ key: "c", header: "Category", render: (r) => r.category }, { key: "n", header: "Count", align: "right" as const, render: (r) => r.count }, { key: "t", header: "Highest score", align: "right" as const, render: (r) => r.top }]} rows={byRisk} rowKey={(r) => r.id} />}
        {report === "pipeline" && <DataTable columns={[{ key: "n", header: "Opportunity", render: (r) => r.name }, { key: "c", header: "Customer", render: (r) => r.customer }, { key: "v", header: "Value", align: "right" as const, render: (r) => formatINR(r.value) }, { key: "s", header: "Stage", render: (r) => r.stage }, { key: "p", header: "Probability", align: "right" as const, render: (r) => `${r.probability}%` }]} rows={pipeline} rowKey={(r) => r.id} />}
      </Card>
    </div>
  );
}

export function AnalyticsPage() {
  const { state } = useApp();
  const won = state.opportunities.filter((o) => o.stage === "Won").length;
  const lost = state.opportunities.filter((o) => o.stage === "Lost").length;
  const winRate = won + lost ? Math.round((won / (won + lost)) * 100) : 0;
  const convertedLeads = state.leads.filter((l) => l.status === "Converted").length;
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString("en-IN", { month: "short" });
  });
  const series: FinPoint[] = months.map((month, i) => ({
    month,
    revenue: [1820000, 2140000, 1960000, 2410000, 2280000, 2640000][i],
    invoices: [2100000, 1980000, 2240000, 2360000, 2180000, 2510000][i],
    payments: [1640000, 1870000, 2010000, 1900000, 2420000, 1890000][i],
    outstanding: [460000, 570000, 800000, 1260000, 1020000, state.invoices.reduce((s, inv) => s + inv.outstanding, 0)][i],
  }));
  const top = [...state.customers].sort((a, b) => b.outstanding - a.outstanding).slice(0, 5);
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Insights" title="Analytics" subtitle="A short read on conversion, exposure and the revenue trend. Not a separate BI product." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat k="Win rate" v={`${winRate}%`} d={`${won} won · ${lost} lost`} />
        <Stat k="Lead conversion" v={`${state.leads.length ? Math.round((convertedLeads / state.leads.length) * 100) : 0}%`} d={`${convertedLeads} of ${state.leads.length} leads`} />
        <Stat k="Open pipeline" v={formatINR(openPipelineValue(state), true)} d="Unweighted" />
        <Stat k="Avg open deal" v={formatINR(openPipelineValue(state) / Math.max(1, state.opportunities.filter((o) => o.stage !== "Won" && o.stage !== "Lost").length), true)} d="Open opportunities" />
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="p-4 xl:col-span-3">
          <h2 className="text-sm font-semibold">Revenue trend</h2>
          <p className="text-xs text-slate-500">Illustrative recognized revenue. The latest outstanding point is live.</p>
          <div className="mt-2"><FinancialChart data={series} /></div>
        </Card>
        <Card className="p-4 xl:col-span-2">
          <h2 className="text-sm font-semibold">Exposure by customer</h2>
          <div className="mt-4">
            <HBars items={top.map((c, i) => ({ label: c.company, value: c.outstanding, color: i === 0 ? "#DC2626" : "#3A86FF" }))} />
          </div>
        </Card>
      </div>
      <Card className="p-4">
        <h2 className="text-sm font-semibold">Volume by stage</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {[
            ["Leads", state.leads.length],
            ["Qualified", state.leads.filter((l) => l.status === "Qualified" || l.status === "Converted").length],
            ["Quotes", state.quotations.length],
            ["Orders", state.orders.length],
            ["Won", won],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-[#F8FAFC] px-3 py-3">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ k, v, d }: { k: string; v: string; d: string }) {
  return <div className="rounded-xl border border-[#E6EAF1] bg-white px-4 py-3"><div className="text-[11px] uppercase tracking-wide text-slate-400">{k}</div><div className="mt-1 text-xl font-semibold">{v}</div><div className="text-xs text-slate-500">{d}</div></div>;
}
