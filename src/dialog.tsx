// One in-page dialog for confirmations and short inputs (the browser's own confirm() blocks the
// whole page and looks foreign inside Home Assistant). Destructive ones can ask for a name to be
// typed before the button works.

import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { signal } from "@preact/signals";
import { Icon } from "./icons";

interface Field {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  type?: "text" | "number" | "checkbox"; // a checkbox gives "true" or ""
}

interface Ask {
  title: string;
  body?: ComponentChildren;
  confirm: string;
  danger?: boolean;
  typeToConfirm?: string; // the button stays off until this is typed
  fields?: Field[];
}

interface Open extends Ask {
  resolve: (v: Record<string, string> | null) => void;
}

const current = signal<Open | null>(null);

/** Resolves with the field values (an empty object if there are none) or null if cancelled. */
export function ask(a: Ask): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    current.value?.resolve(null);
    current.value = { ...a, resolve };
  });
}

export async function confirmIt(a: Ask): Promise<boolean> {
  return (await ask(a)) !== null;
}

export function Dialog() {
  const d = current.value;
  const [values, setValues] = useState<Record<string, string>>({});
  const [typed, setTyped] = useState("");
  const first = useRef<HTMLInputElement>(null);
  const okBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!d) return;
    setValues(Object.fromEntries((d.fields || []).map((f) => [f.name, f.value ?? ""])));
    setTyped("");
    setTimeout(() => (first.current ?? okBtn.current)?.focus(), 0);
  }, [d]);
  if (!d) return null;
  const close = (v: Record<string, string> | null) => {
    current.value = null;
    d.resolve(v);
  };
  const blocked = !!d.typeToConfirm && typed.trim() !== d.typeToConfirm;
  return (
    <div class="palette-back" onClick={() => close(null)} onKeyDown={(e) => e.key === "Escape" && close(null)}>
      <form class="dialog" role="dialog" aria-modal="true" aria-label={d.title} onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (!blocked) close(values); }}>
        <h2>{d.danger && <Icon name="alert" size={18} />}{d.title}</h2>
        {d.body && <div class="dialog-body">{d.body}</div>}
        {(d.fields || []).map((f, i) => f.type === "checkbox" ? (
          <label class="check">
            <input type="checkbox" checked={values[f.name] === "true"}
              onChange={(e) => setValues({ ...values, [f.name]: (e.target as HTMLInputElement).checked ? "true" : "" })} />
            <span>{f.label}</span>
          </label>
        ) : (
          <label class="dialog-field">
            <span>{f.label}</span>
            <input ref={i === 0 ? first : undefined} type={f.type || "text"} value={values[f.name] ?? ""} placeholder={f.placeholder}
              onInput={(e) => setValues({ ...values, [f.name]: (e.target as HTMLInputElement).value })} />
          </label>
        ))}
        {d.typeToConfirm && (
          <label class="dialog-field">
            <span>Type <b>{d.typeToConfirm}</b> to confirm</span>
            <input ref={d.fields?.some((f) => f.type !== "checkbox") ? undefined : first} value={typed} autoComplete="off" spellcheck={false}
              onInput={(e) => setTyped((e.target as HTMLInputElement).value)} />
          </label>
        )}
        <div class="dialog-btns">
          <button type="button" class="btn" onClick={() => close(null)}>Cancel</button>
          <button ref={okBtn} class={`btn ${d.danger ? "danger" : "primary"}`} disabled={blocked}>{d.confirm}</button>
        </div>
      </form>
    </div>
  );
}
