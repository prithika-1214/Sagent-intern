import { createContext, useContext, useMemo, useState } from "react";
import { getLibrarians } from "../api/librariansService";
import { getMembers } from "../api/membersService";

const AuthContext = createContext(null);
const STORAGE_KEY = "library_session";

function getStoredUser() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || !parsed.id || !parsed.role) {
      return null;
    }
    return parsed;
  } catch (_error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const persistUser = (nextUser) => {
    if (!nextUser) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async ({ role, libraryId, email }) => {
    setIsAuthenticating(true);
    try {
      const id = Number(libraryId);
      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Enter a valid Library ID.");
      }

      if (role === "LIBRARIAN") {
        const librarians = await getLibrarians();
        const librarian = librarians.find(
          (item) =>
            item?.id === id &&
            (!normalizedEmail || item?.email?.toLowerCase() === normalizedEmail)
        );

        if (!librarian) {
          throw new Error("Librarian not found for provided credentials.");
        }

        const sessionUser = {
          id: librarian.id,
          name: librarian.name,
          email: librarian.email || "",
          role: "LIBRARIAN",
        };
        persistUser(sessionUser);
        return sessionUser;
      }

      const members = await getMembers();
      const member = members.find(
        (item) =>
          item?.id === id && (!normalizedEmail || item?.email?.toLowerCase() === normalizedEmail)
      );

      if (!member) {
        throw new Error("Member not found for provided credentials.");
      }

      const sessionUser = {
        id: member.id,
        name: member.name,
        email: member.email || "",
        role: "MEMBER",
      };
      persistUser(sessionUser);
      return sessionUser;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => persistUser(null);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticating,
      isAuthenticated: Boolean(user),
    }),
    [user, isAuthenticating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
