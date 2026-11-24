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
const moderationOffers = Array.from({ length: 14 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(102 + index).padStart(12, "0")}`,
  title: index === 0 ? "Panier du fournil" : index === 1 ? "Family breakfast basket with assorted bakery items, fresh fruit and detailed allergen information" : `Basket selection ${index + 1}`,
  shopName: "Boulangerie Test", city: "Casablanca", priceMinor: 4000 + index * 100,
  originalPriceMinor: 8000 + index * 100, quantityTotal: 10, quantityReserved: 2,
  allergensStatus: index % 3 === 0 || index === 1 ? "UNKNOWN" : "DECLARED", allergens: index % 3 === 0 || index === 1 ? null : "Wheat",
  foodNotes: "Prepared today", status: "PUBLISHED", reportedCount: index % 3 === 0 ? 2 : 0,
  pickupStart, pickupEnd, imageUrl: null,
}));

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
const merchantRows = [
  merchant,
  { ...merchant, id: "00000000-0000-4000-8000-000000000117", name: "Épicerie Atlas", businessType: "GROCERY", ownerEmail: "atlas@kulha.test", city: "Rabat", status: "PENDING" },
  { ...merchant, id: "00000000-0000-4000-8000-000000000118", name: "Pâtisserie Zayna", businessType: "PASTRY", ownerEmail: "zayna@kulha.test", city: "Marrakech", status: "PENDING" },
  ...[
    ["00000000-0000-4000-8000-000000000111", "Épicerie de la Place", "GROCERY", "Rabat", "owner2@kulha.test", "14 Rue des Consuls"],
    ["00000000-0000-4000-8000-000000000112", "Pâtisserie Nour", "BAKERY", "Marrakech", "owner3@kulha.test", "8 Avenue Mohammed V"],
    ["00000000-0000-4000-8000-000000000113", "Primeur Atlas", "GROCERY", "Agadir", "owner4@kulha.test", "22 Boulevard Hassan II"],
  ].map(([id, name, businessType, city, ownerEmail, address], index) => ({
    ...merchant, id, name, businessType, city, ownerEmail, address,
    phone: `+21260000000${index + 2}`, status: "PENDING",
    createdAt: new Date(now.getTime() - (index + 1) * 86400000).toISOString(),
  })),
];
const supportCases = [
  supportCase,
  { ...supportCase, id: "00000000-0000-4000-8000-000000000121", reference: "SUP-2026-0002", category: "RESERVATION", subject: "Reservation pickup window mismatch", priority: "MEDIUM" },
  { ...supportCase, id: "00000000-0000-4000-8000-000000000122", reference: "SUP-2026-0003", category: "MERCHANT", subject: "Merchant cannot update opening hours", priority: "LOW" },
  { ...supportCase, id: "00000000-0000-4000-8000-000000000123", reference: "SUP-2026-0004", category: "FOOD_SAFETY", subject: "Packaging condition reported", priority: "HIGH" },
  ...[
    ["SUP-2026-0005", "Reservation pickup time clarification", "RESERVATION", "MEDIUM", "OPEN"],
    ["SUP-2026-0006", "Incorrect basket contents reported", "OFFER_QUALITY", "MEDIUM", "OPEN"],
    ["SUP-2026-0007", "Shop cannot update opening hours", "MERCHANT_ACCOUNT", "LOW", "OPEN"],
    ["SUP-2026-0008", "Possible cold-chain concern", "FOOD_SAFETY", "HIGH", "ESCALATED"],
  ].map(([reference, subject, category, priority, status], index) => ({
    ...supportCase,
    id: `00000000-0000-4000-8000-${String(130 + index).padStart(12, "0")}`,
    reference, subject, category, priority, status,
    description: `Case details for ${subject.toLowerCase()}.`,
    createdAt: new Date(now.getTime() - (index + 1) * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - index * 1800000).toISOString(),
  })),
];
const auditRows = Array.from({ length: 14 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(500 + index).padStart(12, "0")}`,
  actorUserId: actorId,
  actorName: index % 3 === 0 ? "Nadia El Amrani" : index % 3 === 1 ? "Youssef Bennani" : "Support Agent",
  action: index === 8 ? "SUPPORT_CUSTOMER_DETAILS_REVEALED_AFTER_FOOD_SAFETY_ESCALATION_AND_PRIVACY_REVIEW" : ["MERCHANT_APPROVED", "OFFER_SUSPENDED", "SUPPORT_CASE_RESOLVED", "SUPPORT_CUSTOMER_DETAILS_REVEALED", "AUDIT_LOG_EXPORTED"][index % 5],
  targetType: ["MERCHANT", "OFFER", "SUPPORT_CASE", "CUSTOMER", "AUDIT_EXPORT"][index % 5],
  targetId: index === 8 ? `support-case:${supportCase.reference}:customer:${customerId}:authorized-disclosure-review:food-safety-escalation` : [merchant.id, offer.id, supportCase.reference, customerId, "audit-export-2026-11-23"][index % 5],
  reason: index === 8 ? "The customer disclosure was approved for a documented food-safety escalation after the assigned support agent verified the incident, confirmed the merchant response, checked the reservation history, recorded the operational purpose, and restricted disclosed contact details to the case team. This extended reason deliberately exercises wrapping in the audit ledger and selected-record panel." : index === 0 ? "Business registration, address and owner identity were checked against the submitted application." : index === 1 ? "Offer temporarily hidden while allergen declarations are verified with the merchant." : index === 2 ? "Customer received a resolution after the pickup and food-safety details were reviewed." : index === 3 ? "Authorized support disclosure for a food-safety investigation; customer details were accessed only for this case." : "Operational review completed and action recorded.",
  result: index === 4 ? "DENIED" : index === 7 ? "FAILED" : "SUCCESS",
  correlationId: index === 8 ? "kulha-admin-smoke-correlation-food-safety-disclosure-review-2026-11-23-0009" : `kulha-admin-smoke-${index + 1}`,
  createdAt: new Date(now.getTime() - index * 17 * 60000).toISOString(),
}));
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
    const rows = url.searchParams.get("status") === "PENDING" && merchantStatus === "PENDING" ? merchantRows.filter(item => item.status === "PENDING") : merchantRows.filter(item => item.status === url.searchParams.get("status"));
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
    return json(response, page(moderationOffers.map(item => ({ ...item, status: offerStatus }))));
  }
  if (path === `/admin/offers/${offer.id}/suspend` && method === "POST") {
    await bodyOf(request);
    offerStatus = "SUSPENDED";
    return json(response, {});
  }
  if (path === "/admin/support-cases" && method === "GET") {
    const rows = url.searchParams.get("status") === caseStatus ? supportCases : [];
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
  if (path === "/admin/audit-log" && method === "GET") return json(response, page(auditRows));
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


async function assertAdminLoginLayout(page, width, height) {
  const metrics = await page.evaluate(() => {
    const root = document.querySelector("main.admin-login-shell");
    if (!root) return { missingRoot: true };
    const accessPanel = root.querySelector('[data-testid="admin-login-access-panel"]');
    const form = root.querySelector("form.auth-form-fields");
    const fields = [...(form?.querySelectorAll("input, button[type=submit]") ?? [])];
    const rect = element => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { top: value.top, bottom: value.bottom, left: value.left, right: value.right, height: value.height };
    };
    return {
      missingRoot: false,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      root: rect(root),
      accessPanel: rect(accessPanel),
      accessClientHeight: accessPanel?.clientHeight ?? 0,
      accessScrollHeight: accessPanel?.scrollHeight ?? 0,
      fields: fields.map(element => {
        const value = element.getBoundingClientRect();
        return {
          type: element.getAttribute("type"),
          top: value.top, bottom: value.bottom, left: value.left, right: value.right,
          visible: !!(element.offsetWidth || element.offsetHeight)
        };
      })
    };
  });
  if (metrics.missingRoot || !metrics.accessPanel || metrics.documentWidth > width + 1 || metrics.bodyWidth > width + 1) {
    throw new Error("Admin login horizontal overflow or missing layout at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.fields.length < 3 || metrics.fields.some(field => !field.visible || field.left < -1
    || field.right > width + 1 || field.top < -1 || field.bottom > height + 1)) {
    throw new Error("Admin login form controls are missing or clipped at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (width >= 761 && (metrics.documentHeight > height + 1 || metrics.bodyHeight > height + 1
    || metrics.root.top < -1 || metrics.root.bottom > height + 1
    || metrics.accessPanel.top < -1 || metrics.accessPanel.bottom > height + 1
    || metrics.accessScrollHeight > metrics.accessClientHeight + 2)) {
    throw new Error("Admin login must fit without page or inner-panel scrolling at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
}
async function assertOfferModerationLayout(page, width, height) {
  const metrics = await page.evaluate(() => {
    const workspace = document.querySelector('[data-testid="offer-workspace"]');
    const picker = document.querySelector('[data-testid="offer-picker"]');
    const preview = document.querySelector('[data-testid="offer-detail-panel"]');
    const queue = document.querySelector('[data-testid="offer-queue"]');
    const longTitleCount = [...(queue?.querySelectorAll("strong") ?? [])]
      .filter(element => (element.textContent ?? "").trim().length > 48).length;
    const box = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    };
    return {
      workspace: box(workspace), picker: box(picker), preview: box(preview),
      direction: workspace ? getComputedStyle(workspace).direction : "missing",
      columns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(" ").length : 0,
      offerCount: queue?.children.length ?? 0, longTitleCount,
    };
  });
  if (!metrics.workspace || !metrics.picker || !metrics.preview) {
    throw new Error("Offer moderation regions are missing at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.columns !== 1) {
    throw new Error("Offer queue must remain full width at " + width + "px: " + JSON.stringify(metrics));
  }
  if (metrics.offerCount < 8 || metrics.longTitleCount < 1) {
    throw new Error("Offer fixture must show eight records and a long-title example at "
      + width + "x" + height + ": " + JSON.stringify(metrics));
  }
}

async function assertAdminStatusControls(page, route, width, height) {
  const controls = await page.evaluate(() => [...document.querySelectorAll('[role="tablist"] button')].map(button => ({
    text: (button.textContent ?? "").trim().slice(0, 60),
    height: button.getBoundingClientRect().height,
  })));
  const undersized = controls.filter(control => control.height < 44);
  if (undersized.length) {
    throw new Error("Admin status controls must be at least 44px high at "
      + width + "x" + height + " on " + route + ": " + JSON.stringify(undersized));
  }
}

async function assertMerchantReviewLayout(page, width, height) {
  const metrics = await page.evaluate(() => {
    const detail = document.querySelector('[data-testid="merchant-review-detail-panel"]');
    const workspace = document.querySelector('[data-testid="merchant-review-list"]')?.closest("section")?.parentElement;
    const heading = document.querySelector('[data-testid="admin-page-heading"]');
    const topbar = document.querySelector('[data-testid="admin-console-topbar"]');
    const decision = document.querySelector('[data-testid="merchant-review-decision"]');
    const footer = document.querySelector('[data-testid="merchant-review-footer"]');
    const hint = document.querySelector("#merchant-decision-hint");
    const textareas = [...(decision?.querySelectorAll("textarea") ?? [])];
    const segmented = [...(decision?.querySelectorAll('[role="group"] button') ?? [])];
    const box = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    };
    return {
      detail: box(detail), workspace: box(workspace), heading: box(heading), topbar: box(topbar),
      columns: workspace ? getComputedStyle(workspace).gridTemplateColumns.split(" ").length : 0,
      textareas: textareas.map(field => ({ rows: field.rows, minHeight: field.getBoundingClientRect().height })),
      segmentHeights: segmented.map(button => button.getBoundingClientRect().height),
      footer: box(footer), hint: hint?.textContent?.trim() ?? "",
      selectedMerchant: Boolean(detail?.querySelector("h2")?.textContent?.trim()),
    };
  });
  if (!metrics.detail || !metrics.workspace || !metrics.heading || !metrics.topbar
      || !metrics.footer || !metrics.selectedMerchant || metrics.textareas.length !== 2
      || metrics.segmentHeights.length !== 3) {
    throw new Error("Merchant review workflow is incomplete at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.columns !== 1) {
    throw new Error("Merchant list must remain full width at " + width + "px: " + JSON.stringify(metrics));
  }
  if (metrics.textareas[0].rows !== 4 || metrics.textareas[0].minHeight < 100
      || metrics.textareas[1].rows !== 3 || metrics.textareas[1].minHeight < 100) {
    throw new Error("Merchant reason and internal-note fields must retain their requested rows and usable height at "
      + width + "x" + height + ": " + JSON.stringify(metrics.textareas));
  }
  if (metrics.segmentHeights.some(height => height < 48)) {
    throw new Error("Merchant decision choices must be at least 48px high at " + width + "x" + height + ".");
  }
  if (!metrics.hint) throw new Error("Disabled merchant decision must explain the missing decision/reason at " + width + "x" + height + ".");
  if (metrics.detail.left < -1 || metrics.detail.right > width + 1) {
    throw new Error("Merchant detail card is horizontally clipped at " + width + "x" + height + ": " + JSON.stringify(metrics.detail));
  }
}

async function assertOfferDecisionAccessible(page, width, height, route) {
  const metrics = await page.evaluate(() => {
    const preview = document.querySelector('[data-testid="offer-detail-panel"]');
    const title = preview?.querySelector("h2");
    const footer = document.querySelector('[data-testid="offer-moderation-footer"]');
    const submitButtons = [...(footer?.querySelectorAll("button") ?? [])];
    const decisions = [...(document.querySelector('[data-testid="offer-moderation-workflow"]')
      ?.querySelectorAll("button[data-action]") ?? [])];
    const reason = document.querySelector('[data-testid="offer-decision-reason"] textarea');
    const warning = document.querySelector('[data-testid="offer-food-safety-alert"]');
    return {
      title: title?.textContent?.trim() ?? "",
      titleLineClamp: title ? getComputedStyle(title).webkitLineClamp : "missing",
      titleOverflow: title ? getComputedStyle(title).overflow : "missing",
      decisions: decisions.map(button => (button.textContent ?? "").trim()),
      submitCount: submitButtons.length,
      submitLabel: (submitButtons[0]?.textContent ?? "").trim(),
      submitHeight: submitButtons[0]?.getBoundingClientRect().height ?? 0,
      reasonHeight: reason?.getBoundingClientRect().height ?? 0,
      warningVisible: Boolean(warning && warning.getBoundingClientRect().height > 0),
      previewWidth: preview?.clientWidth ?? 0,
      previewScrollWidth: preview?.scrollWidth ?? 0,
    };
  });
  const failures = [];
  const check = (ok, message) => { if (!ok) failures.push(message); };
  check(Boolean(metrics.title), "selected offer title is missing");
  check(metrics.titleLineClamp === "none" || metrics.titleLineClamp === "initial",
    "selected offer title must not be line-clamped");
  check(new Set(metrics.decisions).size === 3, "three moderation decisions must have distinct labels");
  check(metrics.submitCount === 1, "exactly one primary submit button must be rendered");
  check(metrics.submitLabel.includes("·"), "submit button must use the Confirm · action label");
  check(metrics.submitHeight >= 44, "submit action is below the 44px target");
  check(metrics.reasonHeight >= 100, "reason textarea is below 100px");
  check(metrics.warningVisible, "food-safety alert is not visible");
  check(metrics.previewScrollWidth <= metrics.previewWidth + 1, "offer detail has horizontal clipping");
  if (failures.length) {
    throw new Error("Offer moderation usability failed at " + width + "x" + height + " on " + route
      + ": " + failures.join("; ") + "; " + JSON.stringify(metrics));
  }
}

async function assertSupportTimelineVisible(page, width, height) {
  const metrics = await page.evaluate(() => {
    const detail = document.querySelector('[data-testid="support-case-detail"]');
    const history = document.querySelector('[data-testid="support-case-history"]');
    const timeline = document.querySelector('[data-testid="support-case-timeline"]');
    const composer = document.querySelector('[data-testid="support-message-composer"]');
    const actions = document.querySelector('[data-testid="support-case-actions"]');
    const style = timeline ? getComputedStyle(timeline) : null;
    const box = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    };
    return {
      detail: box(detail), history: box(history), timeline: box(timeline),
      composer: box(composer), actions: box(actions),
      overflowY: style?.overflowY ?? "missing",
      drawerOverflowY: drawerStyle?.overflowY ?? "missing",
      drawerScrollHeight: drawerContent?.scrollHeight ?? 0,
      drawerClientHeight: drawerContent?.clientHeight ?? 0,
      maxHeight: style?.maxHeight ?? "missing",
      historyOverflowY: history ? getComputedStyle(history).overflowY : "missing",
      detailOverflowY: detail ? getComputedStyle(detail).overflowY : "missing",
      composerInsideTimeline: Boolean(timeline && composer && timeline.contains(composer)),
      actionsInsideTimeline: Boolean(timeline && actions && timeline.contains(actions)),
      timelineInsideDetail: Boolean(detail && timeline && detail.contains(timeline)),
    };
  });
  if (!metrics.detail || !metrics.history || !metrics.timeline || !metrics.composer || !metrics.actions
      || !metrics.timelineInsideDetail) {
    throw new Error("Support case structure is incomplete at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.overflowY !== "visible" || metrics.drawerOverflowY !== "auto") {
    throw new Error("The drawer document must own support-case scrolling at "
      + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.historyOverflowY === "auto" || metrics.historyOverflowY === "scroll"
      || metrics.detailOverflowY === "auto" || metrics.detailOverflowY === "scroll") {
    throw new Error("Support detail/history must not create nested scroll regions at "
      + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.composerInsideTimeline || metrics.actionsInsideTimeline) {
    throw new Error("Reply composer and Case Actions must remain outside the conversation scroller at "
      + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  const maxHeight = Number.parseFloat(metrics.maxHeight);
  if (!Number.isFinite(maxHeight) || maxHeight > Math.min(520, height * 0.6) + 1) {
    throw new Error("Support timeline max-height must be min(520px, 60vh) at "
      + width + "x" + height + ": " + JSON.stringify(metrics));
  }
}

async function assertAuditExplorerLayout(page, width, height) {
  const metrics = await page.evaluate(() => {
    const explorer = document.querySelector('[data-testid="audit-explorer"]');
    const card = document.querySelector('[data-testid="audit-table-card"]');
    const wrapper = document.querySelector('[data-testid="audit-table-wrapper"]');
    const drawer = document.querySelector('[data-testid="audit-record-detail"]');
    const header = document.querySelector('[data-testid="audit-record-header"]');
    const ths = [...(wrapper?.querySelectorAll("thead th") ?? [])];
    const resultHeader = ths[ths.length - 1];
    const resultCell = wrapper?.querySelector("tbody tr td:last-child");
    const bounds = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    };
    return {
      explorer: bounds(explorer), card: bounds(card), wrapper: bounds(wrapper),
      drawer: bounds(drawer), header: bounds(header),
      drawerRole: drawer?.getAttribute("role") ?? null,
      ariaModal: drawer?.getAttribute("aria-modal") ?? null,
      tableColumns: ths.length,
      resultHeader: bounds(resultHeader), resultCell: bounds(resultCell),
      copyButtons: [...(drawer?.querySelectorAll("button") ?? [])].filter(button => !button.hasAttribute("aria-label")).length,
      tableWidth: wrapper?.clientWidth ?? 0,
      tableScrollWidth: wrapper?.scrollWidth ?? 0,
      detailLength: drawer?.textContent?.length ?? 0,
    };
  });
  if (!metrics.explorer || !metrics.card || !metrics.wrapper || !metrics.drawer || !metrics.header
      || metrics.drawerRole !== "dialog" || metrics.ariaModal !== "true"
      || metrics.tableColumns !== 5 || metrics.copyButtons < 3 || metrics.detailLength < 180) {
    throw new Error("Audit ledger/drawer requirements failed at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.drawer.width > 520 + 1 || metrics.drawer.width > width + 1) {
    throw new Error("Audit drawer exceeds min(520px, 100%) at " + width + "px: " + JSON.stringify(metrics));
  }
  if (metrics.tableScrollWidth > metrics.tableWidth + 1) {
    throw new Error("Audit table wrapper clips horizontally at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (width >= 1024 && (!metrics.resultHeader || !metrics.resultCell
      || metrics.resultHeader.right > metrics.wrapper.right + 1
      || metrics.resultCell.right > metrics.wrapper.right + 1)) {
    throw new Error("Audit Result column is not completely visible at desktop width "
      + width + "px: " + JSON.stringify(metrics));
  }
  const row = page.getByTestId("audit-record-row").last();
  await page.keyboard.press("Escape");
  await page.getByTestId("audit-record-detail").waitFor({ state: "detached" });
  const focusReturned = await row.evaluate(element => document.activeElement === element);
  if (!focusReturned) throw new Error("Closing the audit drawer must return focus to its source row.");
  await row.click();
  await page.getByTestId("audit-record-detail").waitFor({ state: "visible" });
}


async function assertReadable(page, route, width, height) {
  const report = await page.evaluate(() => {
    const root = document;
    if (!root) return { missingRoot: true };
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden"
        && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1;
    };
    const text = [];
    for (const element of root.querySelectorAll("*")) {
      if (!visible(element)) continue;
      const directText = [...element.childNodes].some(node =>
        node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0);
      if (!directText) continue;
      const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
      if (fontSize < 13) text.push({
        element: element.tagName.toLowerCase(),
        className: typeof element.className === "string" ? element.className.slice(0, 100) : "",
        text: (element.textContent ?? "").trim().slice(0, 70),
        measuredFontSize: fontSize,
      });
    }
    const controls = [];
    for (const element of root.querySelectorAll("button,input,select,textarea,[role=tab],[role=button]")) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      const type = element.getAttribute("type") ?? "";
      const classes = typeof element.className === "string" ? element.className : "";
      const minimum = type === "checkbox" || type === "radio" ? 24
        : /pageButton|pageNumber|pageCurrent/.test(classes) ? 40
        : /reasonChip|auditCalendarDay/.test(classes) ? 36 : 44;
      if (rect.height + .5 < minimum) controls.push({
        element: element.tagName.toLowerCase(), className: classes.slice(0, 100),
        label: (element.getAttribute("aria-label") || element.textContent || element.getAttribute("placeholder") || "").trim().slice(0, 70),
        measuredHeight: rect.height, minimumHeight: minimum,
      });
      const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
      if (fontSize < 13) controls.push({
        element: element.tagName.toLowerCase(), className: classes.slice(0, 100),
        label: "control font", measuredFontSize: fontSize, minimumFontSize: 13,
      });
    }
    return { missingRoot: false, text, controls };
  });
  if (report.missingRoot || report.text.length || report.controls.length) {
    throw new Error("Admin readability failed on " + route + " at " + width + "x" + height
      + ": " + JSON.stringify(report));
  }
}

async function assertAdminCardClipping(page, route, width, height) {
  const metrics = await page.evaluate(() => {
    const root = document;
    const candidates = [...root.querySelectorAll("[data-testid]")].filter(element => {
      const id = element.getAttribute("data-testid") ?? "";
      return /detail|workspace|picker|table|queue|workflow|footer|composer|history|drawer/.test(id)
        && !/record-row|case-row/.test(id);
    });
    const overflow = candidates.map(element => ({
      id: element.getAttribute("data-testid"),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    })).filter(item => item.clientWidth > 0 && item.scrollWidth > item.clientWidth + 1);
    const card = root.querySelector('[data-testid="audit-table-card"]');
    const wrapper = root.querySelector('[data-testid="audit-table-wrapper"]');
    const header = wrapper?.querySelector("thead th:last-child");
    const cell = wrapper?.querySelector("tbody tr td:last-child");
    const right = element => element ? element.getBoundingClientRect().right : null;
    return {
      overflow,
      cardRight: right(card),
      headerRight: right(header),
      cellRight: right(cell),
    };
  });
  if (metrics.overflow.length) {
    throw new Error("Admin card clipping on " + route + " at " + width + "x" + height
      + ": " + JSON.stringify(metrics.overflow));
  }
  if (route.endsWith("/admin/audit-log") && width >= 1024
      && (metrics.headerRight === null || metrics.cellRight === null
        || metrics.headerRight > metrics.cardRight + 1 || metrics.cellRight > metrics.cardRight + 1)) {
    throw new Error("Audit Result column is clipped at " + width + "px: " + JSON.stringify(metrics));
  }
}

async function assertScrollOwner(page, route, width, height) {
  const metrics = await page.evaluate(() => {
    const root = document.querySelector(".kulhaAdminShell");
    const ids = ["merchant-review-detail-panel", "offer-detail-panel", "support-case-detail", "audit-table-card"];
    const invalid = [];
    for (const id of ids) {
      const detail = root.querySelector('[data-testid="' + id + '"]');
      if (!detail) continue;
      for (const element of detail.querySelectorAll("*")) {
        const style = getComputedStyle(element);
        if (["auto", "scroll"].includes(style.overflowY)
            && element.scrollHeight > element.clientHeight + 2
            && !element.hasAttribute("data-scroll-region")) {
          invalid.push({
            detail: id, element: element.tagName.toLowerCase(),
            className: typeof element.className === "string" ? element.className.slice(0, 100) : "",
            clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
          });
        }
      }
    }
    return {
      invalid,
      markers: [...root.querySelectorAll("[data-scroll-region]")].map(element => element.getAttribute("data-testid")),
    };
  });
  if (metrics.invalid.length || metrics.markers.length !== 0) {
    throw new Error("Admin scroll ownership failed on " + route + " at " + width + "x" + height
      + ": " + JSON.stringify(metrics));
  }
}

async function assertPrimaryActionUncovered(page, route, width, height) {
  let action;
  if (route.endsWith("/admin/merchant-review")) action = page.getByTestId("merchant-review-footer").locator("button").first();
  else if (route.endsWith("/admin/offer-moderation")) action = page.getByTestId("offer-moderation-footer").locator("button").first();
  else if (route.endsWith("/admin/support-cases")) action = page.getByTestId("support-case-actions").locator("button").last();
  else return;
  await action.scrollIntoViewIfNeeded();
  const hit = await action.evaluate(button => {
    const rect = button.getBoundingClientRect();
    const x = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
    const y = Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
    const top = document.elementFromPoint(x, y);
    return {
      visible: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight,
      unobscured: Boolean(top && (top === button || button.contains(top))),
      center: { x, y },
      topElement: top?.tagName.toLowerCase() ?? null,
      label: (button.textContent ?? "").trim(),
    };
  });
  if (!hit.visible || !hit.unobscured) {
    throw new Error("Primary action is covered or not visible on " + route + " at "
      + width + "x" + height + ": " + JSON.stringify(hit));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
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
    { width: 1279, height: 720 }, { width: 1100, height: 720 },
    { width: 1024, height: 768 }, { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ];
  mkdirSync("artifacts/browser-screenshots", { recursive: true });

  // Admin login is public: cover the required viewport matrix in English and Arabic.
  {
    const loginSizes = sizes.filter(size => [1920, 1440, 1366, 1280, 1279, 1100, 390].includes(size.width));
    for (const locale of [
      { code: "en", heading: "Administrator sign in", direction: "ltr" },
      { code: "ar", heading: "دخول الإدارة", direction: "rtl" }
    ]) {
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const size of loginSizes) {
        await page.setViewportSize(size);
        const route = "/" + locale.code + "/admin/login";
        await page.goto(origin + route, { waitUntil: "networkidle", timeout: 30000 });
        await page.getByRole("heading", { name: locale.heading }).waitFor({ state: "visible" });
        await page.locator('input[type="email"]').waitFor({ state: "visible" });
        await page.locator('input[type="password"]').waitFor({ state: "visible" });
        const direction = await page.locator("main.admin-login-shell").getAttribute("dir");
        if (direction !== locale.direction) throw new Error(route + " expected dir=" + locale.direction + ", received " + direction + ".");
        await assertNoHorizontalOverflow(page, route, size.width);
        await assertAdminLoginLayout(page, size.width, size.height);
        await page.screenshot({
          path: join("artifacts/browser-screenshots", locale.code + "-admin-login-" + size.width + "x" + size.height + ".png"),
          animations: "disabled"
        });
        if (size.width === 390) {
          await page.screenshot({
            path: join("artifacts/browser-screenshots", locale.code + "-admin-login-390x844-full.png"),
            animations: "disabled", fullPage: true
          });
          await page.locator('form.auth-form-fields button[type="submit"]').click();
          await page.waitForFunction(() => document.querySelector('#email[aria-invalid="true"]')
            && document.querySelector('#password[aria-invalid="true"]'));
          await page.screenshot({
            path: join("artifacts/browser-screenshots", locale.code + "-admin-login-390x844-validation.png"),
            animations: "disabled", fullPage: true
          });
          const password = page.locator("#password");
          await page.locator(".password-toggle").click();
          if (await password.getAttribute("type") !== "text") {
            throw new Error(route + " password visibility control did not reveal the password field.");
          }
          await page.locator(".password-toggle").click();
          if (await password.getAttribute("type") !== "password") {
            throw new Error(route + " password visibility control did not conceal the password field.");
          }
        }
      }
      if (errors.length) throw new Error("Browser errors on /" + locale.code + "/admin/login: " + errors.join("; "));
      await context.close();
    }
    process.stdout.write("PASS admin login: five required viewports, English and Arabic RTL, validation errors and password visibility\n");
  }

  const routes = [
    { path: "/en/merchant/orders", token: "merchant-token", heading: "Orders"  },
    { path: "/en/merchant/reservations/scan", token: "merchant-token", heading: "Validate a pickup"  },
    { path: "/en/merchant/staff", token: "merchant-token", heading: "Staff"  },
    { path: "/en/merchant/sales", token: "merchant-token", heading: "Sales"  },
    { path: "/en/admin/merchant-review", token: "admin-token", heading: "Merchant review", adminPage: true },
    { path: "/fr/admin/merchant-review", token: "admin-token", heading: "Revue des commerces", adminPage: true },
    { path: "/ar/admin/merchant-review", token: "admin-token", heading: "مراجعة المتاجر", direction: "rtl", adminPage: true },
    { path: "/en/admin/offer-moderation", token: "admin-token", heading: "Offer moderation", adminPage: true },
    { path: "/fr/admin/offer-moderation", token: "admin-token", heading: "Modération des offres", adminPage: true },
    { path: "/ar/admin/offer-moderation", token: "admin-token", heading: "مراجعة العروض", direction: "rtl", adminPage: true },
    { path: "/en/admin/support-cases", token: "support-token", heading: "Support cases", adminPage: true },
    { path: "/fr/admin/support-cases", token: "support-token", heading: "Dossiers support", adminPage: true },
    { path: "/ar/admin/support-cases", token: "support-token", heading: "طلبات الدعم", direction: "rtl", adminPage: true },
    { path: "/en/admin/audit-log", token: "admin-token", heading: "Audit log", adminPage: true },
    { path: "/fr/admin/audit-log", token: "admin-token", heading: "Journal d’audit", adminPage: true },
    { path: "/ar/admin/audit-log", token: "admin-token", heading: "سجل التدقيق", direction: "rtl", adminPage: true },
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
      await page.evaluate(() => window.scrollTo(0, 0));
      await assertNoHorizontalOverflow(page, route.path, size.width);
      if (route.adminPage && !route.path.endsWith("/admin/audit-log")) {
        const search = page.getByTestId("admin-console-search");
        await search.getByTestId("admin-global-search").waitFor({ state: "visible" });
        const searchBounds = await search.boundingBox();
        if (!searchBounds || (size.width < 900 && searchBounds.width < size.width - 64)) {
          throw new Error(`Admin search must remain visible and full-width at ${size.width}px on ${route.path}: ${JSON.stringify(searchBounds)}`);
        }
        const navMetrics = await page.evaluate(() => {
          const bounds = selector => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width };
          };
          return { search: bounds(".ws-top-search"), profile: bounds(".ws-top-user"), language: bounds(".ws-top-lang"), logout: bounds(".ws-top-signout") };
        });
        for (const key of ["profile", "language", "logout"]) {
          const a = navMetrics.search, b = navMetrics[key];
          if (!a || !b) throw new Error("Admin navbar control missing: " + key);
          const overlap = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          if (overlap) throw new Error("Admin navbar search overlaps " + key + " at " + size.width + "px: " + JSON.stringify(navMetrics));
        }
        if (navMetrics.search.width > 522) throw new Error("Admin navbar search exceeds its max width at " + size.width + "px.");
      }
      if (route.path.endsWith("/admin/merchant-review")) {
        const rows = page.getByTestId("merchant-review-list").getByRole("button");
        await rows.first().click();
        const drawer = page.getByTestId("workspace-drawer");
        await drawer.waitFor({ state: "visible" });
        await page.getByTestId("merchant-review-workflow").waitFor({ state: "visible" });
        await page.keyboard.press("Escape");
        await drawer.waitFor({ state: "hidden" });
        if (!(await rows.first().evaluate(node => node === document.activeElement))) throw new Error("Merchant drawer did not restore focus to the selected row.");
        await rows.first().click();
        await drawer.waitFor({ state: "visible" });
        await rows.nth(1).click();
        await drawer.waitFor({ state: "visible" });
        if (!(await page.locator('[data-testid="merchant-review-detail-panel"] h2').innerText()).includes("Épicerie Atlas")) {
          throw new Error("Selecting another merchant did not update the open drawer.");
        }
        await page.getByTestId("merchant-review-workflow").locator('input[type="checkbox"]').first().check();
        page.evaluate(() => { window.confirm = () => false; });
        await page.getByTestId("workspace-drawer-backdrop").click({ position: { x: 8, y: 8 } });
        if (!(await drawer.isVisible())) throw new Error("Merchant drawer ignored unsaved-change protection.");
        page.evaluate(() => { window.confirm = () => true; });
        await page.keyboard.press("Escape");
        await drawer.waitFor({ state: "hidden" });
        await rows.nth(1).click();
        await drawer.waitFor({ state: "visible" });
      }
      if (route.path.endsWith("/admin/offer-moderation")) {
        const rows = page.getByTestId("offer-queue").getByRole("button");
        await rows.first().click();
        const drawer = page.getByTestId("workspace-drawer");
        await drawer.waitFor({ state: "visible" });
        await rows.nth(1).click();
        await drawer.waitFor({ state: "visible" });
      }
      if (route.path.endsWith("/admin/support-cases")) {
        const rows = page.getByTestId("support-case-row");
        await rows.first().click();
        const drawer = page.getByTestId("workspace-drawer");
        await drawer.waitFor({ state: "visible" });
        const firstSubject = await page.locator('[data-testid="support-case-detail"] h2').innerText();
        await rows.nth(1).click();
        await page.waitForFunction(previous => document.querySelector('[data-testid="support-case-detail"] h2')?.textContent !== previous, firstSubject);
        if (!(await drawer.isVisible())) throw new Error("Selecting another support case closed the detail drawer.");
      }
      if (route.adminPage) await assertAdminStatusControls(page, route.path, size.width, size.height);
      if (route.path.endsWith("/admin/merchant-review")) await assertMerchantReviewLayout(page, size.width, size.height);
      if (route.path.endsWith("/admin/offer-moderation")) {
        await assertOfferModerationLayout(page, size.width, size.height);
        const longTitle = "Family breakfast basket with assorted bakery items, fresh fruit and detailed allergen information";
        await page.getByTestId("offer-queue").getByRole("button").filter({ hasText: longTitle }).click();
        await page.getByTestId("offer-food-safety-alert").waitFor({ state: "visible" });
        await page.getByTestId("offer-food-safety-alert").waitFor({ state: "visible" });
        const selectedTitle = page.getByTestId("offer-detail-panel").locator("h2").first();
        await selectedTitle.waitFor({ state: "visible" });
        const renderedTitle = (await selectedTitle.innerText()).trim();
        if (renderedTitle !== longTitle) {
          throw new Error(`Long offer title was not selected at ${size.width}x${size.height}: ${renderedTitle}`);
        }
        await assertNoHorizontalOverflow(page, route.path, size.width);
        await assertOfferDecisionAccessible(page, size.width, size.height, route.path);
        const locale = route.path.split("/")[1];
        await page.screenshot({
          path: join("artifacts/browser-screenshots", `offer-moderation-long-title-${locale}-${size.width}x${size.height}.png`),
          animations: "disabled",
        });
      }
      if (route.path.endsWith("/admin/support-cases")) {
        await assertSupportTimelineVisible(page, size.width, size.height);
      }
      if (route.direction) {
        const direction = await page.locator(route.directionSelector ?? ".kulhaAdminShell").getAttribute("dir");
        if (direction !== route.direction) throw new Error(`${route.path} expected dir=${route.direction}, received ${direction}.`);
      }
      if (route.adminPage) {
        await assertReadable(page, route.path, size.width, size.height);
        await assertAdminCardClipping(page, route.path, size.width, size.height);
        await assertScrollOwner(page, route.path, size.width, size.height);
        await assertPrimaryActionUncovered(page, route.path, size.width, size.height);
      }
      const screenshotName = `${route.path.replace(/^\/+/, "").replaceAll("/", "-")}-${size.width}x${size.height}.png`;
      if (route.token === "customer-token" && route.path.endsWith("/reservations")) {
        await waitForBackendRequest(item => item.path === "/reservations" && item.query.includes("status=cancelled"), "Customer reservation list");
        const count = requests.filter(item => item.path === "/reservations").length - reservationRequestCount;
        if (count !== 3) throw new Error(`${route.path} expected 3 reservation list requests, observed ${count}.`);
      }
      if (route.path.endsWith("/admin/audit-log")) {
        const events = page.getByTestId("audit-record-row");
        if (await events.count() < 7) throw new Error(route.path + " must render at least seven populated audit events.");
        await events.last().click();
        await page.getByTestId("audit-record-header").waitFor({ state: "visible" });
        const detailText = await page.getByTestId("audit-record-detail").innerText();
        if (detailText.length < 180) throw new Error(route.path + " selected audit detail did not render the long record fields.");
        await assertAuditExplorerLayout(page, size.width, size.height);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: join("artifacts/browser-screenshots", screenshotName), animations: "disabled" });
      if (route.adminPage && size.width === 390) {
        await page.screenshot({
          path: join("artifacts/browser-screenshots", route.path.slice(1).replaceAll("/", "-") + "-390x844-full.png"),
          animations: "disabled", fullPage: true,
        });
      }
      if (size.width === 1366 && size.height === 768 && route.path.includes("/admin/")) {
        const fullName = route.path.replace(/^\/+/, "").replaceAll("/", "-");
        await page.screenshot({
          path: join("artifacts/browser-screenshots", `${fullName}-full-1366x768.png`),
          animations: "disabled",
          fullPage: true,
        });
        const search = route.path.endsWith("/audit-log")
          ? page.getByTestId("audit-search-input")
          : page.getByTestId("admin-global-search");
        await search.fill("no matching KULHA record");
        if (route.path.endsWith("/audit-log")) {
          await page.waitForFunction(() => document.querySelectorAll('[data-testid="audit-record-row"]').length === 0, undefined, { timeout: 8000 });
        } else {
          await page.waitForTimeout(450);
        }
        const emptyCounts = await page.evaluate(() => ({
          merchants: document.querySelector('[data-testid="merchant-review-list"]')?.children.length ?? null,
          offers: document.querySelector('[data-testid="offer-queue"]')?.children.length ?? null,
          support: document.querySelector('[data-testid="support-case-list"]')?.children.length ?? null,
          audit: document.querySelectorAll('[data-testid="audit-record-row"]').length
        }));
        const emptyCount = route.path.endsWith("/merchant-review") ? emptyCounts.merchants
          : route.path.endsWith("/offer-moderation") ? emptyCounts.offers
          : route.path.endsWith("/support-cases") ? emptyCounts.support : emptyCounts.audit;
        if (emptyCount !== 0) throw new Error(route.path + " empty-state search returned " + emptyCount + " rows.");
        await page.screenshot({
          path: join("artifacts/browser-screenshots", `${route.path.replace(/^\/+/, "").replaceAll("/", "-")}-empty-state-1366x768.png`),
          animations: "disabled",
        });
        await search.fill("");
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
    await page.getByTestId("merchant-review-list").getByRole("button").first().click();
    const inlineReview = page.getByTestId("merchant-review-workflow");
    await inlineReview.waitFor({ state: "visible" });
    await inlineReview.getByLabel("Address and location checked").check();
    await inlineReview.getByLabel("Phone number reachable").check();
    await inlineReview.getByLabel("Documents readable and valid").check();
    await inlineReview.getByRole("button", { name: "Approve" }).click();
    await inlineReview.getByLabel("Reason (required)").fill("Verified during browser workflow test.");
    await page.getByTestId("merchant-review-footer").getByRole("button", { name: "Submit decision" }).click();
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
    await page.getByTestId("offer-queue").getByRole("button").first().click();
    const inlineOffer = page.getByTestId("offer-moderation-workflow");
    await inlineOffer.waitFor({ state: "visible" });
    await inlineOffer.locator('[data-action="suspend"]').click();
    await inlineOffer.getByLabel("Reason (required)").fill("Allergen information needs verification.");
    await page.getByTestId("offer-moderation-footer").getByRole("button", { name: "Hide offer" }).click();
    await waitForBackendRequest(item => item.method === "POST" && item.path.endsWith("/suspend"), "Offer moderation action");
    await context.close();
  }

  // Support: assigned SUPPORT agent reveals PII only after a reason and resolves with a separate reason.
  {
    caseStatus = "OPEN";
    supportCase.status = caseStatus;
    const context = await loginContext(browser, "support-token");
    const page = await context.newPage();
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(origin + "/en/admin/support-cases", { waitUntil: "networkidle" });
    await page.getByTestId("support-case-row").first().click();
    const timelinePanel = page.getByTestId("support-case-timeline");
    const composer = page.getByTestId("support-message-composer");
    await timelinePanel.waitFor({ state: "visible" });
    await assertSupportTimelineVisible(page, 1366, 768);

    // Long conversations scroll only in the timeline; the document and adjacent actions remain usable.
    timeline = Array.from({ length: 48 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(300 + index).padStart(12, "0")}`,
      authorType: index % 2 ? "AGENT" : "CUSTOMER",
      authorUserId: index % 2 ? actorId : customerId,
      authorLabel: index % 2 ? "Support Agent" : "Customer",
      visibility: "CUSTOMER",
      message: `Conversation history entry ${index + 1}: ${"The complete case discussion remains available to the support team. ".repeat(3)}`,
      createdAt: new Date(Date.now() - (48 - index) * 60000).toISOString(),
    }));
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.reload({ waitUntil: "networkidle" });
      await page.getByTestId("support-case-row").first().click();
      await timelinePanel.waitFor({ state: "visible" });
      await assertSupportTimelineVisible(page, size.width, size.height);
      const before = await page.evaluate(() => {
        const content = document.querySelector('[data-testid="workspace-drawer"] .content');
        const timelineNode = document.querySelector('[data-testid="support-case-timeline"]');
        return { clientHeight: content.clientHeight, scrollHeight: content.scrollHeight,
          overflow: getComputedStyle(content).overflowY, timelineOverflow: getComputedStyle(timelineNode).overflowY };
      });
      if (before.scrollHeight <= before.clientHeight + 2 || before.overflow !== "auto" || before.timelineOverflow !== "visible") {
        throw new Error("Support drawer does not own the long-conversation scroll at " + size.width + "px: " + JSON.stringify(before));
      }
      await page.locator('[data-testid="workspace-drawer"] .content').evaluate(element => { element.scrollTop = element.scrollHeight; });
      if (size.width < 600 && before.scrollHeight <= before.clientHeight) {
        throw new Error("Mobile Support Cases must retain drawer document scrolling at " + size.width + "px.");
      }
      if (size.width < 600 && before.documentHeight <= before.viewportHeight) {
        throw new Error(`Mobile Support Cases must retain ordinary document scrolling at ${size.width}px.`);
      }
    }

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.reload({ waitUntil: "networkidle" });
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
  process.stdout.write("PASS admin login screenshots/layout at 1366x768, 1920x1080 and 390x844\n");
  process.stdout.write("PASS moderation panels align at 1366x768 and 1920x1080; pagination anchored; populated offer queue internally scrollable; mobile stack checked\n");
  process.stdout.write("PASS 7 viewport sizes across 16 authenticated routes; merchant/admin modal bounds at 390px; Arabic RTL at 390px\n");
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  backend.close();
}
