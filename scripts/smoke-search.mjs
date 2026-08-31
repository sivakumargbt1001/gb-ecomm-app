// Verifies the request and response shapes `src/lib/search-api.ts` codes
// against, since no device or simulator is available to drive the screen.
const BASE = process.env.API_BASE_URL ?? "http://localhost:8787";

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name} ${detail}`);
  }
}

// Mirrors buildSearchQueryString exactly.
function queryString({ q, page }) {
  return `?${new URLSearchParams({ q, page: String(page) }).toString()}`;
}

async function search({ q, page = 1 }) {
  const res = await fetch(`${BASE}/api/search/products${queryString({ q, page })}`);
  return { status: res.status, body: res.ok ? await res.json() : null };
}

const products = await (await fetch(`${BASE}/api/catalog/products?page=1&pageSize=5&sort=newest`)).json();
const sample = products.items?.[0];
if (!sample) {
  console.error("No products in the catalogue to search for.");
  process.exit(1);
}

const term = sample.name.split(/\s+/)[0];
console.log(`Searching for "${term}" (from "${sample.name}")\n`);

const hit = await search({ q: term });
check("a known product name returns 200", hit.status === 200, `got ${hit.status}`);
check(
  "the page carries every field the app reads",
  ["query", "items", "page", "pageSize", "total", "totalPages"].every(
    (key) => hit.body && key in hit.body,
  ),
  JSON.stringify(hit.body && Object.keys(hit.body)),
);
check("the searched product is in the results", hit.body?.items?.some((p) => p.id === sample.id));
check(
  "items are whole products, as ProductCard needs",
  Boolean(hit.body?.items?.[0]?.slug && "priceInPaise" in (hit.body?.items?.[0] ?? {})),
);

// The screen sends the shopper's raw casing; the backend folds it.
const upper = await search({ q: term.toUpperCase() });
check("an uppercase query finds the same product", upper.body?.total === hit.body?.total);

const nothing = await search({ q: "zzzznotathinginthecatalogue" });
check("a miss is an empty page, not an error", nothing.status === 200 && nothing.body?.total === 0);
check("nextSearchPage stops on a miss", nothing.body?.totalPages === 0);

// searchProducts short-circuits a blank query precisely because of this.
const blank = await search({ q: "   " });
check("a blank query is refused by the endpoint", blank.status === 400, `got ${blank.status}`);

const paged = await search({ q: term, page: 2 });
check(
  "an out-of-range page is still a valid empty page",
  paged.status === 200 && Array.isArray(paged.body?.items),
  `got ${paged.status}`,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 1 - 1 : 1);
