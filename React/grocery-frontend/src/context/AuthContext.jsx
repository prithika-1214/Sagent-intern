import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import userService from "../services/userService";
import storeService from "../services/storeService";
import deliveryAgentService from "../services/deliveryAgentService";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ROLES } from "../utils/constants";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (payload) => {
    const { token: authToken, user: loggedInUser } = await userService.login(payload);
    const safeUser = {
      ...loggedInUser,
      role: payload.role || ROLES.CUSTOMER,
    };

    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(safeUser));

    setToken(authToken);
    setUser(safeUser);
    return safeUser;
  }, []);

  const register = useCallback(async (payload) => {
    const role = payload.role || ROLES.CUSTOMER;

    if (role === ROLES.STORE) {
      return storeService.create({
        name: payload.name,
        location: payload.location,
        contact: payload.contact,
      });
    }

    if (role === ROLES.DELIVERY_AGENT) {
      return deliveryAgentService.create({
        name: payload.name,
        phone: payload.contact,
        vehicleNo: payload.vehicleNo,
      });
    }

    const created = await userService.create({
      name: payload.name,
      contact: payload.contact,
      address: payload.address,
      createdAt: new Date().toISOString(),
    });
    return created;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (nextUser) => {
    const updated = await userService.update(nextUser);
    const merged = {
      ...updated,
      role: user?.role || ROLES.CUSTOMER,
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
    setUser(merged);
    return merged;
  }, [user?.role]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, token, loading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
