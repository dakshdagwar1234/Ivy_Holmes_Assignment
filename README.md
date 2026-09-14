# Ivy Homes assignment — Daksh

## Structure

```
scripts/          Node scripts to pull the full dataset and analyze it
data/              Cached API responses (raw pages + merged datasets)
frontend/          Vite + React app (the deliverable)
findings.json      Documentation discrepancies, one object per finding
submission.json    Final answers + findings (fill in from the above)
```

## How to run

### 1. Data pipeline (do this first)

```bash
npm install
cp .env.example .env        # fill in API_KEY / LOGIN_PASSWORD / ASSIGNED_LOCALITY
npm run fetch                # pages through listings/rentals/projects, saves to data/
npm run analyze               # prints draft answers + evidence for all 10 questions
```

Read the console output of `analyze.mjs` carefully — every rule it applies
(what counts as "corrupt", what counts as "fake", how properties are
deduped) is a hypothesis, printed with its own evidence, meant to be
argued with rather than trusted. TODO: [fill in what you changed after
reviewing it, and why].

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # same API key
npm run dev
```

Deployed at: TODO (Vercel/Netlify link)

## LLM use

TODO: name what you used (e.g. Claude, Cursor) and roughly how — scaffolding
the fetch/analyze scripts, frontend boilerplate, etc. Be specific about
what you verified by hand vs. accepted as-is.

## How I worked out what to distrust

TODO — walk through your actual process:
- What you checked first (health/auth/pagination smoke test)
- The hypotheses you formed about the data (duplicates, fakes, corrupt
  records, count mismatches) and how you tested each
- Which rule/threshold you landed on for Q4 and Q9, and why

## What I checked that turned out to be fine

TODO — this is the section nobody can generate for you. List the things
you suspected the docs got wrong that, on inspection, were actually
correct. Examples of things worth checking and reporting either way:
- Does `total` in pagination responses stay stable across pages?
- Are money/area fields actually in the units documented?
- Does `total_listings` on a project actually match a live count?
- Is `is_verified` / `is_live` present and meaningful on every record?

## What I'd do with two more days

TODO.
