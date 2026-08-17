// Phase 10.5 — precondition seeding for `.maestro/referrals.yaml`, and the
// server-side half of its proof.
//
// The reward the phase is really about — the referrer's points, paid only once
// the referred order is captured and not cancelled — is not reachable from the
// app at all: it needs a real payment, an admin to cancel, and a webhook. So
// this script drives that story over the API the way the website's
// e2e/referrals.spec.ts drives it in a browser, asserts it, and leaves behind
// the accounts `.maestro/referrals.yaml` then signs in as:
//
//   - a REFERRER with a code, 3 signups against it and 1 of them rewarded, so
//     the account card has real counts to show;
//   - a REFEREE who signed up on that code and has not ordered yet, so the flow
//     can check out and watch the referral discount come off the total.
//
// Run (backend must be up, ENVIRONMENT=development):
//   node .maestro/scripts/seed-referral.mjs
// It prints the `maestro test -e ...` command to run next. Run it again before
// every run of the flow: the flow signs a fourth shopper up against the code, so
// the counts it asserts on the referrer's card are only right on a fresh seed.
//
// Referral settings are one row for the whole store, like loyalty's. This script
// turns the programme on; `--reset` turns it back off, which is what the store
// ships with and what every other flow expects.

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
// 10% of ₹1,000 is ₹100 off the referee's order; the referrer is paid in points.
const REFEREE_DISCOUNT_PERCENT = 10;
const REFERRER_REWARD_POINTS = 100;
const PRODUCT_NAME = "Referral Test Item";

const SHIPPING_ADDRESS = {
  fullName: "Asha Rao",
  phone: "+919876543210",
  line1: "1 MG Road",
  city: "Bengaluru",
  state: "KA",
  postalCode: "560001",
  country: "IN",
};

// The backend's .dev.vars is the only place these live — the app never sees
// them. Values are unquoted, so split on the first `=` and take the rest.
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

// Signup and login are rate limited to 10 hits per 60 seconds, and in dev there
// is no `cf-connecting-ip`, so every caller on this machine shares one bucket
// (the same thing 10.3 found under the web suite's "flakiness"). One run of this
// script spends 8 of those hits, so two runs inside a minute is enough to earn a
// 429 that means nothing about the code under test — wait the window out.
const RATE_LIMIT_WAIT_MS = 30000;

async function req(method, pathname, { token, body, rawBody, headers } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(`${API_BASE_URL}${pathname}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    if (res.status === 429 && attempt < 3) {
      console.log(`  rate limited on ${pathname} — waiting ${RATE_LIMIT_WAIT_MS / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WAIT_MS));
      continue;
    }
    if (!res.ok) {
      throw new Error(`${method} ${pathname} -> ${res.status}: ${await res.text()}`);
    }
    return res.status === 204 ? null : await res.json();
  }
}

const jwtSecret = devVar("JWT_ACCESS_SECRET");
if (!jwtSecret) throw new Error("JWT_ACCESS_SECRET missing from backend/.dev.vars");
const adminToken = signJwt({ sub: ADMIN_USER_ID, role: "admin" }, jwtSecret);

async function setReferralSettings(patch) {
  const { settings } = await req("PATCH", "/api/referrals/admin/settings", {
    token: adminToken,
    body: patch,
  });
  return settings;
}

const SEED_FILE = path.join(MAESTRO_DIR, ".referral-seed.env");

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
// The accounts, their codes and their referral rows stay: a referral is a
// historical fact about a shopper, and the system has no endpoint to unmake one.
if (process.argv.includes("--reset")) {
  await setReferralSettings({ enabled: false });
  const seeded = readSeedFile();
  for (const [pathname, id] of [
    ["/api/catalog/admin/products", seeded.REFERRAL_PRODUCT_ID],
    ["/api/catalog/admin/categories", seeded.REFERRAL_CATEGORY_ID],
  ]) {
    if (!id) continue;
    await req("DELETE", `${pathname}/${id}`, { token: adminToken });
  }
  console.log("Referral programme switched back off; seeded product removed.");
  process.exit(0);
}

// The signup mail never leaves the dev Worker, so mint the token it would have
// carried rather than reading a mailbox.
function emailVerificationToken(userId) {
  return signJwt({ sub: userId, purpose: "email_verification" }, jwtSecret);
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

const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const password = "SuperPassword123!";

async function registerShopper(label, referralCode) {
  const email = `referral-${label}-${stamp}@test-e2e.com`;
  const { user } = await req("POST", "/api/auth/signup", {
    body: { email, password, ...(referralCode ? { referralCode } : {}) },
  });
  await req("POST", "/api/auth/verify-email", {
    body: { token: emailVerificationToken(user.id) },
  });
  const login = await req("POST", "/api/auth/login", { body: { email, password } });
  return { email, id: user.id, token: login.accessToken };
}

async function buy(shopper, productId, { couponCode } = {}) {
  await req("POST", "/api/cart/items", {
    token: shopper.token,
    body: { productId, quantity: 1 },
  });
  const checkout = await req("POST", "/api/cart/checkout", {
    token: shopper.token,
    body: {
      contactEmail: shopper.email,
      shippingAddress: SHIPPING_ADDRESS,
      ...(couponCode ? { couponCode } : {}),
    },
  });
  return checkout;
}

async function referrerPoints(token) {
  const { balance } = await req("GET", "/api/loyalty/me", { token });
  return balance.balance;
}

async function summaryFor(token) {
  const { summary } = await req("GET", "/api/referrals/me", { token });
  return summary;
}

const settings = await setReferralSettings({
  enabled: true,
  refereeDiscountType: "percentage",
  refereeDiscountValue: REFEREE_DISCOUNT_PERCENT,
  refereeMaxDiscountInPaise: null,
  referrerRewardPoints: REFERRER_REWARD_POINTS,
});

const { category } = await req("POST", "/api/catalog/admin/categories", {
  token: adminToken,
  body: { name: `Maestro Referral ${stamp}`, slug: `maestro-referral-${stamp}` },
});
// Fixed, short name: the flow finds this product by the text on its card, and a
// card truncates a long name to two lines.
const { product } = await req("POST", "/api/catalog/admin/products", {
  token: adminToken,
  body: {
    categoryId: category.id,
    name: PRODUCT_NAME,
    slug: `maestro-referral-prod-${stamp}`,
    priceInPaise: PRICE_IN_PAISE,
  },
});

const referrer = await registerShopper("referrer");
const { summary: issued } = await req("POST", "/api/referrals/me/code", {
  token: referrer.token,
});
const code = issued.code;
if (!code) throw new Error("no referral code was issued");

// ---- 1. A cancelled order pays nobody, however late its capture lands. ----
// This is the gate the whole design turns on, and the app cannot exercise it.
const cancelled = await registerShopper("cancelled", code);
const cancelledCheckout = await buy(cancelled, product.id, { couponCode: code });
await req("PATCH", `/api/orders/admin/${cancelledCheckout.order.id}/status`, {
  token: adminToken,
  body: { status: "cancelled" },
});
await capturePayment(cancelledCheckout.order.razorpayOrderId);
if ((await referrerPoints(referrer.token)) !== 0) {
  throw new Error("a cancelled referred order paid the referrer");
}

// ---- 2. A paid one does, exactly once. ----
const paid = await registerShopper("paid", code);
const paidCheckout = await buy(paid, product.id, { couponCode: code });
const expectedDiscount = (PRICE_IN_PAISE * REFEREE_DISCOUNT_PERCENT) / 100;
if (paidCheckout.order.discountInPaise !== expectedDiscount) {
  throw new Error(
    `referee's discount was ${paidCheckout.order.discountInPaise}, expected ${expectedDiscount}`,
  );
}
await capturePayment(paidCheckout.order.razorpayOrderId);
if ((await referrerPoints(referrer.token)) !== REFERRER_REWARD_POINTS) {
  throw new Error(
    `expected ${REFERRER_REWARD_POINTS} points after a paid referred order, got ${await referrerPoints(referrer.token)}`,
  );
}

// A redelivered webhook must find nothing left to move.
await capturePayment(paidCheckout.order.razorpayOrderId);
if ((await referrerPoints(referrer.token)) !== REFERRER_REWARD_POINTS) {
  throw new Error("a redelivered capture paid the referrer twice");
}

// ---- 3. A referrer cannot spend their own code. ----
// The flow asserts the app refuses it; a guard the server did not also hold
// would still be a standing discount on every order the referrer places.
const selfApply = await fetch(`${API_BASE_URL}/api/coupons/apply`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${referrer.token}`,
  },
  body: JSON.stringify({ code }),
});
if (selfApply.status !== 400) {
  throw new Error(`server priced a self-referral: ${selfApply.status}`);
}

// ---- 4. The referee the Maestro flow signs in as: attributed, not yet ordered.
const referee = await registerShopper("app", code);

const summary = await summaryFor(referrer.token);
if (summary.invited !== 3 || summary.rewarded !== 1) {
  throw new Error(
    `expected 3 invited / 1 rewarded, got ${summary.invited} / ${summary.rewarded}`,
  );
}

// The flow signs a *fourth* shopper up from inside the app, so it needs an
// address nobody has used. It also needs a link to paste, and the host in one is
// irrelevant to the parsing the field does — what matters is that a link, in the
// case the code arrives in lower case, is read rather than refused.
const signupEmail = `referral-app-signup-${stamp}@test-e2e.com`;
const shareLink = `https://shop.example.com/signup?ref=${code.toLowerCase()}`;

writeFileSync(
  SEED_FILE,
  [
    `REFERRAL_CODE=${code}`,
    `REFERRAL_LINK=${shareLink}`,
    `REFERRER_EMAIL=${referrer.email}`,
    `REFEREE_EMAIL=${referee.email}`,
    `REFERRAL_SIGNUP_EMAIL=${signupEmail}`,
    `REFERRAL_PASSWORD=${password}`,
    `REFERRAL_PRODUCT=${PRODUCT_NAME}`,
    `REFERRAL_PRODUCT_ID=${product.id}`,
    `REFERRAL_CATEGORY_ID=${category.id}`,
    "",
  ].join("\n"),
);

console.log(`Settings:  on — ${settings.refereeDiscountValue}% to the referee, ${settings.referrerRewardPoints} points to the referrer`);
console.log(`Referrer:  ${referrer.email} / ${password} — code ${code}`);
console.log(`Referee:   ${referee.email} / ${password} — attributed, no order yet`);
console.log(`Product:   ${PRODUCT_NAME} at ₹${PRICE_IN_PAISE / 100} (referee pays ₹${(PRICE_IN_PAISE - expectedDiscount) / 100})`);
console.log(`Proved:    cancelled pays nothing; paid pays ${REFERRER_REWARD_POINTS} once; redelivery pays nothing; self-referral refused`);
console.log(`Counts:    ${summary.invited} invited / ${summary.rewarded} rewarded\n`);
console.log("Next:");
console.log(
  `  maestro test -e REFERRAL_CODE=${code} -e REFERRAL_LINK="${shareLink}" \\\n` +
    `    -e REFERRER_EMAIL=${referrer.email} -e REFEREE_EMAIL=${referee.email} \\\n` +
    `    -e REFERRAL_SIGNUP_EMAIL=${signupEmail} -e REFERRAL_PASSWORD=${password} \\\n` +
    `    -e REFERRAL_PRODUCT="${PRODUCT_NAME}" .maestro/referrals.yaml`,
);
console.log(`\n(also written to ${path.relative(process.cwd(), SEED_FILE)})`);
console.log("Afterwards: node .maestro/scripts/seed-referral.mjs --reset");
