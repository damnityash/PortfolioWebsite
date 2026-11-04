import "server-only";
import { cacheTag, cacheLife } from "next/cache";
import { normalizePortfolio, seedPortfolio, type Portfolio } from "./portfolio";

export const PORTFOLIO_TAG = "portfolio";

/*
 * Backbone `db_query` API (docs/backend-arch-docs/sop-db-query.md).
 * One row in BACKBONE_TABLE, addressed by BACKBONE_ID, holds the whole portfolio
 * JSON under `pjson`. Server-side only: the API key never reaches the browser.
 */
function config() {
  const url = process.env.BACKBONE_URL?.replace(/\/+$/, "");
  const key = process.env.BACKBONE_DB_QUERY_API_KEY;
  const table = process.env.BACKBONE_TABLE ?? "resume";
  const id = process.env.BACKBONE_ID;
  if (!url || !key || !id) {
    throw new Error(
      "Missing BACKBONE_URL, BACKBONE_DB_QUERY_API_KEY or BACKBONE_ID in .env.local",
    );
  }
  return { url, key, table, id };
}

function headers(key: string) {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/** Reads the portfolio document, falling back to the seed if the row is missing or unreadable. */
export async function getPortfolio(): Promise<Portfolio> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  cacheLife("hours");

  try {
    const { url, key, table, id } = config();
    const res = await fetch(`${url}/db_query/${table}/${id}`, {
      headers: headers(key),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Backbone responded ${res.status}`);
    const body = (await res.json()) as { pjson?: unknown };
    // A row that was only created (name/description) has no portfolio yet.
    if (!body.pjson || typeof body.pjson !== "object" || !("experience" in body.pjson)) {
      return seedPortfolio;
    }
    return normalizePortfolio(body.pjson);
  } catch (err) {
    console.error("[backbone] read failed, using seed data:", err);
    return seedPortfolio;
  }
}

/** Replaces the whole stored document. Always wraps in `pjson` (the SOP requires it). */
export async function savePortfolio(data: Portfolio): Promise<void> {
  const { url, key, table, id } = config();
  const res = await fetch(`${url}/db_query/${table}/${id}`, {
    method: "PUT",
    headers: headers(key),
    body: JSON.stringify({ pjson: data }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Backbone save failed (${res.status}) ${detail}`);
  }
}
