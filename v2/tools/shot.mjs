/* Testværktøj: tager skærmbilleder af et rum og rapporterer fejl, trekanter og draw calls.
 *   node tools/shot.mjs <rum-id> [trin-id ...] [--out mappe] [--wide]
 * Kræver at en webserver kører i v2/ på port 8765:  (cd v2 && python3 -m http.server 8765 &)
 * Uden trin-id fotograferes hvert trin i rummet. Billederne lægges i tools/shots/<rum>/<trin>.png */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const room = args[0];
const outIdx = args.indexOf("--out");
const outDir = outIdx > -1 ? args[outIdx + 1] : path.join(path.dirname(new URL(import.meta.url).pathname), "shots", room);
const wide = args.includes("--wide");
let steps = args.slice(1).filter((a, i, all) => !a.startsWith("--") && all[i] !== outDir);
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: wide ? 1600 : 1200, height: wide ? 900 : 760 });
const errors = [];
page.on("console", m => { if (["error", "warn"].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
page.on("requestfailed", r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push(`requestfailed: ${r.url()}`); });

const base = "http://localhost:8765/";
await page.goto(`${base}?room=${room}&autostart=1&silent=1&ui=0`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.__fagrum && window.__fagrum.ready(), { timeout: 60000 });
if (!steps.length) steps = await page.evaluate(r => fetch("manus.json").then(x => x.json()).then(a => a.filter(s => s.room === r).map(s => s.id)), room);

const report = [];
for (const s of steps) {
  await page.evaluate(id => window.__fagrum.setStep(id), s);
  await new Promise(r => setTimeout(r, 4200));   // lad kamera-animation (1,4 s, langsom under swiftshader) og rummets animationer køre
  const f = path.join(outDir, `${s}.png`);
  await page.screenshot({ path: f });
  const st = await page.evaluate(() => window.__fagrum.stats());
  report.push({ step: s, ...st, file: f });
}
console.log(JSON.stringify({ room, report, errors: [...new Set(errors)].slice(0, 40) }, null, 1));
await browser.close();
