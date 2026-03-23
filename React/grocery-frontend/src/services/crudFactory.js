import api from "./axiosClient";
import {
  fallbackCreate,
  fallbackDelete,
  fallbackGetById,
  fallbackList,
  fallbackUpdate,
  shouldUseFallback,
} from "./fallbackStore";

const data = (response) => response.data;
const forceFallback = import.meta.env.VITE_USE_MOCK === "true" || !import.meta.env.VITE_API_BASE_URL;
let backendUnavailable = false;
const listKeys = ["data", "content", "items", "results"];

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return null;

  for (const key of listKeys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  return null;
};

const unwrapObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  if (value.data && typeof value.data === "object" && !Array.isArray(value.data)) {
    return value.data;
  }

  return value;
};

export const createCrudService = (resourceName, endpoint) => ({
  async create(payload) {
    if (forceFallback || backendUnavailable) {
      return fallbackCreate(resourceName, payload);
    }

    try {
      const response = await api.post(endpoint.base, payload);
      return unwrapObject(data(response));
    } catch (error) {
      if (shouldUseFallback(error)) {
        backendUnavailable = true;
        return fallbackCreate(resourceName, payload);
      }
      throw error;
    }
  },

  async getAll() {
    if (forceFallback || backendUnavailable) {
      return fallbackList(resourceName);
    }

    try {
      const response = await api.get(endpoint.base);
      const collection = toArray(data(response));
      return collection ?? fallbackList(resourceName);
    } catch (error) {
      if (shouldUseFallback(error)) {
        backendUnavailable = true;
        return fallbackList(resourceName);
      }
      throw error;
    }
  },

  async getById(id) {
    if (forceFallback || backendUnavailable) {
      return fallbackGetById(resourceName, id);
    }

    try {
      const response = await api.get(endpoint.byId(id));
      return unwrapObject(data(response));
    } catch (error) {
      if (shouldUseFallback(error)) {
        backendUnavailable = true;
        return fallbackGetById(resourceName, id);
      }
      throw error;
    }
  },

  async update(payload) {
    if (forceFallback || backendUnavailable) {
      return fallbackUpdate(resourceName, payload);
    }

    try {
      const response = await api.put(endpoint.base, payload);
      return unwrapObject(data(response));
    } catch (error) {
      if (shouldUseFallback(error)) {
        backendUnavailable = true;
        return fallbackUpdate(resourceName, payload);
      }
      throw error;
    }
  },

  async delete(id) {
    if (forceFallback || backendUnavailable) {
      return fallbackDelete(resourceName, id);
    }

    try {
      const response = await api.delete(endpoint.byId(id));
      return unwrapObject(data(response));
    } catch (error) {
      if (shouldUseFallback(error)) {
        backendUnavailable = true;
        return fallbackDelete(resourceName, id);
      }
      throw error;
    }
  },
});
