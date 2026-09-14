import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFavourites, removeFavourite } from "../api/client";

export default function Favourites() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  function load() {
    fetchFavourites()
      .then((d) => setItems(d.results || []))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleRemove(id) {
    await removeFavourite(id);
    load();
  }

  if (error)
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl">
          {error}
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal mb-1">
            Personal Collection
          </div>
          <h1 className="text-3xl md:text-4xl text-ink font-serif tracking-tight font-semibold">Saved Properties</h1>
        </div>
        <div className="bg-surface-card border border-line px-4 py-2 rounded-full text-xs text-muted shadow-sm">
          <strong className="text-ink font-semibold">{items.length}</strong> bookmarked
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-3xl p-12 text-center max-w-lg mx-auto my-8 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-ochre-light border border-ochre/20 text-ochre flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-ink font-semibold mb-2">No Saved Properties Yet</h3>
          <p className="text-sm text-muted mb-6 leading-relaxed">
            Browse our verified Bangalore property listings and click "Save Listing" to keep track of your favorites.
          </p>
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 bg-teal hover:bg-teal-hover text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            Explore Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((l) => (
            <div
              key={l.listing_id}
              className="group bg-surface-card border border-line hover:border-teal/50 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="bg-teal-light text-teal border border-teal/20 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {l.bedroom} BHK
                  </span>
                  <div className="price text-2xl font-bold text-ochre text-right shrink-0">
                    ₹{Number(l.price).toLocaleString("en-IN")}
                  </div>
                </div>

                <h3 className="font-serif text-xl text-ink font-semibold leading-snug hover:text-teal transition-colors line-clamp-1 mb-1.5">
                  <Link to={`/listings/${l.listing_id}`}>{l.apartment_name}</Link>
                </h3>

                <p className="text-xs text-muted mb-5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="capitalize font-medium">{l.locality}, Bangalore</span>
                </p>
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-between">
                <Link
                  to={`/listings/${l.listing_id}`}
                  className="text-xs font-semibold text-teal hover:text-teal-hover flex items-center gap-1 transition-colors"
                >
                  View Details
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <button
                  onClick={() => handleRemove(l.listing_id)}
                  className="text-xs font-medium text-muted hover:text-rose-600 bg-surface-muted hover:bg-rose-50 border border-line hover:border-rose-200 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
