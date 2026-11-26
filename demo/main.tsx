// The kit's gallery: every shared piece on one page, as each app would show it.
//   npm run dev  ->  http://localhost:5175/
import { render } from "preact";
import { useState } from "preact/hooks";
import "../src/tokens.css";
import "../src/base.css";
import "../src/zigbee.css";
import { APPS, type AppId, Pill, Shell } from "../src/shell";
import { Card, Chip, Empty, KV, Lqi, Search, Seg, Slider, Stat, Toggle, readOnly } from "../src/ui";
import { LineChart, type XY } from "../src/chart";
import { confirmIt } from "../src/dialog";
import { toast } from "../src/toast";
import { initTheme } from "../src/theme";
import { route, setDefaultPage } from "../src/route";
import { ago, bytes, duration, nowS } from "../src/format";

const { embedded } = initTheme("zui.theme");
setDefaultPage("overview");

const NAV = [
  { id: "overview", label: "Overview", icon: "health" },
  { id: "devices", label: "Devices", icon: "list" },
  { id: "traffic", label: "Traffic", icon: "signal", badge: 3 },
  { id: "map", label: "Map", icon: "mesh" },
  { id: "settings", label: "Settings", icon: "gear" },
];

function Gallery() {
  const [app, setApp] = useState<AppId>("studio");
  const [on, setOn] = useState(true);
  const [lvl, setLvl] = useState(140);
  const [q, setQ] = useState("");
  const t0 = nowS() - 3600;
  const pts = (k: number): XY[] => Array.from({ length: 60 }, (_, i) => { const v = -70 + 8 * Math.sin(i / (6 + k)) - k * 6; return [t0 + i * 60, v, v - 3, v + 3]; });
  return (
    <Shell app={app} version="1.0.0" nav={NAV} page={route.value[0]} embedded={embedded}
      links={{ studio: "#/", sniffer: "#/", bridge: "#/" }}
      right={<>
        <Pill ok label="Online" title="Connected" />
        <Pill tone="warn" icon="download" label="Update 1.0.1" />
        <Pill ok={false} label="2 offline" />
      </>}
      banner={<div class="banner warn">A banner line: reconnecting… showing the last known state.</div>}>
      <div class="page">
        <div class="page-head">
          <div><h1>{APPS[app].name}</h1><p class="lede">{APPS[app].blurb}</p></div>
          <div class="toolbar">
            <Seg label="App" value={app} onChange={setApp} options={[{ v: "studio", label: "Studio" }, { v: "sniffer", label: "Sniffer" }, { v: "bridge", label: "Bridge" }]} />
            <Search value={q} onInput={setQ} placeholder="Search" />
          </div>
        </div>
        <div class="stats">
          <Stat label="Devices" value="73" sub="2 offline" />
          <Stat label="Frames / s" value="15.2" tone="ok" sub="last minute" />
          <Stat label="Retries" value="3.1 %" tone="warn" sub="last hour" />
          <Stat label="Errors" value="1" tone="bad" sub={ago(nowS() - 400)} />
        </div>
        <div class="masonry">
          <Card title="Controls" actions={<button class="btn small" onClick={() => toast("Saved")}>Toast</button>}>
            <div class="toolbar">
              <Toggle on={on} onChange={setOn} label="Power" />
              <button class="btn" onClick={() => (readOnly.value = !readOnly.value)}>{readOnly.value ? "Allow control" : "Read-only"}</button>
              <button class="btn primary" onClick={async () => toast((await confirmIt({ title: "Do it?", body: "A dialog.", confirm: "Do it" })) ? "Done" : "Cancelled", "info")}>Dialog</button>
              <button class="btn danger" onClick={() => confirmIt({ title: "Remove Desk Lamp?", danger: true, typeToConfirm: "Desk Lamp", confirm: "Remove" })}>Danger</button>
            </div>
            <Slider label="Brightness" value={lvl} min={0} max={254} onSend={setLvl} />
          </Card>
          <Card title="Chips and link quality">
            <div class="chips"><Chip tone="ok">ok</Chip><Chip tone="warn">warning</Chip><Chip tone="bad">problem</Chip><Chip tone="info" icon="info">note</Chip><Chip tone="muted">not heard</Chip></div>
            <p><Lqi v={180} /> <Lqi v={90} /> <Lqi v={30} /></p>
            <span class="cost cost-good">1</span> <span class="cost cost-fair">3</span> <span class="cost cost-poor">5</span> <span class="cost cost-bad">7</span>
          </Card>
          <Card title="Key and value">
            <KV rows={[["Uptime", duration(93784)], ["Stored", bytes(48_213_000)], ["Seen", ago(nowS() - 75)], ["Channel", "25"]]} />
          </Card>
          <Card title="Signal"><LineChart label="RSSI" unit="dBm" x0={t0} x1={t0 + 3600}
            series={[{ name: "Sniffer 2", color: "var(--series-1)", points: pts(0) }, { name: "HA box", color: "var(--series-2)", points: pts(1) }]} /></Card>
          <Card title="Empty"><Empty>Nothing here yet.</Empty></Card>
        </div>
      </div>
    </Shell>
  );
}

render(<Gallery />, document.getElementById("app")!);
