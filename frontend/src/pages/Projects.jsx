import { useEffect, useState, useCallback } from "react";
import { fetchProjects } from "../api/client";

export default function Projects() {
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async (o) => {
    try {
      const data = await fetchProjects({ offset: o, limit: PAGE_SIZE });
      setTotal(data.total);
      const results = data.results || [];
      setHasMore(results.length === PAGE_SIZE);
      setResults((prev) => (o === 0 ? results : [...prev, ...results]));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal mb-1">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            New Developments
          </div>
          <h1 className="text-3xl md:text-4xl text-ink font-serif tracking-tight font-semibold">Residential Projects</h1>
        </div>
        {total != null && (
          <div className="bg-surface-card border border-line px-4 py-2 rounded-full text-xs text-muted shadow-sm self-start md:self-auto">
            <strong className="text-ink font-semibold">{total.toLocaleString("en-IN")}</strong> projects on record
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((p) => (
          <div
            key={p.project_id}
            className="group bg-surface-card border border-line hover:border-teal/50 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="bg-teal-light text-teal border border-teal/20 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {p.project_status || "Active Project"}
                </span>
                <div className="price text-lg font-bold text-ochre text-right shrink-0">
                  ₹{Number(p.price_min).toLocaleString("en-IN")} – ₹{Number(p.price_max).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="text-xs text-muted font-medium mb-1">{p.developer_name}</div>
              <h3 className="font-serif text-xl text-ink font-semibold leading-snug mb-2 group-hover:text-teal transition-colors">
                {p.apartment_name}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-muted mb-5">
                <svg className="w-3.5 h-3.5 text-teal shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{p.locality}, Bangalore</span>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-muted">
              <div>
                <span className="font-semibold text-ink">{p.total_units}</span> units · <span className="text-teal font-semibold">{p.total_listings}</span> live listings
              </div>
              <span className="text-teal font-semibold group-hover:translate-x-0.5 transition-transform">
                Explore →
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
              load(next);
            }}
            className="bg-teal hover:bg-teal-hover text-white font-semibold px-8 py-3 rounded-full text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            Load More Projects
          </button>
        </div>
      )}
    </div>
  );
}
