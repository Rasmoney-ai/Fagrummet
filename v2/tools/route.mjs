/* Integrationstest: går hele den anbefalede rute igennem med "Næste" og afprøver alle døre.
 *   node tools/route.mjs        (kræver server på 8765 i v2/)
 * Melder fejl, manglende døre, døre der ikke fører det rigtige sted hen, og trekanter/draw calls pr. trin. */
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage(); await page.setViewport({ width: 1000, height: 640 });
const errors = [];
page.on("console", m => { if (["error", "warn"].includes(m.type()) && !/useLegacyLights|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
page.on("pageerror", e => errors.push("pageerror: " + e.message));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitReady = () => page.waitForFunction(() => window.__fagrum && window.__fagrum.ready(), { timeout: 60000 });
await page.goto("http://localhost:8765/?autostart=1&silent=1", { waitUntil: "domcontentloaded" });
await waitReady();
const manus = await page.evaluate(() => fetch("manus.json").then(r => r.json()));
const ROOMS = await page.evaluate(() => import("./js/data.js").then(m => JSON.parse(JSON.stringify(m.ROOMS))));
// 1) ruten
const seen = []; let worst = { tri: 0, calls: 0 };
for (let i = 0; i < manus.length + 1; i++) {
  const c = await page.evaluate(() => window.__fagrum.current());
  const st = await page.evaluate(() => window.__fagrum.stats());
  seen.push(c.step); worst.tri = Math.max(worst.tri, st.triangles); worst.calls = Math.max(worst.calls, st.calls);
  if (i === manus.length) break;
  await page.evaluate(() => window.__fagrum.next()); await sleep(400); await waitReady(); await sleep(300);
}
const missing = manus.map(s => s.id).filter(id => !seen.includes(id));
// 2) dørene i hvert rum
const doorProblems = [];
for (const [id, r] of Object.entries(ROOMS)) {
  await page.evaluate(id => window.__fagrum.goRoom(id), id); await sleep(500); await waitReady();
  const doors = await page.evaluate(() => window.__fagrum.doors());
  const want = [...(r.parent ? [r.parent] : []), ...r.children];
  for (const w of want) if (!doors.includes(w)) doorProblems.push(`${id}: mangler dør til ${w}`);
  for (const d of doors) if (!want.includes(d)) doorProblems.push(`${id}: uventet dør til ${d}`);
  for (const d of doors) {
    await page.evaluate(id => window.__fagrum.goRoom(id), id); await sleep(500); await waitReady();
    await page.evaluate(to => window.__fagrum.clickDoor(to), d); await sleep(700); await waitReady();
    const now = await page.evaluate(() => window.__fagrum.current().room);
    if (now !== d) doorProblems.push(`${id}: døren til ${d} førte til ${now}`);
  }
}
console.log(JSON.stringify({ routeSteps: seen.length - 1, wrapsTo: seen.at(-1), missing, doorProblems, worst, errors: [...new Set(errors)].slice(0, 30) }, null, 1));
await browser.close();
