import appConfig from "../config/appConfig";

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(appConfig.sessionStorageKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse saved session", error);
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(appConfig.sessionStorageKey, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(appConfig.sessionStorageKey);
}
