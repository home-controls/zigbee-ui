// Hash routing: an add-on page sits under Home Assistant's ingress path and the bridge serves one
// file, so the page's own path stays in the hash (#/device/0x00…/settings).

import { signal } from "@preact/signals";

let fallback = "home";

function parse(): string[] {
  const h = location.hash.replace(/^#\/?/, "");
  return h ? h.split("/").map(decodeURIComponent) : [fallback];
}

/** The current route's parts. */
export const route = signal<string[]>(parse());

/** Set the page shown for an empty hash (each app's first tab). Call once at start. */
export function setDefaultPage(page: string): void {
  fallback = page;
  route.value = parse();
}

window.addEventListener("hashchange", () => {
  route.value = parse();
  document.querySelector("main")?.scrollTo?.({ top: 0 });
});

export function href(...parts: string[]): string {
  return "#/" + parts.map(encodeURIComponent).join("/");
}

export function go(...parts: string[]): void {
  location.hash = href(...parts);
}
