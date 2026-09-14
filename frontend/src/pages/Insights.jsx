import { useEffect, useState } from "react";

function Bar({ label, count, maxCount, sublabel }) {
  const pct = maxCount ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="py-3.5">
      <div className="flex items-baseline justify-between mb-2">
        <span className="capitalize text-xs font-semibold text-ink">{label}</span>
        <span className="text-xs text-muted font-medium flex items-center gap-2">
          <span>{count.toLocaleString("en-IN")} listings</span>
          {sublabel ? (
            <span className="price text-ochre-dark font-bold bg-ochre-light border border-ochre/20 px-2 py-0.5 rounded-md text-[11px]">{sublabel}</span>
          ) : null}
        </span>
      </div>
      <div className="h-2.5 bg-surface-muted rounded-full overflow-hidden border border-line/60">
        <div
          className="h-full bg-gradient-to-r from-teal to-teal-hover rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Insights() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/insights-summary.json")
      .then((r) => {
        if (!r.ok)
          throw new Error(
            `insights-summary.json missing (${r.status}) — run scripts/build-insights.mjs`,
          );
        return r.json();
      })
      .then(setSummary)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center text-muted flex items-center justify-center gap-2">
        <svg className="animate-spin w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading analytics & insights…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-serif text-ink font-semibold mb-6">Market Insights</h1>
        <div className="bg-surface-card border border-line rounded-3xl p-8 text-center shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-ochre-light border border-ochre/20 text-ochre flex items-center justify-center mx-auto mb-3 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-ink font-semibold mb-1">
            Insights data hasn't been generated yet.
          </p>
          <p className="text-xs text-muted mb-4">{error.message}</p>
          <div className="bg-paper p-4 rounded-xl text-left border border-line max-w-lg mx-auto text-xs text-ink space-y-1 font-mono">
            <div>Run <code className="bg-teal-light text-teal font-semibold px-1.5 py-0.5 rounded">node scripts/fetch-all.mjs</code></div>
            <div>Then <code className="bg-teal-light text-teal font-semibold px-1.5 py-0.5 rounded">node scripts/build-insights.mjs</code></div>
            <div>Then restart dev server</div>
          </div>
        </div>
      </div>
    );
  }

  const maxLocalityCount = Math.max(
    ...summary.by_locality.map((l) => l.count),
    1,
  );
  const maxBhkCount = Math.max(...summary.by_bhk.map((b) => b.count), 1);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal mb-1">
        <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
        Real-Time Analytics
      </div>
      <h1 className="text-3xl md:text-4xl text-ink font-serif tracking-tight font-semibold mb-8">
        Market Insights — <span className="capitalize text-teal">{summary.city}</span>
      </h1>

      {/* KPI Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="bg-surface-card border border-line p-6 rounded-2xl shadow-card relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Total Verified Listings</div>
          <div className="price text-3xl md:text-4xl text-ink font-bold">
            {summary.total_listings.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-teal font-semibold mt-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Active database records
          </div>
        </div>

        <div className="bg-surface-card border border-line p-6 rounded-2xl shadow-card relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Median Market Price</div>
          <div className="price text-3xl md:text-4xl text-ochre font-bold">
            ₹{Number(summary.median_price).toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-muted mt-2">Across all configurations</div>
        </div>

        <div className="bg-surface-card border border-line p-6 rounded-2xl shadow-card relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Median Price / Sqft</div>
          <div className="price text-3xl md:text-4xl text-teal font-bold">
            ₹{summary.median_price_per_sqft}
            <span className="text-sm font-sans font-normal text-muted ml-1">/sqft</span>
          </div>
          <div className="text-xs text-muted mt-2">Carpet & built-up average</div>
        </div>
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-surface-card border border-line p-6 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-serif text-ink font-semibold">Distribution by Locality</h2>
              <p className="text-xs text-muted mt-0.5">Volume and median valuation by neighborhood</p>
            </div>
          </div>
          <div className="divide-y divide-line">
            {summary.by_locality.map((l) => (
              <Bar
                key={l.locality}
                label={l.locality}
                count={l.count}
                maxCount={maxLocalityCount}
                sublabel={`₹${Number(l.median_price).toLocaleString("en-IN")}`}
              />
            ))}
          </div>
        </section>

        <section className="bg-surface-card border border-line p-6 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-serif text-ink font-semibold">Distribution by BHK</h2>
              <p className="text-xs text-muted mt-0.5">Listings per bedroom layout</p>
            </div>
          </div>
          <div className="divide-y divide-line">
            {summary.by_bhk.map((b) => (
              <Bar
                key={b.bedroom}
                label={`${b.bedroom} BHK Configuration`}
                count={b.count}
                maxCount={maxBhkCount}
              />
            ))}
          </div>
        </section>
      </div>

      {summary.computed_note && (
        <div className="bg-surface-card border border-line rounded-xl p-4 mt-8 text-xs text-muted flex items-center gap-2">
          <svg className="w-4 h-4 text-teal shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{summary.computed_note}</span>
        </div>
      )}
    </div>
  );
}
