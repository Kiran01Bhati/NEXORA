import { useMemo, useState } from "react";
import { rulesFor, summarizeRules } from "@/lib/domain";
import { formatINR, todayInputValue } from "@/lib/format";
import { useApp } from "@/store/store";
import type { Interaction, Lead, Payment, Role } from "@/types";
import { Button, Field, SelectInput, StatusBadge, TextArea, TextInput } from "@/components/ui";

export function CustomerForm({ onDone }: { onDone?: () => void }) {
  const { addCustomer } = useApp();
  const [form, setForm] = useState({ company: "", contact: "", email: "", phone: "", city: "", industry: "Hospitality", creditLimit: "500000", gstin: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        addCustomer({ ...form, creditLimit: Number(form.creditLimit) || 0 });
        onDone?.();
      }}
    >
      <Field label="Company"><TextInput required value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="ABC Hospitality" /></Field>
      <Field label="Contact person"><TextInput required value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Neha Kapoor" /></Field>
      <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@company.example" /></Field>
      <Field label="Phone"><TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91" /></Field>
      <Field label="City"><TextInput value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
      <Field label="Industry"><TextInput value={form.industry} onChange={(e) => set("industry", e.target.value)} /></Field>
      <Field label="Credit limit (₹)"><TextInput type="number" min={0} value={form.creditLimit} onChange={(e) => set("creditLimit", e.target.value)} /></Field>
      <Field label="GSTIN"><TextInput value={form.gstin} onChange={(e) => set("gstin", e.target.value)} placeholder="Optional" /></Field>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit">Add customer</Button>
      </div>
    </form>
  );
}

export function LeadForm({ onDone }: { onDone?: () => void }) {
  const { addLead } = useApp();
  const [form, setForm] = useState({ name: "", company: "", email: "", source: "Website" as Lead["source"], value: "250000" });
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        addLead({ ...form, value: Number(form.value) || 0 });
        onDone?.();
      }}
    >
      <Field label="Lead name"><TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Company"><TextInput required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
      <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Source">
          <SelectInput value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as Lead["source"] })}>
            {["Website", "Referral", "Campaign", "Event", "Partner", "Outbound"].map((s) => <option key={s}>{s}</option>)}
          </SelectInput>
        </Field>
        <Field label="Estimated value"><TextInput type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end"><Button type="submit">Create lead</Button></div>
    </form>
  );
}

export function QuoteForm({ onDone, customerId, opportunityId }: { onDone?: () => void; customerId?: string; opportunityId?: string }) {
  const { state, addQuotation } = useApp();
  const [form, setForm] = useState({
    customerId: customerId ?? state.customers[0]?.id ?? "",
    productId: state.products[0]?.id ?? "",
    qty: "1",
    unitPrice: String(state.products[0]?.price ?? 0),
    discountPct: "0",
    validUntil: todayInputValue(),
  });
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        addQuotation({
          customerId: form.customerId,
          opportunityId,
          productId: form.productId,
          qty: Number(form.qty),
          unitPrice: Number(form.unitPrice),
          discountPct: Number(form.discountPct),
          validUntil: new Date(form.validUntil).toISOString(),
        });
        onDone?.();
      }}
    >
      <Field label="Customer">
        <SelectInput value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          {state.customers.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </SelectInput>
      </Field>
      <Field label="Product">
        <SelectInput
          value={form.productId}
          onChange={(e) => {
            const product = state.products.find((p) => p.id === e.target.value);
            setForm({ ...form, productId: e.target.value, unitPrice: String(product?.price ?? 0) });
          }}
        >
          {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectInput>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Qty"><TextInput type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
        <Field label="Unit price"><TextInput type="number" min={0} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></Field>
        <Field label="Discount %"><TextInput type="number" min={0} max={100} value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value })} /></Field>
      </div>
      <Field label="Valid until"><TextInput type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></Field>
      <div className="flex justify-end"><Button type="submit" variant="blue">Issue quotation</Button></div>
    </form>
  );
}

export function OrderForm({ onDone, customerId }: { onDone?: () => void; customerId?: string }) {
  const { state } = useApp();
  const { createOrder } = useApp();
  const [form, setForm] = useState({
    customerId: customerId ?? "CUS-1004",
    productId: "PRD-AS",
    qty: "10",
    unitPrice: "70000",
    discountPct: "25",
  });
  const preview = useMemo(() => {
    const customer = state.customers.find((c) => c.id === form.customerId);
    const product = state.products.find((p) => p.id === form.productId);
    if (!customer || !product) return [];
    return rulesFor(state, customer, [{ productId: product.id, name: product.name, sku: product.sku, qty: Number(form.qty) || 0, unitPrice: Number(form.unitPrice) || 0 }], Number(form.discountPct) || 0);
  }, [state, form]);
  const summary = summarizeRules(preview);
  const gross = (Number(form.qty) || 0) * (Number(form.unitPrice) || 0);
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        createOrder({
          customerId: form.customerId,
          productId: form.productId,
          qty: Number(form.qty),
          unitPrice: Number(form.unitPrice),
          discountPct: Number(form.discountPct),
        });
        onDone?.();
      }}
    >
      <Field label="Customer">
        <SelectInput value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          {state.customers.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </SelectInput>
      </Field>
      <Field label="Product">
        <SelectInput value={form.productId} onChange={(e) => {
          const product = state.products.find((p) => p.id === e.target.value);
          setForm({ ...form, productId: e.target.value, unitPrice: String(product?.price ?? form.unitPrice) });
        }}>
          {state.products.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatINR(p.price)}</option>)}
        </SelectInput>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Qty"><TextInput type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
        <Field label="Unit price"><TextInput type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></Field>
        <Field label="Discount %"><TextInput type="number" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value })} /></Field>
      </div>
      <div className="rounded-lg border border-[#E6EAF1] bg-[#F8FAFC] px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Order value</span>
          <span className="font-semibold tabular-nums">{formatINR(gross)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-slate-500">Risk preview</span>
          <StatusBadge status={summary.level} />
        </div>
        {preview.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {preview.map((r) => <li key={r.code}>{r.category} — {r.detail}</li>)}
          </ul>
        )}
        {preview.length === 0 && <p className="mt-2 text-xs text-slate-500">No policy rule will fire. The order can be released without approval.</p>}
      </div>
      <div className="flex justify-end"><Button type="submit">Create sales order</Button></div>
    </form>
  );
}

export function PaymentForm({ onDone, invoiceId }: { onDone?: () => void; invoiceId?: string }) {
  const { state, recordPayment } = useApp();
  const open = state.invoices.filter((i) => i.outstanding > 0);
  const [form, setForm] = useState({
    invoiceId: invoiceId && open.some((i) => i.id === invoiceId) ? invoiceId : open[0]?.id ?? "",
    amount: String(open.find((i) => i.id === invoiceId)?.outstanding ?? open[0]?.outstanding ?? ""),
    method: "NEFT" as Payment["method"],
    reference: "",
    date: todayInputValue(),
  });
  const invoice = state.invoices.find((i) => i.id === form.invoiceId);
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        recordPayment({ ...form, amount: Number(form.amount) });
        onDone?.();
      }}
    >
      <Field label="Invoice">
        <SelectInput value={form.invoiceId} onChange={(e) => {
          const inv = state.invoices.find((i) => i.id === e.target.value);
          setForm({ ...form, invoiceId: e.target.value, amount: String(inv?.outstanding ?? "") });
        }}>
          {open.map((i) => {
            const customer = state.customers.find((c) => c.id === i.customerId);
            return <option key={i.id} value={i.id}>{i.id} · {customer?.company} · {formatINR(i.outstanding)}</option>;
          })}
        </SelectInput>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount" hint={invoice ? `Outstanding ${formatINR(invoice.outstanding)}` : undefined}>
          <TextInput type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <Field label="Method">
          <SelectInput value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as Payment["method"] })}>
            {["NEFT", "RTGS", "UPI", "Card", "Cheque"].map((m) => <option key={m}>{m}</option>)}
          </SelectInput>
        </Field>
      </div>
      <Field label="Reference"><TextInput value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="UTR / cheque no." /></Field>
      <Field label="Date"><TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      <div className="flex justify-end"><Button type="submit" variant="blue">Record payment</Button></div>
    </form>
  );
}

export function InteractionForm({ onDone, customerId }: { onDone?: () => void; customerId?: string }) {
  const { state, addInteraction } = useApp();
  const [form, setForm] = useState({
    customerId: customerId ?? state.customers[0]?.id ?? "",
    type: "Note" as Interaction["type"],
    subject: "",
    body: "",
  });
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        addInteraction(form);
        onDone?.();
      }}
    >
      <Field label="Customer">
        <SelectInput value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          {state.customers.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </SelectInput>
      </Field>
      <Field label="Type">
        <SelectInput value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Interaction["type"] })}>
          {["Call", "Email", "Meeting", "Note", "Demo"].map((t) => <option key={t}>{t}</option>)}
        </SelectInput>
      </Field>
      <Field label="Subject"><TextInput required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
      <Field label="Notes"><TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
      <div className="flex justify-end"><Button type="submit">Log interaction</Button></div>
    </form>
  );
}

export function InviteForm({ onDone }: { onDone?: () => void }) {
  const { inviteUser } = useApp();
  const [form, setForm] = useState({ name: "", email: "", role: "Sales Executive" as Role });
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        inviteUser(form);
        onDone?.();
      }}
    >
      <Field label="Name"><TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email"><TextInput type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Role">
        <SelectInput value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
          {["Admin", "Sales Executive", "Sales Manager", "Finance", "Inventory Manager", "Compliance Officer"].map((r) => <option key={r}>{r}</option>)}
        </SelectInput>
      </Field>
      <div className="flex justify-end"><Button type="submit">Add user</Button></div>
    </form>
  );
}
