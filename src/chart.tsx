// Small hand-drawn SVG charts: a line chart (with a min–max band and reference lines) and a
// stacked column chart. Both follow the pointer with a crosshair and one tooltip listing every
// series, show a legend for two or more series, and open as a table.

import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

export type XY = [number, number | null, number | null, number | null]; // x, y, low, high
export type LineSeries = { name: string; color: string; points: XY[] };
export type RefLine = { y: number; color: string; label: string };
export type Stack = { name: string; color: string; values: number[] };
export type Extra = { name: string; values: (number | null)[]; format?: (v: number) => string };

const M = { l: 44, r: 14, t: 10, b: 22 };

export function useWidth(): [preact.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(240, el.clientWidth)));
    ro.observe(el);
    setW(Math.max(240, el.clientWidth));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Clean ticks: 3–5 round numbers covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, want = 4): number[] {
  if (!isFinite(lo) || !isFinite(hi)) return [0, 1];
  if (lo === hi) { lo -= 1; hi += 1; }
  const raw = (hi - lo) / want;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
  const out = [];
  for (let v = Math.floor(lo / step) * step; v <= hi + step * 0.001; v += step) out.push(Math.round(v * 1e6) / 1e6);
  if (out[out.length - 1] < hi) out.push(out[out.length - 1] + step);
  return out;
}

export function compact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e4) return `${(v / 1e3).toFixed(0)}K`;
  return v.toLocaleString();
}

function timeTicks(x0: number, x1: number): { x: number; label: string }[] {
  const span = x1 - x0;
  const step = span <= 3600 * 1.5 ? 900 : span <= 6 * 3600 + 60 ? 3600 : span <= 26 * 3600 ? 3 * 3600 : 86400;
  const out = [];
  const tz = new Date().getTimezoneOffset() * 60; // align to local hours/days
  for (let t = Math.ceil((x0 - tz) / step) * step + tz; t <= x1; t += step) {
    const d = new Date(t * 1000);
    const label = step >= 86400 ? d.toLocaleDateString([], { weekday: "short", day: "numeric" })
      : d.getMinutes() === 0 ? d.toLocaleTimeString([], { hour: "numeric" })
        : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    out.push({ x: t, label });
  }
  return out;
}

function stamp(t: number, span: number): string {
  const d = new Date(t * 1000);
  return span > 26 * 3600
    ? d.toLocaleString([], { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nearest(xs: number[], x: number): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
  return best;
}

function Legend({ items, kind, refs = [] }: { items: { name: string; color: string }[]; kind: "line" | "rect"; refs?: RefLine[] }) {
  if (items.length < 2 && !refs.length) return null;
  const showItems = items.length > 1 || refs.length > 0;
  return (
    <div class="chart-legend">
      {showItems && items.map((s) => (
        <span><i class={`key ${kind}`} style={{ background: s.color }} />{s.name}</span>
      ))}
      {refs.map((r) => <span><i class="key line ref" style={{ background: r.color }} />{r.label}</span>)}
    </div>
  );
}

function Tip({ left, w, children }: { left: number; w: number; children: ComponentChildren }) {
  const flip = left > w / 2;
  return (
    <div class="chart-tip" style={flip ? { right: `${w - left + 10}px` } : { left: `${left + 10}px` }}>{children}</div>
  );
}

function TableView({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details class="chart-table">
      <summary>Table</summary>
      <div class="table-wrap">
        <table class="data">
          <thead><tr>{head.map((h) => <th>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr>{r.map((c) => <td>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------- line chart

export function LineChart({ series, refs = [], x0, x1, height = 180, unit = "", label, zero, step }: {
  series: LineSeries[]; refs?: RefLine[]; x0: number; x1: number; height?: number; unit?: string; label: string;
  /** Counts and rates: the axis starts at 0 and spans at least 0 to 1. */
  zero?: boolean;
  /** Seconds between points when the data is regular: a missing point (more than 1.5 steps) breaks the line. */
  step?: number;
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const ys: number[] = zero ? [0, 1] : [];
  for (const s of series) for (const p of s.points) for (const v of [p[1], p[2], p[3]]) if (v !== null) ys.push(v);
  // A reference line only stretches the axis when the data comes near it (a 50 ms line over 8 ms answers
  // would flatten the data to the floor); otherwise it's left out.
  const dataMax = ys.length ? Math.max(...ys) : 0;
  refs = refs.filter((r) => r.y <= dataMax * 1.6);
  for (const r of refs) ys.push(r.y);
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys)).filter((v) => !zero || v >= 0);
  const lo = ticks[0], hi = ticks[ticks.length - 1];
  const iw = w - M.l - M.r, ih = height - M.t - M.b;
  const X = (t: number) => M.l + ((t - x0) / (x1 - x0 || 1)) * iw;
  const Y = (v: number) => M.t + (1 - (v - lo) / (hi - lo || 1)) * ih;
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b);
  const gap = step ? step * 1.5 : xs.length > 1 ? Math.min(...xs.slice(1).map((x, i) => x - xs[i])) * 1.5 : Infinity;

  const path = (pts: XY[], k: 1 | 2 | 3) => {
    let d = "", prev: number | null = null;
    for (const p of pts) {
      const v = p[k];
      if (v === null) { prev = null; continue; }
      d += `${prev === null || p[0] - prev > gap ? "M" : "L"}${X(p[0]).toFixed(1)},${Y(v).toFixed(1)}`;
      prev = p[0];
    }
    return d;
  };
  const band = (pts: XY[]) => {
    const runs: XY[][] = [];
    let cur: XY[] = [];
    for (const p of pts) {
      if (p[2] === null || p[3] === null || (cur.length && p[0] - cur[cur.length - 1][0] > gap)) {
        if (cur.length) runs.push(cur);
        cur = [];
        if (p[2] === null || p[3] === null) continue;
      }
      cur.push(p);
    }
    if (cur.length) runs.push(cur);
    return runs.map((r) => "M" + r.map((p) => `${X(p[0]).toFixed(1)},${Y(p[3]!).toFixed(1)}`).join("L")
      + "L" + [...r].reverse().map((p) => `${X(p[0]).toFixed(1)},${Y(p[2]!).toFixed(1)}`).join("L") + "Z").join("");
  };
  const onMove = (e: PointerEvent) => {
    if (!xs.length) return;
    const box = (e.currentTarget as SVGElement).getBoundingClientRect();
    const t = x0 + ((e.clientX - box.left - M.l) / iw) * (x1 - x0);
    setHover(xs[nearest(xs, t)]);
  };
  const fmt = (v: number | null) => (v === null || v === undefined ? "—" : `${Math.round(v * 10) / 10}${unit ? " " + unit : ""}`);
  const at = (s: LineSeries, x: number) => s.points.find((p) => p[0] === x);

  return (
    <div class="chart" ref={ref}>
      <Legend items={series} kind="line" refs={refs} />
      <div class="chart-box">
        <svg width={w} height={height} role="img" aria-label={label} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((v) => (
            <g>
              <line class="grid" x1={M.l} x2={w - M.r} y1={Y(v)} y2={Y(v)} />
              <text class="tick" x={M.l - 6} y={Y(v) + 4} text-anchor="end">{v}</text>
            </g>
          ))}
          {timeTicks(x0, x1).map((t) => <text class="tick" x={X(t.x)} y={height - 6} text-anchor="middle">{t.label}</text>)}
          {series.map((s) => <path d={band(s.points)} fill={s.color} fill-opacity="0.1" stroke="none" />)}
          {refs.map((r) => <line x1={M.l} x2={w - M.r} y1={Y(r.y)} y2={Y(r.y)} stroke={r.color} stroke-opacity="0.55" stroke-width="1" />)}
          {series.map((s) => <path d={path(s.points, 1)} fill="none" stroke={s.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />)}
          {hover !== null && (
            <g>
              <line class="crosshair" x1={X(hover)} x2={X(hover)} y1={M.t} y2={height - M.b} />
              {series.map((s) => {
                const p = at(s, hover);
                return p && p[1] !== null ? <circle cx={X(hover)} cy={Y(p[1])} r="4" fill={s.color} stroke="var(--surface)" stroke-width="2" /> : null;
              })}
            </g>
          )}
          <rect x={M.l} y={M.t} width={iw} height={ih} fill="transparent" />
        </svg>
        {hover !== null && (
          <Tip left={X(hover)} w={w}>
            <div class="tip-head">{stamp(hover, x1 - x0)}</div>
            {series.map((s) => {
              const p = at(s, hover);
              return (
                <div class="tip-row">
                  <i class="key line" style={{ background: s.color }} />
                  <b>{fmt(p?.[1] ?? null)}</b>
                  {p && p[2] !== null && <span class="muted"> {Math.round(p[2]!)} to {Math.round(p[3]!)}</span>}
                  <span class="muted"> {s.name}</span>
                </div>
              );
            })}
          </Tip>
        )}
      </div>
      <TableView head={["Time", ...series.flatMap((s) => [s.name, `${s.name} low`, `${s.name} high`])]}
        rows={xs.map((x) => [stamp(x, x1 - x0), ...series.flatMap((s) => {
          const p = at(s, x);
          return [p?.[1] ?? "—", p?.[2] ?? "—", p?.[3] ?? "—"];
        })])} />
    </div>
  );
}

// ---------------------------------------------------------------------- stacked columns

function colPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function ColumnChart({ xs, stacks, extras = [], x0, x1, bucket, height = 160, label }: {
  xs: number[]; stacks: Stack[]; extras?: Extra[]; x0: number; x1: number; bucket: number; height?: number; label: string;
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const totals = xs.map((_, i) => stacks.reduce((a, s) => a + (s.values[i] || 0), 0));
  const ticks = niceTicks(0, Math.max(1, ...totals));
  const hi = ticks[ticks.length - 1];
  const iw = w - M.l - M.r, ih = height - M.t - M.b;
  const X = (t: number) => M.l + ((t - x0) / (x1 - x0 || 1)) * iw;
  const Y = (v: number) => M.t + (1 - v / hi) * ih;
  const slot = (bucket / (x1 - x0 || 1)) * iw;
  const bw = Math.max(1, Math.min(24, slot - 2));
  const onMove = (e: PointerEvent) => {
    if (!xs.length) return;
    const box = (e.currentTarget as SVGElement).getBoundingClientRect();
    const t = x0 + ((e.clientX - box.left - M.l) / iw) * (x1 - x0) - bucket / 2;
    setHover(nearest(xs, t));
  };
  return (
    <div class="chart" ref={ref}>
      <Legend items={stacks} kind="rect" />
      <div class="chart-box">
        <svg width={w} height={height} role="img" aria-label={label} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((v) => (
            <g>
              <line class="grid" x1={M.l} x2={w - M.r} y1={Y(v)} y2={Y(v)} />
              <text class="tick" x={M.l - 6} y={Y(v) + 4} text-anchor="end">{compact(v)}</text>
            </g>
          ))}
          {timeTicks(x0, x1).map((t) => <text class="tick" x={X(t.x)} y={height - 6} text-anchor="middle">{t.label}</text>)}
          {xs.map((x, i) => {
            let base = 0;
            const left = X(x) + (slot - bw) / 2;
            const tops = stacks.map((s) => s.values[i] || 0);
            const last = tops.map((v, k) => (v > 0 ? k : -1)).reduce((a, b) => Math.max(a, b), -1);
            return (
              <g class={hover === null || hover === i ? "" : "dim"}>
                {stacks.map((s, k) => {
                  const v = s.values[i] || 0;
                  if (v <= 0) return null;
                  const y0 = Y(base), y1 = Y(base + v);
                  base += v;
                  const gapPx = k < last ? 2 : 0; // a 2px surface gap between stacked parts
                  const h = Math.max(0, y0 - y1 - gapPx);
                  return k === last
                    ? <path d={colPath(left, y1, bw, h, 4)} fill={s.color} />
                    : <rect x={left} y={y1 + gapPx} width={bw} height={h} fill={s.color} />;
                })}
              </g>
            );
          })}
          <rect x={M.l} y={M.t} width={iw} height={ih} fill="transparent" />
        </svg>
        {hover !== null && xs[hover] !== undefined && (
          <Tip left={X(xs[hover]) + slot / 2} w={w}>
            <div class="tip-head">{stamp(xs[hover], x1 - x0)}</div>
            {stacks.map((s) => (
              <div class="tip-row"><i class="key rect" style={{ background: s.color }} /><b>{(s.values[hover] || 0).toLocaleString()}</b><span class="muted"> {s.name}</span></div>
            ))}
            {extras.map((e) => {
              const v = e.values[hover];
              return <div class="tip-row"><i class="key none" /><b>{v === null || v === undefined ? "—" : e.format ? e.format(v) : v.toLocaleString()}</b><span class="muted"> {e.name}</span></div>;
            })}
          </Tip>
        )}
      </div>
      <TableView head={["Time", ...stacks.map((s) => s.name), ...extras.map((e) => e.name)]}
        rows={xs.map((x, i) => [stamp(x, x1 - x0), ...stacks.map((s) => s.values[i] || 0),
          ...extras.map((e) => { const v = e.values[i]; return v === null || v === undefined ? "—" : e.format ? e.format(v) : v; })])} />
    </div>
  );
}
