import { useEffect, useState, useCallback } from "react";
import { fetchRentals } from "../api/client";

export default function Rentals() {
  const [locality, setLocality] = useState("");
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async (loc, o) => {
    try {
      const data = await fetchRentals({ locality: loc, offset: o, limit: PAGE_SIZE });
      setTotal(data.total);
      const results = data.results || [];
      setHasMore(results.length === PAGE_SIZE);
      setResults((prev) => (o === 0 ? results : [...prev, ...results]));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    load(locality, 0);
  }, [locality, load]);

  const visible = results.filter(
    (r) => !locality || (r.locality || "").toLowerCase() === locality.toLowerCase()
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal mb-1">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            Long-term Leases
          </div>
          <h1 className="text-3xl md:text-4xl text-ink font-serif tracking-tight font-semibold">Rental Residences</h1>
        </div>
        {total != null && (
          <div className="bg-surface-card border border-line px-4 py-2 rounded-full text-xs text-muted shadow-sm self-start md:self-auto">
            <strong className="text-ink font-semibold">{total.toLocaleString("en-IN")}</strong> rentals on record
          </div>
        )}
      </div>

      {/* Search Filter input */}
      <div className="mb-8 max-w-md">
        <div className="relative">
          <input
            className="w-full bg-surface-card border border-line rounded-xl pl-10 pr-4 py-3 text-xs text-ink placeholder:text-muted focus:border-teal outline-none shadow-card transition-all"
            placeholder="Filter by locality (e.g. Koramangala)"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
          />
          <svg className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visible.map((r) => (
          <div
            key={r.listing_id}
            className="group bg-surface-card border border-line hover:border-teal/50 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="bg-teal-light text-teal border border-teal/20 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {r.bedroom} BHK Rental
                </span>
                <div className="price text-2xl font-bold text-ochre text-right shrink-0">
                  ₹{Number(r.price).toLocaleString("en-IN")}<span className="text-xs font-normal text-muted ml-0.5">/mo</span>
                </div>
              </div>

              <h3 className="font-serif text-xl text-ink font-semibold leading-snug line-clamp-1 mb-2 group-hover:text-teal transition-colors">
                {r.apartment_name || r.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-muted mb-5">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="capitalize">{r.locality}, Bangalore</span>
                </span>
                {r.furnishing && (
                  <>
                    <span>·</span>
                    <span className="capitalize bg-ochre-light text-ochre-dark border border-ochre/20 px-2 py-0.5 rounded font-semibold text-xs">{r.furnishing}</span>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between text-xs">
              <span className="bg-surface-muted border border-line text-ink px-3 py-1 rounded-full font-medium">
                Deposit: <strong className="text-ink font-semibold">₹{Number(r.deposit).toLocaleString("en-IN")}</strong>
              </span>

              <span className="text-teal font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                Verified Lease
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={() => {
              const next = offset + PAGE_SIZE;
              setOffset(next);
              load(locality, next);
            }}
            className="bg-teal hover:bg-teal-hover text-white font-semibold px-8 py-3 rounded-full text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            Load More Rentals
          </button>
        </div>
      )}
    </div>
  );
}
