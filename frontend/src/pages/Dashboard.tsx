import { openPipelineValue, outstandingTotal, scenarioSteps, userName, weightedPipeline } from "@/lib/domain";
import { formatDate, formatINR, fromNow, greeting } from "@/lib/format";
import { useApp } from "@/store/store";
import { FinancialChart, type FinPoint } from "@/components/charts";
import { Icon } from "@/components/icons";
import { Button, Card, CardHeader, Kpi, Money, Mono, StatusBadge } from "@/components/ui";

export function Dashboard() {
  const api = useApp();
  const { state, user } = api;
  const pipeline = openPipelineValue(state);
  const outstanding = outstandingTotal(state);
  const pending = state.orders.filter((o) => o.approvalStatus === "Pending");
  const openRisks = state.risks.filter((r) => r.status === "Open" || r.status === "Monitoring");
  const alerts = state.alerts.filter((a) => a.status === "Open");
  const overdue = state.invoices.filter((i) => i.status === "Overdue" || (i.outstanding > 0 && new Date(i.due) < new Date())).length;
  const steps = scenarioSteps(state);
  const order = state.orders.find((o) => o.id === "SO-1042");

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString("en-IN", { month: "short" });
  });
  const base = [1820000, 2140000, 1960000, 2410000, 2280000, 2640000];
  const inv = [2100000, 1980000, 2240000, 2360000, 2180000, 2510000];
  const pay = [1640000, 1870000, 2010000, 1900000, 2420000, 1890000];
  const out = [460000, 570000, 800000, 1260000, 1020000, outstanding];
  const series: FinPoint[] = months.map((month, i) => ({ month, revenue: base[i], invoices: inv[i], payments: pay[i], outstanding: out[i] }));

  const funnel = [
    { label: "Lead", count: state.leads.filter((l) => l.status !== "Lost" && l.status !== "Converted").length, value: state.leads.filter((l) => l.status !== "Lost" && l.status !== "Converted").reduce((s, l) => s + l.value, 0) },
    { label: "Opportunity", count: state.opportunities.filter((o) => o.stage !== "Won" && o.stage !== "Lost").length, value: pipeline },
    { label: "Quotation", count: state.quotations.filter((q) => ["Draft", "Sent", "Accepted"].includes(q.status)).length, value: state.quotations.filter((q) => ["Draft", "Sent", "Accepted"].includes(q.status)).reduce((s, q) => s + q.gross, 0) },
    { label: "Sales Order", count: state.orders.filter((o) => o.approvalStatus !== "Rejected").length, value: state.orders.filter((o) => o.approvalStatus !== "Rejected").reduce((s, o) => s + o.gross, 0) },
  ];
  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);
  const riskCounts = {
    Critical: openRisks.filter((r) => r.level === "Critical").length,
    High: openRisks.filter((r) => r.level === "High").length,
    Medium: openRisks.filter((r) => r.level === "Medium").length,
    Low: openRisks.filter((r) => r.level === "Low").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">{greeting(user.name)}</h1>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening across your business today.</p>
        </div>
        <div className="text-sm text-slate-500">{formatDate(new Date().toISOString())}</div>
      </div>

      {!state.ui.bannerDismissed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6EAF1] bg-white px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 h-8 w-1 rounded-full bg-[#00F5D4]" />
            <div>
              <div className="text-sm font-semibold">SO-1042 is staged for the control walkthrough</div>
              <p className="text-sm text-slate-500">ABC Hospitality · ₹7,00,000 · 25% discount · two risk rules · waiting on a manager who did not create the order.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => api.setUi({ bannerDismissed: true })}>Dismiss</Button>
            <Button size="sm" onClick={() => api.setUi({ scenarioOpen: true })}>Open scenario</Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi label="Total customers" value={state.customers.length} hint={`${state.customers.filter((c) => c.status === "Active").length} active`} icon="users" />
        <Kpi label="Open opportunities" value={state.opportunities.filter((o) => o.stage !== "Won" && o.stage !== "Lost").length} hint={`${formatINR(weightedPipeline(state), true)} weighted`} icon="briefcase" />
        <Kpi label="Pipeline value" value={formatINR(pipeline, true)} hint="Open deals, unweighted" icon="chart" />
        <Kpi label="Pending approvals" value={pending.length} hint={pending.length ? "Needs an independent approver" : "Queue clear"} icon="check" />
        <Kpi label="Outstanding payments" value={formatINR(outstanding, true)} hint={`${overdue} overdue`} icon="card" />
        <Kpi label="Active risk alerts" value={alerts.length} hint={`${riskCounts.Critical} critical in the register`} icon="alert" />
      </div>

      <Card>
        <CardHeader title="Connected transaction · SO-1042" subtitle="Customer to cash, with risk and audit on the same path." action={<Button size="sm" variant="secondary" onClick={() => api.navigate({ page: "case", id: "SO-1042" })}>Open case</Button>} />
        <div className="px-4 pb-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {steps.slice(0, 7).map((step) => (
              <button key={step.n} onClick={() => api.navigate({ page: step.page, id: step.id })} className="rounded-lg border border-[#E6EAF1] px-3 py-2.5 text-left hover:border-slate-300">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium tracking-wide text-slate-400">{step.n}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${step.done ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
                <div className="mt-1 text-[13px] font-medium leading-tight">{step.title}</div>
                <div className="mt-1 truncate text-[11px] text-slate-500">{step.detail}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Connect customers, sales, finance, inventory and risk in one platform. {steps.filter((s) => s.done).length} of {steps.length} scenario steps complete.</p>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Sales pipeline" subtitle="Lead → Opportunity → Quotation → Sales Order" />
          <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
            {funnel.map((stage, i) => (
              <div key={stage.label} className="relative rounded-xl border border-[#E6EAF1] bg-[#F8FAFC] p-3">
                {i < funnel.length - 1 && <Icon name="chevron" className="absolute top-3 -right-2 hidden h-3 w-3 rotate-[-90deg] text-slate-300 lg:block" />}
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{stage.label}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{stage.count}</div>
                <div className="text-xs text-slate-500"><Money value={stage.value} compact /></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#3A86FF]" style={{ width: `${Math.max(8, (stage.value / maxFunnel) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Financial overview" subtitle="Recognized revenue, invoices, payments and live outstanding." />
          <div className="px-3 pb-4">
            <FinancialChart data={series} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Risk overview" action={<button className="text-xs font-medium text-[#1D6FE0]" onClick={() => api.navigate({ page: "risk" })}>Dashboard</button>} />
          <div className="space-y-3 px-4 pb-4">
            {(["Critical", "High", "Medium", "Low"] as const).map((level) => (
              <div key={level} className="flex items-center gap-3">
                <div className="w-16 text-xs text-slate-500">{level}</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${(riskCounts[level] / Math.max(1, openRisks.length)) * 100}%`, background: level === "Critical" ? "#DC2626" : level === "High" ? "#EA580C" : level === "Medium" ? "#D97706" : "#059669" }} />
                </div>
                <div className="w-6 text-right text-sm font-semibold tabular-nums">{riskCounts[level]}</div>
              </div>
            ))}
            <p className="text-xs text-slate-500">{order ? `${order.id} is ${order.riskLevel.toLowerCase()} with ${order.rules.length} rules.` : "No staged order."}</p>
          </div>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader title="Recent activity" subtitle="Who did what, and when." action={<button className="text-xs font-medium text-[#1D6FE0]" onClick={() => api.navigate({ page: "audit" })}>Audit log</button>} />
          <ol className="px-4 pb-4">
            {state.audit.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex gap-3 border-b border-[#F1F4F8] py-2.5 last:border-0">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#3A86FF]" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm"><span className="font-medium">{entry.userName}</span> {entry.action.toLowerCase()} <span className="font-medium">{entry.entityId}</span></div>
                  <div className="text-xs text-slate-500">{entry.previous} → {entry.next}</div>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{fromNow(entry.at)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card>
        <CardHeader title="Pending approvals" subtitle="High-risk orders cannot be cleared by the person who created them." action={<Button size="sm" variant="secondary" onClick={() => api.navigate({ page: "approvals" })}>Approval center</Button>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="border-y border-[#E6EAF1] bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Order", "Customer", "Amount", "Risk", "Requested by", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pending.map((row) => {
                const customer = state.customers.find((c) => c.id === row.customerId);
                return (
                  <tr key={row.id} className="border-b border-[#F1F4F8] last:border-0">
                    <td className="px-4 py-3"><Mono className="text-[#0B132B]">{row.id}</Mono></td>
                    <td className="px-4 py-3 font-medium">{customer?.company}</td>
                    <td className="px-4 py-3 tabular-nums">{formatINR(row.gross)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.riskLevel} /></td>
                    <td className="px-4 py-3">{userName(state, row.createdBy)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.approvalStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => api.navigate({ page: "case", id: row.id })}>Review</Button>
                    </td>
                  </tr>
                );
              })}
              {pending.length === 0 && <tr><td className="px-4 py-8 text-sm text-slate-500" colSpan={7}>No orders are waiting for approval.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
