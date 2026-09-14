import { createContext, useContext, useEffect, useState } from "react";
import { getSession, login as apiLogin, logout as apiLogout } from "./api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  // Re-validate on mount / tab focus, in case the token expired while away.
  useEffect(() => {
    const check = () => setSession(getSession());
    window.addEventListener("focus", check);
    const interval = setInterval(check, 30000);
    return () => {
      window.removeEventListener("focus", check);
      clearInterval(interval);
    };
  }, []);

  async function login(email, password) {
    const s = await apiLogin(email, password);
    setSession(s);
    return s;
  }

  async function logout() {
    await apiLogout();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, login, logout, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
