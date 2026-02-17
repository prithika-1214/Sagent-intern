import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "pms_auth";

const AuthContext = createContext(null);

function readInitialAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { role: null, user: null };
    }

    const parsed = JSON.parse(raw);
    return {
      role: parsed?.role || null,
      user: parsed?.user || null
    };
  } catch {
    return { role: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readInitialAuth);

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  const value = useMemo(
    () => ({
      role: auth.role,
      user: auth.user,
      isAuthenticated: Boolean(auth.role),
      login: (role, user) => setAuth({ role, user }),
      logout: () => setAuth({ role: null, user: null })
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}