import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.PORTAL_URL || "https://client-portal-zeta-rust.vercel.app";
const outDir = path.join(__dirname, "..", "public", "screenshots");
fs.mkdirSync(outDir, { recursive: true });

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("wrote", file);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});

await page.goto(BASE, { waitUntil: "networkidle" });
await shot(page, "home");

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await shot(page, "login");

await page.fill("#email", "admin@demo.portal");
await page.fill("#password", "DemoAdmin123!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard**", { timeout: 60000 });
await page.waitForTimeout(800);
await shot(page, "admin-dashboard");

await page.goto(`${BASE}/projects`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const first = page.locator('a[href^="/projects/"]').first();
if (await first.count()) {
  await first.click();
  await page.waitForTimeout(1000);
  await shot(page, "project-thread");
}

await page.goto(`${BASE}/invoices`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await shot(page, "invoices");

await browser.close();

// compress to jpg via sips
import { execSync } from "child_process";
for (const name of ["home", "login", "admin-dashboard", "project-thread", "invoices"]) {
  const png = path.join(outDir, `${name}.png`);
  if (!fs.existsSync(png)) continue;
  const jpg = path.join(outDir, `${name}.jpg`);
  execSync(`sips -Z 1600 "${png}" --out "${png}" >/dev/null`);
  execSync(`sips -s format jpeg -s formatOptions 72 "${png}" --out "${jpg}" >/dev/null`);
  fs.unlinkSync(png);
  console.log("jpg", jpg);
}
