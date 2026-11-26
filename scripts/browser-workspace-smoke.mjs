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
const moderationOffers = Array.from({ length: 48 }, (_, index) => {
  const sample = [
    { title: "Panier surprise pâtisserie", shopName: "Pâtisserie Maârif", reportedCount: 3, allergensStatus: "UNKNOWN", priceMinor: 4500, originalPriceMinor: 9000, quantityTotal: 10, quantityReserved: 4, pickupHour: 18 },
    { title: "Tajine poulet citron", shopName: "Dar Zitoun", reportedCount: 0, allergensStatus: "UNKNOWN", priceMinor: 3800, originalPriceMinor: null, quantityTotal: 8, quantityReserved: 2, pickupHour: 20 },
    { title: "Pain complet ×6", shopName: "Boulangerie Atlas", reportedCount: 1, allergensStatus: "DECLARED", priceMinor: 1200, originalPriceMinor: null, quantityTotal: 12, quantityReserved: 5, pickupHour: 19 },
    { title: "Salade composée", shopName: "Green Corner", reportedCount: 2, allergensStatus: "DECLARED", priceMinor: 2900, originalPriceMinor: null, quantityTotal: 6, quantityReserved: 3, pickupHour: 19 },
    { title: "Family breakfast basket with assorted bakery items, fresh fruit and detailed allergen information", shopName: "Boulangerie Test", reportedCount: 0, allergensStatus: "DECLARED", priceMinor: 4000, originalPriceMinor: 8000, quantityTotal: 10, quantityReserved: 2, pickupHour: 20 },
  ][index] ?? { title: `Offer ${index + 1}`, shopName: "Boulangerie Test", reportedCount: 0, allergensStatus: "DECLARED", priceMinor: 4000 + index * 100, originalPriceMinor: null, quantityTotal: 10, quantityReserved: 2, pickupHour: 18 };
  const pickup = new Date(now.getTime() + (sample.pickupHour - now.getHours()) * 60 * 60 * 1000);
  return {
    id: `00000000-0000-4000-8000-${String(102 + index).padStart(12, "0")}`,
    title: sample.title, shopName: sample.shopName, city: index === 1 ? "Casablanca" : "Casablanca", priceMinor: sample.priceMinor,
    originalPriceMinor: sample.originalPriceMinor, quantityTotal: sample.quantityTotal, quantityReserved: sample.quantityReserved,
    allergensStatus: sample.allergensStatus, allergens: sample.allergensStatus === "UNKNOWN" ? null : "Wheat",
    foodNotes: "Prepared today", status: "PUBLISHED", reportedCount: sample.reportedCount,
    pickupStart: pickupStart, pickupEnd, imageUrl: null,
  };
});

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
    phone: `+21260000000${index + 2}`, status: index === 0 ? "PENDING" : "INFO_REQUIRED",
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
    ["SUP-2026-0006", "Incorrect basket contents reported", "OFFER_QUALITY", "MEDIUM", "WAITING_REPLY"],
    ["SUP-2026-0007", "Shop cannot update opening hours", "MERCHANT_ACCOUNT", "LOW", "RESOLVED"],
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
const auditRows = Array.from({ length: 298 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(500 + index).padStart(12, "0")}`,
  actorUserId: actorId,
  actorName: ["A. Benali", "S. Idrissi", "A. Benali", "M. Tazi", "K. Amrani", "S. Idrissi"][index] ?? (index % 3 === 0 ? "Nadia El Amrani" : index % 3 === 1 ? "Youssef Bennani" : "Support Agent"),
  action: index === 8 ? "SUPPORT_CUSTOMER_DETAILS_REVEALED_AFTER_FOOD_SAFETY_ESCALATION_AND_PRIVACY_REVIEW" : ["OFFER_HIDDEN", "MERCHANT_APPROVED", "SUPPORT_CASE_ESCALATED", "SUPPORT_CUSTOMER_DETAILS_REVEALED", "OFFER_RESTORED", "MERCHANT_REJECTED", "SUPPORT_CASE_RESOLVED", "AUDIT_LOG_EXPORTED"][index % 8],
  targetType: ["OFFER", "MERCHANT", "SUPPORT_CASE", "CUSTOMER", "OFFER", "MERCHANT", "SUPPORT_CASE", "AUDIT_EXPORT"][index % 8],
  targetId: index === 8 ? `support-case:${supportCase.reference}:customer:${customerId}:authorized-disclosure-review:food-safety-escalation` : [offer.id, merchant.id, supportCase.reference, customerId, offer.id, merchant.id, supportCase.reference, "audit-export-2026-11-23"][index % 8],
  reason: index === 8 ? "The customer disclosure was approved for a documented food-safety escalation after the assigned support agent verified the incident, confirmed the merchant response, checked the reservation history, recorded the operational purpose, and restricted disclosed contact details to the case team. This extended reason deliberately exercises wrapping in the audit ledger and selected-record panel." : index === 0 ? "Business registration, address and owner identity were checked against the submitted application." : index === 1 ? "Offer temporarily hidden while allergen declarations are verified with the merchant." : index === 2 ? "Customer received a resolution after the pickup and food-safety details were reviewed." : index === 3 ? "Authorized support disclosure for a food-safety investigation; customer details were accessed only for this case." : "Operational review completed and action recorded.",
  result: index === 4 ? "DENIED" : index === 7 ? "FAILED" : "SUCCESS",
  correlationId: index === 8 ? "kulha-admin-smoke-correlation-food-safety-disclosure-review-2026-11-23-0009" : `kulha-admin-smoke-${index + 1}`,
  createdAt: new Date(now.getTime() - ([12, 60, 120, 125, 150, 180][index] ?? index * 17) * 60000).toISOString(),
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
function page(items, pageNumber = 0, size = 20) { const start = pageNumber * size; return { items: items.slice(start, start + size), page: pageNumber, size, total: items.length }; }
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

  const merchantActionMatch = path.match(new RegExp("^/admin/merchants/([^/]+)/(request-information|reject)$"));
  if (merchantActionMatch && method === "POST") {
    await bodyOf(request);
    if (merchantActionMatch[1].endsWith("000000000117") && merchantActionMatch[2] === "request-information") {
      return json(response, { detail: "Simulated merchant conflict for partial-failure coverage." }, 409);
    }
    const target = merchantRows.find(item => item.id === merchantActionMatch[1]);
    if (target) target.status = merchantActionMatch[2] === "reject" ? "REJECTED" : "INFO_REQUIRED";
    return json(response, {});
  }
  if (path === "/admin/merchants" && method === "GET") {
    const rows = url.searchParams.get("status") === "PENDING" && merchantStatus === "PENDING" ? merchantRows.filter(item => item.status === "PENDING") : merchantRows.filter(item => item.status === url.searchParams.get("status"));
    return json(response, page(rows, Number(url.searchParams.get("page") ?? 0), Number(url.searchParams.get("size") ?? 20)));
  }
  if (path === `/admin/merchants/${merchant.id}` && method === "GET") return json(response, merchant);
  if (path === `/admin/merchants/${merchant.id}/request-information` && method === "POST") {
    await bodyOf(request);
    merchantStatus = "INFO_REQUIRED";
    merchant.status = merchantStatus;
    return json(response, {});
  }
  if (path === `/admin/merchants/${merchant.id}/approve` && method === "POST") {
    await bodyOf(request);
    merchantStatus = "APPROVED";
    merchant.status = merchantStatus;
    return json(response, {});
  }
  if (path === "/admin/offers" && method === "GET") {
    return json(response, page(moderationOffers.map(item => ({ ...item, status: offerStatus })), Number(url.searchParams.get("page") ?? 0), Number(url.searchParams.get("size") ?? 20)));
  }
  const offerActionMatch = path.match(new RegExp("^/admin/offers/([^/]+)/(suspend|request-edit|reinstate)$"));
  if (offerActionMatch && method === "POST") {
    await bodyOf(request);
    if (offerActionMatch[1].endsWith("000000000103") && offerActionMatch[2] === "request-edit") {
      return json(response, { detail: "Simulated moderation conflict for partial-failure coverage." }, 409);
    }
    if (offerActionMatch[2] === "suspend") offerStatus = "SUSPENDED";
    return json(response, {});
  }
  if (path === `/admin/offers/${offer.id}/suspend` && method === "POST") {
    await bodyOf(request);
    offerStatus = "SUSPENDED";
    return json(response, {});
  }
  if (path === "/admin/support-cases" && method === "GET") {
    const requestedStatus = url.searchParams.get("status") ?? "OPEN";
    const rows = supportCases.map(item => item.id === supportCase.id ? { ...item, status: caseStatus } : item).filter(item => item.status === requestedStatus);
    return json(response, page(rows, Number(url.searchParams.get("page") ?? 0), Number(url.searchParams.get("size") ?? 20)));
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
  if (path === "/admin/audit-log" && method === "GET") return json(response, page(auditRows, Number(url.searchParams.get("page") ?? 0), Number(url.searchParams.get("size") ?? 20)));
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
    const tabs = [...document.querySelectorAll('[role="tablist"] button')];
    const box = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height };
    };
    return {
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      workspace: box(workspace), picker: box(picker), preview: box(preview),
      direction: workspace ? getComputedStyle(workspace).direction : "missing",
      tabHeights: tabs.map(tab => Math.round(tab.getBoundingClientRect().height)),
      offerCount: document.querySelectorAll('[data-testid="offer-queue"] > *').length,
      longTitleCount: [...document.querySelectorAll('[data-testid="offer-queue"] strong')].filter(element => (element.textContent ?? "").trim().length > 48).length,
      columns: workspace ? getComputedStyle(workspace).gridTemplateColumns : "",
    };
  });
  if (metrics.documentWidth > width + 1 || metrics.bodyWidth > width + 1)
    throw new Error(`Offer moderation horizontal overflow at ${width}x${height}: ${JSON.stringify(metrics)}`);
  if (!metrics.workspace || !metrics.picker || !metrics.preview)
    throw new Error(`Offer moderation layout regions are missing at ${width}x${height}: ${JSON.stringify(metrics)}`);
  if (metrics.tabHeights.some(value => value > 44))
    throw new Error(`Admin status filters must remain compact at ${width}x${height}: ${JSON.stringify(metrics.tabHeights)}`);
  if (metrics.picker.width < width - (width >= 900 ? 300 : 24))
    throw new Error("Offer queue must use the available workspace width before a selection is opened at " + width + "px: " + JSON.stringify(metrics));
  if (metrics.preview.width > 0)
    throw new Error("Offer detail dialog should remain closed until an offer is selected at " + width + "px: " + JSON.stringify(metrics));
  if (metrics.offerCount < 10 || metrics.longTitleCount < 1)
    throw new Error(`Offer moderation fixtures must exercise a populated queue and a long offer title: ${JSON.stringify(metrics)}`);
}


async function assertAdminStatusControls(page, route, width, height) {
  const controls = await page.evaluate(() => [...document.querySelectorAll('[role="tablist"] button')].map(button => {
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    return { height: rect.height, radius: parseFloat(style.borderTopLeftRadius) };
  }));
  if (controls.some(control => control.height > 44 || control.radius > 16)) {
    throw new Error("Admin status controls are oversized at " + width + "x" + height + " on " + route + ": " + JSON.stringify(controls));
  }
}

async function assertMerchantReviewLayout(page, width, height) {
  const metrics = await page.evaluate(() => {
    const detail = document.querySelector('[data-testid="merchant-review-detail-panel"]');
    const heading = document.querySelector('[data-testid="admin-page-heading"]');
    const topbar = document.querySelector('[data-testid="admin-console-topbar"]');
    const tabs = document.querySelector('.kulhaAdminShell[data-page="merchant-review"] [role="tablist"]');
    const workflow = document.querySelector('[data-testid="merchant-review-workflow"]');
    const decision = document.querySelector('[data-testid="merchant-review-decision"]');
    const footer = document.querySelector('[data-testid="merchant-review-footer"]');
    const box = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height };
    };
    const buttons = [...(decision?.querySelectorAll('button') ?? [])].map(button => {
      const rect = button.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    });
    const textareas = [...(decision?.querySelectorAll('textarea') ?? [])].map(element => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, visible: rect.width > 0 && rect.height > 0 };
    });
    const footerButton = footer?.querySelector('button');
    const footerText = footer?.querySelector('p');
    const actionRect = footerButton?.getBoundingClientRect();
    const noteRect = footerText?.getBoundingClientRect();
    return {
      detail: box(detail), heading: box(heading), topbar: box(topbar), tabs: box(tabs),
      workflow: box(workflow), decision: box(decision), footer: box(footer),
      documentWidth: document.documentElement.scrollWidth, scrollY: window.scrollY,
      buttons, textareas,
      footerAction: actionRect ? { top: actionRect.top, bottom: actionRect.bottom, left: actionRect.left, right: actionRect.right } : null,
      footerNote: noteRect ? { top: noteRect.top, bottom: noteRect.bottom, left: noteRect.left, right: noteRect.right } : null,
      selectedMerchant: detail?.textContent?.includes('Boulangerie Test') ?? false,
      detailWidth: detail?.getBoundingClientRect().width ?? 0,
      bodyColumns: workflow ? getComputedStyle(workflow).gridTemplateColumns : ''
    };
  });
  if (!metrics.detail || !metrics.heading || !metrics.topbar || !metrics.tabs
      || !metrics.workflow || !metrics.decision || !metrics.footer
      || !metrics.footerAction || !metrics.footerNote || !metrics.selectedMerchant) {
    throw new Error("Merchant review decision workspace is incomplete at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.detail.width > 800 || metrics.bodyColumns.split(' ').length < 2) {
    throw new Error('Merchant decision dialog must match the compact two-column PDF design at ' + width + 'x' + height + ': ' + JSON.stringify(metrics));
  }
  if (metrics.documentWidth > width + 1 || metrics.detail.left < -1 || metrics.detail.right > width + 1) {
    throw new Error("Merchant review horizontal clipping at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.scrollY > 1 || metrics.heading.top < metrics.topbar.bottom - 1
      || metrics.tabs.top < metrics.heading.bottom - 1) {
    throw new Error("Merchant review heading, filters and topbar overlap or start scrolled at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.buttons.length !== 3 || metrics.textareas.length !== 2 || metrics.textareas.some(field => !field.visible)) {
    throw new Error("Merchant review decision controls are missing at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  const overlaps = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  for (let i = 0; i < metrics.buttons.length; i++) for (let j = i + 1; j < metrics.buttons.length; j++) {
    if (overlaps(metrics.buttons[i], metrics.buttons[j])) {
      throw new Error("Merchant review decision buttons overlap at " + width + "x" + height + ": " + JSON.stringify(metrics));
    }
  }
  if (overlaps(metrics.footerAction, metrics.footerNote)) {
    throw new Error("Merchant review decision note overlaps the final action at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (width >= 900 && metrics.footer.bottom > height + 2) {
    throw new Error("Merchant review final action is below the desktop viewport at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
}


async function assertOfferDecisionAccessible(page, width, height, route) {
  const metrics = await page.evaluate(() => {
    const workspace = document.querySelector('[data-testid="offer-workspace"]');
    const picker = document.querySelector('[data-testid="offer-picker"]');
    const queue = document.querySelector('[data-testid="offer-queue"]');
    const pagination = document.querySelector('[data-testid="offer-pagination"]');
    const preview = document.querySelector('[data-testid="offer-detail-panel"]');
    const previewScroll = document.querySelector('[data-testid="offer-preview-scroll"]');
    const evidence = document.querySelector('[data-testid="offer-evidence"]');
    const dock = document.querySelector('[data-testid="offer-decision-dock"]');
    const workflow = document.querySelector('[data-testid="offer-moderation-workflow"]');
    const footer = document.querySelector('[data-testid="offer-moderation-footer"]');
    const reasonPanel = document.querySelector('[data-testid="offer-decision-reason"]');
    const reasonField = reasonPanel?.querySelector("textarea");
    const reasonLabel = reasonPanel?.querySelector("label");
    const reasonChips = [...(reasonPanel?.querySelectorAll("button") ?? [])];
    const decisionButtons = [...(workflow?.querySelectorAll("button[data-action]") ?? [])];
    const title = preview?.querySelector("h2");
    const safetyWarning = document.querySelector('[data-testid="offer-food-safety-alert"]');
    const box = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height };
    };
    const font = element => element ? Number.parseFloat(getComputedStyle(element).fontSize) : null;
    const action = footer?.querySelector("button");
    return {
      workspace: box(workspace), picker: box(picker), queue: box(queue), pagination: box(pagination),
      preview: box(preview), previewScroll: box(previewScroll), evidence: box(evidence),
      decisionDock: box(dock), workflow: box(workflow), footer: box(footer),
      action: box(action), reasonPanel: box(reasonPanel), reasonField: box(reasonField), title: box(title),
      queueClient: queue?.clientHeight ?? 0, queueScroll: queue?.scrollHeight ?? 0,
      queueOverflow: queue ? getComputedStyle(queue).overflowY : "missing",
      previewClient: preview?.clientHeight ?? 0,
      previewOverflow: preview ? getComputedStyle(preview).overflowY : "missing",
      previewScrollClient: previewScroll?.clientHeight ?? 0,
      previewScrollHeight: previewScroll?.scrollHeight ?? 0,
      previewScrollOverflow: previewScroll ? getComputedStyle(previewScroll).overflowY : "missing",
      documentWidth: document.documentElement.scrollWidth,
      evidenceInsideScroll: Boolean(previewScroll && evidence && previewScroll.contains(evidence)),
      evidenceInsideWorkflow: Boolean(workflow && evidence && workflow.contains(evidence)),
      safetyWarningInsideScroll: Boolean(previewScroll && safetyWarning && previewScroll.contains(safetyWarning)),
      safetyWarningInsideWorkflow: Boolean(workflow && safetyWarning && workflow.contains(safetyWarning)),
      reasonLabelFont: font(reasonLabel),
      reasonFieldFont: font(reasonField),
      reasonChipFonts: reasonChips.map(font),
      reasonChipHeights: reasonChips.map(element => element.getBoundingClientRect().height),
      decisionButtonFonts: decisionButtons.map(font),
      decisionButtonHeights: decisionButtons.map(element => element.getBoundingClientRect().height),
      footerTextFont: font(footer?.querySelector("p")),
      actionHeight: action?.getBoundingClientRect().height ?? 0,
      dialogWidth: preview?.getBoundingClientRect().width ?? 0,
      decisionColumns: workflow ? getComputedStyle(workflow).gridTemplateColumns : "",
    };
  });
  const failures = [];
  const check = (ok, message) => { if (!ok) failures.push(message); };
  check(metrics.dialogWidth <= 800 && metrics.decisionColumns.split(" ").length >= 2,
    "Individual offer dialog should use compact two-column PDF layout (width " + metrics.dialogWidth + ", columns " + metrics.decisionColumns + ").");
  const fmt = value => Number.isFinite(value) ? value.toFixed(1) : String(value);
  check(Boolean(metrics.workspace), "workspace is missing");
  check(Boolean(metrics.picker), "offer picker is missing");
  check(Boolean(metrics.queue), "offer queue is missing");
  check(Boolean(metrics.pagination), "pagination is missing");
  check(Boolean(metrics.preview), "preview card is missing");
  check(Boolean(metrics.previewScroll), "independent preview scroll region is missing");
  check(Boolean(metrics.evidence), "evidence section is missing");
  check(Boolean(metrics.decisionDock), "decision dock is missing");
  check(Boolean(metrics.workflow), "decision workflow is missing");
  check(Boolean(metrics.footer), "decision footer is missing");
  check(Boolean(metrics.action), "primary moderation action is missing");
  check(Boolean(metrics.reasonPanel), "reason panel is missing");
  check(Boolean(metrics.reasonField), "reason textarea is missing");
  check(metrics.reasonField?.height >= 44, `reasonField.height ${fmt(metrics.reasonField?.height)} must be >= 44px`);
  check(metrics.documentWidth <= width + 1, `document width ${metrics.documentWidth}px exceeds viewport ${width}px`);
  check(metrics.pagination && metrics.picker && metrics.pagination.top >= metrics.picker.top - 1,
    `pagination.top ${fmt(metrics.pagination?.top)} is above picker.top ${fmt(metrics.picker?.top)}`);
  check(metrics.pagination && metrics.picker && metrics.pagination.bottom <= metrics.picker.bottom + 1,
    `pagination.bottom ${fmt(metrics.pagination?.bottom)} exceeds picker.bottom ${fmt(metrics.picker?.bottom)}`);
  check(metrics.evidenceInsideScroll, "evidence is not inside the independent preview scroll region");
  check(!metrics.evidenceInsideWorkflow, "evidence must not be inside the decision workflow");
  check(metrics.safetyWarningInsideScroll, "food-safety warning is not inside the preview scroll region");
  check(!metrics.safetyWarningInsideWorkflow, "food-safety warning must stay outside the decision workflow");
  check(metrics.previewScroll && metrics.preview && metrics.previewScroll.top >= metrics.preview.top - 1
    && metrics.previewScroll.bottom <= metrics.preview.bottom + 1, "preview scroll region escapes the preview card");
  check(metrics.decisionDock && metrics.preview && metrics.decisionDock.top >= metrics.preview.top - 1
    && metrics.decisionDock.bottom <= metrics.preview.bottom + 1, "decision dock escapes the preview card");
  check(metrics.workflow && metrics.footer && metrics.workflow.bottom <= metrics.footer.top - 4,
    `workflow.bottom ${fmt(metrics.workflow?.bottom)} must be at least 4px above footer.top ${fmt(metrics.footer?.top)}`);
  check(metrics.reasonField && metrics.footer && metrics.reasonField.bottom <= metrics.footer.top - 4,
    `reasonField.bottom ${fmt(metrics.reasonField?.bottom)} must be <= footer.top ${fmt(metrics.footer?.top)} - 4`);
  check(metrics.workflow && metrics.preview && metrics.workflow.bottom <= metrics.preview.bottom,
    `workflow.bottom ${fmt(metrics.workflow?.bottom)} exceeds preview.bottom ${fmt(metrics.preview?.bottom)}`);
  check(metrics.footer && metrics.preview && metrics.footer.bottom <= metrics.preview.bottom,
    `footer.bottom ${fmt(metrics.footer?.bottom)} exceeds preview.bottom ${fmt(metrics.preview?.bottom)}`);
  check(metrics.action && metrics.preview && metrics.action.bottom <= metrics.preview.bottom - 8,
    `action.bottom ${fmt(metrics.action?.bottom)} leaves less than 8px below the button inside the preview`);
  check(metrics.action && metrics.action.bottom <= height + 2,
    `action.bottom ${fmt(metrics.action?.bottom)} is below viewport height ${height}px`);
  check(metrics.reasonField && metrics.preview && metrics.reasonField.top >= metrics.preview.top - 1,
    `reasonField.top ${fmt(metrics.reasonField?.top)} is above preview.top ${fmt(metrics.preview?.top)}`);
  check(metrics.title && metrics.previewScroll && metrics.title.top >= metrics.previewScroll.top - 1
    && metrics.title.bottom <= metrics.previewScroll.bottom + 1,
    `selected title bounds ${JSON.stringify(metrics.title)} escape preview scroll bounds ${JSON.stringify(metrics.previewScroll)}`);
  check(metrics.reasonLabelFont >= 11, `reason label font ${fmt(metrics.reasonLabelFont)}px is below 11px`);
  check(metrics.reasonFieldFont >= 11, `reason textarea font ${fmt(metrics.reasonFieldFont)}px is below 11px`);
  check(metrics.reasonChipFonts.length === 4 && metrics.reasonChipFonts.every(size => size >= 11),
    `reason chip fonts ${metrics.reasonChipFonts.map(fmt).join(", ")}px must all be >= 11px`);
  check(metrics.reasonChipHeights.length === 4 && metrics.reasonChipHeights.every(size => size >= 30),
    `reason chip heights ${metrics.reasonChipHeights.map(fmt).join(", ")}px must all be >= 30px`);
  check(metrics.decisionButtonFonts.length === 3 && metrics.decisionButtonFonts.every(size => size >= 11),
    `decision button fonts ${metrics.decisionButtonFonts.map(fmt).join(", ")}px must all be >= 11px`);
  check(metrics.decisionButtonHeights.length === 3 && metrics.decisionButtonHeights.every(size => size >= 30),
    `decision button heights ${metrics.decisionButtonHeights.map(fmt).join(", ")}px must all be >= 30px`);
  check(metrics.footerTextFont >= 11, `footer note font ${fmt(metrics.footerTextFont)}px is below 11px`);
  check(metrics.actionHeight >= 36, `primary action height ${fmt(metrics.actionHeight)}px is below 36px`);
  check(metrics.previewOverflow === "hidden", `preview overflow is ${metrics.previewOverflow}, expected hidden`);
  check(metrics.previewScrollOverflow === "auto",
    `preview scroll overflow is ${metrics.previewScrollOverflow}, expected auto`);
  check(metrics.previewClient >= 100, `preview client height ${metrics.previewClient}px is below 100px`);
  if (width >= 1100 && height <= 820) {
    check(metrics.queueClient >= 40, `queue client height ${metrics.queueClient}px is below 40px`);
    check(metrics.queueScroll > metrics.queueClient + 2,
      `queue scroll height ${metrics.queueScroll}px does not exceed client height ${metrics.queueClient}px`);
    check(metrics.queueOverflow === "auto", `queue overflow is ${metrics.queueOverflow}, expected auto`);
  }
  if (failures.length) {
    await page.screenshot({
      path: `artifacts/browser-screenshots/FAIL-offer-${width}x${height}.png`,
      animations: "disabled",
    });
    throw new Error(`Offer decision failed at ${width}x${height}:\n- ${failures.join("\n- ")}\n${JSON.stringify(metrics)}`);
  }
  process.stdout.write(`PASS offer geometry ${width}x${height}: ${JSON.stringify(metrics)}\n`);
}
async function assertSupportTimelineVisible(page, width, height) {
  const history = page.getByTestId("support-case-history");
  const timeline = page.getByTestId("support-case-timeline");
  const firstMessage = timeline.locator("article").first();
  await firstMessage.waitFor({ state: "visible" });
  const firstBox = await firstMessage.boundingBox();
  const historyBox = await history.boundingBox();
  const actionBar = page.getByTestId("support-case-actions");
  const composer = page.getByTestId("support-message-composer");
  const composerBox = await composer.boundingBox();
  if (!firstBox || !historyBox || !composerBox) {
    throw new Error("Support timeline or reply composer is missing at " + width + "x" + height + ".");
  }
  if (width >= 900 && (firstBox.y + firstBox.height <= historyBox.y
      || firstBox.y >= historyBox.y + historyBox.height)) {
    throw new Error("The first support conversation message is not visible in the initial timeline viewport at "
      + width + "x" + height + ": " + JSON.stringify({ firstBox, historyBox }));
  }
  await history.evaluate(element => { element.scrollTop = element.scrollHeight; });
  const actionsBox = await actionBar.boundingBox();
  const historyAfterScroll = await history.boundingBox();
  if (!actionsBox || !historyAfterScroll || actionsBox.y < historyAfterScroll.y - 1
      || actionsBox.y + actionsBox.height > historyAfterScroll.y + historyAfterScroll.height + 1) {
    throw new Error("Support case actions are not reachable inside the independent history scroller at "
      + width + "x" + height + ": " + JSON.stringify({ actionsBox, historyAfterScroll }));
  }
  const composerAfterScroll = await composer.boundingBox();
  if (!composerAfterScroll || Math.abs(composerAfterScroll.y - composerBox.y) > 1) {
    throw new Error("Support reply composer moved while the conversation timeline scrolled at " + width + "x" + height + ".");
  }
  await history.evaluate(element => { element.scrollTop = 0; });
}

async function assertAuditExplorerLayout(page, width, height) {
  const metrics = await page.evaluate(() => {
    const explorer = document.querySelector('[data-testid="audit-explorer"]');
    const table = document.querySelector('[data-testid="audit-table-card"]');
    const tableViewport = table?.querySelector(".table");
    const firstRow = table?.querySelector("tbody tr");
    const detail = document.querySelector('[data-testid="audit-record-detail"]');
    const header = document.querySelector('[data-testid="audit-record-header"]');
    const rect = element => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { top: value.top, bottom: value.bottom, left: value.left, right: value.right, width: value.width, height: value.height };
    };
    return {
      explorer: rect(explorer), table: rect(table), detail: rect(detail), header: rect(header),
      detailPosition: detail ? getComputedStyle(detail).position : "missing",
      scrollWidth: document.documentElement.scrollWidth,
      tableViewportWidth: tableViewport?.clientWidth ?? 0,
      tableViewportScrollWidth: tableViewport?.scrollWidth ?? 0,
      mobileRowDisplay: firstRow ? getComputedStyle(firstRow).display : "missing",
      mobileCells: firstRow?.querySelectorAll("td[data-label]").length ?? 0,
      detailText: detail?.textContent ?? ""
    };
  });
  if (!metrics.explorer || !metrics.table || !metrics.detail || !metrics.header
      || metrics.detail.width < 220 || metrics.detailText.length < 180) {
    throw new Error("Audit ledger and selected-record dialog are not both rendered at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (metrics.scrollWidth > width + 1 || metrics.detail.left < 7 || metrics.detail.right > width - 7
      || metrics.detail.top < 0 || metrics.detail.bottom > height + 1 || metrics.detailPosition !== "fixed") {
    throw new Error("Audit record dialog must remain centered and within the viewport at " + width + "x" + height + ": " + JSON.stringify(metrics));
  }
  if (width < 900 && (metrics.tableViewportScrollWidth > metrics.tableViewportWidth + 1
      || metrics.mobileRowDisplay !== "grid" || metrics.mobileCells !== 6)) {
    throw new Error("Audit mobile events must use labeled stacked cells without horizontal scrolling at " + width + "x" + height + ": " + JSON.stringify(metrics));
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
    { width: 1279, height: 720 }, { width: 1100, height: 720 },
    { width: 1024, height: 768 }, { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ];
  mkdirSync("artifacts/browser-screenshots", { recursive: true });

  // Admin login is public: cover the required viewport matrix in English and Arabic.
  {
    const loginSizes = sizes.filter(size => [1920, 1440, 1366, 1280, 1279, 1100, 390].includes(size.width));
    for (const locale of [
      { code: "fr", heading: "Connexion administrateur", direction: "ltr" },
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
    { path: "/en/merchant/orders", token: "merchant-token", heading: "Orders" , compact: true },
    { path: "/en/merchant/reservations/scan", token: "merchant-token", heading: "Validate a pickup" , compact: true },
    { path: "/en/merchant/staff", token: "merchant-token", heading: "Staff" , compact: true },
    { path: "/en/merchant/sales", token: "merchant-token", heading: "Sales" , compact: true },
    { path: "/fr/admin", token: "admin-token", heading: "Aujourd’hui chez Kulha!" },
    { path: "/en/admin", token: "admin-token", heading: "Today at Kulha!" },
    { path: "/ar/admin", token: "admin-token", heading: "اليوم في KULHA!", direction: "rtl" },
    { path: "/en/admin/merchant-review", token: "admin-token", heading: "Merchant review", adminPage: true },
    { path: "/fr/admin/merchant-review", token: "admin-token", heading: "Revue des commerces", adminPage: true },
    { path: "/ar/admin/merchant-review", token: "admin-token", heading: "مراجعة المتاجر", direction: "rtl", adminPage: true },
    { path: "/en/admin/offer-moderation", token: "admin-token", heading: "Offer moderation", adminPage: true },
    { path: "/fr/admin/offer-moderation", token: "admin-token", heading: "Modération des offres", adminPage: true },
    { path: "/ar/admin/offer-moderation", token: "admin-token", heading: "مراجعة العروض", direction: "rtl", adminPage: true },
    { path: "/en/admin/support-cases", token: "support-token", heading: "Support cases", compact: true, adminPage: true },
    { path: "/fr/admin/support-cases", token: "support-token", heading: "Dossiers support", compact: true, adminPage: true },
    { path: "/ar/admin/support-cases", token: "support-token", heading: "طلبات الدعم", direction: "rtl", compact: true, adminPage: true },
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
      if (route.path.includes("/admin") && !route.path.includes("/admin/login")) {
        const adminLinks = page.locator(".ws-sidebar-admin .ws-nav-link");
        if (await adminLinks.count() !== 5) throw new Error("Administrator navigation must expose all five workspaces.");
        if (size.width <= 600) {
          const navBounds = await adminLinks.evaluateAll(links => links.map(link => {
            const rect = link.getBoundingClientRect();
            return { left: rect.left, right: rect.right, width: rect.width };
          }));
          if (navBounds.some(rect => rect.width < 44 || rect.left < 0 || rect.right > size.width)) {
            throw new Error("All administrator navigation items must fit the mobile viewport: " + JSON.stringify(navBounds));
          }
        }
      }
      await assertNoHorizontalOverflow(page, route.path, size.width);
      if (route.path.endsWith("/admin/merchant-review") && size.width <= 600) {
        const merchantDialog = page.getByTestId("merchant-review-detail-panel");
        const merchantClose = merchantDialog.getByTestId("merchant-review-close");
        await merchantClose.waitFor({ state: "visible" });
        const dialogBounds = await merchantDialog.boundingBox();
        const dialogHeaderBounds = await merchantClose.boundingBox();
        if (!dialogBounds || !dialogHeaderBounds || dialogHeaderBounds.top < 0 || dialogHeaderBounds.bottom > size.height) {
          throw new Error("Mobile merchant review must keep its dialog header visible: " + JSON.stringify({ dialogBounds, dialogHeaderBounds }));
        }
      }
      if (route.path.endsWith("/admin") && size.width >= 900) {
        const overview = await page.evaluate(() => {
          const metrics = document.querySelector(".overviewMetrics");
          const columns = document.querySelector(".overviewColumns");
          const queue = document.querySelector(".overviewQueue");
          const side = document.querySelector(".overviewSide");
          const rect = element => {
            if (!element) return null;
            const value = element.getBoundingClientRect();
            return { top: value.top, left: value.left, right: value.right, width: value.width, bottom: value.bottom };
          };
          return { metricCount: metrics?.children.length ?? 0, metrics: rect(metrics), columns: rect(columns), queue: rect(queue), side: rect(side) };
        });
        if (overview.metricCount !== 3 || !overview.queue || !overview.side || overview.queue.width < 240 || overview.side.width < 220) {
          throw new Error("Overview must show three operational metrics and complete queue/activity regions: " + JSON.stringify(overview));
        }
        if (size.width < 1100 && overview.side.top < overview.queue.bottom - 1) {
          throw new Error("Overview activity must stack below the priority queue below 1100px: " + JSON.stringify(overview));
        }
        if (size.width >= 1100 && overview.side.left < overview.queue.right - 1) {
          throw new Error("Overview activity must remain in a right column at 1100px and wider: " + JSON.stringify(overview));
        }
      }
      if (route.adminPage && !route.path.endsWith("/admin/audit-log")) {
        const search = page.getByTestId("admin-console-search");
        await search.getByTestId("admin-global-search").waitFor({ state: "visible" });
        const searchBounds = await search.boundingBox();
        if (!searchBounds || (size.width < 900 && searchBounds.width < size.width - 64)) {
          throw new Error(`Admin search must remain visible and full-width at ${size.width}px on ${route.path}: ${JSON.stringify(searchBounds)}`);
        }
      }
      if (size.width === 1366 && route.path.endsWith("/admin/merchant-review")) {
        await page.getByTestId("merchant-review-workflow").waitFor({ state: "visible" });
      }
      if (size.width === 1366 && route.path.endsWith("/admin/support-cases")) {
        await page.screenshot({ path: join("artifacts/browser-screenshots", "support-before-close-1366x768.png"), animations: "disabled" });
        const supportCloseBounds = await page.getByTestId("support-case-close").boundingBox();
        if (!supportCloseBounds || supportCloseBounds.top < 0 || supportCloseBounds.bottom > size.height) {
          throw new Error("Support close control must remain inside the viewport: " + JSON.stringify(supportCloseBounds));
        }
        await page.getByTestId("support-case-close").click();
        await page.getByTestId("support-case-row").first().click();
        await page.locator('[data-testid="support-case-detail"] h2').waitFor({ state: "visible" });
      }
      if (route.adminPage) await assertAdminStatusControls(page, route.path, size.width, size.height);
      if (route.path.endsWith("/admin/merchant-review") && size.width >= 1280) await assertMerchantReviewLayout(page, size.width, size.height);
      if (route.path.endsWith("/admin/offer-moderation")) {
        await assertOfferModerationLayout(page, size.width, size.height);
        const longTitle = "Family breakfast basket with assorted bakery items, fresh fruit and detailed allergen information";
        await page.getByTestId("offer-queue").getByRole("button").filter({ hasText: longTitle }).click();
        await page.getByTestId("offer-food-safety-alert").waitFor({ state: "visible" });
        const selectedTitle = page.getByTestId("offer-detail-panel").locator("h2").first();
        await selectedTitle.waitFor({ state: "visible" });
        const renderedTitle = (await selectedTitle.innerText()).trim();
        if (renderedTitle !== longTitle) {
          throw new Error(`Long offer title was not selected at ${size.width}x${size.height}: ${renderedTitle}`);
        }
        await assertNoHorizontalOverflow(page, route.path, size.width);
        if (size.width >= 1100) await assertOfferDecisionAccessible(page, size.width, size.height, route.path);
        const locale = route.path.split("/")[1];
        await page.screenshot({
          path: join("artifacts/browser-screenshots", `offer-moderation-long-title-${locale}-${size.width}x${size.height}.png`),
          animations: "disabled",
        });
      }
      if (route.path.endsWith("/admin/support-cases")) {
        const supportLayout = await page.evaluate(() => {
          const detail = document.querySelector('[data-testid="support-case-detail"]');
          const history = document.querySelector('[data-testid="support-case-history"]');
          const composer = document.querySelector('[data-testid="support-message-composer"]');
          if (!detail || !history || !composer) return { missingRegion: true };
          const panel = detail.getBoundingClientRect();
          const reply = composer.getBoundingClientRect();
          const picker = detail.parentElement?.children[0];
          const pickerBottom = picker?.getBoundingClientRect().bottom ?? null;
          const style = getComputedStyle(detail);
          const historyStyle = getComputedStyle(history);
          return {
            missingRegion: false,
            panelBottom: panel.bottom,
            composerBottom: reply.bottom,
            detailTop: panel.top,
            pickerBottom,
            documentHeight: document.documentElement.scrollHeight,
            viewportHeight: innerHeight,
            detailOverflow: style.overflowY,
            detailPosition: style.position,
            historyOverflow: historyStyle.overflowY,
          };
        });
        if (supportLayout.missingRegion || supportLayout.composerBottom > supportLayout.panelBottom + 1) {
          throw new Error(`Support composer escaped its detail panel at ${size.width}x${size.height}: ${JSON.stringify(supportLayout)}`);
        }
        if (size.width >= 900) await assertSupportTimelineVisible(page, size.width, size.height);
        if (size.width >= 900 && (supportLayout.detailPosition !== "fixed" || supportLayout.detailTop < 0
          || supportLayout.panelBottom > size.height + 1)) {
          throw new Error("Desktop support case dialog must remain inside the viewport at " + size.width + "px: " + JSON.stringify(supportLayout));
        }
        if (size.width < 900 && supportLayout.pickerBottom !== null && supportLayout.detailTop < supportLayout.pickerBottom - 1) {
          throw new Error("Mobile support details must stack below the case picker at " + size.width + "px: " + JSON.stringify(supportLayout));
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
      if (route.path.endsWith("/admin/audit-log")) {
        const events = page.getByTestId("audit-record-row");
        if (await events.count() < 7) throw new Error(route.path + " must render at least seven populated audit events.");
        await events.nth(8).click();
        await page.getByTestId("audit-record-header").waitFor({ state: "visible" });
        const detailText = await page.getByTestId("audit-record-detail").innerText();
        if (detailText.length < 180) throw new Error(route.path + " selected audit detail did not render the long record fields.");
        if (size.width >= 900) await assertAuditExplorerLayout(page, size.width, size.height);
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
        if (route.path.endsWith("/offer-moderation")) await page.getByTestId("offer-review-close").click();
        if (route.path.endsWith("/merchant-review")) await page.getByTestId("merchant-review-close").click();
        if (route.path.endsWith("/support-cases")) await page.getByTestId("support-case-close").click();
        if (route.path.endsWith("/audit-log")) await page.getByTestId("audit-record-close").click();
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

  {
    merchantStatus = "PENDING";
    merchant.status = merchantStatus;
    const context = await loginContext(browser, "admin-token");
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + "/en/admin/merchant-review", { waitUntil: "networkidle" });
    const inlineReview = page.getByTestId("merchant-review-workflow");
    await inlineReview.waitFor({ state: "visible" });
    await inlineReview.getByLabel("Address and location checked").check();
    await inlineReview.getByLabel("Phone number reachable").check();
    const documents = inlineReview.getByLabel("Documents readable and valid");
    if (!(await documents.isDisabled())) throw new Error("Merchant approval document check must remain disabled without backend documents.");
    const approve = inlineReview.getByRole("button", { name: "Approve" });
    if (!(await approve.isDisabled())) throw new Error("Merchant approval must remain blocked until documents are verifiable.");
    const approvalOpacity = Number(await approve.evaluate(element => getComputedStyle(element).opacity));
    if (approvalOpacity >= 1) throw new Error("Blocked merchant approval must be visibly disabled.");
    await inlineReview.getByRole("button", { name: "Request information" }).click();
    const merchantSubmit = page.getByTestId("merchant-review-footer").getByRole("button", { name: "Submit decision" });
    if (!(await merchantSubmit.isDisabled())) throw new Error("Merchant decisions must require a reason.");
    await inlineReview.getByLabel("Reason (required)").fill("Please provide the missing business documents.");
    if (await merchantSubmit.isDisabled()) throw new Error("A valid merchant reason should enable the decision.");
    await merchantSubmit.click();
    await waitForBackendRequest(item => item.method === "POST" && item.path.endsWith("/request-information"), "Merchant request-information action");
    if (requests.some(item => item.method === "POST" && item.path.endsWith("/approve"))) throw new Error("A blocked merchant approval reached the backend.");
    await context.close();
  }

  {
    merchantStatus = "PENDING";
    merchant.status = merchantStatus;
    merchantRows.forEach(item => { item.status = "PENDING"; });
    const context = await loginContext(browser, "admin-token");
    const page = await context.newPage();
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(origin + "/en/admin/merchant-review", { waitUntil: "networkidle" });
    await page.getByTestId("merchant-review-close").click();
    const checks = page.locator('[data-testid="merchant-review-list"] input[type="checkbox"]');
    await checks.nth(0).check();
    await checks.nth(1).check();
    await page.getByTestId("merchant-batch-bar").getByRole("button", { name: "Review together" }).click();
    const modal = page.getByTestId("batch-merchant-modal");
    await modal.waitFor({ state: "visible" });
    await page.screenshot({ path: join("artifacts/browser-screenshots", "merchant-batch-review-1366x768.png"), animations: "disabled" });
    const confirmBatch = modal.getByRole("button", { name: "Confirm decision" });
    if (!(await confirmBatch.isDisabled())) throw new Error("Merchant batch decision must require a reason.");
    await modal.getByLabel("One reason for all (required)").fill("Please complete the missing application details.");
    if (await confirmBatch.isDisabled()) throw new Error("A valid merchant batch reason should enable confirmation.");
    await modal.getByRole("button", { name: "Confirm decision" }).click();
    await modal.getByText("1 / 2 processed").waitFor({ state: "visible" });
    await page.screenshot({ path: join("artifacts/browser-screenshots", "merchant-batch-partial-results-1366x768.png"), animations: "disabled" });
    const successBeforeRetry = requests.filter(item => item.method === "POST" && item.path.endsWith("/request-information") && item.path.includes("000000000101")).length;
    await modal.getByRole("button", { name: "Retry failed" }).click();
    await modal.getByText("1 / 2 processed").waitFor({ state: "visible" });
    const successAfterRetry = requests.filter(item => item.method === "POST" && item.path.endsWith("/request-information") && item.path.includes("000000000101")).length;
    const failedAfterRetry = requests.filter(item => item.method === "POST" && item.path.endsWith("/request-information") && item.path.includes("000000000117")).length;
    if (successAfterRetry !== successBeforeRetry || failedAfterRetry !== 2) throw new Error("Merchant batch retry repeated a successful action or did not retry the failed merchant.");
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
    const individualSubmit = page.getByTestId("offer-moderation-footer").getByRole("button", { name: "Hide offer" });
    if (!(await individualSubmit.isDisabled())) throw new Error("Individual offer moderation must require a reason.");
    await inlineOffer.getByLabel("Reason (required)").fill("Allergen information needs verification.");
    if (await individualSubmit.isDisabled()) throw new Error("A valid offer reason should enable the decision confirmation.");
    await individualSubmit.click();
    const confirm = page.getByTestId("offer-confirm-modal");
    await confirm.waitFor({ state: "visible" });
    await confirm.getByRole("button", { name: "Confirm" }).click();
    await waitForBackendRequest(item => item.method === "POST" && item.path.endsWith("/suspend"), "Offer moderation action");
    await context.close();
  }

  {
    offerStatus = "PUBLISHED";
    const context = await loginContext(browser, "admin-token");
    const page = await context.newPage();
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(origin + "/en/admin/offer-moderation", { waitUntil: "networkidle" });
    const checks = page.locator('[data-testid="offer-queue"] input[type="checkbox"]');
    await checks.nth(0).check();
    await checks.nth(1).check();
    await page.getByTestId("offer-batch-bar").getByRole("button", { name: "Review together" }).click();
    const modal = page.getByTestId("batch-offer-modal");
    await modal.waitFor({ state: "visible" });
    await page.screenshot({ path: join("artifacts/browser-screenshots", "offer-batch-review-1366x768.png"), animations: "disabled" });
    await modal.locator('button[aria-pressed]').nth(1).click();
    const confirmBatch = modal.getByRole("button", { name: "Confirm decision" });
    if (!(await confirmBatch.isDisabled())) throw new Error("Offer batch decision must require a reason.");
    await modal.getByLabel("One reason for all (required)").fill("Correct the missing offer information.");
    if (await confirmBatch.isDisabled()) throw new Error("A valid batch reason should enable confirmation.");
    await modal.getByRole("button", { name: "Confirm decision" }).click();
    await modal.getByText("1 / 2 processed").waitFor({ state: "visible" });
    await page.screenshot({ path: join("artifacts/browser-screenshots", "offer-batch-partial-results-1366x768.png"), animations: "disabled" });
    const successBeforeRetry = requests.filter(item => item.method === "POST" && item.path.endsWith("/request-edit") && item.path.includes("000000000102")).length;
    await modal.getByRole("button", { name: "Retry failed" }).click();
    await modal.getByText("1 / 2 processed").waitFor({ state: "visible" });
    const successAfterRetry = requests.filter(item => item.method === "POST" && item.path.endsWith("/request-edit") && item.path.includes("000000000102")).length;
    const failedAfterRetry = requests.filter(item => item.method === "POST" && item.path.endsWith("/request-edit") && item.path.includes("000000000103")).length;
    if (successAfterRetry !== successBeforeRetry || failedAfterRetry !== 2) throw new Error("Offer batch retry repeated a successful action or did not retry the failed offer.");
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

    // Repeat the long-history behavior at every required viewport. Desktop scroll
    // stays in history; narrow layouts retain ordinary document scrolling.
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.reload({ waitUntil: "networkidle" });
      const matrixLayout = await page.evaluate(() => {
        const detailNode = document.querySelector('[data-testid="support-case-detail"]');
        const historyNode = document.querySelector('[data-testid="support-case-history"]');
        const composerNode = document.querySelector('[data-testid="support-message-composer"]');
        const detailRect = detailNode.getBoundingClientRect();
        const composerRect = composerNode.getBoundingClientRect();
        return {
          viewportHeight: innerHeight,
          documentHeight: document.documentElement.scrollHeight,
          detailClient: detailNode.clientHeight,
          detailScroll: detailNode.scrollHeight,
          detailBottom: detailRect.bottom,
          composerBottom: composerRect.bottom,
          historyClient: historyNode.clientHeight,
          historyScroll: historyNode.scrollHeight,
          historyOverflow: getComputedStyle(historyNode).overflowY,
          detailOverflow: getComputedStyle(detailNode).overflowY,
          firstEntry: historyNode.textContent.includes("Conversation history entry 1"),
          lastEntry: historyNode.textContent.includes("Conversation history entry 48"),
        };
      });
      if (matrixLayout.composerBottom > matrixLayout.detailBottom + 1
        || !matrixLayout.firstEntry || !matrixLayout.lastEntry) {
        throw new Error(`Long support conversation content/composer failed at ${size.width}x${size.height}: ${JSON.stringify(matrixLayout)}`);
      }
      if (size.width >= 900) {
        if (matrixLayout.documentHeight > size.height + 1
          || matrixLayout.detailScroll > matrixLayout.detailClient + 2
          || matrixLayout.historyScroll <= matrixLayout.historyClient + 2
          || matrixLayout.historyOverflow !== "auto"
          || matrixLayout.detailOverflow !== "hidden"
          || matrixLayout.detailBottom > size.height + 1) {
          throw new Error(`Long desktop history scroll ownership failed at ${size.width}x${size.height}: ${JSON.stringify(matrixLayout)}`);
        }
      } else {
        if (matrixLayout.historyOverflow !== "visible" || matrixLayout.documentHeight <= size.height) {
          throw new Error(`Long mobile conversation must use document scrolling at ${size.width}x${size.height}: ${JSON.stringify(matrixLayout)}`);
        }
        await page.locator('[data-testid="support-message-composer"]').scrollIntoViewIfNeeded();
        const composerVisible = await page.locator('[data-testid="support-message-composer"]').evaluate(element => {
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= innerHeight;
        });
        if (!composerVisible) throw new Error(`Mobile reply composer is unreachable at ${size.width}px.`);
      }
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.reload({ waitUntil: "networkidle" });
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
