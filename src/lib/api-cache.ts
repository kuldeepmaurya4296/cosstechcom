import { NextResponse } from "next/server";

/**
 * JSON response with CDN cache headers for Vercel's edge network.
 *
 * `s-maxage` — how long the Vercel CDN serves the cached response without
 * re-invoking the function (the real speed win — most reads never touch the DB).
 * `stale-while-revalidate` — serve stale up to this long while refreshing in
 * the background, so users never wait on a cold function.
 *
 * Per-URL cache (query string included), so filtered/searched listings each
 * cache independently. Safe only for public, non-personalised GETs.
 */
export function cachedJson(data: unknown, sMaxage = 60, swr = 300) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxage}, stale-while-revalidate=${swr}`,
    },
  });
}
