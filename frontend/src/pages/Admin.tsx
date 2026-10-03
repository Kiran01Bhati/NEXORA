import { useEffect, useState } from "react";
import { COMPANY, PERMISSION_ROWS, ROLES, can } from "@/lib/domain";
import { downloadCsv, formatDateTime, formatINR } from "@/lib/format";
import { useApp } from "@/store/store";
import { InviteForm } from "@/components/forms";
import { Icon } from "@/components/icons";
import { Avatar, Button, Card, DataTable, Field, FilterBar, Modal, PageHeader, SearchBox, StatusBadge, TextInput } from "@/components/ui";
import type { AuditEntry } from "@/types";

export function UsersPage() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Users" subtitle="People who operate Air Dive inside NEXORA. Invites are recorded locally in this demo." actions={<Button onClick={() => setOpen(true)}>Add user</Button>} />
      <Card>
        <DataTable
          columns={[
            { key: "name", header: "User", render: (r) => <div className="flex items-center gap-2"><Avatar name={r.name} id={r.id} size="sm" /><div><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.email}</div></div></div> },
            { key: "role", header: "Role", render: (r) => r.role },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={state.users}
          rowKey={(r) => r.id}
        />
      </Card>
      <Modal open={open} title="Add user" onClose={() => setOpen(false)}><InviteForm onDone={() => setOpen(false)} /></Modal>
    </div>
  );
}

export function RolesPage() {
  const { user } = useApp();
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Roles & permissions" subtitle="Permissions are enforced on approvals, receipts, stock and policy. Viewing stays open so the workflow can be demonstrated." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="border-b border-[#E6EAF1] bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Permission</th>
              {ROLES.map((role) => <th key={role} className={`px-3 py-2.5 font-medium ${role === user.role ? "text-[#1D6FE0]" : ""}`}>{role}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_ROWS.map((row) => (
              <tr key={row.perm} className="border-b border-[#F1F4F8]">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                {ROLES.map((role) => (
                  <td key={role} className="px-3 py-3">
                    {can(role, row.perm) ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Icon name="check" className="h-3 w-3" /></span> : <span className="text-slate-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-slate-500">Signed in as {user.name} · {user.role}. Segregation of duties still blocks a creator even when their role can approve.</p>
    </div>
  );
}

export function HierarchyPage() {
  const { state } = useApp();
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Approval hierarchy" subtitle="The path a sales order takes after the risk engine scores it." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5">
          <ol className="space-y-3">
            {[
              ["1", "Order created", "Sales executive or manager raises the order from a quotation or directly."],
              ["2", "Risk engine", `High value above ${formatINR(state.policy.highValue)}, discount above ${state.policy.discountPct}%, credit breach, overdue invoices, stock shortfall.`],
              ["3", "Route the decision", "Clear or low risk can be released. Medium and high go to the Sales Manager. Critical, or a manager-created order, goes to Compliance."],
              ["4", "Segregation of duties", "CTRL-SOD-01. The creator cannot approve their own order, even if they hold the approver role."],
              ["5", "Fulfillment", "Approval reserves stock and issues the invoice. Finance records the receipt. The ledger and audit update with the same identifiers."],
            ].map(([n, title, body]) => (
              <li key={n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B132B] text-xs font-semibold text-white">{n}</span>
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <p className="text-sm text-slate-500">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Thresholds in force</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">High value</dt><dd className="font-medium">{formatINR(state.policy.highValue)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="font-medium">{state.policy.discountPct}%</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Credit warning</dt><dd className="font-medium">{state.policy.creditWarnPct}%</dd></div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">SO-1042 breaches the first two rules and routes to Kiran Bhati. SO-1038 was created by Kiran, so it escalates to Priya Nair.</p>
        </Card>
      </div>
    </div>
  );
}

export function AuditPage() {
  const { state } = useApp();
  const [q, setQ] = useState(state.view.id ?? "");
  useEffect(() => {
    if (state.view.id) setQ(state.view.id);
  }, [state.view.id]);
  const rows = state.audit.filter((a) => `${a.userName} ${a.action} ${a.entity} ${a.entityId} ${a.previous} ${a.next}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Audit logs"
        subtitle="Who did what, when, and what the value was before and after."
        actions={<Button variant="secondary" onClick={() => downloadCsv("nexora-audit.csv", [["Timestamp", "User", "Action", "Entity", "Previous", "New", "Status"], ...rows.map((r) => [r.at, r.userName, r.action, r.entityId, r.previous, r.next, r.status])])}>Export</Button>}
      />
      <FilterBar><SearchBox value={q} onChange={setQ} placeholder="Filter by user, action or SO-1042" /></FilterBar>
      <Card>
        <DataTable
          pageSize={10}
          columns={[
            { key: "at", header: "Timestamp", sort: (r: AuditEntry) => r.at, render: (r: AuditEntry) => formatDateTime(r.at) },
            { key: "user", header: "User", render: (r: AuditEntry) => r.userName },
            { key: "action", header: "Action", render: (r: AuditEntry) => r.action },
            { key: "entity", header: "Entity", render: (r: AuditEntry) => <div><div className="font-medium">{r.entityId}</div><div className="text-xs text-slate-400">{r.entity}</div></div> },
            { key: "prev", header: "Previous value", render: (r: AuditEntry) => r.previous },
            { key: "next", header: "New value", render: (r: AuditEntry) => r.next },
            { key: "status", header: "Status", render: (r: AuditEntry) => <StatusBadge status={r.status} /> },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          loading={state.ui.refreshing}
        />
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const { state, user, setPolicy, resetDemo } = useApp();
  const [policy, setLocal] = useState(state.policy);
  const [confirm, setConfirm] = useState(false);
  const canEdit = user.role === "Admin" || user.role === "Compliance Officer";
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Administration" title="Settings" subtitle="Workspace, risk policy and the portfolio context behind NEXORA." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Signed in</h2>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={user.name} id={user.id} />
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-slate-500">{user.role}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Organization</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Workspace</dt><dd className="font-medium">{COMPANY.short}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Legal name</dt><dd className="text-right">{COMPANY.legal}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">GSTIN</dt><dd>{COMPANY.gstin}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Address</dt><dd className="text-right">{COMPANY.address}</dd></div>
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Risk policy</h2>
          <p className="mt-1 text-xs text-slate-500">Editable by Admin and Compliance. Re-evaluate open orders from the risk dashboard after saving.</p>
          <form
            className="mt-3 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setPolicy(policy);
            }}
          >
            <Field label="High-value threshold (₹)"><TextInput type="number" disabled={!canEdit} value={policy.highValue} onChange={(e) => setLocal({ ...policy, highValue: Number(e.target.value) })} /></Field>
            <Field label="Discount threshold (%)"><TextInput type="number" disabled={!canEdit} value={policy.discountPct} onChange={(e) => setLocal({ ...policy, discountPct: Number(e.target.value) })} /></Field>
            <Field label="Credit warning (%)"><TextInput type="number" disabled={!canEdit} value={policy.creditWarnPct} onChange={(e) => setLocal({ ...policy, creditWarnPct: Number(e.target.value) })} /></Field>
            <div className="flex justify-end"><Button type="submit" disabled={!canEdit}>Save policy</Button></div>
          </form>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">About NEXORA</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            NEXORA is a unified business operations platform. It was designed around the operating needs of Air Dive, a growing technology company selling environmental intelligence systems. The product connects CRM, ERP and enterprise risk so a single order can be seen from customer through cash, with an independent approval and an audit trail.
          </p>
          <p className="mt-3 text-sm text-slate-500">This workspace is a portfolio build. Bank details on invoices are sample data.</p>
          <Button className="mt-4" variant="danger" onClick={() => setConfirm(true)}>Reset demo data</Button>
        </Card>
      </div>
      <Modal open={confirm} title="Reset the workspace?" onClose={() => setConfirm(false)} footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="dangerSolid" onClick={() => { resetDemo(); setConfirm(false); }}>Reset</Button></>}>
        <p className="text-sm text-slate-600">This restores SO-1042 to pending approval and clears any approvals, payments or records you created in this session.</p>
      </Modal>
    </div>
  );
}
