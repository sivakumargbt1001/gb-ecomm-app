// Phase 9.5 — precondition seeding for `.maestro/loyalty-checkout.yaml`.
//
// Points are earned when an order is *delivered*, and paid for through
// Razorpay. Neither is reachable from the app: it has no admin screen and its
// Razorpay SDK is still deferred (see 3.4). So the shopper this flow signs in
// as is built here, over the backend API, the way the website's
// e2e/helpers/loyalty-api.ts does it for Playwright.
//
// Run (backend must be up, ENVIRONMENT=development):
//   node .maestro/scripts/seed-loyalty.mjs
// It prints the `maestro test -e ...` command to run next.
//
// The loyalty settings are one row for the whole store. This script turns the
// programme on (10% earn / 5% cap); `--reset` puts it back to 0/0, which is
// what the store ships with and what every other flow expects.

import { Buffer } from "node:buffer";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAESTRO_DIR = path.resolve(HERE, "..");
const BACKEND_DIR = path.resolve(MAESTRO_DIR, "../../gb-ecomm-backend");

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8787";
const ADMIN_USER_ID = "00000000-0000-4000-8000-0000000000ad";

const PRICE_IN_PAISE = 100000;
// 10% of ₹1,000 earns 100 points; 5% of ₹1,000 caps the next order at 50.
const EARN_RATE_PERCENT = 10;
const MAX_REDEMPTION_PERCENT = 5;

// The backend's .dev.vars is the only place these live — the app never sees
// them. Values are unquoted, so split on the first `=` and take the rest.
function devVar(name) {
  const file = readFileSync(path.join(BACKEND_DIR, ".dev.vars"), "utf8");
  const line = file
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${name}=`));
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

async function setLoyaltySettings(patch) {
  const { settings } = await req("PATCH", "/api/loyalty/admin/settings", {
    token: adminToken,
    body: patch,
  });
  return settings;
}

const SEED_FILE = path.join(MAESTRO_DIR, ".loyalty-seed.env");

function readSeedFile() {
  try {
    return Object.fromEntries(
      readFileSync(SEED_FILE, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
    );
  } catch {
    return {};
  }
}

// Every run seeds a product, so every run has to take it away again — this is
// the mess the web suite's leftover categories became (see 7.3's follow-up).
if (process.argv.includes("--reset")) {
  await setLoyaltySettings({ earnRatePercent: 0, maxRedemptionPercent: 0 });
  const seeded = readSeedFile();
  for (const [pathname, id] of [
    ["/api/catalog/admin/products", seeded.LOYALTY_PRODUCT_ID],
    ["/api/catalog/admin/categories", seeded.LOYALTY_CATEGORY_ID],
  ]) {
    if (!id) continue;
    await req("DELETE", `${pathname}/${id}`, { token: adminToken });
  }
  console.log(
    "Loyalty programme switched back off (0% earn / 0% cap); seeded product removed.",
  );
  process.exit(0);
}

// The signup mail never leaves the dev Worker, so mint the token it would have
// carried rather than reading a mailbox.
function emailVerificationToken(userId) {
  return signJwt({ sub: userId, purpose: "email_verification" }, jwtSecret);
}

// Drives the same `payment.captured` path Razorpay would. With no webhook
// secret configured the non-production branch accepts an empty signature.
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

const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const email = `loyalty-mobile-${stamp}@test-e2e.com`;
const password = "SuperPassword123!";

const settings = await setLoyaltySettings({
  earnRatePercent: EARN_RATE_PERCENT,
  maxRedemptionPercent: MAX_REDEMPTION_PERCENT,
});

const { category } = await req("POST", "/api/catalog/admin/categories", {
  token: adminToken,
  body: { name: `Maestro Loyalty ${stamp}`, slug: `maestro-loyalty-${stamp}` },
});
const productSlug = `maestro-loyalty-prod-${stamp}`;
// Fixed, short name: the flow finds this product by the text on its card, and a
// card truncates a long name to two lines.
const productName = "Loyalty Test Item";
const { product } = await req("POST", "/api/catalog/admin/products", {
  token: adminToken,
  body: {
    categoryId: category.id,
    name: productName,
    slug: productSlug,
    priceInPaise: PRICE_IN_PAISE,
  },
});

const { user } = await req("POST", "/api/auth/signup", {
  body: { email, password },
});
await req("POST", "/api/auth/verify-email", {
  body: { token: emailVerificationToken(user.id) },
});
const login = await req("POST", "/api/auth/login", { body: { email, password } });
const shopperToken = login.accessToken;

// One full-price order, delivered, is what puts points on the account.
await req("POST", "/api/cart/items", {
  token: shopperToken,
  body: { productId: product.id, quantity: 1 },
});
const checkout = await req("POST", "/api/cart/checkout", {
  token: shopperToken,
  body: {
    contactEmail: email,
    shippingAddress: {
      fullName: "Asha Rao",
      phone: "+919876543210",
      line1: "1 MG Road",
      city: "Bengaluru",
      state: "KA",
      postalCode: "560001",
      country: "IN",
    },
  },
});

await capturePayment(checkout.order.razorpayOrderId);
for (const status of ["shipped", "delivered"]) {
  await req("PATCH", `/api/orders/admin/${checkout.order.id}/status`, {
    token: adminToken,
    body: { status },
  });
}

const { balance } = await req("GET", "/api/loyalty/me", { token: shopperToken });
const expected = Math.round((PRICE_IN_PAISE * EARN_RATE_PERCENT) / 100 / 100);
if (balance.balance !== expected) {
  throw new Error(
    `expected ${expected} points after delivery, got ${balance.balance}`,
  );
}

// The Maestro flow can only prove the *app* refuses an over-cap spend. A cap
// the server did not also enforce would still be a way to spend points the
// merchant never agreed to, so assert it here, past the UI, on the same cart
// the flow is about to build — then empty the cart again.
const cap = Math.round(
  (PRICE_IN_PAISE * MAX_REDEMPTION_PERCENT) / 100 / 100,
);
const { cart } = await req("POST", "/api/cart/items", {
  token: shopperToken,
  body: { productId: product.id, quantity: 1 },
});
const overCap = await fetch(`${API_BASE_URL}/api/cart/checkout`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${shopperToken}`,
  },
  body: JSON.stringify({
    contactEmail: email,
    shippingAddress: {
      fullName: "Asha Rao",
      phone: "+919876543210",
      line1: "1 MG Road",
      city: "Bengaluru",
      state: "KA",
      postalCode: "560001",
      country: "IN",
    },
    redeemPoints: cap + 1,
  }),
});
const overCapBody = await overCap.text();
if (overCap.status !== 400 || !overCapBody.includes(String(cap))) {
  throw new Error(
    `server accepted ${cap + 1} points: ${overCap.status} ${overCapBody}`,
  );
}
for (const cartItem of cart.items) {
  await req("DELETE", `/api/cart/items/${cartItem.id}`, { token: shopperToken });
}

writeFileSync(
  SEED_FILE,
  [
    `LOYALTY_EMAIL=${email}`,
    `LOYALTY_PASSWORD=${password}`,
    `LOYALTY_PRODUCT=${productName}`,
    `LOYALTY_PRODUCT_ID=${product.id}`,
    `LOYALTY_CATEGORY_ID=${category.id}`,
    "",
  ].join("\n"),
);

console.log(`Settings:  ${settings.earnRatePercent}% earn / ${settings.maxRedemptionPercent}% cap`);
console.log(`Shopper:   ${email} / ${password}`);
console.log(`Product:   ${productName} (${productSlug}) at ₹${PRICE_IN_PAISE / 100}`);
console.log(`Delivered: order ${checkout.order.id} — balance ${balance.balance} points`);
console.log(`Allowance: ${MAX_REDEMPTION_PERCENT}% of ₹${PRICE_IN_PAISE / 100} = 50 points\n`);
console.log("Next:");
console.log(
  `  maestro test -e LOYALTY_EMAIL=${email} -e LOYALTY_PASSWORD=${password} \\\n` +
    `    -e LOYALTY_PRODUCT="${productName}" .maestro/loyalty-checkout.yaml`,
);
console.log(`\n(also written to ${path.relative(process.cwd(), SEED_FILE)})`);
console.log("Afterwards: node .maestro/scripts/seed-loyalty.mjs --reset");
