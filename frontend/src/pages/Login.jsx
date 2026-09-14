import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo1@ivy.homes");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/listings");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6 py-12 relative overflow-hidden">
      {/* Subtle ambient luxury lighting accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-ochre/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface-card p-8 md:p-10 rounded-3xl border border-line shadow-card relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-light text-teal border border-teal/20 shadow-md mb-4">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
            </svg>
          </div>
          <h2 className="font-serif text-xs uppercase tracking-widest text-teal font-semibold mb-1">Ivy Homes</h2>
          <h1 className="text-3xl font-serif text-ink tracking-tight font-semibold">Welcome Back</h1>
          <p className="text-sm text-muted mt-1.5">Sign in to access verified Bangalore properties</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-2">
              Select Demo Account
            </label>
            <div className="relative">
              <select
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all appearance-none cursor-pointer"
              >
                <option value="demo1@ivy.homes" className="bg-paper text-ink">demo1@ivy.homes (Primary demo)</option>
                <option value="demo2@ivy.homes" className="bg-paper text-ink">demo2@ivy.homes (Secondary demo)</option>
                <option value="demo3@ivy.homes" className="bg-paper text-ink">demo3@ivy.homes (Tertiary demo)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-paper border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal hover:bg-teal-hover text-white py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              "Sign In to Account"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-line text-center">
          <p className="text-xs text-muted">
            Protected by Ivy Homes Secure Auth Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
