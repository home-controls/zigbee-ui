// Where the other Zigbee apps are, for the app menu. Inside Home Assistant a page can ask HA (its
// parent page, same origin, the signed-in admin) which add-ons are installed: that finds Zigbee
// Studio and Zigbee Sniffer from either of them. The bridge's address is only known to Zigbee
// Studio, which tells it (and only it, never the bridge's token) at its api/family, read through
// HA's ingress. Outside HA (the bridge's own page, development) nothing is found.

import { useEffect, useState } from "preact/hooks";
import type { AppId } from "./shell";

type Links = Partial<Record<AppId, string>>;

const SLUG: Record<"studio" | "sniffer", RegExp> = {
  studio: /^(?:[0-9a-f]{8}_|local_)?zigbee_studio$/,
  sniffer: /^(?:[0-9a-f]{8}_|local_)?zigbee_sniffer$/,
};

function hassOf(): any {
  try {
    return window.parent !== window ? (window.parent.document.querySelector("home-assistant") as any)?.hass : null;
  } catch {
    return null; // not same-origin: not inside HA
  }
}

/** An add-on's slug from its panel path ("/<slug>", "/app/<slug>" or "/hassio/ingress/<slug>"). */
export function slugOf(panel: string): string {
  return panel.replace(/^\/(app\/|hassio\/ingress\/)?/, "").split("/")[0];
}

/** Where Home Assistant shows an add-on's page. Current HA serves every add-on at /app/<slug> (its
 * panels are of type "app"); older HA used the sidebar panel's own path, or /hassio/ingress/<slug>
 * for one not in the sidebar. */
export function panelHref(panel: string | null | undefined): string | null {
  if (!panel) return null;
  const slug = slugOf(panel);
  const panels = Object.values(hassOf()?.panels || {}) as any[];
  if (panels.length && !panels.some((x) => x.component_name === "app")) {
    const own = panels.find((x) => x.config?.ingress === slug || x.config?.addon === slug);
    return own ? `/${own.url_path}` : `/hassio/ingress/${slug}`;
  }
  return `/app/${slug}`;
}

let found: Promise<Links> | null = null;

async function discover(): Promise<Links> {
  const hass = hassOf();
  if (!hass?.callWS) return {};
  const out: Links = {};
  try {
    const res = await hass.callWS({ type: "supervisor/api", endpoint: "/addons", method: "get" });
    const addons: { slug: string; state?: string }[] = res?.addons || [];
    // a started one before a stopped one (an old install from another store may still be around)
    const pick = (rx: RegExp) =>
      addons.filter((a) => rx.test(a.slug)).sort((a, b) => Number(a.state !== "started") - Number(b.state !== "started"))[0];
    const studio = pick(SLUG.studio), sniffer = pick(SLUG.sniffer);
    if (studio) out.studio = panelHref("/" + studio.slug) ?? undefined;
    if (sniffer) out.sniffer = panelHref("/" + sniffer.slug) ?? undefined;
    if (studio?.state === "started") {
      const info = await hass.callWS({ type: "supervisor/api", endpoint: `/addons/${studio.slug}/info`, method: "get" });
      if (typeof info?.ingress_url === "string") {
        const r = await fetch(`${info.ingress_url.replace(/\/?$/, "/")}api/family`, { credentials: "same-origin" });
        const fam = r.ok ? await r.json() : null;
        if (typeof fam?.bridge === "string" && /^https?:\/\//.test(fam.bridge)) out.bridge = fam.bridge;
      }
    }
  } catch {
    /* not an admin, or an older Studio without api/family: show what was found */
  }
  return out;
}

/** The other apps' pages for <Shell links>: what this app already knows wins over what is found. */
export function useFamily(known: Links = {}): Links {
  const [f, setF] = useState<Links>({});
  useEffect(() => {
    let live = true;
    (found ??= discover()).then((v) => live && setF(v));
    return () => { live = false; };
  }, []);
  const mine = Object.fromEntries(Object.entries(known).filter(([, v]) => !!v)) as Links;
  return { ...f, ...mine };
}
