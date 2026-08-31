// The push payload addresses the website (`/orders/:id`); the app's own route
// for the same order is `/order/:id`.
export function orderRouteForPushUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;

  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return null;
  }

  const match = /^\/orders\/([^/]+)\/?$/.exec(path);
  return match ? `/order/${match[1]}` : null;
}
