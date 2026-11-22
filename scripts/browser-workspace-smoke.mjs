import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdirSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const port = 3000;
const apiPort = 8080;
const origin = `http://localhost:${port}`;
const actorId = "00000000-0000-4000-8000-000000000001";
const customerId = "00000000-0000-4000-8000-000000000002";
const now = new Date();
const pickupStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
const pickupEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
const requests = [];
let staff = [];
let merchantStatus = "PENDING";
let offerStatus = "PUBLISHED";
let caseStatus = "OPEN";

const merchant = {
  id: "00000000-0000-4000-8000-000000000101", ownerUserId: customerId,
  ownerEmail: "owner@kulha.test", name: "Boulangerie Test", businessType: "BAKERY",
  address: "12 Avenue Hassan II", city: "Casablanca", phone: "+212600000001",
  openingHours: "08:00–18:00", status: merchantStatus, decisionReason: null, createdAt: now.toISOString(),
};
const offer = {
  id: "00000000-0000-4000-8000-000000000102", title: "Panier du fournil",
  shopName: "Boulangerie Test", city: "Casablanca", priceMinor: 4000, originalPriceMinor: 8000,
  quantityTotal: 10, quantityReserved: 2, allergensStatus: "UNKNOWN", allergens: null,
  foodNotes: "Prepared today", status: offerStatus, reportedCount: 2,
  pickupStart, pickupEnd, imageUrl: null,
};
const supportCase = {
  id: "00000000-0000-4000-8000-000000000103", reference: "SUP-2026-0001",
  category: "FOOD_SAFETY", subject: "Allergen information needs review",
  description: "Customer asks about allergen information.", priority: "HIGH", status: caseStatus,
  customerUserId: customerId, customerLabel: "Customer ·••• 002",
  merchantId: merchant.id, merchantName: merchant.name, offerId: offer.id,
  offerTitle: offer.title, reservationReference: "KULHA-SMOKE-001", assignedTo: actorId,
  assigneeName: "Support Agent", hiddenOffer: false, createdAt: now.toISOString(),
  updatedAt: now.toISOString(), resolvedAt: null,
};
const timeline = [{
  id: "00000000-0000-4000-8000-000000000104", authorType: "CUSTOMER",
  authorUserId: customerId, authorLabel: "Customer", visibility: "CUSTOMER",
  message: "Can you confirm the allergens?", createdAt: now.toISOString(),
}];

function json(response, value, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}
function page(items) { return { items, page: 0, size: 20, total: items.length }; }
async function bodyOf(request) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}
function csv(response, filename) {
  response.writeHead(200, {
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename="${filename}"`,
  });
  response.end("reference,amount\nKULHA-SMOKE-001,40.00\n");
}

const backend = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${apiPort}`);
  const path = url.pathname.replace(/^\/api\/v1/, "");
  const method = request.method ?? "GET";
  const token = request.headers.authorization ?? "";
  const role = token.includes("support-token") ? "SUPPORT"
    : token.includes("admin-token") ? "ADMIN" : "MERCHANT_OWNER";
  requests.push({ method, path, query: url.search, token });

  if (path === "/auth/login" && method === "POST") {
    const payload = await bodyOf(request);
    const accessToken = String(payload.email ?? "").split("@")[0];
    return json(response, { accessToken, refreshToken: `refresh-${accessToken}`, expiresIn: 3600 });
  }
  if (path === "/me") {
    return json(response, {
      id: actorId, email: "browser-smoke@kulha.test", fullName: "KULHA Browser Smoke",
      phone: null, emailVerified: true, roles: [role],
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
  if (path === "/merchants/me/staff" && method === "GET") return json(response, staff);
  if (path === "/merchants/me/staff" && method === "POST") {
    const payload = await bodyOf(request);
    staff = [{
      userId: "00000000-0000-4000-8000-000000000105", fullName: "Staff Test",
      email: payload.email, role: "STAFF", canValidatePickups: payload.canValidatePickups,
      canViewOrders: payload.canViewOrders, canManageOffers: payload.canManageOffers,
    }];
    return json(response, staff[0], 201);
  }
  if (path.startsWith("/merchants/me/staff/") && method === "PUT") {
    const payload = await bodyOf(request);
    staff = staff.map(member => member.userId === path.split("/").at(-1) ? { ...member, ...payload } : member);
    return json(response, {});
  }
  if (path === "/merchants/me/sales") {
    return json(response, {
      basketsCollected: 4, salesMinor: 16000, cancelled: 1, notCollected: 0,
      daily: [{ date: now.toISOString().slice(0, 10), amountMinor: 16000 }],
      latestOrders: [],
    });
  }
  if (path === "/merchants/me/sales/export") return csv(response, "kulha-sales.csv");

  if (path === "/admin/merchants" && method === "GET") {
    const rows = url.searchParams.get("status") === "PENDING" && merchantStatus === "PENDING" ? [merchant] : [];
    return json(response, page(rows));
  }
  if (path === `/admin/merchants/${merchant.id}` && method === "GET") return json(response, merchant);
  if (path === `/admin/merchants/${merchant.id}/approve` && method === "POST") {
    await bodyOf(request);
    merchantStatus = "APPROVED";
    merchant.status = merchantStatus;
    return json(response, {});
  }
  if (path === "/admin/offers" && method === "GET") {
    return json(response, page([{ ...offer, status: offerStatus }]));
  }
  if (path === `/admin/offers/${offer.id}/suspend` && method === "POST") {
    await bodyOf(request);
    offerStatus = "SUSPENDED";
    return json(response, {});
  }
  if (path === "/admin/support-cases" && method === "GET") {
    const rows = url.searchParams.get("status") === caseStatus ? [supportCase] : [];
    return json(response, page(rows));
  }
  if (path === `/admin/support-cases/${supportCase.reference}` && method === "GET") {
    return json(response, { summary: { ...supportCase, status: caseStatus }, timeline });
  }
  if (path === `/admin/support-cases/${supportCase.reference}/reveal-customer` && method === "POST") {
    await bodyOf(request);
    return json(response, { fullName: "Customer Example", email: "customer@kulha.test", phone: "+212611111111" });
  }
  if (path === `/admin/support-cases/${supportCase.reference}/actions` && method === "POST") {
    const payload = await bodyOf(request);
    if (payload.action === "RESOLVE") caseStatus = "RESOLVED";
    supportCase.status = caseStatus;
    return json(response, {});
  }
  if (path === "/admin/audit-log" && method === "GET") return json(response, page([]));
  if (path === "/admin/audit-log/export") return csv(response, "kulha-audit-log.csv");

  if (path === "/reservations/pickup/check" && method === "POST") {
    await bodyOf(request);
    return json(response, {
      reference: "KULHA-SMOKE-001", merchantName: "Boulangerie Test",
      offerTitle: "Panier du fournil", quantity: 1, totalPriceMinor: 4000,
      currency: "MAD", pickupStart, pickupEnd, status: "CONFIRMED",
      validationState: "VALID", canConfirm: true,
    });
  }
  if (path === "/reservations/collect" && method === "POST") {
    await bodyOf(request);
    return json(response, {
      reference: "KULHA-SMOKE-001", offerTitle: "Panier du fournil", status: "COMPLETED",
    });
  }
  if (method !== "GET") await bodyOf(request);
  return json(response, {});
});

const app = spawn("pnpm", ["exec", "next", "start", "--hostname", "0.0.0.0", "--port", String(port)], {
  env: { ...process.env, API_BASE_URL: `http://127.0.0.1:${apiPort}`, APP_ORIGIN: origin, NODE_ENV: "production" },
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
async function loginContext(browser, token, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(origin + "/en/login", { waitUntil: "domcontentloaded" });
  const status = await page.evaluate(async accessToken => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: accessToken + "@kulha.test", password: "browser-smoke" }),
    });
    return response.status;
  }, token);
  if (status !== 200) throw new Error(`Browser smoke login failed with HTTP ${status} for ${token}.`);
  const cookies = await context.cookies(origin);
  if (!cookies.some(cookie => cookie.name === "kulha_at" && cookie.value === token)) {
    throw new Error("Login endpoint did not issue the HttpOnly KULHA access cookie.");
  }
  await page.close();
  return context;
}
async function assertNoHorizontalOverflow(page, route, width) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
  }));
  if (dimensions.document > dimensions.viewport + 1 || dimensions.body > dimensions.viewport + 1) {
    throw new Error(`Horizontal overflow at ${width}px on ${route}: ${JSON.stringify(dimensions)}`);
  }
}
async function assertDialogWithinViewport(page, route) {
  const rect = await page.getByRole("dialog").evaluate(element => {
    const value = element.getBoundingClientRect();
    return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
  });
  const viewport = page.viewportSize();
  if (!viewport || rect.left < -1 || rect.top < -1 || rect.right > viewport.width + 1 || rect.bottom > viewport.height + 1) {
    throw new Error(`Dialog exceeds viewport on ${route}: ${JSON.stringify({ rect, viewport })}`);
  }
}

let browser;
try {
  await new Promise(resolve => backend.listen(apiPort, "127.0.0.1", resolve));
  await waitFor(origin + "/en/login", app);
  const cliPath = realpathSync(process.env.PLAYWRIGHT_CLI);
  const { chromium } = await import(pathToFileURL(join(dirname(cliPath), "index.mjs")).href);
  browser = await chromium.launch({ headless: true });

  const sizes = [
    { width: 1920, height: 1080 }, { width: 1440, height: 900 },
    { width: 1366, height: 768 }, { width: 1280, height: 720 },
    { width: 1024, height: 768 }, { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ];
  mkdirSync("artifacts/browser-screenshots", { recursive: true });
  const routes = [
    { path: "/en/merchant/orders", token: "merchant-token", heading: "Orders" },
    { path: "/en/merchant/reservations/scan", token: "merchant-token", heading: "Validate a pickup" },
    { path: "/en/merchant/staff", token: "merchant-token", heading: "Staff" },
    { path: "/en/merchant/sales", token: "merchant-token", heading: "Sales" },
    { path: "/en/admin/merchant-review", token: "admin-token", heading: "Merchant review" },
    { path: "/en/admin/offer-moderation", token: "admin-token", heading: "Offer moderation" },
    { path: "/en/admin/support-cases", token: "support-token", heading: "Support cases" },
    { path: "/fr/admin/support-cases", token: "support-token", heading: "Dossiers support" },
    { path: "/ar/admin/support-cases", token: "support-token", heading: "طلبات الدعم", direction: "rtl" },
    { path: "/en/admin/audit-log", token: "admin-token", heading: "Audit log" },
  ];
  for (const route of routes) {
    const context = await loginContext(browser, route.token);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto(origin + route.path, { waitUntil: "networkidle", timeout: 30000 });
      try {
        await page.getByText(route.heading, { exact: true }).first().waitFor({ state: "visible", timeout: 15000 });
      } catch {
        const bodyText = (await page.locator("body").innerText()).slice(0, 1200);
        throw new Error(`Workspace did not render ${route.path}; current URL=${page.url()}; body=${bodyText}; backend requests=${JSON.stringify(requests.slice(-12))}`);
      }
      await assertNoHorizontalOverflow(page, route.path, size.width);
      if (route.direction) {
        const direction = await page.locator("main").getAttribute("dir");
        if (direction !== route.direction) throw new Error(`${route.path} expected dir=${route.direction}, received ${direction}.`);
      }
      const screenshotName = `${route.path.replace(/^\/+/, "").replaceAll("/", "-")}-${size.width}x${size.height}.png`;
      await page.screenshot({ path: join("artifacts/browser-screenshots", screenshotName), animations: "disabled" });
    }
    if (errors.length) throw new Error(`Browser errors on ${route.path}: ${errors.join("; ")}`);
    await context.close();
    process.stdout.write(`PASS viewport matrix: ${route.path}\n`);
  }

  // Orders: the status filter changes the backend query, not just the selected tab.
  {
    const context = await loginContext(browser, "merchant-token");
    const page = await context.newPage();
    await page.goto(origin + "/en/merchant/orders", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "To collect" }).click();
    await page.getByRole("heading", { name: "Orders" }).waitFor();
    if (!requests.some(item => item.path === "/merchants/me/orders" && item.query.includes("filter=TO_COLLECT"))) {
      throw new Error("Orders filter did not request TO_COLLECT records.");
    }
    await context.close();
  }

  // Staff: grant access and change an existing staff member's permissions.
  {
    staff = [];
    const context = await loginContext(browser, "merchant-token");
    const page = await context.newPage();
    await page.goto(origin + "/en/merchant/staff", { waitUntil: "networkidle" });
    await page.getByLabel("Email address").fill("new-staff@kulha.test");
    await page.getByLabel("Create and edit offers").check();
    await page.getByRole("button", { name: "Grant access" }).click();
    await page.getByText("new-staff@kulha.test").waitFor({ state: "visible" });
    const offersPermission = page.getByLabel("Create and edit offers").first();
    if (!(await offersPermission.isChecked())) throw new Error("Staff offer permission was not persisted.");
    if (!requests.some(item => item.method === "POST" && item.path === "/merchants/me/staff")) {
      throw new Error("Staff grant action did not reach the API.");
    }
    await context.close();
  }

  // Sales: export is a real browser download from the streamed same-origin endpoint.
  {
    const context = await loginContext(browser, "merchant-token");
    const page = await context.newPage();
    await page.goto(origin + "/en/merchant/sales", { waitUntil: "networkidle" });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    if (download.suggestedFilename() !== "kulha-sales.csv") throw new Error("Merchant sales CSV download failed.");
    await context.close();
  }

  // Pickup: preview and explicit confirmation are separate steps.
  {
    const context = await loginContext(browser, "merchant-token");
    const page = await context.newPage();
    await page.goto(origin + "/en/merchant/reservations/scan", { waitUntil: "networkidle" });
    await page.getByLabel("Reservation reference").fill("KULHA-SMOKE-001");
    await page.getByLabel("Pickup code").fill("ABCD");
    await page.getByRole("button", { name: "Check code" }).click();
    await page.getByText("Valid pickup").waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Confirm handover" }).click();
    await page.getByRole("heading", { name: "Basket handed to customer" }).waitFor({ state: "visible" });
    await assertNoHorizontalOverflow(page, "/en/merchant/reservations/scan", 390);
    await context.close();
  }

  // Merchant review: checklist gates approval; the decision is submitted with a reason.
  {
    merchantStatus = "PENDING";
    merchant.status = merchantStatus;
    const context = await loginContext(browser, "admin-token");
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + "/en/admin/merchant-review", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Review application" }).click();
    await assertDialogWithinViewport(page, "/en/admin/merchant-review");
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Address and location checked").check();
    await dialog.getByLabel("Phone number reachable").check();
    await dialog.getByLabel("Documents readable and valid").check();
    await dialog.getByRole("button", { name: "Approve" }).click();
    await dialog.getByLabel("Reason (required)").fill("Verified during browser workflow test.");
    await dialog.getByRole("button", { name: "Submit decision" }).click();
    if (!requests.some(item => item.method === "POST" && item.path.endsWith("/approve"))) {
      throw new Error("Merchant approval was not submitted.");
    }
    await context.close();
  }

  // Offer moderation: the selected action and mandatory reason are submitted.
  {
    offerStatus = "PUBLISHED";
    const context = await loginContext(browser, "admin-token");
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + "/en/admin/offer-moderation", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open moderation" }).click();
    await assertDialogWithinViewport(page, "/en/admin/offer-moderation");
    const dialog = page.getByRole("dialog");
    await dialog.locator('[data-action="suspend"]').click();
    await dialog.getByLabel("Reason (required)").fill("Allergen information needs verification.");
    await dialog.getByRole("button", { name: "Hide offer" }).last().click();
    if (!requests.some(item => item.method === "POST" && item.path.endsWith("/suspend"))) {
      throw new Error("Offer moderation action was not submitted.");
    }
    await context.close();
  }

  // Support: assigned SUPPORT agent reveals PII only after a reason and resolves with a separate reason.
  {
    caseStatus = "OPEN";
    supportCase.status = caseStatus;
    const context = await loginContext(browser, "support-token");
    const page = await context.newPage();
    await page.goto(origin + "/en/admin/support-cases", { waitUntil: "networkidle" });
    await page.getByLabel("Reason for viewing customer details (required)").fill("Confirming a food-safety complaint.");
    await page.getByRole("button", { name: "Reveal" }).click();
    await page.getByText("customer@kulha.test").waitFor({ state: "visible" });
    await page.getByLabel(/Reason for the action/).fill("Food-safety case reviewed and resolved.");
    await page.getByRole("button", { name: "Resolve case" }).click();
    if (!requests.some(item => item.method === "POST" && item.path.endsWith("/reveal-customer"))
        || !requests.some(item => item.method === "POST" && item.path.endsWith("/actions"))) {
      throw new Error("Support disclosure or resolution workflow did not reach the API.");
    }
    await context.close();
  }

  // Audit export is an actual download.
  {
    const context = await loginContext(browser, "admin-token");
    const page = await context.newPage();
    await page.goto(origin + "/en/admin/audit-log", { waitUntil: "networkidle" });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export (logged)" }).click();
    const download = await downloadPromise;
    if (download.suggestedFilename() !== "kulha-audit-log.csv") throw new Error("Audit CSV download failed.");
    await context.close();
  }

  // Arabic scanner keeps RTL direction and fits a narrow phone viewport.
  {
    const context = await loginContext(browser, "merchant-token");
    const page = await context.newPage();
    await page.goto(origin + "/ar/merchant/reservations/scan", { waitUntil: "networkidle" });
    const direction = await page.locator("main").getAttribute("dir");
    await assertNoHorizontalOverflow(page, "/ar/merchant/reservations/scan", 390);
    if (direction !== "rtl") throw new Error("Arabic pickup scanner is not RTL.");
    await context.close();
  }

  process.stdout.write("PASS merchant order filtering, staff permissions, sales download and pickup handover\n");
  process.stdout.write("PASS admin merchant review, offer moderation, assigned support disclosure/resolution and audit download\n");
  process.stdout.write("PASS 5 viewport widths for 8 authenticated workspaces; merchant/admin modal bounds at 390px; Arabic RTL at 390px\n");
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  backend.close();
}
