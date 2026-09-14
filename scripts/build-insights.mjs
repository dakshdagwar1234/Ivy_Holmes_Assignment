// scripts/build-insights.mjs
// Usage: node scripts/build-insights.mjs
// Run AFTER fetch-all.mjs. Reads data/listings.json and computes the
// aggregate summary the documented (but missing) /v1/analytics/summary
// endpoint would have returned — from data we actually pulled ourselves.
//
// Writes frontend/public/insights-summary.json, which the frontend fetches
// as a static file at build/runtime instead of hitting the dead endpoint.
//
// NOTE: median_price and median_price_per_sqft are computed over ALL
// retrievable listings here, unfiltered. If your findings work has already
// identified corrupt/fake listing_ids (Q4/Q9), consider excluding them from
// these aggregates too, the same way Q6 requires — edit the `listings`
// array below with a .filter(...) once you have those ids finalized.

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const OUT_PATH = path.join(
  process.cwd(),
  "frontend",
  "public",
  "insights-summary.json",
);
const CITY_NAME = process.env.CITY_NAME || "your city"; // fill in from your registration email

function load(name) {
  const p = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p} — run fetch-all.mjs first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function median(nums) {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const listings = load("listings");

const prices = listings
  .map((l) => l.price)
  .filter((p) => typeof p === "number" && p > 0);
const pricePerSqft = listings
  .filter((l) => l.price > 0 && l.carpet_area > 0)
  .map((l) => l.price / l.carpet_area);

const byLocalityMap = new Map();
for (const l of listings) {
  const key = (l.locality || "unknown").toLowerCase();
  if (!byLocalityMap.has(key)) byLocalityMap.set(key, []);
  byLocalityMap.get(key).push(l);
}
const by_locality = [...byLocalityMap.entries()]
  .map(([locality, group]) => ({
    locality,
    count: group.length,
    median_price: Math.round(
      median(group.map((l) => l.price).filter((p) => p > 0)),
    ),
  }))
  .sort((a, b) => b.count - a.count);

const byBhkMap = new Map();
for (const l of listings) {
  if (l.bedroom == null) continue;
  byBhkMap.set(l.bedroom, (byBhkMap.get(l.bedroom) || 0) + 1);
}
const by_bhk = [...byBhkMap.entries()]
  .map(([bedroom, count]) => ({ bedroom, count }))
  .sort((a, b) => a.bedroom - b.bedroom);

const summary = {
  city: CITY_NAME,
  total_listings: listings.length,
  median_price: Math.round(median(prices)),
  median_price_per_sqft: Math.round(median(pricePerSqft)),
  by_locality,
  by_bhk,
  computed_note:
    "The documented /v1/analytics/summary endpoint returns 404 on this API — these figures are computed client-side from every retrievable /v1/listings record instead.",
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(summary, null, 2));
console.log(`Wrote ${OUT_PATH}`);
console.log(summary);
