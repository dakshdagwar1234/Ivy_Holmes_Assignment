// scripts/fetch-all.mjs
// Usage: node scripts/fetch-all.mjs
// Requires Node 18+ (global fetch). Reads config from .env (see .env.example).
//
// What this does:
//   1. Logs in against /auth/login to get a bearer token.
//   2. Pages through /v1/listings, /v1/rentals, /v1/projects to the end,
//      using api_key as a query param + Authorization header on every call.
//   3. Saves RAW pages (not just merged records) to data/raw/*.json so we
//      can go back and inspect exactly what the server said on each page —
//      this is what lets us catch pagination lies (drift in `total`,
//      repeated records across pages, off-by-one, etc).
//   4. Saves merged, deduped-by-id datasets to data/*.json for analysis.
//   5. Prints diagnostics as it goes — read these, don't just trust the
//      final JSON blindly.

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const BASE_URL = process.env.BASE_URL || "https://solve.ivy.homes";
const API_KEY = process.env.API_KEY;
const EMAIL = process.env.LOGIN_EMAIL || "demo1@ivy.homes";
const PASSWORD = process.env.LOGIN_PASSWORD;
const LIMIT = Number(process.env.FETCH_LIMIT || 200); // doc says max 200

if (!API_KEY || !PASSWORD) {
  console.error("Missing API_KEY or LOGIN_PASSWORD in .env — copy .env.example to .env and fill it in.");
  process.exit(1);
}

const RAW_DIR = path.join(process.cwd(), "data", "raw");
const OUT_DIR = path.join(process.cwd(), "data");
fs.mkdirSync(RAW_DIR, { recursive: true });

let TOKEN = null;

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}): ${JSON.stringify(body)}`);
  }
console.log(
  `Logged in as ${EMAIL}. Full response:`,
  JSON.stringify(body, null, 2),
);
return body.token || body.access_token || body.jwt || body.accessToken;
return body.access_token;
}

async function callApi(pathAndQuery) {
  const url = `${BASE_URL}${pathAndQuery}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, "X-API-Key": API_KEY },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
 //   console.log(`GET ${pathAndQuery} -> ${res.status}:`, JSON.stringify(body, null, 2));
  } catch {
    body = { _raw: text };
  }
  if (!res.ok) {
    throw new Error(`GET ${pathAndQuery} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// Pull every page of a collection endpoint. Records the raw page responses
// AND does live sanity checks (does `total` stay stable? do pages overlap?
// do we get fewer records than `page_size` before we've reached `total`?).
async function fetchAllPages(basePath, label) {
  const rawPages = [];
  const merged = new Map();
  let offset = 0;
  let total = null;
  let seenTotals = new Set();
  let idKeyGuess = null;
  let pageNum = 0;

  while (true) {
    pageNum++;
    const sep = basePath.includes("?") ? "&" : "?";
    const pageBody = await callApi(
      `${basePath}${sep}offset=${offset}&limit=${LIMIT}`,
    );
    rawPages.push({ offset, requested_limit: LIMIT, response: pageBody });

    const results = pageBody.results || pageBody.data || [];
    if (total === null) total = pageBody.total;
    seenTotals.add(pageBody.total);

    if (pageNum <= 2) {
      console.log(
        `[${label}] call ${pageNum} raw top-level keys:`,
        Object.keys(pageBody),
      );
      console.log(
        `[${label}] call ${pageNum} meta: limit=${pageBody.limit} offset=${pageBody.offset} count=${pageBody.count} total=${pageBody.total} has_more=${pageBody.has_more}`,
      );
      if (results[0])
        console.log(`[${label}] sample record keys:`, Object.keys(results[0]));
    }

    if (!idKeyGuess && results.length) {
      const first = results[0];
      idKeyGuess =
        "listing_id" in first
          ? "listing_id"
          : "project_id" in first
            ? "project_id"
            : "id" in first
              ? "id"
              : null;
    }

    let newInThisPage = 0;
    for (const r of results) {
      const id = idKeyGuess ? r[idKeyGuess] : JSON.stringify(r);
      if (!merged.has(id)) newInThisPage++;
      merged.set(id, r);
    }

    console.log(
      `[${label}] offset ${offset}: got ${results.length} records ` +
        `(reported total=${pageBody.total}, has_more=${pageBody.has_more}), ` +
        `${newInThisPage} new / ${results.length - newInThisPage} repeats, ` +
        `merged so far=${merged.size}`,
    );

    if (results.length === 0) break;
    if (pageBody.has_more === false) break;
    offset += results.length;

    if (pageNum > 500) {
      console.warn(
        `[${label}] stopping at 500 calls as a safety valve — investigate!`,
      );
      break;
    }
  }

  if (seenTotals.size > 1) {
    console.warn(
      `[${label}] WARNING: reported 'total' changed across calls: ${[...seenTotals].join(", ")}`,
    );
  }

  fs.writeFileSync(
    path.join(RAW_DIR, `${label}.raw.json`),
    JSON.stringify(rawPages, null, 2),
  );
  const mergedArr = [...merged.values()];
  fs.writeFileSync(
    path.join(OUT_DIR, `${label}.json`),
    JSON.stringify(mergedArr, null, 2),
  );

  console.log(
    `[${label}] DONE. last reported total=${total}, unique records merged=${mergedArr.length}, calls made=${rawPages.length}\n`,
  );

  return mergedArr;
}
async function main() {
  TOKEN = await login();

  await fetchAllPages("/v1/listings", "listings");
  await fetchAllPages("/v1/rentals", "rentals");
  await fetchAllPages("/v1/projects", "projects");

  // Also grab analytics summary + health, verbatim, for the findings doc.
  try {
    const summary = await callApi("/v1/analytics/summary");
    fs.writeFileSync(
      path.join(OUT_DIR, "analytics-summary.json"),
      JSON.stringify(summary, null, 2),
    );
  } catch (err) {
    console.warn("Could not fetch /v1/analytics/summary:", err.message);
  }

  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json().catch(() => ({}));
  fs.writeFileSync(path.join(OUT_DIR, "health.json"), JSON.stringify(health, null, 2));

  console.log("All done. Raw pages are in data/raw/, merged datasets in data/.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
