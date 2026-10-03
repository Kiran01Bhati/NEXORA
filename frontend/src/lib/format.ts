export function formatINR(value: number, compact = false): string {
  const sign = value < 0 ? "-" : "";
  const n = Math.abs(Math.round(value));
  if (compact) {
    if (n >= 10000000) {
      const cr = n / 10000000;
      return `${sign}₹${trimNum(cr)}Cr`;
    }
    if (n >= 100000) {
      const l = n / 100000;
      return `${sign}₹${trimNum(l)}L`;
    }
    if (n >= 1000) return `${sign}₹${trimNum(n / 1000)}K`;
  }
  return `${sign}₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`;
}

function trimNum(n: number) {
  const fixed = n >= 10 ? n.toFixed(1) : n.toFixed(1);
  return fixed.replace(/\.0$/, "");
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function fromNow(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  const abs = Math.abs(min);
  if (abs < 1) return "Just now";
  if (abs < 60) return min >= 0 ? `${min}m ago` : `in ${-min}m`;
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return hr >= 0 ? `${hr}h ago` : `in ${-hr}h`;
  const day = Math.round(hr / 24);
  if (Math.abs(day) < 14) return day >= 0 ? `${day}d ago` : `in ${-day}d`;
  return formatDate(iso);
}

export function minsAgo(mins: number) {
  return new Date(Date.now() - mins * 60000).toISOString();
}

export function daysFromNow(days: number, hours = 10, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function todayInputValue() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function greeting(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${g}, ${name.split(" ")[0]}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
