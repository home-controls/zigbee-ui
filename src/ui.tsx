// Small building blocks shared by every Zigbee app.

import type { ComponentChildren, JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { signal } from "@preact/signals";
import { Icon } from "./icons";

/** True while the app may only look, not act (e.g. Zigbee Studio before "Allow control"). Toggles
 * and sliders then show values instead of controls that would do nothing. Apps set it. */
export const readOnly = signal(false);

export function Toggle({ on, onChange, disabled, label }: { on: boolean | undefined; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  const locked = readOnly.value;
  return (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label}
      class={`toggle ${on ? "on" : ""} ${on === undefined ? "unknown" : ""} ${locked ? "locked" : ""}`}
      disabled={disabled} title={locked ? "Read-only" : undefined}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onChange(!on);
      }}>
      <span class="knob" />
    </button>
  );
}

/** A slider that shows the dragged value at once, sends while dragging (throttled) and on
 * release, then follows the device again. */
export function Slider({ value, min, max, step = 1, onSend, label, format, track, disabled, empty }: {
  value: number | undefined; min: number; max: number; step?: number; onSend: (v: number) => void;
  label: string; format?: (v: number) => string; track?: string; disabled?: boolean;
  /** What to say while there is no value (an option left at its default) */
  empty?: string;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const last = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const hold = useRef<number | undefined>(undefined);
  const shown = drag ?? value ?? min;
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(hold.current); }, []);
  const send = (v: number, final: boolean) => {
    const now = performance.now();
    clearTimeout(timer.current);
    if (final || now - last.current > 180) {
      last.current = now;
      onSend(v);
    } else {
      timer.current = window.setTimeout(() => {
        last.current = performance.now();
        onSend(v);
      }, 180 - (now - last.current));
    }
  };
  const pctv = Math.max(0, Math.min(100, ((shown - min) / (max - min || 1)) * 100));
  if (readOnly.value) {
    // read-only: the value and a quiet bar, not a control that does nothing
    return (
      <div class="slider ro">
        <div class="slider-head">
          <span>{label}</span>
          <span class="slider-val">{value === undefined || value === null ? "—" : format ? format(value) : value}</span>
        </div>
        <div class={`meter ${track ? "custom-track" : ""}`} style={track ? ({ "--track": track } as any) : undefined}>
          <i style={{ width: `${value === undefined || value === null ? 0 : pctv}%` }} />
        </div>
      </div>
    );
  }
  const unset = drag === null && (value === undefined || value === null);
  return (
    <div class={`slider ${unset ? "unset" : ""}`}>
      <div class="slider-head">
        <span>{label}</span>
        <span class="slider-val">{unset && empty ? empty : format ? format(shown) : shown}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={shown} aria-label={label}
        disabled={disabled || readOnly.value}
        style={{ "--p": `${pctv}%`, ...(track ? { "--track": track } : {}) } as any}
        class={track ? "custom-track" : ""}
        onInput={(e) => {
          const v = Number((e.target as HTMLInputElement).value);
          setDrag(v);
          clearTimeout(hold.current);
          send(v, false);
        }}
        onChange={(e) => {
          const v = Number((e.target as HTMLInputElement).value);
          send(v, true);
          // keep showing the sent value until the device has had a moment to report it
          hold.current = window.setTimeout(() => setDrag(null), 1200);
        }} />
    </div>
  );
}

export function Chip({ children, tone, title, icon }: { children: ComponentChildren; tone?: "ok" | "warn" | "bad" | "info" | "muted"; title?: string; icon?: string }) {
  return (
    <span class={`chip ${tone || ""}`} title={title}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export function Lqi({ v, title }: { v: number | undefined; title?: string }) {
  if (v === undefined || v === null) return <span class="muted">—</span>;
  const tone = v >= 120 ? "ok" : v >= 60 ? "warn" : "bad";
  const bars = v >= 160 ? 4 : v >= 110 ? 3 : v >= 60 ? 2 : 1;
  return (
    <span class={`lqi ${tone}`} title={title ?? `Link quality ${v} (last hop, as the coordinator heard it)`}>
      <span class="bars">{[1, 2, 3, 4].map((i) => <i class={i <= bars ? "lit" : ""} style={{ height: `${3 + i * 3}px` }} />)}</span>
      {v}
    </span>
  );
}

export function Card({ title, children, actions, class: cls }: { title?: ComponentChildren; children: ComponentChildren; actions?: ComponentChildren; class?: string }) {
  return (
    <section class={`card ${cls || ""}`}>
      {(title || actions) && (
        <header class="card-head">
          <h2>{title}</h2>
          {actions && <div class="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ComponentChildren; sub?: ComponentChildren; tone?: string }) {
  return (
    <div class={`stat ${tone || ""}`}>
      <div class="stat-label">{label}</div>
      <div class="stat-value">{value}</div>
      {sub && <div class="stat-sub">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ComponentChildren }) {
  return <div class="empty">{children}</div>;
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: ComponentChildren }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div class="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" aria-pressed={o.v === value} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

export function KV({ rows }: { rows: [string, ComponentChildren][] }) {
  return (
    <dl class="kv">
      {rows.map(([k, v]) => (
        <>
          <dt>{k}</dt>
          <dd>{v ?? "—"}</dd>
        </>
      ))}
    </dl>
  );
}

export function Search({ value, onInput, placeholder, autoFocus }: { value: string; onInput: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, []);
  return (
    <label class="search">
      <Icon name="search" size={16} />
      <input ref={ref} type="search" value={value} placeholder={placeholder} aria-label={placeholder}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)} />
    </label>
  );
}

export function Ext({ href, children, title, newTab }: { href: string; children: ComponentChildren; title?: string; newTab?: boolean }): JSX.Element {
  return (
    <a class="ext" href={href} target={newTab ? "_blank" : "_top"} rel={newTab ? "noopener" : undefined} title={title}>
      {children}
      <Icon name="external" size={13} />
    </a>
  );
}

/** RSSI with the same four-bar look as Lqi. */
export function Rssi({ v, title }: { v: number | undefined; title?: string }) {
  if (v === undefined || v === null) return <span class="muted">—</span>;
  const tone = v >= -70 ? "ok" : v >= -82 ? "warn" : "bad";
  const bars = v >= -60 ? 4 : v >= -70 ? 3 : v >= -82 ? 2 : 1;
  return (
    <span class={`lqi ${tone}`} title={title ?? `Signal ${v} dBm`}>
      <span class="bars">{[1, 2, 3, 4].map((i) => <i class={i <= bars ? "lit" : ""} style={{ height: `${3 + i * 3}px` }} />)}</span>
      {v} dBm
    </span>
  );
}

/** A labelled input for a .form-grid. */
export function Field({ label, children, help }: { label: string; children: ComponentChildren; help?: ComponentChildren }) {
  return (
    <label>
      <span>{label}</span>
      {children}
      {help && <span class="field-help">{help}</span>}
    </label>
  );
}

export async function copyText(t: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    // http:// pages may not get the async clipboard; fall back to a selection copy
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
