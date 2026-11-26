// Stroke icons (24×24, currentColor), hand-drawn to keep bundles small, and the shared logo.
// One set for every Zigbee app, so the same thing has the same icon everywhere.

import type { JSX } from "preact";
import { LOGO_PNG } from "./logo";

const P: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  groups: "M4 7h16v4H4zM4 15h16v4H4zM8 9h.01M8 17h.01",
  logs: "M4 5h16v14H4zM7.5 9.5 10 12l-2.5 2.5M12 15h4.5",
  health: "M3 12h4l2.5-6 4 12 2.5-6H21",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3-4.3-4.3",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  toggle: "M8 6h8a6 6 0 0 1 0 12H8A6 6 0 0 1 8 6zm8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  outlet: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 9v3M15 9v3M10 16h4",
  door: "M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14 12h.01",
  motion: "M13 4.5a1.5 1.5 0 1 0 0-.01M9 21l2-6 2.5 2.5V21M8 12l2-3.5 3.5-1 2 3.5 2.5 1M11 15l-1.5-3",
  thermo: "M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0zM12 9v7",
  air: "M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7",
  keypad: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 7h6M9 11h6M9 15h6",
  router: "M4 15h16v5H4zM8 17.5h.01M12 11v4M8.5 8.5a5 5 0 0 1 7 0M6 6a8.5 8.5 0 0 1 12 0",
  coordinator: "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2",
  sensor: "M12 3v4M12 17v4M3 12h4M17 12h4M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  cover: "M4 4h16M5 4v16M19 4v16M5 8h14M5 12h14M5 16h14",
  lock: "M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11",
  fan: "M12 12m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M12 10.5C12 6 13 3 15.5 3S19 6 13.5 11M13.5 12c4.5 0 7.5 1 7.5 3.5S18 19 13 13.5M12 13.5c0 4.5-1 7.5-3.5 7.5S5 18 10.5 13M10.5 12C6 12 3 11 3 8.5S6 5 11 10.5",
  battery: "M3 8h15v8H3zM21 11v2M6 11v2",
  signal: "M4 20v-3M9 20v-7M14 20v-11M19 20V5",
  mesh: "M5 20a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM19 20a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM12 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM6 16.3l5-8.6M18 16.3l-5-8.6M7 18h10",
  map: "M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  download: "M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  terminal: "M4 5h16v14H4zM7.5 9.5 10 12l-2.5 2.5M12 15h4.5",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  chevron: "m9 6 6 6-6 6",
  back: "M15 6 9 12l6 6",
  x: "M6 6l12 12M18 6 6 18",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1.5v2M12 20.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  pause: "M8 5v14M16 5v14",
  play: "M7 5v14l11-7z",
  alert: "M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  check: "M5 12.5 10 17.5 19 7",
  refresh: "M20 11a8 8 0 0 0-14.8-4M4 4v4h4M4 13a8 8 0 0 0 14.8 4M20 20v-4h-4",
  pencil: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  plus: "M12 5v14M5 12h14",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  filter: "M4 5h16l-6 8v5l-4 2v-7z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  power: "M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0",
  contrast: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 3v18M12 7.5h4M12 12h5M12 16.5h4",
  caret: "m7 10 5 5 5-5",
  apps: "M5 5h4v4H5zM15 5h4v4h-4zM5 15h4v4H5zM15 15h4v4h-4z",
  antenna: "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2",
  ethernet: "M4 6h16v10H4zM8 16v3M16 16v3M12 16v3M8 10h.01M12 10h.01M16 10h.01",
  usb: "M12 3v15M12 3l-2.5 3h5zM12 18a2 2 0 1 0 0 .01M12 13l-4-2.5V8M12 10.5l4-2V6M7 7h2v2H7zM15 4.5h2v2h-2z",
  frames: "M4 6h16M4 10h16M4 14h10M4 18h7",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  chip: "M7 7h10v10H7zM9.5 4v3M14.5 4v3M9.5 17v3M14.5 17v3M4 9.5h3M4 14.5h3M17 9.5h3M17 14.5h3",
  zigbee: "M5 5h14L5 19h14M8 9.5h6.5M9.5 14.5H16",
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 20, class: cls, title }: { name: IconName | string; size?: number; class?: string; title?: string }): JSX.Element {
  return (
    <svg class={`icon ${cls || ""}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      <path d={P[name] || P.sensor} />
    </svg>
  );
}

/** The shared logo (the Zigbee mark), the same in every app. */
export function Logo({ size = 24, title }: { size?: number; title?: string }): JSX.Element {
  return <img class="logo" src={LOGO_PNG} width={size} height={size} alt={title ?? ""} aria-hidden={title ? undefined : "true"} draggable={false} />;
}
