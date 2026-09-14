import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchListings } from "../api/client";

const EMPTY_FILTERS = { locality: "", bhk: "", min_price: "", max_price: "", furnishing: "" };

function matchesFilters(listing, f) {
  if (f.locality && (listing.locality || "").toLowerCase() !== f.locality.toLowerCase()) return false;
  if (f.bhk && Number(listing.bedroom) !== Number(f.bhk)) return false;
  if (f.min_price && Number(listing.price) < Number(f.min_price)) return false;
  if (f.max_price && Number(listing.price) > Number(f.max_price)) return false;
  if (f.furnishing && listing.furnishing !== f.furnishing) return false;
  return true;
}

export default function Listings() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);
  const [rawResults, setRawResults] = useState([]);
  const [total, setTotal] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async (targetFilters, targetOffset) => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...targetFilters, offset: targetOffset, limit: PAGE_SIZE };
      const data = await fetchListings(params);
      setTotal(data.total);
      const results = data.results || [];
      setHasMore(results.length === PAGE_SIZE);
      setRawResults((prev) => (targetOffset === 0 ? results : [...prev, ...results]));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    load(filters, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function handleFilterChange(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function loadMore() {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    load(filters, nextOffset);
  }

  const visible = rawResults.filter((l) => matchesFilters(l, filters));
  const isFiltered = Object.values(filters).some((v) => v !== "");

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal mb-1">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            Verified Marketplace
          </div>
          <h1 className="text-3xl md:text-4xl text-ink font-serif tracking-tight font-medium">Properties for Sale</h1>
        </div>
        {total != null && (
          <div className="inline-flex items-center gap-2 bg-surface-card border border-line px-4 py-2 rounded-full text-xs text-muted shadow-sm self-start md:self-auto">
            <svg className="w-3.5 h-3.5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span><strong className="text-ink font-semibold">{total.toLocaleString("en-IN")}</strong> verified properties on record</span>
          </div>
        )}
      </div>

      {/* Filter Glass Panel */}
      <div className="bg-surface-card border border-line rounded-2xl p-5 shadow-card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Properties
          </div>
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted hover:text-teal font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <input
              className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-muted focus:border-teal outline-none transition-all"
              placeholder="Locality (e.g. Indiranagar)"
              value={filters.locality}
              onChange={(e) => handleFilterChange("locality", e.target.value)}
            />
          </div>

          <div>
            <select
              className="w-full bg-paper border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:border-teal outline-none transition-all cursor-pointer"
              value={filters.bhk}
              onChange={(e) => handleFilterChange("bhk", e.target.value)}
            >
              <option value="">Any BHK</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} BHK</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-muted focus:border-teal outline-none transition-all"
              placeholder="Min price (₹)"
              value={filters.min_price}
              onChange={(e) => handleFilterChange("min_price", e.target.value)}
            />
          </div>

          <div>
            <input
              type="number"
              className="w-full bg-paper border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-muted focus:border-teal outline-none transition-all"
              placeholder="Max price (₹)"
              value={filters.max_price}
              onChange={(e) => handleFilterChange("max_price", e.target.value)}
            />
          </div>

          <div>
            <select
              className="w-full bg-paper border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:border-teal outline-none transition-all cursor-pointer"
              value={filters.furnishing}
              onChange={(e) => handleFilterChange("furnishing", e.target.value)}
            >
              <option value="">Any Furnishing</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi-furnished">Semi-furnished</option>
              <option value="fully-furnished">Fully-furnished</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3.5 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visible.map((l) => (
          <Link
            to={`/listings/${l.listing_id}`}
            key={l.listing_id}
            className="group bg-surface-card border border-line hover:border-teal/50 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative"
          >
            <div>
              {/* Card Header: Badges & Price */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-teal-light text-teal border border-teal/20 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                    {l.property_type || "Apartment"}
                  </span>
                  {l.is_verified && (
                    <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      Verified
                    </span>
                  )}
                </div>
                <div className="price text-2xl font-bold text-ochre text-right shrink-0">
                  ₹{Number(l.price).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Apartment Name & Location */}
              <h3 className="text-xl font-serif text-ink font-semibold leading-snug group-hover:text-teal transition-colors line-clamp-1 mb-1.5">
                {l.apartment_name || l.locality}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-muted mb-5">
                <svg className="w-3.5 h-3.5 text-teal shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="capitalize font-medium">{l.locality}, Bangalore</span>
              </div>
            </div>

            {/* Specifications footer */}
            <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 bg-surface-muted px-2.5 py-1 rounded-lg text-ink font-medium">
                  <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {l.bedroom} BHK
                </span>
                <span className="flex items-center gap-1 bg-surface-muted px-2.5 py-1 rounded-lg text-ink font-medium">
                  <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {l.bathroom} Bath
                </span>
                {l.furnishing && (
                  <span className="bg-ochre-light text-ochre-dark border border-ochre/20 px-2.5 py-1 rounded-lg font-semibold capitalize">
                    {l.furnishing}
                  </span>
                )}
              </div>

              <span className="group-hover:translate-x-1 transition-transform text-teal font-semibold flex items-center gap-1 shrink-0 ml-2">
                Details
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Skeletons when loading */}
      {loading && rawResults.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-card border border-line rounded-2xl p-6 shadow-card animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-24 bg-surface-muted rounded-full"></div>
                <div className="h-7 w-28 bg-surface-muted rounded"></div>
              </div>
              <div className="h-6 w-3/4 bg-surface-muted rounded mb-2.5"></div>
              <div className="h-4 w-1/3 bg-surface-muted rounded mb-6"></div>
              <div className="pt-4 border-t border-line flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-surface-muted rounded-lg"></div>
                  <div className="h-6 w-16 bg-surface-muted rounded-lg"></div>
                </div>
                <div className="h-5 w-14 bg-surface-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && rawResults.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-muted text-sm py-12">
          <svg className="animate-spin w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading additional properties…
        </div>
      )}

      {!loading && hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={loadMore}
            className="bg-teal hover:bg-teal-hover text-white font-semibold px-8 py-3 rounded-full text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            Load More Properties
          </button>
        </div>
      )}

      {!loading && visible.length === 0 && rawResults.length > 0 && (
        <div className="bg-surface-card border border-line rounded-2xl p-8 text-center mt-6">
          <p className="text-ink font-medium">No listings match your current filters on the loaded page.</p>
          <p className="text-xs text-muted mt-1">Try resetting filters or click "Load more" to fetch additional properties.</p>
        </div>
      )}
    </div>
  );
}
