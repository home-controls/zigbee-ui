// Short messages in the corner (bottom on phones), the same in every app.

import { signal } from "@preact/signals";
import { Icon } from "./icons";

export type ToastKind = "ok" | "info" | "warn" | "error";
export interface Toast { id: number; kind: ToastKind; text: string; }

export const toasts = signal<Toast[]>([]);
let next = 1;

/** Show a message for `ms` (at most five at once; the oldest goes first). */
export function toast(text: string, kind: ToastKind = "ok", ms = 4000): void {
  const t = { id: next++, kind, text };
  toasts.value = [...toasts.value.slice(-4), t];
  setTimeout(() => (toasts.value = toasts.value.filter((x) => x.id !== t.id)), ms);
}

export function Toasts() {
  return (
    <div class="toasts" role="status" aria-live="polite">
      {toasts.value.map((t) => (
        <div class={`toast ${t.kind}`} key={t.id}>
          <Icon name={t.kind === "ok" ? "check" : t.kind === "error" ? "alert" : "info"} size={16} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
