import { ROLES, STORAGE_KEYS } from "../constants/appConstants";

const parseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const normalizeRole = (role) => {
  const normalized = String(role ?? "").trim().toUpperCase();
  if (normalized.includes("OFFICER") || normalized.includes("ADMIN")) {
    return ROLES.OFFICER;
  }
  return ROLES.STUDENT;
};

export const createSessionFromUser = (user) => {
  if (!user) {
    return null;
  }

  const role = normalizeRole(user.role);
  const token = user.token || user.accessToken || null;
  const authScheme = user.authScheme || (token ? "Bearer" : null);

  return {
    token,
    authScheme,
    role,
    user,
  };
};

export const getStoredSession = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return parseJSON(window.localStorage.getItem(STORAGE_KEYS.AUTH_SESSION));
};

export const saveSession = (session) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
};

export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
};

export const getAuthToken = () => getStoredSession()?.token ?? null;

export const getAuthHeader = () => {
  const session = getStoredSession();
  const token = session?.token;
  if (!token) {
    return null;
  }

  const scheme = session?.authScheme;
  if (!scheme) {
    return null;
  }
  return `${scheme} ${token}`;
};
