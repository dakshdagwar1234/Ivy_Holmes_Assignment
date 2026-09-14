import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchListing,
  fetchSimilarListings,
  addFavourite,
  removeFavourite,
  fetchFavourites,
} from "../api/client";

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [isFavourite, setIsFavourite] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchListing(id)
      .then(setListing)
      .catch((e) => setLoadError(e.message));
    fetchSimilarListings(id)
      .then((d) => setSimilar(d.results || d))
      .catch(() => {});
    fetchFavourites()
      .then((d) =>
        setIsFavourite((d.results || []).some((f) => f.listing_id === id)),
      )
      .catch(() => {});
  }, [id]);

  async function toggleFavourite() {
    setSaving(true);
    setSaveError(null);
    try {
      if (isFavourite) {
        await removeFavourite(id);
        setIsFavourite(false);
      } else {
        await addFavourite(id);
        setIsFavourite(true);
      }
    } catch (e) {
      setSaveError(`Couldn't save this listing: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loadError)
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl">
          <h3 className="font-serif text-lg font-semibold mb-1 text-rose-900">Error Loading Property</h3>
          <p className="text-sm">{loadError}</p>
        </div>
      </div>
    );

  if (!listing)
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="w-24 h-4 bg-surface-muted rounded mb-6 animate-pulse"></div>
        <div className="bg-surface-card border border-line rounded-3xl p-8 shadow-card mb-8 animate-pulse">
          <div className="h-6 w-32 bg-surface-muted rounded-full mb-4"></div>
          <div className="h-8 w-2/3 bg-surface-muted rounded mb-3"></div>
          <div className="h-4 w-1/3 bg-surface-muted rounded"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-card border border-line p-5 rounded-xl h-24 animate-pulse flex flex-col justify-center">
              <div className="w-20 h-3 bg-surface-muted rounded mb-2"></div>
              <div className="w-16 h-6 bg-surface-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Back button link */}
      <Link to="/listings" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-teal font-semibold mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Listings
      </Link>

      {/* Property Hero Header Card */}
      <div className="bg-surface-card border border-line rounded-3xl p-6 sm:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-teal-light text-teal border border-teal/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal" />
                {listing.property_type || "Verified Residence"}
              </span>
              {listing.is_verified && (
                <span className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Verified Partner
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl text-ink font-serif tracking-tight font-bold mb-2">
              {listing.apartment_name || listing.locality}
            </h1>

            <p className="text-sm text-muted flex items-center gap-1.5">
              <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="capitalize font-medium">{listing.locality}, Bangalore</span>
            </p>
          </div>

          <div className="flex sm:flex-col items-end sm:items-end justify-between sm:justify-start gap-4 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-line">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold sm:text-right mb-0.5">Listed Price</div>
              <div className="price text-3xl font-bold text-ochre">
                ₹{Number(listing.price).toLocaleString("en-IN")}
              </div>
            </div>

            <button
              onClick={toggleFavourite}
              disabled={saving}
              className={`text-xs font-semibold px-5 py-2.5 rounded-full border transition-all flex items-center gap-2 shadow-sm ${
                isFavourite
                  ? "bg-ochre text-white border-ochre-dark shadow-md"
                  : "bg-surface-muted text-ink border-line hover:bg-teal-light hover:text-teal hover:border-teal/30"
              } disabled:opacity-60 active:scale-95`}
            >
              <svg
                className={`w-4 h-4 ${isFavourite ? "fill-white text-white" : "fill-none stroke-current"}`}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {saving ? "Saving…" : isFavourite ? "Saved" : "Save Listing"}
            </button>
          </div>
        </div>
      </div>
      {saveError && <p className="text-rose-600 text-xs mb-4">{saveError}</p>}

      {/* Property Specifications Matrix */}
      <h2 className="text-xl font-serif text-ink mb-4 font-semibold">Property Specifications</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-card border border-line p-5 rounded-2xl shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1.5">Configuration</div>
          <div className="font-serif text-xl text-ink font-semibold">
            {listing.bedroom} BHK · {listing.bathroom} Bath
          </div>
        </div>
        <div className="bg-surface-card border border-line p-5 rounded-2xl shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1.5">Locality</div>
          <div className="font-serif text-xl text-ink font-semibold capitalize">{listing.locality}</div>
        </div>
        <div className="bg-surface-card border border-line p-5 rounded-2xl shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1.5">Floor</div>
          <div className="font-serif text-xl text-ink font-semibold">
            {listing.floor} of {listing.total_floors}
          </div>
        </div>
        <div className="bg-surface-card border border-line p-5 rounded-2xl shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1.5">Carpet Area</div>
          <div className="font-serif text-xl text-ink font-semibold">{listing.carpet_area} sqft</div>
        </div>
        <div className="bg-surface-card border border-line p-5 rounded-2xl shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1.5">Super Built-up</div>
          <div className="font-serif text-xl text-ink font-semibold">{listing.super_built_up_area} sqft</div>
        </div>
        <div className="bg-surface-card border border-line p-5 rounded-2xl shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1.5">Furnishing</div>
          <div className="font-serif text-xl text-ink font-semibold capitalize">{listing.furnishing}</div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-surface-card border border-line p-6 rounded-2xl shadow-card mb-8">
        <h2 className="text-xl font-serif text-ink mb-3 font-semibold">About this Property</h2>
        <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line font-normal">{listing.description}</p>
      </div>

      {/* Seller Contact Box */}
      <div className="bg-[#0B1E19] text-white border border-emerald-900/40 p-6 rounded-2xl mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-teal text-white flex items-center justify-center font-serif text-lg font-bold shrink-0 shadow-md">
            {listing.posted_by_name ? listing.posted_by_name.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-200">Listed By</div>
            <div className="font-semibold text-white text-base">{listing.posted_by_name || "Authorized Partner"} ({listing.posted_by})</div>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 text-xs font-medium text-white flex items-center gap-2 self-start sm:self-auto shadow-sm">
          <svg className="w-4 h-4 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="font-semibold">{listing.posted_by_contact}</span>
        </div>
      </div>

      {/* Similar Listings Grid */}
      {similar.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif text-ink mb-6 tracking-tight font-semibold">Similar Listings in <span className="capitalize text-teal">{listing.locality}</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {similar.map((l) => (
              <Link
                to={`/listings/${l.listing_id}`}
                key={l.listing_id}
                className="group bg-surface-card border border-line hover:border-teal/40 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-serif text-base text-ink font-semibold leading-snug group-hover:text-teal transition-colors truncate">
                    {l.apartment_name}
                  </h3>
                  <div className="price text-base font-bold text-ochre shrink-0">
                    ₹{Number(l.price).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{l.bedroom} BHK · <span className="capitalize">{l.locality}</span></span>
                  <span className="text-teal font-semibold group-hover:translate-x-0.5 transition-transform">View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
