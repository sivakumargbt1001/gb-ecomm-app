// Phase 12.8 — precondition seeding for `.maestro/search.yaml`, and the
// server-side half of its proof.
//
// Search merchandising cannot be produced from inside the app: a pin and a
// synonym are admin decisions, and the shopper-facing effect of both is only
// visible once they exist. So this script creates them over the API, asserts
// what the app cannot assert for itself, and leaves the products behind for the
// flow:
//
//   - MATCH   — a product whose name carries the searched word;
//   - PINNED  — a product with *no* textual match, pinned to that query, so its
//               appearance on screen can only be the merchandising;
//   - ABSENT  — a product that matches nothing in the query and must not show;
//   - a synonym (`tee` -> `tshirt`) so a second query reaches MATCH by a word
//     its name never uses.
//
// Ordering is asserted here, not in the flow: Maestro can say an element is
// visible, not that it sits above another in a list (the same limitation
// recorded in `recommendations.yaml`). Pin-goes-first is checked below instead.
//
// Run (backend must be up, ENVIRONMENT=development):
//   node .maestro/scripts/seed-search.mjs
// It prints the `maestro test -e ...` command to run next.
//   node .maestro/scripts/seed-search.mjs --reset

import { createHmac } from "node:crypto";
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

// The word the flow types. Deliberately not one any other fixture in the shared
// dev branch uses, so a stray leftover product cannot satisfy the assertions by
// accident.
const QUERY = "tshirt";
const SYNONYM_QUERY = "tee";
const EMPTY_QUERY = "zzqqxxnothing";

// Fixed, short names: the flow finds these by the text on their cards, and a
// card truncates a long name to two lines.
const NAMES = {
  match: "Srch Cotton Tshirt",
  pinned: "Srch Wall Clock",
  absent: "Srch Copper Kettle",
};

// The backend's .dev.vars is the only place this lives — the app never sees it.
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

async function req(method, pathname, { token, body } = {}) {
  const res = await fetch(`${API_BASE_URL}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${method} ${pathname} -> ${res.status}: ${await res.text()}`);
  }
  return res.status === 204 ? null : await res.json();
}

const jwtSecret = devVar("JWT_ACCESS_SECRET");
if (!jwtSecret) throw new Error("JWT_ACCESS_SECRET missing from backend/.dev.vars");
const adminToken = signJwt({ sub: ADMIN_USER_ID, role: "admin" }, jwtSecret);

const SEED_FILE = path.join(MAESTRO_DIR, ".search-seed.env");

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

// Every run seeds products, a pin and a synonym, so every run has to take them
// away again — leftover fixtures are what turned the web suite's admin category
// table into the mess 7.3 recorded, and a stale pin would silently steer a
// later search for anyone sharing this branch.
if (process.argv.includes("--reset")) {
  const seeded = readSeedFile();
  if (seeded.SEARCH_PIN_ID) {
    await req("DELETE", `/api/search/admin/pins/${seeded.SEARCH_PIN_ID}`, {
      token: adminToken,
    });
  }
  if (seeded.SEARCH_SYNONYM_ID) {
    await req("DELETE", `/api/search/admin/synonyms/${seeded.SEARCH_SYNONYM_ID}`, {
      token: adminToken,
    });
  }
  for (const id of (seeded.SEARCH_PRODUCT_IDS ?? "").split(",").filter(Boolean)) {
    await req("DELETE", `/api/catalog/admin/products/${id}`, { token: adminToken });
  }
  if (seeded.SEARCH_CATEGORY_ID) {
    await req("DELETE", `/api/catalog/admin/categories/${seeded.SEARCH_CATEGORY_ID}`, {
      token: adminToken,
    });
  }
  console.log("Seeded search fixtures removed.");
  process.exit(0);
}

const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

const { category } = await req("POST", "/api/catalog/admin/categories", {
  token: adminToken,
  body: { name: `Maestro Search ${stamp}`, slug: `maestro-search-${stamp}` },
});

async function createProduct(key) {
  const { product } = await req("POST", "/api/catalog/admin/products", {
    token: adminToken,
    body: {
      categoryId: category.id,
      name: NAMES[key],
      slug: `maestro-search-${key}-${stamp}`,
      priceInPaise: PRICE_IN_PAISE,
      isActive: true,
    },
  });
  return product;
}

const match = await createProduct("match");
const pinned = await createProduct("pinned");
const absent = await createProduct("absent");

const { pin } = await req("POST", "/api/search/admin/pins", {
  token: adminToken,
  body: { query: QUERY, productId: pinned.id, sortOrder: 0 },
});

const { synonym } = await req("POST", "/api/search/admin/synonyms", {
  token: adminToken,
  body: { term: SYNONYM_QUERY, synonym: QUERY },
});

// ---- The assertions the app cannot make for itself. ----
async function search(q, page = 1) {
  const params = new URLSearchParams({ q, page: String(page) });
  return req("GET", `/api/search/products?${params}`);
}

const hit = await search(QUERY);
const hitNames = hit.items.map((p) => p.name);

if (!hitNames.includes(NAMES.match)) {
  throw new Error(`"${QUERY}" did not find ${NAMES.match}: ${JSON.stringify(hitNames)}`);
}
if (!hitNames.includes(NAMES.pinned)) {
  throw new Error(`the pinned product was not returned for "${QUERY}"`);
}
// The one thing the flow cannot see: a pin does not merely appear, it leads.
if (hitNames[0] !== NAMES.pinned) {
  throw new Error(`pinned product was at ${hitNames.indexOf(NAMES.pinned)}, not first`);
}
if (hitNames.includes(NAMES.absent)) {
  throw new Error(`a non-matching product was returned for "${QUERY}"`);
}

const viaSynonym = await search(SYNONYM_QUERY);
const synonymNames = viaSynonym.items.map((p) => p.name);
if (!synonymNames.includes(NAMES.match)) {
  throw new Error(
    `synonym "${SYNONYM_QUERY}" did not reach ${NAMES.match}: ${JSON.stringify(synonymNames)}`,
  );
}
// A pin belongs to one query, not to everything a synonym widens it to.
if (synonymNames.includes(NAMES.pinned)) {
  throw new Error(`the pin for "${QUERY}" leaked into "${SYNONYM_QUERY}"`);
}

const nothing = await search(EMPTY_QUERY);
if (nothing.total !== 0 || nothing.totalPages !== 0) {
  throw new Error(`"${EMPTY_QUERY}" returned ${nothing.total} results`);
}

const productIds = [match.id, pinned.id, absent.id];

writeFileSync(
  SEED_FILE,
  [
    `SEARCH_QUERY=${QUERY}`,
    `SEARCH_SYNONYM_QUERY=${SYNONYM_QUERY}`,
    `SEARCH_EMPTY_QUERY=${EMPTY_QUERY}`,
    `SEARCH_MATCH=${NAMES.match}`,
    `SEARCH_PINNED=${NAMES.pinned}`,
    `SEARCH_ABSENT=${NAMES.absent}`,
    `SEARCH_PIN_ID=${pin.id}`,
    `SEARCH_SYNONYM_ID=${synonym.id}`,
    `SEARCH_CATEGORY_ID=${category.id}`,
    `SEARCH_PRODUCT_IDS=${productIds.join(",")}`,
    "",
  ].join("\n"),
);

console.log(`Query:        "${QUERY}" -> ${hitNames.join(", ")}`);
console.log(`Pinned first: ${NAMES.pinned} (no textual match at all)`);
console.log(`Synonym:      "${SYNONYM_QUERY}" -> ${synonymNames.join(", ")}`);
console.log(`Never shown:  ${NAMES.absent}`);
console.log(
  "Proved:       pin leads the page, pin is query-specific, synonym widens the term, a miss is empty",
);
console.log("");
console.log("Next:");
console.log(
  [
    "  maestro test",
    `-e SEARCH_QUERY="${QUERY}"`,
    `-e SEARCH_SYNONYM_QUERY="${SYNONYM_QUERY}"`,
    `-e SEARCH_EMPTY_QUERY="${EMPTY_QUERY}"`,
    `-e SEARCH_MATCH="${NAMES.match}"`,
    `-e SEARCH_PINNED="${NAMES.pinned}"`,
    `-e SEARCH_ABSENT="${NAMES.absent}"`,
    ".maestro/search.yaml",
  ].join(" "),
);
console.log("");
console.log("Then:  node .maestro/scripts/seed-search.mjs --reset");
