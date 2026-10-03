import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { formatINR } from "@/lib/format";
import { Icon } from "@/components/icons";

export const fieldClass =
  "h-10 w-full rounded-lg border border-[#E6EAF1] bg-white px-3 text-sm text-[#0B132B] outline-none transition placeholder:text-slate-400 focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/15";

const tones = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/15",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/15",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
  high: "bg-orange-50 text-orange-800 ring-orange-600/15",
  info: "bg-blue-50 text-blue-700 ring-blue-600/15",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/10",
  navy: "bg-[#0B132B]/[0.06] text-[#0B132B] ring-[#0B132B]/10",
};

export type Tone = keyof typeof tones;

export function statusTone(status: string): Tone {
  const map: Record<string, Tone> = {
    Active: "success",
    Paid: "success",
    Approved: "success",
    Converted: "success",
    Won: "success",
    "In Stock": "success",
    Received: "success",
    Success: "success",
    Mitigated: "success",
    Reserved: "success",
    Fulfilled: "success",
    Cleared: "success",
    Accepted: "success",
    Qualified: "info",
    Contacted: "info",
    Proposal: "info",
    Sent: "info",
    Issued: "info",
    Monitoring: "info",
    Info: "info",
    New: "neutral",
    Draft: "neutral",
    Prospect: "neutral",
    "Not Required": "neutral",
    "Not Reserved": "neutral",
    "Not Invoiced": "neutral",
    Lead: "neutral",
    Pending: "warning",
    "Partially Paid": "warning",
    Partial: "warning",
    Negotiation: "warning",
    "Changes Requested": "warning",
    Ordered: "warning",
    Warning: "warning",
    Unpaid: "warning",
    "On Hold": "danger",
    Lost: "danger",
    "Out of Stock": "danger",
    Rejected: "danger",
    Overdue: "danger",
    Failed: "danger",
    Backordered: "danger",
    High: "high",
    Critical: "critical",
    Low: "success",
    Medium: "warning",
    None: "neutral",
    Clear: "success",
    Open: "warning",
    Closed: "neutral",
    Acknowledged: "info",
    Resolved: "success",
    Invited: "info",
    Expired: "neutral",
  };
  return map[status] ?? "neutral";
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label = status === "None" ? "Clear" : status;
  return <Badge tone={statusTone(status)}>{label}</Badge>;
}

const buttonVariants = {
  primary: "bg-[#0B132B] text-white hover:bg-[#16203c] shadow-sm",
  blue: "bg-[#1D6FE0] text-white hover:bg-[#185fc4]",
  secondary: "border border-[#E6EAF1] bg-white text-[#0B132B] hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  dangerSolid: "bg-rose-600 text-white hover:bg-rose-700",
};

const buttonSizes = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3 text-[13px]",
  lg: "h-10 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants; size?: keyof typeof buttonSizes }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A86FF]/40 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0B132B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A86FF]/40", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-[#E6EAF1] bg-white", className)}>{children}</section>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-[#0B132B]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{eyebrow}</div>}
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-[#0B132B]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-[#0B132B]">
      <Icon name="arrowLeft" className="h-4 w-4" />
      {label}
    </button>
  );
}

export function Money({ value, compact, className }: { value: number; compact?: boolean; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatINR(value, compact)}</span>;
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px] tracking-tight text-slate-500", className)}>{children}</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClass, "h-24 py-2", props.className)} />;
}

export function Modal({
  open,
  title,
  kicker,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button className="absolute inset-0 bg-[#0B132B]/40" aria-label="Close dialog" onClick={onClose} />
      <div className={cn("relative z-10 w-full rounded-2xl border border-[#E6EAF1] bg-white shadow-2xl shadow-slate-900/20", wide ? "max-w-2xl" : "max-w-lg")}>
        <div className="flex items-start justify-between gap-3 border-b border-[#E6EAF1] px-5 py-4">
          <div>
            {kicker && <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{kicker}</div>}
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          </div>
          <IconButton label="Close" onClick={onClose}>
            <Icon name="x" />
          </IconButton>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[#E6EAF1] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[65]">
      <button className="absolute inset-0 bg-[#0B132B]/30" aria-label="Close panel" onClick={onClose} />
      <aside className={cn("absolute inset-y-0 right-0 flex w-full flex-col border-l border-[#E6EAF1] bg-white shadow-2xl", wide ? "max-w-xl" : "max-w-md")}>
        <div className="flex items-center justify-between border-b border-[#E6EAF1] px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <Icon name="x" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[#E6EAF1]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative shrink-0 px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:text-[#0B132B]",
            value === tab.id && "text-[#0B132B]",
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && <span className="ml-1.5 text-[11px] text-slate-400">{tab.count}</span>}
          {value === tab.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#3A86FF]" />}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name="layers" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, body, onBack }: { title: string; body: string; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <Icon name="alert" className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
      <Button className="mt-4" onClick={onBack}>
        Go back
      </Button>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/80", className)} />;
}

export function Kpi({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: string }) {
  return (
    <div className="rounded-xl border border-[#E6EAF1] bg-white px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">{label}</span>
        {icon && <Icon name={icon} className="h-4 w-4 text-slate-400" />}
      </div>
      <div className="mt-2 text-[22px] font-semibold leading-none tracking-tight tabular-nums text-[#0B132B]">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function Timeline({ items }: { items: { title: string; meta: string; body?: string; tone?: Tone }[] }) {
  return (
    <ol>
      {items.map((item, i) => (
        <li key={`${item.title}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
          {i < items.length - 1 && <span className="absolute top-4 bottom-0 left-[6px] w-px bg-slate-200" />}
          <span className={cn("mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white ring-2", item.tone === "danger" ? "bg-rose-500 ring-rose-100" : item.tone === "warning" ? "bg-amber-500 ring-amber-100" : item.tone === "success" ? "bg-emerald-500 ring-emerald-100" : "bg-[#3A86FF] ring-blue-100")} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-[#0B132B]">{item.title}</div>
            <div className="text-xs text-slate-500">{item.meta}</div>
            {item.body && <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  sort?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRow,
  loading,
  empty,
  pageSize = 8,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRow?: (row: T) => void;
  loading?: boolean;
  empty?: ReactNode;
  pageSize?: number;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const copy = [...rows].sort((a, b) => {
      const av = col.sort!(a);
      const bv = col.sort!(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sort, columns]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => setPage(0), [rows.length]);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E6EAF1] bg-[#F8FAFC]">
              {columns.map((col) => (
                <th key={col.key} className={cn("px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500", col.align === "right" && "text-right", col.className)}>
                  {col.sort ? (
                    <button
                      className="inline-flex items-center gap-1 hover:text-[#0B132B]"
                      onClick={() => setSort((s) => ({ key: col.key, dir: s?.key === col.key && s.dir === "asc" ? "desc" : "asc" }))}
                    >
                      {col.header}
                      <span className="text-[9px] text-slate-400">{sort?.key === col.key ? (sort.dir === "asc" ? "↑" : "↓") : ""}</span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F1F4F8]">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : slice.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRow ? () => onRow(row) : undefined}
                    className={cn("border-b border-[#F1F4F8] last:border-0", onRow && "cursor-pointer hover:bg-[#F8FAFC]")}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3 text-[13px] text-[#0B132B]", col.align === "right" && "text-right", col.className)}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && (empty ?? <EmptyState title="Nothing to show" body="Try a different filter, or create a record to start the workflow." />)}
      {rows.length > 0 && (
        <div className="flex items-center justify-between border-t border-[#E6EAF1] px-4 py-2.5 text-xs text-slate-500">
          <span>
            Showing {safePage * pageSize + 1}–{Math.min(rows.length, safePage * pageSize + pageSize)} of {rows.length}
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Prev
              </Button>
              <span className="px-1 tabular-nums">
                {safePage + 1} / {pages}
              </span>
              <Button variant="ghost" size="sm" disabled={safePage >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center gap-2">{children}</div>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(fieldClass, "pl-9")} />
    </div>
  );
}

export function Avatar({ name, id, size = "md" }: { name: string; id?: string; size?: "sm" | "md" }) {
  const colors = ["#1D4ED8", "#0B132B", "#0F766E", "#6D28D9", "#B45309", "#0E7490", "#334155"];
  const color = colors[(id ?? name).split("").reduce((s, ch) => s + ch.charCodeAt(0), 0) % colors.length];
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[11px]")}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}

export function Toasts({ items, onDismiss }: { items: { id: string; message: string; tone: Tone | "success" | "danger" | "warning" | "info" }[]; onDismiss: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(360px,calc(100%-2rem))] flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[#E6EAF1] bg-white px-3 py-3 shadow-lg shadow-slate-900/10">
          <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", t.tone === "success" ? "bg-emerald-500" : t.tone === "danger" ? "bg-rose-500" : t.tone === "warning" ? "bg-amber-500" : "bg-[#3A86FF]")} />
          <p className="flex-1 text-sm text-[#0B132B]">{t.message}</p>
          <button className="text-slate-400 hover:text-slate-700" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
