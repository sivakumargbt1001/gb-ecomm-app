// Phase 11.5 — precondition seeding for `.maestro/recommendations.yaml`, and the
// server-side half of its proof.
//
// A "customers also bought" row cannot be produced from inside the app: it needs
// several *paid* orders that each contain the product being viewed alongside
// another one, which means real checkouts and real payment captures. So this
// script builds that history over the API, asserts the ranking the flow will
// then look at on screen, and leaves the products behind for it:
//
//   - SEED       — the product the flow opens;
//   - three partners bought with it in 3, 2 and 1 paid orders (so the row has a
//     ranking, not just contents);
//   - one *inactive* partner bought in all three, which must never be shown;
//   - one partner that only ever appeared in a pending and a cancelled order,
//     which must never be shown either;
//   - LONELY     — a second product nobody co-bought, so the flow can check that
//     a product with no co-purchases shows no section at all.
//
// Orders are placed as **guests** (`X-Guest-Id`), so this script never touches
// signup or login and therefore never spends the 10-per-60s rate-limit budget
// that 10.3 found behind the web suite's "flakiness".
//
// Run (backend must be up, ENVIRONMENT=development):
//   node .maestro/scripts/seed-recommendations.mjs
// It prints the `maestro test -e ...` command to run next.
//   node .maestro/scripts/seed-recommendations.mjs --reset

import { createHmac, randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAESTRO_DIR = path.resolve(HERE, "..");
const BACKEND_DIR = path.resolve(MAESTRO_DIR, "../../gb-ecomm-backend");

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8787";
const ADMIN_USER_ID = "00000000-0000-4000-8000-0000000000ad";

const PRICE_IN_PAISE = 100000;

// Fixed, short names: the flow finds these by the text on their cards, and a card
// truncates a long name to two lines.
const NAMES = {
  seed: "Rec Reading Lamp",
  often: "Rec LED Bulbs",
  sometimes: "Rec Lamp Shade",
  once: "Rec Rotary Dimmer",
  inactive: "Rec Discontinued",
  unpaidOnly: "Rec Never Paid",
  lonely: "Rec Lonely Vase",
};

const SHIPPING_ADDRESS = {
  fullName: "Asha Rao",
  phone: "+919876543210",
  line1: "1 MG Road",
  city: "Bengaluru",
  state: "KA",
  postalCode: "560001",
  country: "IN",
};

// The backend's .dev.vars is the only place these live — the app never sees them.
// Values are unquoted, so split on the first `=` and take the rest.
function devVar(name) {
  const file = readFileSync(path.join(BACKEND_DIR, ".dev.vars"), "utf8");
  const line = file.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : "";
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signJwt(claims, secret) {
  const now = Math.floor(Date.now() / 1000);
  const data = `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iat: now, exp: now + 3600, ...claims }),
  )}`;
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

async function req(method, pathname, { token, body, rawBody, headers } = {}) {
  const res = await fetch(`${API_BASE_URL}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  if (!res.ok) {
    throw new Error(`${method} ${pathname} -> ${res.status}: ${await res.text()}`);
  }
  return res.status === 204 ? null : await res.json();
}

const jwtSecret = devVar("JWT_ACCESS_SECRET");
if (!jwtSecret) throw new Error("JWT_ACCESS_SECRET missing from backend/.dev.vars");
const adminToken = signJwt({ sub: ADMIN_USER_ID, role: "admin" }, jwtSecret);

const SEED_FILE = path.join(MAESTRO_DIR, ".recommendations-seed.env");

function readSeedFile() {
  try {
    return Object.fromEntries(
      readFileSync(SEED_FILE, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => [
          line.slice(0, line.indexOf("=")),
          line.slice(line.indexOf("=") + 1),
        ]),
    );
  } catch {
    return {};
  }
}

// Every run seeds products, so every run has to take them away again — leftover
// fixtures are what turned the web suite's admin category table into the mess
// 7.3 recorded. The orders stay: a paid order is a historical fact and there is
// no endpoint to unmake one.
if (process.argv.includes("--reset")) {
  const seeded = readSeedFile();
  for (const id of (seeded.REC_PRODUCT_IDS ?? "").split(",").filter(Boolean)) {
    await req("DELETE", `/api/catalog/admin/products/${id}`, { token: adminToken });
  }
  if (seeded.REC_CATEGORY_ID) {
    await req("DELETE", `/api/catalog/admin/categories/${seeded.REC_CATEGORY_ID}`, {
      token: adminToken,
    });
  }
  console.log("Seeded recommendation products removed.");
  process.exit(0);
}

// Drives the same `payment.captured` path Razorpay would. With no webhook secret
// configured the non-production branch accepts an empty signature.
async function capturePayment(razorpayOrderId) {
  const rawBody = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: { id: `pay_maestro_${randomUUID()}`, order_id: razorpayOrderId },
      },
    },
  });
  const secret = devVar("RAZORPAY_WEBHOOK_SECRET");
  await req("POST", "/api/cart/webhook", {
    rawBody,
    headers: {
      "X-Razorpay-Signature": secret
        ? createHmac("sha256", secret).update(rawBody).digest("hex")
        : "",
    },
  });
}

/** One guest order over the real cart -> checkout (-> capture) path. */
async function placeOrder(productIds, { capture = true, cancel = false } = {}) {
  const guestId = randomUUID();
  for (const productId of productIds) {
    await req("POST", "/api/cart/items", {
      headers: { "X-Guest-Id": guestId },
      body: { productId, quantity: 1 },
    });
  }
  const { order } = await req("POST", "/api/cart/checkout", {
    headers: { "X-Guest-Id": guestId },
    body: {
      contactEmail: `rec-shopper-${guestId}@test-e2e.com`,
      shippingAddress: SHIPPING_ADDRESS,
    },
  });

  if (cancel) {
    await req("PATCH", `/api/orders/admin/${order.id}/status`, {
      token: adminToken,
      body: { status: "cancelled" },
    });
  }
  if (capture) await capturePayment(order.razorpayOrderId);
  return order;
}

const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

const { category } = await req("POST", "/api/catalog/admin/categories", {
  token: adminToken,
  body: { name: `Maestro Rec ${stamp}`, slug: `maestro-rec-${stamp}` },
});

async function createProduct(key, { isActive = true } = {}) {
  // Slugs are lowercase-and-hyphens only, so a camelCase key cannot go in raw.
  const slugKey = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const { product } = await req("POST", "/api/catalog/admin/products", {
    token: adminToken,
    body: {
      categoryId: category.id,
      name: NAMES[key],
      slug: `maestro-rec-${slugKey}-${stamp}`,
      priceInPaise: PRICE_IN_PAISE,
      isActive,
    },
  });
  return product;
}

const seed = await createProduct("seed");
const often = await createProduct("often");
const sometimes = await createProduct("sometimes");
const once = await createProduct("once");
// Created active on purpose: the cart refuses an inactive product, so the only
// way to have one sitting in a paid order is to sell it first and discontinue it
// afterwards — which is exactly the case the recommendation filter exists for.
const inactive = await createProduct("inactive");
const unpaidOnly = await createProduct("unpaidOnly");
const lonely = await createProduct("lonely");

// 3 paid orders: bulbs in all three, the shade in two, the dimmer in one. The
// inactive product rides all three, which is what makes its absence meaningful.
await placeOrder([seed.id, often.id, sometimes.id, once.id, inactive.id]);
await placeOrder([seed.id, often.id, sometimes.id, inactive.id]);
await placeOrder([seed.id, often.id, inactive.id]);

// Neither of these is a purchase: one was never captured, one was taken back.
await placeOrder([seed.id, unpaidOnly.id], { capture: false });
await placeOrder([seed.id, unpaidOnly.id], { cancel: true });

// Discontinued after the fact — it is in three paid orders and must still never
// be recommended.
await req("PATCH", `/api/catalog/admin/products/${inactive.id}`, {
  token: adminToken,
  body: { isActive: false },
});

// ---- The assertions the app cannot make for itself. ----
async function recommendations(productId, limit) {
  const query = limit === undefined ? "" : `?limit=${limit}`;
  const { items } = await req("GET", `/api/recommendations/${productId}${query}`);
  return items;
}

const ranked = await recommendations(seed.id);
const rankedNames = ranked.map((p) => p.name);
const expected = [NAMES.often, NAMES.sometimes, NAMES.once];
if (JSON.stringify(rankedNames) !== JSON.stringify(expected)) {
  throw new Error(
    `ranking was ${JSON.stringify(rankedNames)}, expected ${JSON.stringify(expected)}`,
  );
}
if (rankedNames.includes(NAMES.inactive)) {
  throw new Error("an inactive product was recommended");
}
if (rankedNames.includes(NAMES.unpaidOnly)) {
  throw new Error("a product only ever in a pending/cancelled order was recommended");
}
if (rankedNames.includes(NAMES.seed)) {
  throw new Error("the product being viewed was recommended back");
}

const limited = await recommendations(seed.id, 1);
if (limited.length !== 1 || limited[0].name !== NAMES.often) {
  throw new Error(`limit=1 returned ${JSON.stringify(limited.map((p) => p.name))}`);
}

const lonelyRecs = await recommendations(lonely.id);
if (lonelyRecs.length !== 0) {
  throw new Error(`a product with no co-purchases returned ${lonelyRecs.length} items`);
}

const productIds = [
  seed.id,
  often.id,
  sometimes.id,
  once.id,
  inactive.id,
  unpaidOnly.id,
  lonely.id,
];

writeFileSync(
  SEED_FILE,
  [
    `REC_SEED_PRODUCT=${NAMES.seed}`,
    `REC_FIRST=${NAMES.often}`,
    `REC_SECOND=${NAMES.sometimes}`,
    `REC_THIRD=${NAMES.once}`,
    `REC_HIDDEN=${NAMES.inactive}`,
    `REC_UNPAID=${NAMES.unpaidOnly}`,
    `REC_LONELY_PRODUCT=${NAMES.lonely}`,
    `REC_CATEGORY_ID=${category.id}`,
    `REC_PRODUCT_IDS=${productIds.join(",")}`,
    "",
  ].join("\n"),
);

console.log(`Seed product:  ${NAMES.seed}`);
console.log(`Recommended:   ${rankedNames.join(" > ")}`);
console.log(`Never shown:   ${NAMES.inactive} (inactive), ${NAMES.unpaidOnly} (pending/cancelled only)`);
console.log(`No section:    ${NAMES.lonely}`);
console.log("Proved:        ranking order, inactive excluded, unpaid orders ignored, limit honoured, empty for an uncobought product");
console.log("");
console.log("Next:");
console.log(
  [
    "  maestro test",
    `-e REC_SEED_PRODUCT="${NAMES.seed}"`,
    `-e REC_FIRST="${NAMES.often}"`,
    `-e REC_SECOND="${NAMES.sometimes}"`,
    `-e REC_THIRD="${NAMES.once}"`,
    `-e REC_HIDDEN="${NAMES.inactive}"`,
    `-e REC_LONELY_PRODUCT="${NAMES.lonely}"`,
    ".maestro/recommendations.yaml",
  ].join(" "),
);
