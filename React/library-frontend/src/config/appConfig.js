const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  sessionStorageKey: "library_spa_session_v1",
  defaultBorrowDays: 14,
  dueSoonDays: 3,
  finePerDay: 1,
};

export default appConfig;
