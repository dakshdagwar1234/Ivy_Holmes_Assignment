import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import Favourites from "./pages/Favourites";
import Rentals from "./pages/Rentals";
import Projects from "./pages/Projects";
import Insights from "./pages/Insights";
import "./styles.css";

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

const LINKS = [
  { to: "/listings", label: "Listings" },
  { to: "/rentals", label: "Rentals" },
  { to: "/projects", label: "Projects" },
  { to: "/saved", label: "Saved" },
  { to: "/insights", label: "Insights" },
];

function Nav() {
  const { isAuthenticated, logout, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (!isAuthenticated) return null;

  const userInitial = session?.email ? session.email.charAt(0).toUpperCase() : "U";

  return (
    <header className="glass-header sticky top-0 z-50 transition-all">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-8">
          <Link to="/listings" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-teal/20 text-teal-300 border border-teal/40 flex items-center justify-center font-serif text-base shadow-sm group-hover:bg-teal group-hover:text-white transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
              </svg>
            </div>
            <span className="font-serif text-xl font-medium tracking-tight text-white group-hover:text-teal-200 transition-colors">
              Ivy Homes
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/10 text-sm">
            {LINKS.map((l) => {
              const active = location.pathname.startsWith(l.to);
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={
                      active
                        ? "bg-teal text-white font-semibold px-4 py-1.5 rounded-full shadow-sm transition-all"
                        : "text-slate-300 hover:text-white px-4 py-1.5 rounded-full transition-colors"
                    }
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile Navigation bar */}
        <ul className="flex md:hidden items-center gap-3 text-xs">
          {LINKS.map((l) => {
            const active = location.pathname.startsWith(l.to);
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={
                    active
                      ? "text-teal-300 font-semibold border-b-2 border-teal-300 pb-0.5"
                      : "text-slate-300 hover:text-white pb-0.5"
                  }
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {session?.email && (
            <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1 rounded-full text-xs text-slate-200 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-ochre/20 text-ochre-light flex items-center justify-center font-semibold text-[10px]">
                {userInitial}
              </div>
              <span className="font-medium text-slate-200">{session.email}</span>
            </div>
          )}

          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-white/10 bg-white/10 hover:bg-rose-500/20 hover:text-white hover:border-rose-400/40 text-slate-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/listings" element={<RequireAuth><Listings /></RequireAuth>} />
          <Route path="/listings/:id" element={<RequireAuth><ListingDetail /></RequireAuth>} />
          <Route path="/rentals" element={<RequireAuth><Rentals /></RequireAuth>} />
          <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
          <Route path="/saved" element={<RequireAuth><Favourites /></RequireAuth>} />
          <Route path="/insights" element={<RequireAuth><Insights /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/listings" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
