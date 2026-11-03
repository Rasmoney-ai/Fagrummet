import puppeteer from "puppeteer-core";
const [room, ...pairs] = process.argv.slice(2); // step:s:out
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 760 });
await page.goto(`http://localhost:8765/?room=${room}&autostart=1&silent=1&ui=0`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.__fagrum && window.__fagrum.ready(), { timeout: 60000 });
for (const p of pairs) { const [st, s, out] = p.split(":");
  await page.evaluate((id, s) => { window.__roomS = +s; window.__fagrum.setStep(id); }, st, s);
  await new Promise(r => setTimeout(r, 6000)); await page.screenshot({ path: out }); }
await browser.close();
