// Copies the kit into an app:  node <zigbee-ui>/tools/sync.mjs <app>/web/src/kit
// Writes KIT.json (kit version + a SHA-256 per file) and check.mjs next to the copy. The app's
// build runs check.mjs, which fails when a copied file was edited by hand: change the kit, then sync.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dest = process.argv[2] && resolve(process.argv[2]);
if (!dest) {
  console.error("usage: node tools/sync.mjs <app>/web/src/kit");
  process.exit(2);
}
const version = readFileSync(join(root, "VERSION"), "utf8").trim();
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
// text files hash with LF line ends, so a CRLF checkout on Windows still matches
const hash = (p) => {
  let b = readFileSync(p);
  if (!/\.(png|woff2?)$/.test(p)) b = Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n"));
  return createHash("sha256").update(b).digest("hex");
};

// files the previous sync put there and the kit no longer has
const oldManifest = join(dest, "KIT.json");
if (existsSync(oldManifest)) {
  for (const f of Object.keys(JSON.parse(readFileSync(oldManifest, "utf8")).files)) {
    if (!existsSync(join(src, f))) rmSync(join(dest, f), { force: true });
  }
}
const files = {};
for (const p of walk(src).sort()) {
  const rel = relative(src, p).split(sep).join("/");
  mkdirSync(dirname(join(dest, rel)), { recursive: true });
  copyFileSync(p, join(dest, rel));
  files[rel] = hash(p);
}
writeFileSync(oldManifest, JSON.stringify({ kit: "zigbee-ui", version, files }, null, 2) + "\n");
copyFileSync(join(root, "tools", "check.mjs"), join(dest, "check.mjs"));
console.log(`zigbee-ui ${version}: ${Object.keys(files).length} files -> ${dest}`);
