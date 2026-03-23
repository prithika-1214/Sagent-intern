import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginUser } from '../api/authApi';
import { getValue } from '../utils/entity';
import { setSelectedUserId } from '../utils/storage';
import { normalizeRole } from '../utils/auth';

const AUTH_STORAGE_KEY = 'seat_booking_auth_user';
const AuthContext = createContext(null);

const normalizeUser = (user) => ({
  id: getValue(user, ['user_id', 'userId', 'id']),
  name: getValue(user, ['user_name', 'userName', 'name'], 'User'),
  email: getValue(user, ['email'], ''),
  mobileNumber: getValue(user, ['mobile_number', 'mobileNumber'], ''),
  role: normalizeRole(getValue(user, ['role'], 'USER')),
  accountStatus: String(getValue(user, ['account_status', 'accountStatus'], 'ACTIVE')).toUpperCase()
});

const readStoredUser = () => {
  try {
    const storedUser = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedUser) {
      return null;
    }

    const parsedUser = JSON.parse(storedUser);
    const normalizedUser = normalizeUser(parsedUser);
    return normalizedUser.id || normalizedUser.email ? normalizedUser : null;
  } catch (error) {
    return null;
  }
};

const storeUser = (user) => {
  try {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    // Ignore storage write errors.
  }
};

const clearStoredUser = () => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    // Ignore storage delete errors.
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());

  useEffect(() => {
    storeUser(currentUser);
    setSelectedUserId(currentUser?.id || '');
  }, [currentUser]);

  const login = useCallback(async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    const response = await loginUser({
      email: normalizedEmail,
      password
    });

    const authUser = normalizeUser(response);
    setCurrentUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    clearStoredUser();
    setSelectedUserId('');
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser?.id || currentUser?.email),
      login,
      logout
    }),
    [currentUser, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
