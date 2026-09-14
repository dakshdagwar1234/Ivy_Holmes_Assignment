# Ivy Homes Assignment — Daksh

## Structure


## How to run

### 1. Data pipeline (do this first)


`fetch-all.mjs` logs in with the API key as an `X-API-Key` header, not the query
param the docs describe (docs are wrong here — see `findings.json`), and pages
`/v1/listings`, `/v1/rentals`, `/v1/projects` using `offset=` rather than
`page=`, following the server's own `has_more` flag rather than trusting
`total` to compute page count up front. It logs a warning if `total` ever
drifts across pages within one collection — [it did not / it did, on
`<endpoint>`, see below].

`analyze.mjs` doesn't print a single answer per question — it prints a rule,
applies it, shows sample matches, and where the first attempt was too broad or
too narrow, tries again and says so. Nothing in the console output should be
copied into `submission.json` without reading the reasoning above it first.

### 2. Frontend


Deployed at: [https://ivy-holmes-assignment.vercel.app]

## LLM use

I used Claude throughout — scaffolding `fetch-all.mjs` and `analyze.mjs`,
building the frontend, and debugging. Worth being specific about how this
actually went, because it's relevant: an early session produced a full
`findings.json` and `submission.json` with real-looking numbers (fake listing
counts, corrupt IDs, etc.) that were never actually verified against the live
API — the frontend built from that session's assumptions (query-param auth,
`page=` pagination, wrong field names) didn't work at all when I actually ran
it. I caught this by testing the deployed frontend against real login/list
calls and reading actual DevTools responses rather than trusting the
explanation given for why something failed.

From that point on, every fix went through: reproduce the failure → capture
the real request/response → only then patch the code. The `X-API-Key` header
fix, the `/v1/saved` endpoint (docs say `/v1/favourites`) and its
`listing_id` field name (docs say `id`), and the confirmed-missing
`/v1/analytics/summary` endpoint were all found this way, not assumed.
`analyze.mjs`'s answers were treated the same way — as hypotheses to check
against sample output, not final numbers.

What I accepted more directly from the LLM: general React/Vite boilerplate,
Tailwind setup, and the visual design of the frontend — none of that affects
correctness of the data answers, so it got less scrutiny than the data
pipeline and auth logic.

## How I worked out what to distrust

I started with the two endpoints the doc singles out as safe to check first —
`/health` (unauthenticated, confirms the server clock/reference date) and
`/auth/login` — and immediately found the first real discrepancy: the
documented query-param auth doesn't work, the API wants `X-API-Key` as a
header. That set the pattern for the rest: assume every documented shape
(auth, pagination, field names, endpoint paths) is a claim to test, not a fact.

For the ten questions, the real work was in Q4, Q6, and Q9, since those
require defining "impossible" and "fake" myself:

**Q4 (corrupt listings):** I started with seven candidate impossibility rules
— floor exceeding total floors, non-positive area, carpet area exceeding
super built-up area, non-positive bedroom count, bathroom count far exceeding
bedroom count, non-positive price, and coordinates outside India's bounding
box. Run against the real data: [`floor_exceeds_total_floors`: N matches,
`negative_or_zero_area`: N, `carpet_exceeds_superbuiltup`: N,
`bedroom_zero_or_negative`: N, `bathroom_way_over_bedroom`: N,
`price_zero_or_negative`: N, `lat_lng_out_of_india`: N — fill in from your
console output]. I dropped `bedroom_zero_or_negative` from the final rule set
after sampling actual `bedroom: 0` listings — [they looked like genuine
studio/plot listings with sane price and area / they didn't, see below] —
since the task says corrupt records "cannot exist," not "are unusual," and a
0-bedroom studio is a legitimate property type, not an impossibility. Final
`corrupt_listing_ids` uses the union of the four remaining rules:
floor-exceeds-total, carpet-exceeds-super-built-up, non-positive price, and
out-of-India coordinates — [N] listings total.

**Q9 (fake listings):** I tried five signals before landing on one. Reused
contact numbers labeled `owner` (a real owner shouldn't be posting 3+
unrelated listings) was the strongest starting signal — [N] owner contacts
reused ≥3 times. I checked whether refining that to "spans multiple distinct
apartments/localities" narrowed it further — it [did not / did], since [most
reused owner-contacts were already all-distinct properties by construction].
I tried three other signals that were dead ends: near-identical description
text reused across listings ([N] groups — [too common to be a fake-listing
signal / genuinely nothing]), price divisible by exactly ₹1,00,000 (no
distributional cliff), and contact number prefix clustering (uniform, no
signal). The signal I ended up using stacks the owner-reuse rule with
`is_verified`: final `fake_listing_ids` = owner-contacts reused ≥3 times where
at least 50% of that contact's listings are `is_verified: false` — [N]
listings. I chose 50% over "all unverified" (too conservative, [N] listings)
because a real fake-listing operation would plausibly still get some listings
past verification.

**Q6:** computed after excluding both `corrupt_listing_ids` and
`fake_listing_ids`, over `is_live === true && bedroom === 2` records only, as
the question requires — final average: [₹X/sqft, from N eligible listings].

**Q10:** compared each project's documented `total_listings` against an
actual count of listings carrying that `project_id` in the retrieved dataset
— [N] projects mismatched. Caveat I haven't fully closed out: this only
counts listings currently retrievable in bulk from `/v1/listings`; I didn't
cross-check every mismatch against `GET /v1/listings?project_id=...`
individually, which the docs suggest should agree exactly.

## What I checked that turned out to be fine

- **Pagination `total` stability**: [did the reported `total` field stay
  constant across every page of listings/rentals/projects, or did it drift?
  Check your `fetch-all.mjs` output for the "WARNING: reported 'total'
  changed across calls" line — if it never printed, say so explicitly here,
  that's a real finding either way.]
- **Units**: tested whether `project.price_max` is really rupees as
  documented, or actually crores, by comparing implied ₹/sqft both ways
  against a plausible residential range (₹3,000–30,000/sqft). [State which
  interpretation landed in range, and for how many of the sampled projects —
  the script prints this for the first 10 projects.]
- **The P10004 outlier**: [what did this record actually show — was it a
  genuine unit-mismatch, or something else? Fill in from the printed
  record.]
- **`is_live` completeness**: [what fraction of listing records actually
  carry the `is_live` field at all, and does the doc's claim that
  `/v1/listings` "only returns active listings" hold, or are `is_live: false`
  records present?]
- **`is_verified`**: [what fraction of listings are `is_verified: false`? —
  the script computes this in the Q9 pivots section.]

## What I'd do with another two days

- Cross-check every Q10 mismatch individually via
  `GET /v1/listings?project_id=...` rather than relying on the bulk dataset,
  in case pagination gaps are hiding in specific projects.
- Try a duplicate-property detection pass based on geographic proximity
  (lat/long clustering) rather than only apartment name + floor + BHK +
  carpet area, since a resale re-listing under a slightly different
  apartment-name spelling would currently be missed by Q2's dedup key.
- [Add your own — anything you noticed but didn't have time to chase.]
