import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'activeUser';
const ActiveUserContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  const resolvedId = user.id ?? user.userId ?? user?.user?.id ?? null;

  return {
    ...user,
    id: resolvedId
  };
};

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    return normalizeUser(JSON.parse(stored));
  } catch {
    return null;
  }
};

export const ActiveUserProvider = ({ children }) => {
  const [activeUser, setActiveUserState] = useState(readStoredUser);

  const setActiveUser = useCallback((user) => {
    const normalizedUser = normalizeUser(user);
    setActiveUserState(normalizedUser);

    if (!normalizedUser) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
  }, []);

  const value = useMemo(
    () => ({
      activeUser,
      setActiveUser,
      clearActiveUser: () => setActiveUser(null)
    }),
    [activeUser, setActiveUser]
  );

  return <ActiveUserContext.Provider value={value}>{children}</ActiveUserContext.Provider>;
};

export const useActiveUser = () => {
  const context = useContext(ActiveUserContext);

  if (!context) {
    throw new Error('useActiveUser must be used inside ActiveUserProvider');
  }

  return context;
};
