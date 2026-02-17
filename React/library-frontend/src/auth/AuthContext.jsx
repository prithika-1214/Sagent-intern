import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { librariansService, membersService } from "../api/services";
import { getDisplayName, getLibraryId, normalizeText, pickFieldValue } from "../utils/entityMappers";
import { clearSession, getStoredSession, saveSession } from "../utils/storage";

const AuthContext = createContext(null);

function buildIdentifierSet(entity) {
  return [
    getLibraryId(entity),
    pickFieldValue(entity, ["id", "memberId", "libraryId", "employeeId"]),
    pickFieldValue(entity, ["email", "memberEmail", "emailAddress", "mail", "user.email"]),
    pickFieldValue(entity, ["username", "userName", "loginId"]),
    pickFieldValue(entity, ["contact", "phone", "mobile"]),
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function findUserByIdentifier(users, identifier) {
  const target = normalizeText(identifier);
  return (Array.isArray(users) ? users : []).find((user) => buildIdentifierSet(user).includes(target));
}

function validatePassword(candidate, password) {
  const storedPassword = pickFieldValue(candidate, ["password", "passcode", "pin"]);

  if (storedPassword === undefined || storedPassword === null || storedPassword === "") {
    return true;
  }

  if (!password) {
    throw new Error("Password is required for this account.");
  }

  if (String(storedPassword) !== String(password)) {
    throw new Error("Invalid credentials.");
  }

  return true;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingSession = getStoredSession();
    if (existingSession?.user && existingSession?.role) {
      setUser(existingSession.user);
      setRole(existingSession.role);
    }
    setIsLoading(false);
  }, []);

  const login = async ({ identifier, password, rolePreference = "AUTO" }) => {
    const normalizedIdentifier = String(identifier || "").trim();
    if (!normalizedIdentifier) {
      throw new Error("Identifier is required.");
    }

    const attemptMemberLogin = async () => {
      const members = await membersService.list();
      const candidate = findUserByIdentifier(members, normalizedIdentifier);
      if (!candidate) {
        return null;
      }
      validatePassword(candidate, password);
      return { role: "MEMBER", user: candidate };
    };

    const attemptLibrarianLogin = async () => {
      const librarians = await librariansService.list();
      const candidate = findUserByIdentifier(librarians, normalizedIdentifier);
      if (!candidate) {
        return null;
      }
      validatePassword(candidate, password);
      return { role: "LIBRARIAN", user: candidate };
    };

    let authResult = null;

    if (rolePreference === "MEMBER") {
      authResult = await attemptMemberLogin();
    } else if (rolePreference === "LIBRARIAN") {
      authResult = await attemptLibrarianLogin();
    } else {
      authResult = (await attemptMemberLogin()) || (await attemptLibrarianLogin());
    }

    if (!authResult) {
      throw new Error("No matching account found.");
    }

    setUser(authResult.user);
    setRole(authResult.role);
    saveSession({
      role: authResult.role,
      user: authResult.user,
      loggedInAt: new Date().toISOString(),
    });

    return authResult;
  };

  const registerMember = async (payload) => {
    const member = await membersService.create(payload);
    return member;
  };

  const registerLibrarian = async (payload) => {
    const librarian = await librariansService.create(payload);
    return librarian;
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setRole(null);
  };

  const value = useMemo(() => {
    const currentUserId = getLibraryId(user);
    return {
      user,
      role,
      isLoading,
      isAuthenticated: Boolean(user && role),
      isMember: role === "MEMBER",
      isLibrarian: role === "LIBRARIAN",
      currentUserId,
      currentUserName: getDisplayName(user),
      login,
      logout,
      registerMember,
      registerLibrarian,
    };
  }, [user, role, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
