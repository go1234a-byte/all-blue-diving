import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const CHROME = "/Users/kimjin-tae/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.54/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE = process.env.BASE || "http://localhost:4174/"; // run from store-assets/

const DEVICES = [
  { key: "ios", w: 428, h: 926, dsf: 3 },      // -> 1284 x 2778
  { key: "android", w: 360, h: 720, dsf: 3 },  // -> 1080 x 2160 (2:1, Play-compliant)
];

const SHOTS = [
  { name: "01-hero", sel: "header.ab-hero", align: "top" },
  { name: "02-monthly-tours", sel: "#guide .ab-subhead", align: "top", pickMonth: true },
  { name: "03-guide-banner", sel: "#guide .ab-banner", align: "center" },
  { name: "04-liveaboard", sel: "#liveaboard .ab-banner", align: "center" },
  { name: "05-tours", sel: "#tours", align: "top" },
  { name: "06-instructors", sel: "#instructors", align: "top" },
  { name: "07-reviews", sel: ".ab-rev", align: "top" },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell", args: ["--no-sandbox"] });

for (const d of DEVICES) {
  const dir = `${d.key}`;
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: d.dsf, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage["allblue-diver-popup-dismiss-until"] = Date.now() + 9e9;
      localStorage["allblue-splash-shown"] = "true";
    } catch {}
  });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1600));
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)); }
    scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500));
  });

  // pick a month tab that actually has departing tours, so section 2 isn't an empty state
  await page.evaluate(async () => {
    const btns = [...document.querySelectorAll("#guide .ab-months button")];
    const cur = new Date().getMonth();
    const order = [cur, ...[...Array(12).keys()].filter((i) => i !== cur)];
    for (const i of order) {
      btns[i]?.click();
      await new Promise((r) => setTimeout(r, 300));
      if (document.querySelector("#guide .ab-tourrow .ab-tcard")) return;
    }
    btns[cur]?.click();
  });
  await new Promise((r) => setTimeout(r, 400));

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
    if (!ok) { console.log(`  [${d.key}] skip ${s.name}`); continue; }
    await new Promise((r) => setTimeout(r, 550));
    await page.screenshot({ path: `${dir}/${s.name}.png` });
    console.log(`  [${d.key}] ${s.name}.png`);
  }
  await page.close();
}
await browser.close();
console.log("done");
