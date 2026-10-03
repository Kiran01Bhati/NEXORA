import { cn } from "@/utils/cn";
import type { StageState } from "@/lib/domain";
import { Icon } from "@/components/icons";

const labels: Record<StageState, string> = {
  completed: "Completed",
  current: "Current",
  pending: "Pending",
  blocked: "Blocked",
};

export function Lifecycle({ stages, note }: { stages: { key: string; label: string; state: StageState }[]; note?: string }) {
  const currentIndex = Math.max(0, stages.findIndex((s) => s.state === "current" || s.state === "blocked"));
  const progress = stages.filter((s) => s.state === "completed").length / Math.max(1, stages.length - 1);
  return (
    <div className="rounded-xl border border-[#E6EAF1] bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Transaction lifecycle</h2>
          <p className="text-xs text-slate-500">Quotation through accounting, with risk in the same path.</p>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">CRM · ERP · Risk</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <ol className="relative flex min-w-[860px] justify-between">
          <span className="absolute top-[13px] right-4 left-4 h-px bg-slate-200" />
          <span className="absolute top-[13px] left-4 h-px bg-[#3A86FF]" style={{ width: `calc((100% - 2rem) * ${Math.min(1, progress)})` }} />
          {stages.map((stage, index) => (
            <li key={stage.key} className="relative flex w-24 flex-col items-center text-center">
              <span
                className={cn(
                  "z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold",
                  stage.state === "completed" && "border-[#0B132B] bg-[#0B132B] text-white",
                  stage.state === "current" && "border-[#3A86FF] bg-white text-[#1D6FE0] ring-4 ring-[#3A86FF]/15",
                  stage.state === "pending" && "border-slate-200 bg-white text-slate-400",
                  stage.state === "blocked" && "border-rose-300 bg-rose-50 text-rose-700",
                )}
              >
                {stage.state === "completed" ? <Icon name="check" className="h-3.5 w-3.5" /> : stage.state === "blocked" ? "!" : index + 1}
              </span>
              <span className="mt-2 text-[11px] leading-tight font-medium text-[#0B132B]">{stage.label}</span>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium uppercase tracking-wide",
                  stage.state === "completed" && "text-emerald-700",
                  stage.state === "current" && "text-[#1D6FE0]",
                  stage.state === "pending" && "text-slate-400",
                  stage.state === "blocked" && "text-rose-600",
                )}
              >
                {labels[stage.state]}
              </span>
            </li>
          ))}
        </ol>
      </div>
      {note && (
        <div className="mt-4 rounded-lg bg-[#F8FAFC] px-3 py-2.5 text-sm text-slate-600">
          <span className="font-medium text-[#0B132B]">{stages[currentIndex]?.label ?? "Status"}. </span>
          {note}
        </div>
      )}
    </div>
  );
}
