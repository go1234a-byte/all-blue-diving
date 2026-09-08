// Capture the current live landing for both stores.
//   ios-live/     1242x2688  (App Store 6.5")
//   android-live/ 1236x2472  (Play phone, exactly 2:1)
// Run from repo root: node store-assets/capture-live.mjs   (BASE=http://localhost:4174/ for a local preview)
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const CHROME = "/Users/kimjin-tae/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.54/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE = process.env.BASE || "https://allbluedive.com/";

const DEVICES = [
  { out: "store-assets/ios-live", w: 414, h: 896, dsf: 3 },
  { out: "store-assets/android-live", w: 412, h: 824, dsf: 3 },
];

const SHOTS = [
  { name: "01-hero", sel: "header.ab-hero", align: "top" },
  { name: "02-guide-banner", sel: "#guide .ab-banner", align: "center" },
  { name: "03-liveaboard", sel: "#liveaboard .ab-banner", align: "center" },
  { name: "04-story", sel: "#story", align: "center" },
  { name: "05-tours", sel: "#tours", align: "top" },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell", args: ["--no-sandbox"] });

for (const d of DEVICES) {
  mkdirSync(d.out, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: d.dsf, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage["allblue-diver-popup-dismiss-until"] = Date.now() + 9e9;
      localStorage["allblue-splash-shown"] = "true";
    } catch {}
  });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)); }
    scrollTo(0, 0); await new Promise((r) => setTimeout(r, 600));
  });

  for (const s of SHOTS) {
    const ok = await page.evaluate((sel, align) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const nav = document.querySelector("nav.ab-nav");
      const navH = nav ? nav.getBoundingClientRect().height + 14 : 16;
      const rect = el.getBoundingClientRect();
      let y = scrollY + rect.top - navH;
      if (align === "center") y = scrollY + rect.top - Math.max(navH, (innerHeight - rect.height) / 2);
      scrollTo(0, Math.max(0, Math.round(y)));
      return true;
    }, s.sel, s.align);
    if (!ok) { console.log(`skip ${s.name} (no ${s.sel})`); continue; }
    await new Promise((r) => setTimeout(r, 650));
    await page.screenshot({ path: `${d.out}/${s.name}.png` });
    console.log(`${d.out}/${s.name}.png`);
  }
  await page.close();
}
await browser.close();
console.log("done");
