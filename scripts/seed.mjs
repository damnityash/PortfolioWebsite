// Seeds the portfolio JSON into the Backbone `db_query` table.
// Usage: npm run seed            (creates the row if BACKBONE_ID does not exist, then writes)
// Reads BACKBONE_* from .env.local via `node --env-file`.
import { readFileSync } from "node:fs";

const { BACKBONE_URL, BACKBONE_DB_QUERY_API_KEY: KEY, BACKBONE_TABLE = "resume" } = process.env;
let id = process.env.BACKBONE_ID;
if (!BACKBONE_URL || !KEY) {
  console.error("Missing BACKBONE_URL or BACKBONE_DB_QUERY_API_KEY. Run via: npm run seed");
  process.exit(1);
}

const base = `${BACKBONE_URL.replace(/\/+$/, "")}/db_query/${BACKBONE_TABLE}`;
const headers = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const doc = JSON.parse(readFileSync(new URL("../data/portfolio.seed.json", import.meta.url), "utf8"));

async function call(method, url, body) {
  const res = await fetch(url, { method, headers, body: body && JSON.stringify(body) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

if (id) {
  const probe = await call("GET", `${base}/${id}`);
  if (probe.status === 404) id = undefined;
  else if (probe.status !== 200) { console.error("Read failed:", probe); process.exit(1); }
}

if (!id) {
  const created = await call("POST", base, { name: "portfolio", description: "Yash Kulkarni portfolio" });
  if (created.status !== 201) { console.error("Create failed:", created); process.exit(1); }
  id = String(created.json.project_id);
  console.log(`Created row ${id}. Set BACKBONE_ID=${id} in .env.local.`);
}

const saved = await call("PUT", `${base}/${id}`, { pjson: doc });
if (saved.status !== 200) { console.error("Write failed:", saved); process.exit(1); }

const check = await call("GET", `${base}/${id}`);
const ok = check.status === 200 && typeof check.json.pjson === "object" && check.json.pjson.name === doc.name;
console.log(ok ? `Seeded ${BACKBONE_TABLE}/${id}: ${doc.name} (verified by read-back).` : "Write succeeded but read-back did not match:", ok ? "" : check);
process.exit(ok ? 0 : 1);
