import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const port = 3000;
const apiPort = 8080;
const origin = `http://127.0.0.1:${port}`;
const now = new Date();
const pickupStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
const pickupEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

function json(response, value, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

const backend = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${apiPort}`);
  const path = url.pathname.replace(/^\/api\/v1/, "");
  const token = request.headers.authorization ?? "";
  const role = token.includes("support-token") ? "SUPPORT"
    : token.includes("admin-token") ? "ADMIN" : "MERCHANT_OWNER";

  if (path === "/me") {
    return json(response, {
      id: "00000000-0000-4000-8000-000000000001",
      email: "browser-smoke@kulha.test",
      fullName: "KULHA Browser Smoke",
      phone: null,
      emailVerified: true,
      roles: [role],
    });
  }
  if (path === "/merchants/me/workspace") {
    return json(response, {
      shopName: "Boulangerie Test", city: "Casablanca", liveOffers: 2,
      reservedToday: 3, basketsToday: 4, toCollectNow: 1, collectedToday: 2,
      todayOrders: [], offers: [],
    });
  }
  if (path === "/merchants/me/orders") {
    return json(response, [{
      reference: "KULHA-SMOKE-001", customerName: "Client Test", basket: "Panier du fournil",
      quantity: 1, pickupStart, pickupEnd, amountMinor: 4000, status: "CONFIRMED",
      createdAt: now.toISOString(),
    }]);
  }
  if (path === "/merchants/me/staff") return json(response, []);
  if (path === "/admin/support-cases" || path === "/admin/audit-log"
      || path === "/admin/merchants" || path === "/admin/offers") {
    return json(response, { items: [], page: 0, size: 20, total: 0 });
  }
  if (path === "/reservations/pickup/check" && request.method === "POST") {
    for await (const chunk of request) { void chunk; }
    return json(response, {
      reference: "KULHA-SMOKE-001", merchantName: "Boulangerie Test",
      offerTitle: "Panier du fournil", quantity: 1, totalPriceMinor: 4000,
      currency: "MAD", pickupStart, pickupEnd, status: "CONFIRMED",
      validationState: "VALID", canConfirm: true,
    });
  }
  if (path === "/reservations/collect" && request.method === "POST") {
    for await (const _chunk of request) { /* consume request body */ }
    return json(response, {
      reference: "KULHA-SMOKE-001", offerTitle: "Panier du fournil", status: "COMPLETED",
    });
  }
  if (request.method !== "GET") {
    for await (const _chunk of request) { /* consume request body */ }
  }
  return json(response, {});
});

const app = spawn("pnpm", ["exec", "next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: {
    ...process.env,
    API_BASE_URL: `http://127.0.0.1:${apiPort}`,
    APP_ORIGIN: origin,
    NODE_ENV: "production",
  },
  stdio: "inherit",
});

async function waitFor(url, child) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Next.js exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch { /* server is still starting */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let browser;
try {
  await new Promise(resolve => backend.listen(apiPort, "127.0.0.1", resolve));
  await waitFor(origin + "/fr/login", app);
  const cliPath = realpathSync(process.env.PLAYWRIGHT_CLI);
  const { chromium } = await import(pathToFileURL(join(dirname(cliPath), "index.mjs")).href);
  browser = await chromium.launch({ headless: true });
  const sizes = [
    { width: 1920, height: 1080 },
    { width: 1365, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ];
  const routes = [
    { path: "/fr/merchant/orders", token: "merchant-token", heading: "Commandes" },
    { path: "/fr/merchant/reservations/scan", token: "merchant-token", heading: "Scanner un retrait" },
    { path: "/fr/admin/support-cases", token: "support-token", heading: "Dossiers support" },
    { path: "/fr/admin/audit-log", token: "admin-token", heading: "Journal d’audit" },
  ];

  for (const route of routes) {
    const context = await browser.newContext();
    await context.addCookies([{
      name: "kulha_at", value: route.token, url: origin, httpOnly: true, sameSite: "Lax",
    }]);
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto(origin + route.path, { waitUntil: "networkidle", timeout: 30000 });
      await page.getByRole("heading", { name: route.heading }).waitFor({ state: "visible", timeout: 15000 });
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      if (dimensions.document > dimensions.viewport + 1 || dimensions.body > dimensions.viewport + 1) {
        throw new Error(`Horizontal overflow at ${size.width}px on ${route.path}: ${JSON.stringify(dimensions)}`);
      }
    }
    if (pageErrors.length) throw new Error(`Browser errors on ${route.path}: ${pageErrors.join("; ")}`);
    await context.close();
    process.stdout.write(`PASS viewport matrix: ${route.path}\n`);
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{
    name: "kulha_at", value: "merchant-token", url: origin, httpOnly: true, sameSite: "Lax",
  }]);
  const page = await context.newPage();
  await page.goto(origin + "/fr/merchant/reservations/scan", { waitUntil: "networkidle" });
  await page.getByLabel("Référence de réservation").fill("KULHA-SMOKE-001");
  await page.getByLabel("Code de retrait").fill("ABCD");
  await page.getByRole("button", { name: "Vérifier le code" }).click();
  await page.getByText("Retrait valide").waitFor({ state: "visible", timeout: 10000 });
  await page.getByRole("button", { name: "Confirmer la remise" }).click();
  await page.getByRole("heading", { name: "Panier remis au client" }).waitFor({ state: "visible", timeout: 10000 });
  const scannerWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (scannerWidth > 391) throw new Error(`Pickup workflow overflows 390px viewport: ${scannerWidth}px`);
  await context.close();

  const rtlContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await rtlContext.addCookies([{
    name: "kulha_at", value: "merchant-token", url: origin, httpOnly: true, sameSite: "Lax",
  }]);
  const rtlPage = await rtlContext.newPage();
  await rtlPage.goto(origin + "/ar/merchant/reservations/scan", { waitUntil: "networkidle" });
  const rtl = await rtlPage.locator("main").getAttribute("dir");
  const rtlWidth = await rtlPage.evaluate(() => document.documentElement.scrollWidth);
  if (rtl !== "rtl" || rtlWidth > 391) throw new Error(`RTL viewport check failed: dir=${rtl}, width=${rtlWidth}`);
  await rtlContext.close();

  process.stdout.write("PASS pickup preview -> confirm workflow at 390px\n");
  process.stdout.write("PASS Arabic RTL pickup scanner at 390px\n");
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  backend.close();
}
