// Light / dark. Inside Home Assistant (an add-on's ingress page is on HA's own origin) the page
// follows HA's theme: HA's theme variables are read from the parent document and re-read now and
// then, so switching theme or dark mode in HA follows without a reload. Anywhere else (the bridge,
// development) the viewer picks Auto / Dark / Light, remembered per app in localStorage.

import { signal } from "@preact/signals";

const MAP: [string, string][] = [
  ["--bg", "--primary-background-color"],
  ["--surface", "--card-background-color"],
  ["--text", "--primary-text-color"],
  ["--muted", "--secondary-text-color"],
  ["--accent", "--primary-color"],
  ["--border", "--divider-color"],
  ["--on", "--state-light-active-color"],
  ["--ok", "--success-color"],
  ["--warn", "--warning-color"],
  ["--bad", "--error-color"],
  ["--info", "--info-color"],
];

function hostRoot(): HTMLElement | null {
  try {
    return window.parent !== window ? window.parent.document.documentElement : null;
  } catch {
    return null; // not same-origin: not inside HA
  }
}

function luminance(color: string): number | null {
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  if (!m) return null;
  const [r, g, b] = m.map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function inHomeAssistant(): boolean {
  return hostRoot() !== null;
}

/** Take Home Assistant's theme when the page is inside HA. True if it is. */
export function followHomeAssistant(): boolean {
  const host = hostRoot();
  if (!host) return false;
  let last = "";
  const apply = () => {
    const cs = getComputedStyle(host);
    const values = MAP.map(([, theirs]) => cs.getPropertyValue(theirs).trim());
    const key = values.join("|");
    if (key === last) return;
    last = key;
    const root = document.documentElement;
    MAP.forEach(([mine], i) => (values[i] ? root.style.setProperty(mine, values[i]) : root.style.removeProperty(mine)));
    const bg = values[0];
    const lum = bg ? luminance(bg) : null;
    root.dataset.theme = lum !== null && lum > 0.5 ? "light" : "dark";
  };
  apply();
  setInterval(apply, 4000);
  window.addEventListener("focus", apply);
  document.documentElement.dataset.embedded = "ha";
  return true;
}

export type ThemeChoice = "auto" | "light" | "dark";

/** The viewer's own choice, used when the page is not inside HA. */
export const themeChoice = signal<ThemeChoice>("auto");
let storageKey = "";

/** Start theming: follow HA when embedded, else the remembered choice. Call once, before render.
 * `key` is the app's localStorage key (also read by its index.html, so there is no flash). */
export function initTheme(key: string): { embedded: boolean } {
  storageKey = key;
  const embedded = followHomeAssistant();
  if (!embedded) {
    try {
      const t = localStorage.getItem(key);
      themeChoice.value = t === "light" || t === "dark" ? t : "auto";
    } catch { /* private window: auto */ }
    themeChoice.subscribe(apply);
  }
  return { embedded };
}

function apply(t: ThemeChoice) {
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  try {
    if (t === "auto") localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, t);
  } catch { /* fine */ }
}

export function nextTheme(): void {
  themeChoice.value = themeChoice.value === "auto" ? "dark" : themeChoice.value === "dark" ? "light" : "auto";
}
