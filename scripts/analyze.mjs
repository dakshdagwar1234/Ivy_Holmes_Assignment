// scripts/analyze.mjs
// Usage: node scripts/analyze.mjs
// Run AFTER fetch-all.mjs. Reads data/listings.json, data/rentals.json,
// data/projects.json and prints draft answers + the evidence behind each,
// so you can eyeball whether a heuristic is right before locking it in.

import fs from "node:fs";

const REFERENCE = new Date("2026-09-10T00:00:00+05:30");
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ASSIGNED_LOCALITY = (
  process.env.ASSIGNED_LOCALITY || "jp nagar"
).toLowerCase();

function load(name) {
  const p = `data/${name}.json`;
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p} — run fetch-all.mjs first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const listings = load("listings");
const rentals = load("rentals");
const projects = load("projects");

console.log(
  `Loaded: ${listings.length} listings, ${rentals.length} rentals, ${projects.length} projects.\n`,
);

console.log("=== Q1 total_listing_records ===");
console.log("Retrievable listing records:", listings.length);
console.log();

console.log(
  "=== Q2 unique_properties (dedupe by apartment_name+floor+bedroom+carpet_area) ===",
);
function propertyKey(l) {
  const name = (l.apartment_name || "").trim().toLowerCase();
  const floor = l.floor ?? "NA";
  const bhk = l.bedroom ?? "NA";
  const carpet = l.carpet_area != null ? Math.round(l.carpet_area) : "NA";
  return `${name}|${floor}|${bhk}|${carpet}`;
}
const byPropertyKey = new Map();
for (const l of listings) {
  const k = propertyKey(l);
  if (!byPropertyKey.has(k)) byPropertyKey.set(k, []);
  byPropertyKey.get(k).push(l.listing_id);
}
const groupsWithDupes = [...byPropertyKey.entries()].filter(
  ([, ids]) => ids.length > 1,
);
console.log("Unique property groups under this key:", byPropertyKey.size);
console.log(
  "Groups with >1 listing_id (candidate re-listings):",
  groupsWithDupes.length,
);
console.log("Sample duplicate groups (first 5):");
for (const [k, ids] of groupsWithDupes.slice(0, 5))
  console.log("  ", k, "->", ids);
console.log(
  "If this key is too loose/tight, adjust propertyKey() and re-run.\n",
);

console.log("=== Q3 active_listings (is_live === true) ===");
const withIsLive = listings.filter((l) => "is_live" in l);
console.log(
  `Records that actually HAVE an is_live field: ${withIsLive.length} / ${listings.length}`,
);
const activeCount = listings.filter((l) => l.is_live === true).length;
console.log("Count where is_live === true:", activeCount);
console.log(
  "Count where is_live === false:",
  listings.filter((l) => l.is_live === false).length,
);
console.log(
  "(Doc claims /v1/listings only returns 'active' listings — if is_live is ever false, that's a finding.)\n",
);

console.log("=== Q4 corrupt_listing_ids (candidate impossibility rules) ===");
const rules = {
  floor_exceeds_total_floors: (l) =>
    l.total_floors != null && l.floor != null && l.floor > l.total_floors,
  negative_or_zero_area: (l) =>
    (l.carpet_area != null && l.carpet_area <= 0) ||
    (l.super_built_up_area != null && l.super_built_up_area <= 0),
  carpet_exceeds_superbuiltup: (l) =>
    l.carpet_area != null &&
    l.super_built_up_area != null &&
    l.carpet_area > l.super_built_up_area,
  bedroom_zero_or_negative: (l) => l.bedroom != null && l.bedroom <= 0,
  bathroom_way_over_bedroom: (l) =>
    l.bathroom != null && l.bedroom != null && l.bathroom > l.bedroom + 3,
  price_zero_or_negative: (l) => l.price != null && l.price <= 0,
  lat_lng_out_of_india: (l) =>
    l.latitude != null &&
    l.longitude != null &&
    (l.latitude < 6 || l.latitude > 38 || l.longitude < 68 || l.longitude > 98),
};
const flagged = new Map();
for (const [name, fn] of Object.entries(rules)) {
  const matches = listings.filter(fn).map((l) => l.listing_id);
  console.log(
    `  rule '${name}': ${matches.length} matches`,
    matches.slice(0, 10),
  );
  for (const id of matches) flagged.set(id, [...(flagged.get(id) || []), name]);
}
console.log(
  "Union of all rules — listing_ids flagged by at least one rule:",
  flagged.size,
);
console.log(
  "(Review each one manually before finalizing corrupt_listing_ids — the task says 'a small number'.)\n",
);

console.log(
  "=== Q4 refinement: excluding bedroom_zero_or_negative (likely legitimate studios) ===",
);
const PHYSICAL_IMPOSSIBILITY_RULES = [
  "floor_exceeds_total_floors",
  "carpet_exceeds_superbuiltup",
  "price_zero_or_negative",
  "lat_lng_out_of_india",
];
const physicallyImpossibleIds = new Set();
for (const [id, ruleNames] of flagged.entries()) {
  if (ruleNames.some((r) => PHYSICAL_IMPOSSIBILITY_RULES.includes(r))) {
    physicallyImpossibleIds.add(id);
  }
}
console.log(
  "Union of the four '8-match' physical-impossibility rules only:",
  physicallyImpossibleIds.size,
);
console.log("IDs:", [...physicallyImpossibleIds].sort());
const zeroBedroomSample = listings.filter((l) => l.bedroom === 0).slice(0, 3);
console.log(
  "Sample of bedroom=0 listings (checking if they look like real studios):",
  zeroBedroomSample.map((l) => ({
    id: l.listing_id,
    carpet_area: l.carpet_area,
    price: l.price,
    property_type: l.property_type,
  })),
);
console.log();

console.log(
  `=== Q5 total_monthly_rent (locality === "${ASSIGNED_LOCALITY}") ===`,
);
const localityValues = [...new Set(rentals.map((r) => r.locality))];
console.log("Distinct locality values seen in rentals data:", localityValues);
const localityRentals = rentals.filter(
  (r) => (r.locality || "").toLowerCase() === ASSIGNED_LOCALITY,
);
console.log(
  `Matched ${localityRentals.length} rental records in "${ASSIGNED_LOCALITY}"`,
);
const totalRent = localityRentals.reduce((sum, r) => sum + (r.price || 0), 0);
console.log("Sum of price field across those:", totalRent, "\n");

console.log(
  "=== Units check: price_max vs area (testing crore hypothesis) ===",
);
projects.slice(0, 10).forEach((p) => {
  const asIs = p.price_max / (p.min_area_sqft || 1);
  const asCrore = (p.price_max * 1e7) / (p.min_area_sqft || 1);
  console.log(
    `  ${p.project_id}: price_max=${p.price_max}, min_area_sqft=${p.min_area_sqft}, ₹/sqft as-is=${asIs.toFixed(2)}, ₹/sqft if ×1e7=${asCrore.toFixed(0)}`,
  );
});
console.log(
  "Sane residential ₹/sqft is roughly 3,000–30,000. Whichever column lands there confirms the unit.\n",
);

console.log("=== P10004 anomaly check (outlier from units check) ===");
const p10004 = projects.find((p) => p.project_id === "P10004");
console.log(p10004, "\n");

console.log("=== Q7 costliest_project (max price_max) ===");
let costliest = null;
for (const p of projects) {
  if (p.price_max != null && (!costliest || p.price_max > costliest.price_max))
    costliest = p;
}
console.log("Top 5 projects by price_max:");
[...projects]
  .filter((p) => p.price_max != null)
  .sort((a, b) => b.price_max - a.price_max)
  .slice(0, 5)
  .forEach((p) =>
    console.log(
      `  ${p.project_id}  price_max=${p.price_max} cr (₹${Math.round(p.price_max * 1e7).toLocaleString("en-IN")})  (${p.apartment_name})`,
    ),
  );
console.log(
  "Draft answer:",
  costliest && {
    project_id: costliest.project_id,
    price_max_inr: Math.round(costliest.price_max * 1e7),
  },
  "\n",
);

console.log("=== Q8 listings_last_7_days ===");
const windowStart = new Date(REFERENCE.getTime() - SEVEN_DAYS_MS);
console.log(
  `Window: [${windowStart.toISOString()}, ${REFERENCE.toISOString()})`,
);
const inWindow = listings.filter((l) => {
  if (!l.posted_at) return false;
  const t = new Date(l.posted_at);
  return t >= windowStart && t < REFERENCE;
});
console.log("Count posted_at within window:", inWindow.length, "\n");

console.log(
  "=== Q9 fake_listing_ids (candidate signal: contact number reused across many listings) ===",
);
const byContact = new Map();
for (const l of listings) {
  const c = l.posted_by_contact;
  if (!c) continue;
  if (!byContact.has(c)) byContact.set(c, []);
  byContact.get(c).push(l);
}
const distribution = {};
for (const items of byContact.values()) {
  distribution[items.length] = (distribution[items.length] || 0) + 1;
}
console.log(
  "Distribution: {listings per contact: number of contacts with that count}",
);
console.log(
  Object.fromEntries(Object.entries(distribution).sort((a, b) => a[0] - b[0])),
);

const ownerContacts = [...byContact.entries()].filter(
  ([, items]) => items[0].posted_by === "owner",
);
const suspiciousOwnerContacts = ownerContacts
  .filter(([, items]) => items.length >= 3)
  .sort((a, b) => b[1].length - a[1].length);
console.log(
  `\nContacts labeled 'owner' reused across >=3 listings: ${suspiciousOwnerContacts.length} contacts`,
);

const agentContacts = [...byContact.entries()].filter(
  ([, items]) => items[0].posted_by === "agent",
);
console.log(
  `(For comparison) top agent contacts by volume:`,
  [...agentContacts]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([c, items]) => `${c}: ${items.length}`),
);

const FAKE_CANDIDATE_IDS = suspiciousOwnerContacts.flatMap(([, items]) =>
  items.map((l) => l.listing_id),
);
console.log(
  `\nDraft fake_listing_ids candidate count (owner-mislabeled-as-multi-property only): ${FAKE_CANDIDATE_IDS.length}`,
);
console.log("This threshold alone is too broad — refining below.\n");

console.log(
  "=== Q9 refinement: do suspicious owner-contacts span multiple distinct properties? ===",
);
const REFINED_FAKE_IDS = [];
for (const [, items] of suspiciousOwnerContacts) {
  const distinctApartments = new Set(
    items.map((l) => (l.apartment_name || "").trim().toLowerCase()),
  );
  const distinctLocalities = new Set(items.map((l) => l.locality));
  const spansMultipleProperties =
    distinctApartments.size > 1 || distinctLocalities.size > 1;
  if (spansMultipleProperties)
    REFINED_FAKE_IDS.push(...items.map((l) => l.listing_id));
}
console.log(
  `Owner-contacts flagged AND spanning multiple distinct apartments/localities: ${REFINED_FAKE_IDS.length} listings`,
);
console.log(
  `(vs ${FAKE_CANDIDATE_IDS.length} under owner>=3 alone — no-op in practice.)\n`,
);

console.log(
  "=== Q9 alternative signal tried: near-identical description text reused across listings ===",
);
const byDescription = new Map();
for (const l of listings) {
  const d = (l.description || "").trim().toLowerCase();
  if (!d) continue;
  if (!byDescription.has(d)) byDescription.set(d, []);
  byDescription.get(d).push(l.listing_id);
}
const dupDescriptions = [...byDescription.entries()].filter(
  ([, ids]) => ids.length > 1,
);
console.log(
  `Distinct description strings reused verbatim across >1 listing: ${dupDescriptions.length} groups (dead end)\n`,
);

console.log("=== Q9 owner-only contact frequency distribution ===");
const ownerDistribution = {};
for (const [, items] of ownerContacts) {
  ownerDistribution[items.length] = (ownerDistribution[items.length] || 0) + 1;
}
console.log(
  Object.fromEntries(
    Object.entries(ownerDistribution).sort((a, b) => a[0] - b[0]),
  ),
  "(no natural cliff)\n",
);

console.log("=== Q9 pivots tried (mostly dead ends, kept for the record) ===");
const unverifiedCount = listings.filter((l) => l.is_verified === false).length;
console.log(`is_verified === false: ${unverifiedCount} / ${listings.length}`);
const suspiciouslyRoundPrices = listings.filter(
  (l) => l.price != null && l.price % 100000 === 0,
);
console.log(
  `price exactly divisible by 1,00,000: ${suspiciouslyRoundPrices.length} (no clear signal)`,
);
const contactPrefixes = {};
for (const l of listings) {
  if (!l.posted_by_contact) continue;
  const prefix = l.posted_by_contact.slice(0, 6);
  contactPrefixes[prefix] = (contactPrefixes[prefix] || 0) + 1;
}
console.log(
  "contact number prefixes:",
  Object.entries(contactPrefixes).sort((a, b) => b[1] - a[1]),
  "(uniform — dead end)\n",
);

console.log("=== Q9 FINAL: owner-reuse AND unverified (stacked signal) ===");
const STACKED_FAKE_IDS_ALL_UNVERIFIED = [];
for (const [, items] of suspiciousOwnerContacts) {
  const unverifiedItems = items.filter((l) => l.is_verified === false);
  if (unverifiedItems.length === items.length)
    STACKED_FAKE_IDS_ALL_UNVERIFIED.push(...items.map((l) => l.listing_id));
}
console.log(
  `Owner-reuse contacts where EVERY listing is unverified: ${STACKED_FAKE_IDS_ALL_UNVERIFIED.length} listings (too conservative)`,
);

const STACKED_FAKE_IDS_PARTIAL = [];
for (const [, items] of suspiciousOwnerContacts) {
  const unverifiedShare =
    items.filter((l) => l.is_verified === false).length / items.length;
  if (unverifiedShare >= 0.5)
    STACKED_FAKE_IDS_PARTIAL.push(...items.map((l) => l.listing_id));
}
console.log(
  `Owner-reuse contacts where >=50% of listings are unverified: ${STACKED_FAKE_IDS_PARTIAL.length} listings`,
);
console.log("FINAL Q9 ANSWER: using the >=50% unverified stacked signal.\n");

console.log(
  "=== Q6 avg_price_per_sqft_2bhk (is_live && bedroom===2, excluding corrupt+fake) ===",
);
const FAKE_IDS = new Set(STACKED_FAKE_IDS_PARTIAL);
const CORRUPT_IDS = new Set(flagged.keys());
const eligible = listings.filter(
  (l) =>
    l.is_live === true &&
    l.bedroom === 2 &&
    !CORRUPT_IDS.has(l.listing_id) &&
    !FAKE_IDS.has(l.listing_id) &&
    l.carpet_area,
);
console.log("Eligible 2BHK live listings after exclusions:", eligible.length);
const ratios = eligible.map((l) => l.price / l.carpet_area);
const avgPsf = ratios.length
  ? ratios.reduce((a, b) => a + b, 0) / ratios.length
  : null;
console.log("avg_price_per_sqft_2bhk (FINAL):", avgPsf?.toFixed(2), "\n");

console.log("=== Q10 projects_with_wrong_listing_count ===");
const listingsByProject = new Map();
for (const l of listings) {
  if (!l.project_id) continue;
  listingsByProject.set(
    l.project_id,
    (listingsByProject.get(l.project_id) || 0) + 1,
  );
}
let wrongCount = 0;
const mismatches = [];
for (const p of projects) {
  const actual = listingsByProject.get(p.project_id) || 0;
  if (actual !== p.total_listings) {
    wrongCount++;
    mismatches.push({
      project_id: p.project_id,
      documented: p.total_listings,
      actual,
    });
  }
}
console.log("Projects where total_listings != actual count:", wrongCount);
console.log("Sample mismatches (first 10):", mismatches.slice(0, 10));
console.log(
  "CAVEAT: only counts listings currently retrievable in bulk; re-check via GET /v1/listings?project_id=... per project if needed.\n",
);

console.log(
  "=== SUMMARY (draft — verify every line above before copying into submission.json) ===",
);
const draftAnswers = {
  total_listing_records: listings.length,
  unique_properties: byPropertyKey.size,
  active_listings: activeCount,
  corrupt_listing_ids: [...physicallyImpossibleIds].sort(),
  total_monthly_rent: totalRent,
  avg_price_per_sqft_2bhk: avgPsf ? Number(avgPsf.toFixed(2)) : null,
  costliest_project: costliest
    ? {
        project_id: costliest.project_id,
        price_max_inr: Math.round(costliest.price_max * 1e7),
      }
    : null,
  listings_last_7_days: inWindow.length,
  fake_listing_ids: STACKED_FAKE_IDS_PARTIAL.sort(),
  projects_with_wrong_listing_count: wrongCount,
};
fs.writeFileSync(
  "data/draft-answers.json",
  JSON.stringify(draftAnswers, null, 2),
);
console.log("Counts only (full arrays written to data/draft-answers.json):");
console.log({
  total_listing_records: draftAnswers.total_listing_records,
  unique_properties: draftAnswers.unique_properties,
  active_listings: draftAnswers.active_listings,
  corrupt_listing_ids_count: draftAnswers.corrupt_listing_ids.length,
  total_monthly_rent: draftAnswers.total_monthly_rent,
  avg_price_per_sqft_2bhk: draftAnswers.avg_price_per_sqft_2bhk,
  costliest_project: draftAnswers.costliest_project,
  listings_last_7_days: draftAnswers.listings_last_7_days,
  fake_listing_ids_count: draftAnswers.fake_listing_ids.length,
  projects_with_wrong_listing_count:
    draftAnswers.projects_with_wrong_listing_count,
});
