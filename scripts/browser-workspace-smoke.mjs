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
let timeline = [{
  id: "00000000-0000-4000-8000-000000000104", authorType: "CUSTOMER",
  authorUserId: customerId, authorLabel: "Customer", visibility: "CUSTOMER",
  message: "Can you confirm the allergens?", createdAt: now.toISOString(),
}];

function json(response, value, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}
function page(items) { return { items, page: 0, size: 20, total: items.length }; }
async function waitForBackendRequest(predicate, description) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const match = requests.find(predicate);
    if (match) return match;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`${description} did not reach the backend. Recent requests: ${JSON.stringify(requests.slice(-24))}`);
}
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
    : token.includes("admin-token") ? "ADMIN"
    : token.includes("customer-token") ? "CUSTOMER" : "MERCHANT_OWNER";
  requests.push({ method, path, query: url.search, token });

  if (path === "/auth/login" && method === "POST") {
    const payload = await bodyOf(request);
    const accessToken = String(payload.email ?? "").split("@")[0];
    return json(response, { accessToken, refreshToken: `refresh-${accessToken}`, expiresIn: 3600 });
  }
  if (path === "/me/preferences" && method === "GET") return json(response, { preferredCity: "Casablanca", preferredDistrict: null, locale: url.searchParams.get("locale") ?? "fr" });
  if (path === "/me/notification-preferences" && method === "GET") return json(response, { reservationConfirmations: true, pickupReminders: true, cancellationsAndStatusChanges: true, nearbyBaskets: false, reminderMinutesBefore: 60, emailEnabled: true, smsEnabled: false });
  if (path === "/me") {
    return json(response, {
      id: actorId, email: "browser-smoke@kulha.test", fullName: "KULHA Browser Smoke",
      phone: null, emailVerified: true, roles: [role],
    });
  }
  if (path === "/offers" && method === "GET") return json(response, page([{ id: offer.id, title: offer.title, category: "BREAD_PASTRY", priceMinor: 4000, originalPriceMinor: 8000, quantityTotal: 10, availableUnits: 8, pickupStart, pickupEnd, merchant: { name: "Boulangerie Test", address: "12 Avenue Hassan II", city: "Casablanca", district: null, pickupInstructions: null } }]));
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
  if (path === `/admin/support-cases/${supportCase.reference}/messages` && method === "POST") {
    const payload = await bodyOf(request);
    timeline.push({
      id: `00000000-0000-4000-8000-${String(200 + timeline.length).padStart(12, "0")}`,
      authorType: "AGENT", authorUserId: actorId, authorLabel: "Support Agent",
      visibility: payload.sendToCustomer ? "CUSTOMER" : "INTERNAL",
      message: payload.message, createdAt: new Date().toISOString(),
    });
    return json(response, {});
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

  if (path === "/reservations" && method === "GET") return json(response, page([]));
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
async function assertCompactWorkspaceFits(page, route, width, height) {
  const metrics = await page.evaluate(() => {
    const owners = [...document.querySelectorAll("*")].filter(element => {
      const style = getComputedStyle(element);
      return ["auto", "scroll"].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 2;
    }).slice(0, 8).map(element => ({
      tag: element.tagName.toLowerCase(),
      className: typeof element.className === "string" ? element.className.slice(0, 100) : "",
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    return {
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      verticalScrollOwners: owners,
      layoutNodes: [".kulhaAdminShell", ".kulhaAdminShell > main", ".kulhaAdminShell > main > *", "#contenu", "#contenu > *", "body > footer"].map(selector => {
        const element = document.querySelector(selector);
        if (!element) return { selector, missing: true };
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { selector, top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height), clientHeight: element.clientHeight, scrollHeight: element.scrollHeight, overflowY: style.overflowY, gridTemplateColumns: style.gridTemplateColumns };
      }),
      bodyChildren: [...document.body.children].map(element => ({ tag: element.tagName.toLowerCase(), id: element.id, className: typeof element.className === "string" ? element.className.slice(0, 160) : "", height: Math.round(element.getBoundingClientRect().height), top: Math.round(element.getBoundingClientRect().top), bottom: Math.round(element.getBoundingClientRect().bottom), display: getComputedStyle(element).display, position: getComputedStyle(element).position })),
      overflowElements: [...document.querySelectorAll("*")].map(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { tag: element.tagName.toLowerCase(), className: typeof element.className === "string" ? element.className.slice(0, 100) : "", top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height), position: style.position, overflowY: style.overflowY };
      }).filter(item => item.bottom > window.innerHeight + 2 && item.height > 0 && item.position !== "fixed").sort((a,b) => b.bottom-a.bottom).slice(0, 12),
    };
  });
  if (metrics.documentHeight > height + 2 || metrics.bodyHeight > height + 2) {
    throw new Error(`Unnecessary page scrolling at ${width}x${height} on ${route}: ${JSON.stringify(metrics)}`);
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
    { path: "/en/merchant/orders", token: "merchant-token", heading: "Orders" , compact: true },
    { path: "/en/merchant/reservations/scan", token: "merchant-token", heading: "Validate a pickup" , compact: true },
    { path: "/en/merchant/staff", token: "merchant-token", heading: "Staff" , compact: true },
    { path: "/en/merchant/sales", token: "merchant-token", heading: "Sales" , compact: true },
    { path: "/en/admin/merchant-review", token: "admin-token", heading: "Merchant review" , compact: true },
    { path: "/en/admin/offer-moderation", token: "admin-token", heading: "Offer moderation" , compact: true },
    { path: "/en/admin/support-cases", token: "support-token", heading: "Support cases" , compact: true },
    { path: "/fr/admin/support-cases", token: "support-token", heading: "Dossiers support" , compact: true },
    { path: "/ar/admin/support-cases", token: "support-token", heading: "طلبات الدعم", direction: "rtl" , compact: true },
    { path: "/en/admin/audit-log", token: "admin-token", heading: "Audit log" , compact: true },
    { path: "/fr/reservations", token: "customer-token", heading: "Mes réservations" },
    { path: "/ar/reservations", token: "customer-token", heading: "حجوزاتي", direction: "rtl", directionSelector: '[lang="ar"]' },
    { path: "/fr/account", token: "customer-token", heading: "Profil et paramètres" },
    { path: "/ar/account", token: "customer-token", heading: "الملف الشخصي والإعدادات", direction: "rtl", directionSelector: '[lang="ar"]' },
    { path: "/fr/offers", token: "customer-token", heading: "Paniers près de chez vous" },
    { path: "/ar/offers", token: "customer-token", heading: "سلال بالقرب منك", direction: "rtl", directionSelector: '[lang="ar"]' },
  ];
  for (const route of routes) {
    const context = await loginContext(browser, route.token);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const size of sizes) {
      await page.setViewportSize(size);
      const reservationRequestCount = requests.filter(item => item.path === "/reservations").length;
      await page.goto(origin + route.path, { waitUntil: "networkidle", timeout: 30000 });
      try {
        await page.getByText(route.heading, { exact: true }).first().waitFor({ state: "visible", timeout: 15000 });
      } catch {
        const bodyText = (await page.locator("body").innerText()).slice(0, 1200);
        throw new Error(`Workspace did not render ${route.path}; current URL=${page.url()}; body=${bodyText}; backend requests=${JSON.stringify(requests.slice(-12))}`);
      }
      await assertNoHorizontalOverflow(page, route.path, size.width);
      if (route.path.endsWith("/admin/support-cases")) {
        const supportLayout = await page.evaluate(() => {
          const detail = document.querySelector('[data-testid="support-case-detail"]');
          const history = document.querySelector('[data-testid="support-case-history"]');
          const composer = document.querySelector('[data-testid="support-message-composer"]');
          if (!detail || !history || !composer) return { missingRegion: true };
          const panel = detail.getBoundingClientRect();
          const reply = composer.getBoundingClientRect();
          const style = getComputedStyle(detail);
          const historyStyle = getComputedStyle(history);
          return {
            missingRegion: false,
            panelBottom: panel.bottom,
            composerBottom: reply.bottom,
            documentHeight: document.documentElement.scrollHeight,
            viewportHeight: innerHeight,
            detailOverflow: style.overflowY,
            historyOverflow: historyStyle.overflowY,
          };
        });
        if (supportLayout.missingRegion || supportLayout.composerBottom > supportLayout.panelBottom + 1) {
          throw new Error(`Support composer escaped its detail panel at ${size.width}x${size.height}: ${JSON.stringify(supportLayout)}`);
        }
        if (size.width >= 900 && (supportLayout.documentHeight > size.height + 1
          || supportLayout.detailOverflow !== "hidden" || supportLayout.historyOverflow !== "auto"
          || supportLayout.panelBottom > size.height + 1)) {
          throw new Error(`Desktop support layout/scroll ownership failed at ${size.width}x${size.height}: ${JSON.stringify(supportLayout)}`);
        }
      }
      if (route.direction) {
        const direction = await page.locator(route.directionSelector ?? ".kulhaAdminShell").getAttribute("dir");
        if (direction !== route.direction) throw new Error(`${route.path} expected dir=${route.direction}, received ${direction}.`);
      }
      const screenshotName = `${route.path.replace(/^\/+/, "").replaceAll("/", "-")}-${size.width}x${size.height}.png`;
      if (route.token === "customer-token" && route.path.endsWith("/reservations")) {
        await waitForBackendRequest(item => item.path === "/reservations" && item.query.includes("status=cancelled"), "Customer reservation list");
        const count = requests.filter(item => item.path === "/reservations").length - reservationRequestCount;
        if (count !== 3) throw new Error(`${route.path} expected 3 reservation list requests, observed ${count}.`);
      }
      await page.screenshot({ path: join("artifacts/browser-screenshots", screenshotName), animations: "disabled" });
      if (route.compact && size.width >= 1024 && size.height <= 768) {
        await assertCompactWorkspaceFits(page, route.path, size.width, size.height);
      }
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
    await waitForBackendRequest(item => item.method === "POST" && item.path === "/merchants/me/staff", "Staff grant action");
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
    await waitForBackendRequest(item => item.method === "POST" && item.path.endsWith("/approve"), "Merchant approval");
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
    await waitForBackendRequest(item => item.method === "POST" && item.path.endsWith("/suspend"), "Offer moderation action");
    await context.close();
  }

  // Support: assigned SUPPORT agent reveals PII only after a reason and resolves with a separate reason.
  {
    caseStatus = "OPEN";
    supportCase.status = caseStatus;
    const context = await loginContext(browser, "support-token");
    const page = await context.newPage();
    await page.goto(origin + "/en/admin/support-cases", { waitUntil: "networkidle" });
    await page.setViewportSize({ width: 1366, height: 768 });
    const detail = page.locator('[data-testid="support-case-detail"]');
    const history = page.locator('[data-testid="support-case-history"]');
    const composer = page.locator('[data-testid="support-message-composer"]');
    await history.waitFor({ state: "visible" });
    const shortLayout = await page.evaluate(() => {
      const detailNode = document.querySelector('[data-testid="support-case-detail"]');
      const historyNode = document.querySelector('[data-testid="support-case-history"]');
      const composerNode = document.querySelector('[data-testid="support-message-composer"]');
      const panel = detailNode.getBoundingClientRect();
      const reply = composerNode.getBoundingClientRect();
      return {
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        detailOverflow: getComputedStyle(detailNode).overflowY,
        historyOverflow: getComputedStyle(historyNode).overflowY,
        composerBottom: reply.bottom,
        detailBottom: panel.bottom,
        textareaHeight: composerNode.querySelector("textarea").getBoundingClientRect().height,
      };
    });
    if (shortLayout.documentHeight > shortLayout.viewportHeight + 1
      || shortLayout.detailOverflow !== "hidden"
      || shortLayout.historyOverflow !== "auto"
      || shortLayout.composerBottom > shortLayout.detailBottom + 1
      || shortLayout.textareaHeight > 140) {
      throw new Error(`Short support conversation layout failed: ${JSON.stringify(shortLayout)}`);
    }

    // Long history must scroll inside .caseHistory; the detail panel and composer stay fixed.
    timeline = Array.from({ length: 48 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(300 + index).padStart(12, "0")}`,
      authorType: index % 2 ? "AGENT" : "CUSTOMER",
      authorUserId: index % 2 ? actorId : customerId,
      authorLabel: index % 2 ? "Support Agent" : "Customer",
      visibility: "CUSTOMER",
      message: `Conversation history entry ${index + 1}: ${"The complete case discussion remains available to the support team. ".repeat(3)}`,
      createdAt: new Date(Date.now() - (48 - index) * 60000).toISOString(),
    }));
    await page.reload({ waitUntil: "networkidle" });
    await history.waitFor({ state: "visible" });
    const longLayout = await page.evaluate(() => {
      const detailNode = document.querySelector('[data-testid="support-case-detail"]');
      const historyNode = document.querySelector('[data-testid="support-case-history"]');
      const composerNode = document.querySelector('[data-testid="support-message-composer"]');
      const detailRect = detailNode.getBoundingClientRect();
      const composerRect = composerNode.getBoundingClientRect();
      return {
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        detailClient: detailNode.clientHeight,
        detailScroll: detailNode.scrollHeight,
        historyClient: historyNode.clientHeight,
        historyScroll: historyNode.scrollHeight,
        historyOverflow: getComputedStyle(historyNode).overflowY,
        composerTop: composerRect.top,
        composerBottom: composerRect.bottom,
        detailTop: detailRect.top,
        detailBottom: detailRect.bottom,
      };
    });
    if (longLayout.documentHeight > longLayout.viewportHeight + 1
      || longLayout.detailScroll > longLayout.detailClient + 2
      || longLayout.historyScroll <= longLayout.historyClient + 2
      || longLayout.historyOverflow !== "auto"
      || longLayout.composerBottom > longLayout.detailBottom + 1
      || longLayout.composerTop < longLayout.detailTop - 1) {
      throw new Error(`Long support conversation layout failed: ${JSON.stringify(longLayout)}`);
    }
    await history.evaluate(element => { element.scrollTop = element.scrollHeight; });
    const composerAfterScroll = await composer.boundingBox();
    if (!composerAfterScroll || composerAfterScroll.y + composerAfterScroll.height > longLayout.detailBottom + 1) {
      throw new Error("Reply composer moved outside the detail panel while scrolling the conversation.");
    }
    await composer.getByPlaceholder("Write a message…").fill("Reply sent from the long-conversation browser test.");
    await composer.getByRole("button", { name: "Send to customer" }).click();
    await waitForBackendRequest(item => item.method === "POST" && item.path.endsWith("/messages"), "Support reply submission");
    await page.getByText("Reply sent from the long-conversation browser test.").waitFor({ state: "visible" });
    await page.getByLabel("Reason for viewing customer details (required)").fill("Confirming a food-safety complaint.");
    await page.getByRole("button", { name: "Reveal" }).click();
    await page.getByText("customer@kulha.test").waitFor({ state: "visible" });
    await page.getByLabel(/Reason for the action/).fill("Food-safety case reviewed and resolved.");
    await page.getByRole("button", { name: "Resolve case" }).click();
    await waitForBackendRequest(item => item.method === "POST" && item.path.endsWith("/reveal-customer"), "Support customer disclosure");
    await waitForBackendRequest(item => item.method === "POST" && item.path.endsWith("/actions"), "Support case resolution");
    await context.close();
  }

  // Audit export is an actual download.
  {
    const context = await loginContext(browser, "admin-token");
    const page = await context.newPage();
    await page.goto(origin + "/en/admin/audit-log", { waitUntil: "networkidle" });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    if (download.suggestedFilename() !== "kulha-audit-log.csv") throw new Error("Audit CSV download failed.");
    await context.close();
  }

  // Arabic scanner keeps RTL direction and fits a narrow phone viewport.
  {
    const context = await loginContext(browser, "merchant-token");
    const page = await context.newPage();
    await page.goto(origin + "/ar/merchant/reservations/scan", { waitUntil: "networkidle" });
    const direction = await page.locator('#contenu main[lang="ar"]').getAttribute("dir");
    await assertNoHorizontalOverflow(page, "/ar/merchant/reservations/scan", 390);
    if (direction !== "rtl") throw new Error("Arabic pickup scanner is not RTL.");
    await context.close();
  }

  process.stdout.write("PASS merchant order filtering, staff permissions, sales download and pickup handover\n");
  process.stdout.write("PASS admin merchant review, offer moderation, assigned support disclosure/resolution and audit download\n");
  process.stdout.write("PASS 7 viewport sizes across 16 authenticated routes; merchant/admin modal bounds at 390px; Arabic RTL at 390px\n");
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  backend.close();
}
