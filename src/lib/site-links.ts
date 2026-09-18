// A promo banner's link is an absolute URL aimed at the website, because the
// same banner is what the website's rail renders. When it points at a screen
// this app has of its own, the tap should stay in the app rather than hand the
// shopper to a browser.
//
// The website's paths and the app's routes are not the same: the website has
// /products/:slug where the app has /product/:slug, and the website's category
// listing is a query on /products where the app narrows the Home grid through
// its filter store instead.

const WEBSITE_URL = process.env.EXPO_PUBLIC_WEBSITE_URL ?? "https://pimkart.com";

export type SiteLinkTarget =
  // A screen the app can route to directly.
  | { kind: "route"; href: string }
  // The Home grid, narrowed to a category (undefined clears the filter).
  | { kind: "category"; slug: string | undefined };

function isOwnHost(host: string): boolean {
  let site: string;
  try {
    site = new URL(WEBSITE_URL).host;
  } catch {
    return false;
  }
  const bare = (value: string) => value.replace(/^www\./, "").toLowerCase();
  return bare(host) === bare(site);
}

// The app route a website URL stands for, or null to open it in a browser.
// Anything on another host is somebody else's link — a campaign page, a social
// profile — and must not be mistaken for one of ours just because its path
// happens to look familiar.
export function siteLinkTarget(url: string | null | undefined): SiteLinkTarget | null {
  if (typeof url !== "string") return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!isOwnHost(parsed.host)) return null;

  const path = parsed.pathname.replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) return { kind: "route", href: "/(tabs)" };

  const [head, slug] = segments;

  // The catalogue listing, optionally narrowed to a category.
  if (head === "products" && slug === undefined) {
    return { kind: "category", slug: parsed.searchParams.get("category") ?? undefined };
  }

  if (segments.length === 2) {
    if (head === "products") return { kind: "route", href: `/product/${slug}` };
    if (head === "stores") return { kind: "route", href: `/store/${slug}` };
    if (head === "brands") return { kind: "route", href: `/brand/${slug}` };
    if (head === "orders") return { kind: "route", href: `/order/${slug}` };
  }

  // Search carries its terms in the query string, which the app's own search
  // screen reads under the same names.
  if (head === "search" && segments.length === 1) {
    return { kind: "route", href: `/search${parsed.search}` };
  }

  return null;
}
