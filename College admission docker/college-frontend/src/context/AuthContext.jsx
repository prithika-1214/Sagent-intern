import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EVENTS, ROLES } from "../constants/appConstants";
import {
  clearSession,
  createSessionFromUser,
  getStoredSession,
  normalizeRole,
  saveSession,
} from "../utils/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => getStoredSession());

  const logout = () => {
    clearSession();
    setSession(null);
  };

  const loginWithUser = (user) => {
    const nextSession = createSessionFromUser(user);
    saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  };

  const updateUser = (userPatch) => {
    setSession((prev) => {
      if (!prev) {
        return prev;
      }
      const next = {
        ...prev,
        role: normalizeRole(userPatch.role ?? prev.role),
        user: {
          ...prev.user,
          ...userPatch,
        },
      };
      saveSession(next);
      return next;
    });
  };

  useEffect(() => {
    const handleForcedLogout = () => logout();
    window.addEventListener(AUTH_EVENTS.FORCE_LOGOUT, handleForcedLogout);
    return () => window.removeEventListener(AUTH_EVENTS.FORCE_LOGOUT, handleForcedLogout);
  }, []);

  const value = useMemo(
    () => ({
      session,
      token: session?.token ?? null,
      user: session?.user ?? null,
      role: normalizeRole(session?.role),
      isAuthenticated: Boolean(session?.user),
      isStudent: normalizeRole(session?.role) === ROLES.STUDENT,
      isOfficer: normalizeRole(session?.role) === ROLES.OFFICER,
      loginWithUser,
      updateUser,
      logout,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
};
