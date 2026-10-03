import { formatINR } from "@/lib/format";

export interface FinPoint {
  month: string;
  revenue: number;
  invoices: number;
  payments: number;
  outstanding: number;
}

export function FinancialChart({ data }: { data: FinPoint[] }) {
  const width = 720;
  const height = 220;
  const pad = { l: 44, r: 12, t: 16, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(...data.flatMap((d) => [d.revenue, d.invoices, d.payments, d.outstanding]), 1);
  const group = innerW / data.length;
  const barW = 10;
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const ticks = [0, 0.5, 1];
  const line = data
    .map((d, i) => {
      const x = pad.l + group * i + group / 2;
      return `${i === 0 ? "M" : "L"} ${x} ${y(d.outstanding)}`;
    })
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Financial overview chart">
        {ticks.map((t) => {
          const yy = pad.t + innerH - t * innerH;
          return (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={yy} y2={yy} stroke="#E6EAF1" />
              <text x={pad.l - 8} y={yy + 3} textAnchor="end" fontSize="10" fill="#94A3B8">
                {t === 0 ? "0" : `₹${Math.round((max * t) / 100000)}L`}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = pad.l + group * i + group / 2;
          const bars = [
            { v: d.revenue, color: "#0B132B", dx: -16 },
            { v: d.invoices, color: "#3A86FF", dx: -2 },
            { v: d.payments, color: "#94A3B8", dx: 12 },
          ];
          return (
            <g key={d.month}>
              {bars.map((b) => (
                <rect key={b.color} x={x + b.dx} y={y(b.v)} width={barW} height={Math.max(0, pad.t + innerH - y(b.v))} rx="2" fill={b.color}>
                  <title>{`${d.month}: ${formatINR(b.v)}`}</title>
                </rect>
              ))}
              <text x={x} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748B">
                {d.month}
              </text>
            </g>
          );
        })}
        <path d={line} fill="none" stroke="#D97706" strokeWidth="2" />
        {data.map((d, i) => (
          <circle key={d.month} cx={pad.l + group * i + group / 2} cy={y(d.outstanding)} r="3" fill="#fff" stroke="#D97706" strokeWidth="2">
            <title>{`Outstanding ${formatINR(d.outstanding)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 px-1 text-[11px] text-slate-500">
        <Legend color="#0B132B" label="Revenue" />
        <Legend color="#3A86FF" label="Invoices" />
        <Legend color="#94A3B8" label="Payments" />
        <Legend color="#D97706" label="Outstanding" line />
      </div>
    </div>
  );
}

function Legend({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {line ? <span className="h-0.5 w-3.5 rounded" style={{ background: color }} /> : <span className="h-2 w-2 rounded-sm" style={{ background: color }} />}
      {label}
    </span>
  );
}

export function RiskMatrix({
  cells,
  onSelect,
}: {
  cells: { l: number; i: number; count: number; ids: string[] }[];
  onSelect?: (l: number, i: number) => void;
}) {
  const color = (score: number) => {
    if (score >= 17) return "#FEE2E2";
    if (score >= 10) return "#FFEDD5";
    if (score >= 5) return "#FEF3C7";
    return "#ECFDF5";
  };
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex items-center">
          <span className="-rotate-90 text-[10px] font-medium tracking-[0.14em] text-slate-400 uppercase">Likelihood</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-5 gap-1.5">
            {[5, 4, 3, 2, 1].map((l) =>
              [1, 2, 3, 4, 5].map((i) => {
                const cell = cells.find((c) => c.l === l && c.i === i);
                const score = l * i;
                return (
                  <button
                    key={`${l}-${i}`}
                    type="button"
                    onClick={() => onSelect?.(l, i)}
                    title={cell?.ids.join(", ") || `Score ${score}`}
                    className="flex h-11 items-center justify-center rounded-md border border-white/80 transition hover:ring-2 hover:ring-[#0B132B]/15"
                    style={{ background: color(score) }}
                  >
                    {cell && cell.count > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0B132B] px-1.5 text-[11px] font-medium text-white">
                        {cell.count}
                      </span>
                    )}
                  </button>
                );
              }),
            )}
          </div>
          <div className="mt-1.5 grid grid-cols-5 text-center text-[10px] text-slate-400">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <div className="mt-1 text-center text-[10px] font-medium tracking-[0.14em] text-slate-400 uppercase">Impact</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-200" /> Low 1–4</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-200" /> Medium 5–9</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-orange-100 ring-1 ring-orange-200" /> High 10–16</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-red-200" /> Critical 17–25</span>
      </div>
    </div>
  );
}

export function HBars({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-medium tabular-nums text-[#0B132B]">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StackedRisk({ critical, high, medium, low }: { critical: number; high: number; medium: number; low: number }) {
  const total = critical + high + medium + low || 1;
  const parts = [
    { n: critical, color: "#DC2626", label: "Critical" },
    { n: high, color: "#EA580C", label: "High" },
    { n: medium, color: "#D97706", label: "Medium" },
    { n: low, color: "#059669", label: "Low" },
  ];
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${(p.n / total) * 100}%`, background: p.color }} title={`${p.label} ${p.n}`} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-2.5 py-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <i className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className="font-semibold tabular-nums">{p.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
