import { useEffect, useMemo, useState } from "react";
import { NAV, navPage, pageTitle } from "@/nav";
import { scenarioSteps } from "@/lib/domain";
import { cn } from "@/utils/cn";
import { useApp } from "@/store/store";
import type { Page, QuickType } from "@/types";
import { Icon, LogoMark } from "@/components/icons";
import { CustomerForm, InteractionForm, LeadForm, OrderForm, PaymentForm, QuoteForm } from "@/components/forms";
import { Avatar, Button, Drawer, IconButton, Modal, Toasts } from "@/components/ui";

export function Shell({ children }: { children: React.ReactNode }) {
  const api = useApp();
  const { state, user } = api;
  const [userOpen, setUserOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const steps = scenarioSteps(state);
  const done = steps.filter((s) => s.done).length;
  const pendingApprovals = state.orders.filter((o) => o.approvalStatus === "Pending").length;
  const openAlerts = state.alerts.filter((a) => a.status === "Open").length;
  const unread = state.notices.filter((n) => !n.read).length;
  const critical = state.alerts.some((a) => a.status === "Open" && a.severity === "Critical");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        api.setUi({ commandOpen: true, notifOpen: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api]);

  const badge = (page: Page) => {
    if (page === "approvals") return pendingApprovals;
    if (page === "alerts") return openAlerts;
    return 0;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6FA] text-[#0B132B]">
      {state.ui.mobileNav && <button className="fixed inset-0 z-30 bg-[#0B132B]/40 lg:hidden" aria-label="Close navigation" onClick={() => api.setUi({ mobileNav: false })} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0B132B] text-white transition-all duration-200 lg:static",
          state.ui.sidebarCollapsed ? "w-[76px]" : "w-[252px]",
          state.ui.mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className={cn("flex items-center gap-2.5 px-4 py-4", state.ui.sidebarCollapsed && "justify-center px-2")}>
          <LogoMark className="h-8 w-8 shrink-0" />
          {!state.ui.sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-[0.16em]">NEXORA</div>
              <div className="truncate text-[11px] text-slate-400">Unified Business Operations</div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 pb-4">
          {NAV.map((group) => (
            <div key={group.label}>
              {!state.ui.sidebarCollapsed && <div className="px-2.5 pb-1.5 text-[10px] font-medium tracking-[0.14em] text-slate-500 uppercase">{group.label}</div>}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = navPage(state.view.page) === item.page;
                  const count = badge(item.page);
                  return (
                    <button
                      key={item.page}
                      title={item.label}
                      onClick={() => api.navigate({ page: item.page })}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-300 hover:bg-white/5 hover:text-white",
                        active && "bg-white/[0.08] text-white",
                        state.ui.sidebarCollapsed && "justify-center px-0",
                      )}
                    >
                      {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-[#00F5D4]" />}
                      <Icon name={item.icon} className={cn("h-[18px] w-[18px] shrink-0 text-slate-400", active && "text-[#00F5D4]")} />
                      {!state.ui.sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      {!state.ui.sidebarCollapsed && count > 0 && (
                        <span className={cn("ml-auto rounded-full px-1.5 text-[10px] font-semibold", item.page === "alerts" && critical ? "bg-rose-500 text-white" : "bg-white/10 text-slate-200")}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-2.5">
          <button
            onClick={() => api.navigate({ page: "settings" })}
            className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-300 hover:bg-white/5 hover:text-white", state.view.page === "settings" && "bg-white/[0.08] text-white", state.ui.sidebarCollapsed && "justify-center px-0")}
            title="Settings"
          >
            <Icon name="settings" className="h-[18px] w-[18px]" />
            {!state.ui.sidebarCollapsed && "Settings"}
          </button>
          <button onClick={() => setUserOpen(true)} className={cn("mt-1 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-white/5", state.ui.sidebarCollapsed && "justify-center px-0")} title={user.name}>
            <Avatar name={user.name} id={user.id} size="sm" />
            {!state.ui.sidebarCollapsed && (
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{user.name}</span>
                <span className="block truncate text-[11px] text-slate-400">{user.role}</span>
              </span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[#E6EAF1] bg-white/95 px-3 backdrop-blur sm:px-4">
          <IconButton label="Open navigation" className="lg:hidden" onClick={() => api.setUi({ mobileNav: true })}>
            <Icon name="menu" />
          </IconButton>
          <IconButton label={state.ui.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden lg:inline-flex" onClick={() => api.setUi({ sidebarCollapsed: !state.ui.sidebarCollapsed })}>
            <Icon name="menu" />
          </IconButton>
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-sm font-semibold">Air Dive</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">Workspace</span>
          </div>
          <button
            onClick={() => api.setUi({ commandOpen: true })}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#E6EAF1] bg-[#F8FAFC] px-3 text-sm text-slate-400 hover:border-slate-300 md:max-w-md"
          >
            <Icon name="search" className="shrink-0" />
            <span className="truncate text-left">Search customers, orders, invoices…</span>
            <kbd className="ml-auto hidden rounded border border-[#E6EAF1] bg-white px-1.5 text-[10px] font-medium text-slate-400 sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => api.setUi({ scenarioOpen: true })}
              className="hidden h-9 items-center gap-2 rounded-lg border border-[#E6EAF1] px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
            >
              <Ring value={done / steps.length} />
              Scenario {done}/{steps.length}
            </button>
            <div className="relative">
              <Button size="sm" onClick={() => setCreateOpen((v) => !v)}>
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Create</span>
              </Button>
              {createOpen && (
                <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-[#E6EAF1] bg-white p-1 shadow-xl">
                  {([
                    ["customer", "Customer"],
                    ["lead", "Lead"],
                    ["quote", "Quotation"],
                    ["order", "Sales order"],
                    ["payment", "Payment"],
                    ["interaction", "Interaction"],
                  ] as [QuickType, string][]).map(([type, label]) => (
                    <button key={type} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setCreateOpen(false); api.openQuick(type); }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => api.navigate({ page: "alerts" })}
              className={cn("hidden h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium sm:inline-flex", critical || openAlerts > 2 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-800")}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", critical ? "bg-rose-500" : "bg-amber-500")} />
              {openAlerts} alerts
            </button>
            <IconButton label="Notifications" className="relative" onClick={() => api.setUi({ notifOpen: !state.ui.notifOpen, commandOpen: false })}>
              <Icon name="bell" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#3A86FF]" />}
            </IconButton>
            <button onClick={() => setUserOpen(true)} className="hidden items-center gap-2 rounded-lg py-1 pr-1 pl-1 hover:bg-slate-50 sm:flex">
              <Avatar name={user.name} id={user.id} size="sm" />
              <span className="hidden text-left lg:block">
                <span className="block text-[13px] leading-tight font-semibold">{user.name}</span>
                <span className="block text-[11px] leading-tight text-slate-500">{user.role}</span>
              </span>
            </button>
            <IconButton label="Refresh" onClick={api.refresh}>
              <Icon name="refresh" />
            </IconButton>
          </div>
        </header>
        {state.ui.refreshing && (
          <div className="h-0.5 overflow-hidden bg-slate-100">
            <div className="loadbar h-full w-1/3 bg-[#3A86FF]" />
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <div key={`${state.view.page}-${state.view.id ?? ""}`} className="page-enter mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>

      {state.ui.notifOpen && (
        <div className="fixed top-16 right-4 z-50 w-[min(380px,calc(100%-2rem))] rounded-xl border border-[#E6EAF1] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E6EAF1] px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <button className="text-xs font-medium text-[#1D6FE0]" onClick={api.markAllNotices}>Mark all read</button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {state.notices.map((n) => (
              <button
                key={n.id}
                className="flex w-full gap-3 border-b border-[#F1F4F8] px-4 py-3 text-left hover:bg-slate-50"
                onClick={() => {
                  api.markNotice(n.id);
                  api.navigate({ page: n.page, id: n.entityId });
                }}
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-slate-200" : n.tone === "danger" ? "bg-rose-500" : n.tone === "warning" ? "bg-amber-500" : n.tone === "success" ? "bg-emerald-500" : "bg-[#3A86FF]")} />
                <span>
                  <span className="block text-sm font-medium">{n.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{n.body}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <CommandPalette />
      <ScenarioDrawer />
      <UserSwitch open={userOpen} onClose={() => setUserOpen(false)} />
      <Drawer open={state.ui.quickOpen} title={quickTitle(state.ui.quickType)} onClose={() => api.setUi({ quickOpen: false })} wide>
        {state.ui.quickType === "customer" && <CustomerForm onDone={() => api.setUi({ quickOpen: false })} />}
        {state.ui.quickType === "lead" && <LeadForm onDone={() => api.setUi({ quickOpen: false })} />}
        {state.ui.quickType === "quote" && <QuoteForm onDone={() => api.setUi({ quickOpen: false })} />}
        {state.ui.quickType === "order" && <OrderForm onDone={() => api.setUi({ quickOpen: false })} />}
        {state.ui.quickType === "payment" && <PaymentForm onDone={() => api.setUi({ quickOpen: false })} />}
        {state.ui.quickType === "interaction" && <InteractionForm onDone={() => api.setUi({ quickOpen: false })} />}
      </Drawer>
      <Modal
        open={!!state.ui.decision}
        title={state.ui.decision?.title ?? ""}
        kicker={state.ui.decision?.kicker}
        onClose={api.closeDecision}
        footer={
          <>
            <Button variant="secondary" onClick={api.closeDecision}>Close</Button>
            {state.ui.decision?.primaryLabel && (
              <Button
                onClick={() => {
                  const d = state.ui.decision;
                  api.closeDecision();
                  if (d?.primaryPage) api.navigate({ page: d.primaryPage, id: d.primaryId });
                }}
              >
                {state.ui.decision.primaryLabel}
              </Button>
            )}
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">{state.ui.decision?.body}</p>
      </Modal>
      <Toasts items={state.toasts} onDismiss={api.dismissToast} />
    </div>
  );
}

function quickTitle(type: QuickType) {
  return {
    customer: "Add customer",
    lead: "Add lead",
    quote: "New quotation",
    order: "New sales order",
    payment: "Record payment",
    interaction: "Log interaction",
  }[type];
}

function Ring({ value }: { value: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="9" cy="9" r={r} stroke="#E6EAF1" strokeWidth="2" fill="none" />
      <circle cx="9" cy="9" r={r} stroke="#3A86FF" strokeWidth="2" fill="none" strokeDasharray={`${c * value} ${c}`} strokeLinecap="round" transform="rotate(-90 9 9)" />
    </svg>
  );
}

function UserSwitch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setUser, user } = useApp();
  return (
    <Modal open={open} title="Switch user" kicker="Demo control" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">Role switching demonstrates segregation of duties. It is not a production login.</p>
      <div className="space-y-1">
        {state.users.map((u) => (
          <button
            key={u.id}
            onClick={() => {
              setUser(u.id);
              onClose();
            }}
            className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50", u.id === user.id && "bg-slate-50")}
          >
            <Avatar name={u.name} id={u.id} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{u.name}</span>
              <span className="block text-xs text-slate-500">{u.role}</span>
            </span>
            {u.id === user.id && <span className="text-[11px] font-medium text-[#1D6FE0]">Signed in</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ScenarioDrawer() {
  const api = useApp();
  const steps = scenarioSteps(api.state);
  const current = steps.find((s) => !s.done);
  return (
    <Drawer open={api.state.ui.scenarioOpen} title="Transaction scenario" onClose={() => api.setUi({ scenarioOpen: false })} wide>
      <p className="text-sm leading-relaxed text-slate-600">
        SO-1042 walks one order from customer to cash, with risk and segregation of duties in the same path. Steps already staged are marked done.
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#0B132B]" style={{ width: `${(steps.filter((s) => s.done).length / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.n} className={cn("rounded-xl border px-3 py-2.5", !step.done && current?.n === step.n ? "border-[#3A86FF]/40 bg-blue-50/40" : "border-[#E6EAF1]")}>
            <div className="flex items-start gap-3">
              <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", step.done ? "bg-[#0B132B] text-white" : "bg-slate-100 text-slate-500")}>
                {step.done ? <Icon name="check" className="h-3 w-3" /> : step.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-slate-500">{step.detail}</div>
              </div>
              <button
                className="text-xs font-medium text-[#1D6FE0]"
                onClick={() => {
                  api.setUi({ scenarioOpen: false });
                  api.navigate({ page: step.page, id: step.id });
                }}
              >
                Open
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={() => { api.resetDemo(); api.setUi({ scenarioOpen: false }); }}>Reset demo</Button>
        <Button onClick={() => { api.setUi({ scenarioOpen: false }); api.navigate({ page: "case", id: "SO-1042" }); }}>Open SO-1042</Button>
      </div>
    </Drawer>
  );
}

function CommandPalette() {
  const api = useApp();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const hits = useMemo(() => {
    const query = q.trim().toLowerCase();
    const pages = NAV.flatMap((g) => g.items.map((i) => ({ group: "Navigate", label: i.label, hint: g.label, page: i.page as Page, id: undefined as string | undefined })));
    pages.push({ group: "Navigate", label: "Settings", hint: "Administration", page: "settings", id: undefined });
    const records = [
      ...api.state.customers.map((c) => ({ group: "Customers", label: c.company, hint: c.contact, page: "customer" as Page, id: c.id })),
      ...api.state.orders.map((o) => ({ group: "Orders", label: o.id, hint: api.state.customers.find((c) => c.id === o.customerId)?.company ?? "", page: "order" as Page, id: o.id })),
      ...api.state.invoices.map((i) => ({ group: "Invoices", label: i.id, hint: api.state.customers.find((c) => c.id === i.customerId)?.company ?? "", page: "invoice" as Page, id: i.id })),
      ...api.state.quotations.map((qt) => ({ group: "Quotations", label: qt.id, hint: api.state.customers.find((c) => c.id === qt.customerId)?.company ?? "", page: "quotation" as Page, id: qt.id })),
      ...api.state.risks.map((r) => ({ group: "Risks", label: r.id, hint: r.category, page: "register" as Page, id: r.id })),
    ];
    return [...pages, ...records]
      .filter((h) => !query || `${h.label} ${h.hint} ${h.group}`.toLowerCase().includes(query))
      .slice(0, 12);
  }, [q, api.state]);

  useEffect(() => setIdx(0), [q, api.state.ui.commandOpen]);

  if (!api.state.ui.commandOpen) return null;
  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center px-4 pt-[12vh]">
      <button className="absolute inset-0 bg-[#0B132B]/40" aria-label="Close search" onClick={() => api.setUi({ commandOpen: false })} />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[#E6EAF1] bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[#E6EAF1] px-4">
          <Icon name="search" className="text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(hits.length - 1, i + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter" && hits[idx]) {
                api.navigate({ page: hits[idx].page, id: hits[idx].id });
                setQ("");
              }
              if (e.key === "Escape") api.setUi({ commandOpen: false });
            }}
            placeholder="Search or jump to…"
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
          <span className="text-[10px] text-slate-400">ESC</span>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {hits.length === 0 && <div className="px-3 py-8 text-center text-sm text-slate-500">No matches for “{q}”.</div>}
          {hits.map((hit, i) => (
            <button
              key={`${hit.group}-${hit.label}-${hit.id ?? ""}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => {
                api.navigate({ page: hit.page, id: hit.id });
                setQ("");
              }}
              className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === idx && "bg-slate-50")}
            >
              <span className="w-20 shrink-0 text-[10px] font-medium tracking-wide text-slate-400 uppercase">{hit.group}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{hit.label}</span>
                <span className="block truncate text-xs text-slate-500">{hit.hint}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="border-t border-[#E6EAF1] px-4 py-2 text-[11px] text-slate-400">{pageTitle(api.state.view.page)} · ↑↓ to move · Enter to open</div>
      </div>
    </div>
  );
}
