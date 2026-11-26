// The one layout every Zigbee app uses: the logo and the app's name (a menu to the other apps when
// they are known), page tabs on top (at the bottom on a phone), status on the right, a banner
// line, the page, one dialog and the toasts.

import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Icon, Logo } from "./icons";
import { href } from "./route";
import { Dialog } from "./dialog";
import { Toasts } from "./toast";
import { nextTheme, themeChoice } from "./theme";

export type AppId = "studio" | "sniffer" | "bridge";

/** The family. Same logo, one name each. */
export const APPS: Record<AppId, { name: string; blurb: string }> = {
  studio: { name: "Zigbee Studio", blurb: "Devices, groups and settings for Zigbee2MQTT" },
  sniffer: { name: "Zigbee Sniffer", blurb: "What the radios hear: signal, routes, the mesh" },
  bridge: { name: "Zigbee Bridge", blurb: "The coordinator on Ethernet" },
};

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  /** A count on the tab (e.g. updates waiting); hidden when 0 or missing. */
  badge?: number;
}

export function Shell({ app, version, nav, page, right, banner, links = {}, embedded, children }: {
  app: AppId;
  version?: string;
  nav: NavItem[];
  /** The id of the tab to mark as current. */
  page: string;
  /** Status pills and buttons on the right of the top bar. */
  right?: ComponentChildren;
  /** One banner line under the top bar (connection lost, restart needed, …), or nothing. */
  banner?: ComponentChildren;
  /** Where the other apps are, when this app knows (an add-on's panel, the bridge's address). */
  links?: Partial<Record<AppId, string>>;
  /** Inside Home Assistant: HA's theme rules, so there is no theme button. */
  embedded?: boolean;
  children: ComponentChildren;
}) {
  const tabs = (cls: "tabs" | "bottom-tabs") => (
    <nav class={cls} aria-label="Pages">
      {nav.map((n) => (
        <a href={href(n.id)} class={page === n.id ? "active" : ""} aria-current={page === n.id ? "page" : undefined} title={n.label}>
          <Icon name={n.icon} size={cls === "tabs" ? 18 : 20} />
          <span>{n.label}</span>
          {!!n.badge && <span class="badge">{n.badge}</span>}
        </a>
      ))}
    </nav>
  );
  return (
    <div class={`shell app-${app}`}>
      <header class="top">
        <Brand app={app} version={version} links={links} />
        {tabs("tabs")}
        <div class="top-right">
          {right}
          {!embedded && <ThemeButton />}
        </div>
      </header>
      {banner}
      <main>{children}</main>
      {tabs("bottom-tabs")}
      <Dialog />
      <Toasts />
    </div>
  );
}

export function Brand({ app, version, links = {} }: { app: AppId; version?: string; links?: Partial<Record<AppId, string>> }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const others = (Object.keys(APPS) as AppId[]).filter((a) => a !== app && links[a]);
  const name = APPS[app].name;
  const tip = version ? `${name} ${version}` : name;
  useEffect(() => {
    if (!open) return;
    const off = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  if (!others.length) {
    return <div class="brand" title={tip}><Logo size={24} /><span>{name}</span></div>;
  }
  return (
    <div class="brand" ref={box}>
      <button type="button" class="brand-btn" title={tip} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Logo size={24} /><span>{name}</span><Icon name="caret" size={16} class="caret" />
      </button>
      {open && (
        <div class="apps-menu" role="menu">
          {(Object.keys(APPS) as AppId[]).filter((a) => a === app || links[a]).map((a) => (
            <a role="menuitem" class={a === app ? "current" : ""} href={a === app ? href() : links[a]}
              // another page of Home Assistant replaces this one; another machine (the bridge) opens beside it
              target={a === app ? undefined : /^https?:/.test(links[a] || "") ? "_blank" : "_top"}
              rel={/^https?:/.test(links[a] || "") ? "noopener" : undefined}
              onClick={() => setOpen(false)}>
              <Logo size={28} />
              <b>{APPS[a].name}{a === app && version ? <span class="brand-ver"> {version}</span> : null}</b>
              <small>{APPS[a].blurb}</small>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeButton() {
  const t = themeChoice.value;
  return (
    <button type="button" class="icon-btn" aria-label="Theme" title={`Theme: ${t === "auto" ? "follows the system" : t} (click to change)`}
      onClick={nextTheme}>
      <Icon name={t === "light" ? "sun" : t === "dark" ? "moon" : "contrast"} size={18} />
    </button>
  );
}

/** The whole page while the app has nothing to show yet. */
export function Splash({ children }: { children: ComponentChildren }) {
  return (
    <div class="splash">
      <Logo size={44} />
      <p>{children}</p>
    </div>
  );
}

/** A status pill: a coloured dot and a word (the word hides on narrow screens; the title stays). */
export function Pill({ ok, tone, label, title, icon, href: to }: {
  /** true = ok (green), false = bad (red), null/undefined = neutral; `tone` overrides. */
  ok?: boolean | null; tone?: "ok" | "warn" | "bad"; label: ComponentChildren; title?: string; icon?: string; href?: string;
}) {
  const cls = `pill ${tone ?? (ok === null || ok === undefined ? "" : ok ? "ok" : "bad")}`;
  const inner = <>{icon ? <Icon name={icon} size={13} /> : <span class="dot" />}<span class="pill-text">{label}</span></>;
  return to ? <a class={cls} href={to} title={title}>{inner}</a> : <span class={cls} title={title}>{inner}</span>;
}
