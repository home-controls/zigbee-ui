// Fails when a file of the Zigbee UI kit copy next to it was changed by hand (see KIT.json).
// Change the kit in the zigbee-ui repo instead, then copy it again with its tools/sync.mjs.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const m = JSON.parse(readFileSync(join(dir, "KIT.json"), "utf8"));
const bad = [];
for (const [f, want] of Object.entries(m.files)) {
  const p = join(dir, f);
  if (!existsSync(p)) { bad.push(`${f} (missing)`); continue; }
  let b = readFileSync(p);
  if (!/\.(png|woff2?)$/.test(f)) b = Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n"));
  if (createHash("sha256").update(b).digest("hex") !== want) bad.push(f);
}
if (bad.length) {
  console.error(`zigbee-ui ${m.version}: changed by hand: ${bad.join(", ")}\nChange the kit (zigbee-ui repo) and sync it again.`);
  process.exit(1);
}
console.log(`zigbee-ui ${m.version}: ${Object.keys(m.files).length} files as synced`);
