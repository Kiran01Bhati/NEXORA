import { useMemo, useState } from "react";
import { userName } from "@/lib/domain";
import { formatDate, formatINR, fromNow } from "@/lib/format";
import { useApp } from "@/store/store";
import { HBars, RiskMatrix, StackedRisk } from "@/components/charts";
import { Button, Card, CardHeader, DataTable, FilterBar, Kpi, PageHeader, SearchBox, SelectInput, StatusBadge } from "@/components/ui";
import type { Alert, Risk } from "@/types";

export function RiskDashboardPage() {
  const { state, navigate, reevaluate, user } = useApp();
  const open = state.risks.filter((r) => r.status === "Open" || r.status === "Monitoring");
  const count = (level: Risk["level"]) => open.filter((r) => r.level === level).length;
  const cells = useMemo(() => {
    const map = new Map<string, { l: number; i: number; count: number; ids: string[] }>();
    state.risks.forEach((r) => {
      const key = `${r.likelihood}x${r.impact}`;
      const cell = map.get(key) ?? { l: r.likelihood, i: r.impact, count: 0, ids: [] };
      cell.count += 1;
      cell.ids.push(r.id);
      map.set(key, cell);
    });
    return [...map.values()];
  }, [state.risks]);
  const canPolicy = user.role === "Admin" || user.role === "Compliance Officer" || user.role === "Sales Manager";
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Risk management" title="Risk overview" subtitle="Likelihood and impact sit next to the transactions that created them." actions={canPolicy ? <Button variant="secondary" onClick={reevaluate}>Re-evaluate open orders</Button> : undefined} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Critical risks" value={count("Critical")} hint="Score 17–25" icon="alert" />
        <Kpi label="High risks" value={count("High")} hint="Score 10–16" icon="flag" />
        <Kpi label="Medium risks" value={count("Medium")} hint="Score 5–9" icon="warning" />
        <Kpi label="Open alerts" value={state.alerts.filter((a) => a.status === "Open").length} hint="Operational signals" icon="bell" />
        <Kpi label="Pending approvals" value={state.orders.filter((o) => o.approvalStatus === "Pending").length} hint="Waiting on an independent approver" icon="check" />
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Risk matrix" subtitle="5 × 5 likelihood × impact. Select a cell to open the register." />
          <div className="px-4 pb-4">
            <RiskMatrix cells={cells} onSelect={(l, i) => navigate({ page: "register", id: `${l}x${i}` })} />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Distribution" subtitle="Open and monitoring items." />
          <div className="px-4 pb-4">
            <StackedRisk critical={count("Critical")} high={count("High")} medium={count("Medium")} low={count("Low")} />
            <div className="mt-4">
              <HBars items={[
                { label: "Credit", value: state.risks.filter((r) => r.category === "Credit Risk").length, color: "#DC2626" },
                { label: "High value", value: state.risks.filter((r) => r.category === "High-Value Transaction").length, color: "#EA580C" },
                { label: "Discount", value: state.risks.filter((r) => r.category === "Discount Risk").length, color: "#D97706" },
                { label: "Inventory", value: state.risks.filter((r) => r.category === "Inventory Risk").length, color: "#3A86FF" },
                { label: "Payment", value: state.risks.filter((r) => r.category === "Payment Risk").length, color: "#0F766E" },
              ]} />
            </div>
          </div>
        </Card>
      </div>
      <Card className="p-4">
        <div className="text-sm font-semibold">Active policy</div>
        <p className="mt-1 text-sm text-slate-500">High-value above {formatINR(state.policy.highValue)} · discount above {state.policy.discountPct}% · credit warning at {state.policy.creditWarnPct}% utilization. Creator and approver must be different people.</p>
      </Card>
    </div>
  );
}

export function RegisterPage() {
  const { state, navigate } = useApp();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const focus = state.view.id;
  const rows = state.risks.filter((r) => {
    const cell = focus?.includes("x") ? `${r.likelihood}x${r.impact}` === focus : true;
    const blob = `${r.id} ${r.category} ${r.transaction} ${r.detail}`.toLowerCase();
    return cell && (category === "All" || r.category === category) && (level === "All" || r.level === level) && blob.includes(q.toLowerCase());
  });
  const categories = ["All", ...Array.from(new Set(state.risks.map((r) => r.category)))];
  return (
    <div>
      <PageHeader eyebrow="Risk management" title="Risk register" subtitle="One row per rule. Treatment and owner stay visible with the score." />
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search risks" />
        <SelectInput className="w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </SelectInput>
        <SelectInput className="w-36" value={level} onChange={(e) => setLevel(e.target.value)}>
          {["All", "Low", "Medium", "High", "Critical"].map((s) => <option key={s}>{s}</option>)}
        </SelectInput>
      </FilterBar>
      {focus?.includes("x") && <p className="mb-2 text-xs text-slate-500">Filtered to matrix cell {focus}. <button className="text-[#1D6FE0]" onClick={() => navigate({ page: "register" })}>Clear</button></p>}
      <Card>
        <DataTable
          columns={[
            { key: "id", header: "Risk ID", render: (r: Risk) => r.id },
            { key: "cat", header: "Category", render: (r: Risk) => r.category },
            { key: "tx", header: "Transaction", render: (r: Risk) => r.transaction },
            { key: "customer", header: "Customer", render: (r: Risk) => state.customers.find((c) => c.id === r.customerId)?.company ?? "—" },
            { key: "l", header: "Likelihood", align: "right" as const, render: (r: Risk) => r.likelihood },
            { key: "i", header: "Impact", align: "right" as const, render: (r: Risk) => r.impact },
            { key: "score", header: "Score", align: "right" as const, sort: (r: Risk) => r.score, render: (r: Risk) => r.score },
            { key: "owner", header: "Owner", render: (r: Risk) => userName(state, r.ownerId) },
            { key: "status", header: "Status", render: (r: Risk) => <StatusBadge status={r.status} /> },
            { key: "treat", header: "Treatment", render: (r: Risk) => <span className="text-slate-600">{r.treatment}</span> },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          onRow={(r) => navigate(r.transaction.startsWith("SO-") ? { page: "case", id: r.transaction } : { page: "alerts" })}
          loading={state.ui.refreshing}
        />
      </Card>
    </div>
  );
}

export function AlertsPage() {
  const { state, navigate, acknowledgeAlert } = useApp();
  const [status, setStatus] = useState("Open");
  const rows = state.alerts.filter((a) => status === "All" || a.status === status);
  return (
    <div>
      <PageHeader eyebrow="Risk management" title="Alerts" subtitle="Signals that need a person, not just a score." />
      <FilterBar>
        <SelectInput className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["Open", "Acknowledged", "Resolved", "All"].map((s) => <option key={s}>{s}</option>)}
        </SelectInput>
      </FilterBar>
      <Card>
        <DataTable
          columns={[
            { key: "sev", header: "Severity", render: (r: Alert) => <StatusBadge status={r.severity} /> },
            { key: "title", header: "Alert", render: (r: Alert) => <div><div className="font-medium">{r.title}</div><div className="text-xs text-slate-500">{r.body}</div></div> },
            { key: "when", header: "When", render: (r: Alert) => fromNow(r.at) },
            { key: "status", header: "Status", render: (r: Alert) => <StatusBadge status={r.status} /> },
            { key: "act", header: "", render: (r: Alert) => r.status === "Open" ? <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); acknowledgeAlert(r.id); }}>Acknowledge</Button> : null },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          onRow={(r) => navigate({ page: r.page, id: r.entityId })}
          loading={state.ui.refreshing}
        />
      </Card>
    </div>
  );
}

export function ApprovalsPage() {
  const { state, navigate } = useApp();
  const rows = state.orders.filter((o) => o.approvalStatus === "Pending" || o.approvalStatus === "Changes Requested" || o.approvalStatus === "Rejected" || o.approvalStatus === "Approved").slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <div>
      <PageHeader eyebrow="Risk management" title="Approvals" subtitle="An inbox of commercial decisions. The creator of a high-risk order cannot clear it." />
      <Card>
        <DataTable
          columns={[
            { key: "order", header: "Order", render: (r) => r.id },
            { key: "customer", header: "Customer", render: (r) => state.customers.find((c) => c.id === r.customerId)?.company },
            { key: "amount", header: "Amount", align: "right" as const, sort: (r) => r.gross, render: (r) => formatINR(r.gross) },
            { key: "risk", header: "Risk level", render: (r) => <StatusBadge status={r.riskLevel} /> },
            { key: "rules", header: "Triggered rules", render: (r) => r.rules.map((x) => x.category.replace(" Transaction", "").replace(" Risk", "")).join(" + ") || "—" },
            { key: "by", header: "Requested by", render: (r) => userName(state, r.createdBy) },
            { key: "approver", header: "Approver", render: (r) => userName(state, r.approverId) },
            { key: "date", header: "Date", render: (r) => formatDate(r.createdAt) },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.approvalStatus} /> },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          onRow={(r) => navigate({ page: "case", id: r.id })}
          loading={state.ui.refreshing}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
