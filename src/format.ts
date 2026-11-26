// Formatting helpers: the same wording in every Zigbee app.

import { signal } from "@preact/signals";

/** Ticks every 15 s, so "5 min ago" texts stay true without anything else changing. */
export const tick = signal(0);
setInterval(() => tick.value++, 15000);

let skewS = 0;
/** Seconds to add to this browser's clock to match the device or server the app talks to. */
export function setClockSkew(s: number): void {
  skewS = s;
}

/** Now, in seconds, on the app's clock. Reading it subscribes a component to the 15 s tick. */
export function nowS(): number {
  tick.value;
  return Date.now() / 1000 + skewS;
}

export function ago(ts: number | undefined | null, now = nowS()): string {
  if (!ts) return "—";
  const s = Math.max(0, now - ts);
  if (s < 10) return "just now";
  if (s < 60) return `${Math.round(s)} s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${(s / 3600).toFixed(s < 36000 ? 1 : 0)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export function isoToTs(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? undefined : t / 1000;
}

export function clock(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** The time of day, with the date in front when it isn't today. */
export function dayClock(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toDateString() === new Date().toDateString()
    ? clock(ts)
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function duration(sec: number | undefined | null): string {
  if (!sec && sec !== 0) return "—";
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  if (!d && !h && !m) return `${Math.floor(sec)} s`;
  return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
}

export function hex(n: number | undefined | null, width = 4): string {
  return n === undefined || n === null ? "—" : "0x" + n.toString(16).padStart(width, "0").toUpperCase();
}

export function bytes(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KiB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 ** 2 ? 1 : 0)} MiB`;
  return `${(n / 1024 ** 3).toFixed(1)} GiB`;
}

export function count(v: number | undefined | null): string {
  return v === undefined || v === null ? "—" : v.toLocaleString();
}

export function pct(v: number | undefined | null, digits = 0): string {
  return v === undefined || v === null ? "—" : `${(v * 100).toFixed(digits)} %`;
}

export function title(s: string): string {
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Every word of the query appears somewhere in the fields (any order, any case). */
export function matches(query: string, ...fields: (string | undefined | null)[]): boolean {
  const hay = fields.filter(Boolean).join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}
