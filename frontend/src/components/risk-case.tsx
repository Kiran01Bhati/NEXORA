import { useState } from "react";
import { approvalGate, lifecycleNote, orderLifecycle, stockOf, userById } from "@/lib/domain";
import { formatDateTime, formatINR } from "@/lib/format";
import { useApp } from "@/store/store";
import { Icon } from "@/components/icons";
import { Lifecycle } from "@/components/lifecycle";
import { BackLink, Button, Card, ErrorState, Field, Modal, Mono, StatusBadge, TextArea } from "@/components/ui";

export function RiskCasePage() {
  const { state, back, navigate } = useApp();
  const order = state.orders.find((o) => o.id === state.view.id);
  if (!order) return <ErrorState title="Risk case not found" body="This transaction is no longer in the workspace." onBack={back} />;
  const customer = state.customers.find((c) => c.id === order.customerId);
  return (
    <div>
      <BackLink label="Approvals" onClick={() => navigate({ page: "approvals" })} />
      <RiskCase orderId={order.id} headline />
      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate({ page: "order", id: order.id })}>
          Open sales order{customer ? ` · ${customer.company}` : ""}
        </Button>
      </div>
    </div>
  );
}

export function RiskCase({ orderId, headline = false }: { orderId: string; headline?: boolean }) {
  const { state } = useApp();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return null;
  const customer = state.customers.find((c) => c.id === order.customerId);
  const creator = userById(state, order.createdBy);
  const approver = userById(state, order.approverId);
  const invoice = state.invoices.find((i) => i.orderId === order.id || i.id === order.invoiceId);
  const paid = invoice?.status === "Paid";
  const partial = invoice?.status === "Partially Paid";
  const accounted = invoice ? state.ledger.some((l) => l.reference === invoice.id && l.account === "Bank") : false;
  const stages = orderLifecycle(order, !!invoice, !!paid, !!partial, accounted);
  const level = order.riskLevel === "None" ? "Clear" : order.riskLevel;

  return (
    <div className="space-y-4">
      {headline && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-rose-600">Risk case</div>
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{order.riskLevel === "None" ? "No policy breach" : `${level} risk detected`}</h1>
            <p className="mt-1 text-sm text-slate-500">{order.rules.length} rule{order.rules.length === 1 ? "" : "s"} triggered · {order.approvalStatus === "Pending" ? "Pending manager approval" : order.approvalStatus}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.riskLevel} />
            <StatusBadge status={order.approvalStatus} />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Order" value={<Mono className="text-sm text-[#0B132B]">{order.id}</Mono>} />
        <Fact label="Customer" value={customer?.company ?? "—"} />
        <Fact label="Order value" value={formatINR(order.gross)} />
        <Fact label="Discount" value={`${order.discountPct}%`} />
      </div>

      <Lifecycle stages={stages} note={lifecycleNote(order, approver)} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card className="p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Rules triggered</div>
          {order.rules.length === 0 && <p className="mt-3 text-sm text-slate-500">No risk rule is currently attached to this order.</p>}
          <div className="mt-3 space-y-3">
            {order.rules.map((rule, index) => (
              <div key={rule.code} className="rounded-xl border border-[#E6EAF1] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{index + 1}. {rule.category}</div>
                    <p className="mt-1 text-sm text-slate-600">{rule.detail}</p>
                  </div>
                  <StatusBadge status={rule.level} />
                </div>
                <div className="mt-2 text-xs text-slate-400">Likelihood {rule.likelihood} × Impact {rule.impact} · score {rule.score}</div>
              </div>
            ))}
          </div>
          <dl className="mt-5 grid gap-3 border-t border-[#E6EAF1] pt-4 sm:grid-cols-2">
            <Meta label="Risk score" value={order.riskLevel === "None" ? "Clear" : `${order.riskScore} · ${order.riskLevel}`} />
            <Meta label="Status" value={order.approvalStatus === "Pending" ? "Pending approval" : order.approvalStatus} />
            <Meta label="Requested by" value={`${creator?.name ?? "—"} · ${creator?.role ?? ""}`} />
            <Meta label="Approver" value={`${approver?.name ?? "—"} · ${approver?.role ?? ""}`} />
          </dl>
        </Card>
        <div className="space-y-4">
          <DecisionPanel orderId={order.id} />
          <InventoryCard orderId={order.id} />
        </div>
      </div>
    </div>
  );
}

export function DecisionPanel({ orderId }: { orderId: string }) {
  const api = useApp();
  const { state, user } = api;
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return null;
  const creator = userById(state, order.createdBy);
  const approver = userById(state, order.approverId);
  const gate = approvalGate(user, order);
  const [mode, setMode] = useState<null | "reject" | "changes">(null);
  const [note, setNote] = useState("");

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Icon name="shield" className="text-[#0B132B]" />
        <h3 className="text-sm font-semibold">Approval decision</h3>
      </div>

      {gate === "sod" && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
          <div className="text-sm font-semibold text-amber-950">Approval unavailable</div>
          <div className="mt-1 text-[11px] font-medium tracking-[0.12em] text-amber-800 uppercase">Segregation of Duties · CTRL-SOD-01</div>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/80">
            Orders cannot be approved by their creator. This control stops one person from both initiating and authorizing a high-risk transaction.
          </p>
          <dl className="mt-3 space-y-1.5 text-xs text-amber-950">
            <Row k="Creator" v={`${creator?.name} · ${creator?.role}`} />
            <Row k="Required approver" v={`${approver?.name} · ${approver?.role}`} />
            <Row k="Signed in as" v={`${user.name} · ${user.role}`} />
          </dl>
          {order.sodAttempts.length > 0 && (
            <p className="mt-3 text-xs font-medium text-rose-700">
              Last attempt rejected {formatDateTime(order.sodAttempts[order.sodAttempts.length - 1].at)}. Written to the audit log.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="danger" size="sm" onClick={() => api.attemptApproval(order.id)}>Attempt approval</Button>
            {approver && <Button variant="secondary" size="sm" onClick={() => api.setUser(approver.id)}>Switch to {approver.name.split(" ")[0]}</Button>}
          </div>
        </div>
      )}

      {gate === "role" && (
        <div className="mt-3 rounded-xl border border-[#E6EAF1] bg-[#F8FAFC] p-3.5 text-sm text-slate-600">
          <div className="font-semibold text-[#0B132B]">Another role must decide</div>
          <p className="mt-1">Required approver is {approver?.name} ({approver?.role}). You are signed in as {user.name}, {user.role}.</p>
          {approver && <Button className="mt-3" size="sm" variant="secondary" onClick={() => api.setUser(approver.id)}>Switch to {approver.name.split(" ")[0]}</Button>}
        </div>
      )}

      {gate === "ok" && (
        <div className="mt-3">
          <p className="text-sm text-slate-600">You are the designated approver. Approving reserves inventory and issues the invoice.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => api.approveOrder(order.id)}>Approve</Button>
            <Button size="sm" variant="secondary" onClick={() => setMode("changes")}>Request changes</Button>
            <Button size="sm" variant="danger" onClick={() => setMode("reject")}>Reject</Button>
          </div>
        </div>
      )}

      {gate === "closed" && (
        <div className="mt-3 text-sm text-slate-600">
          This decision is closed · <span className="font-medium text-[#0B132B]">{order.approvalStatus}</span>
          {order.rejectReason && <p className="mt-1">{order.rejectReason}</p>}
          {order.changeNote && order.approvalStatus === "Changes Requested" && <p className="mt-1">{order.changeNote}</p>}
          {(order.approvalStatus === "Approved" || order.approvalStatus === "Not Required") && order.inventoryStatus === "Not Reserved" && (
            <Button className="mt-3" size="sm" onClick={() => api.releaseOrder(order.id)}>Reserve & invoice</Button>
          )}
        </div>
      )}

      <Modal
        open={mode !== null}
        title={mode === "reject" ? "Reject order" : "Request changes"}
        onClose={() => setMode(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMode(null)}>Cancel</Button>
            <Button
              variant={mode === "reject" ? "dangerSolid" : "primary"}
              onClick={() => {
                if (mode === "reject") api.rejectOrder(order.id, note);
                if (mode === "changes") api.requestChanges(order.id, note);
                setMode(null);
                setNote("");
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Field label={mode === "reject" ? "Reason" : "What should change?"}>
          <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === "reject" ? "Commercial terms are outside policy." : "Reduce the discount below 20%."} />
        </Field>
      </Modal>
    </Card>
  );
}

export function InventoryCard({ orderId }: { orderId: string }) {
  const { state, navigate } = useApp();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return null;
  const line = order.lines[0];
  const live = line ? stockOf(state, line.productId) : null;
  const snap = order.reservation?.[0];
  const availableNow = snap ? Math.max(0, snap.availableBefore - snap.reserved) : live?.available ?? 0;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Inventory reservation</h3>
        <button className="text-xs font-medium text-[#1D6FE0]" onClick={() => navigate({ page: "inventory" })}>View stock</button>
      </div>
      <p className="mt-1 text-xs text-slate-500">{line?.name} · {line?.sku}</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <Row k="Required" v={String(line?.qty ?? 0)} />
        <Row k={snap ? "Available before" : "Available"} v={String(snap?.availableBefore ?? live?.available ?? 0)} />
        <Row k="Reserved" v={String(snap?.reserved ?? (order.inventoryStatus === "Reserved" ? line?.qty ?? 0 : 0))} />
        {snap && <Row k="Available now" v={String(availableNow)} />}
      </dl>
      <div className="mt-3"><StatusBadge status={order.inventoryStatus} /></div>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E6EAF1] bg-white px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium tabular-nums">{v}</dd>
    </div>
  );
}
