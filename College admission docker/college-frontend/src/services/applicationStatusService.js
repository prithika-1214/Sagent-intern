import { STORAGE_KEYS } from "../constants/appConstants";

const getAllStatusOverrides = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATION_STATUS_OVERRIDES) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const saveAllStatusOverrides = (overrides) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEYS.APPLICATION_STATUS_OVERRIDES, JSON.stringify(overrides));
};

const normalizeStatus = (status) => {
  if (typeof status !== "string") {
    return "";
  }
  return status.trim();
};

export const applicationStatusService = {
  getByAppId(appId) {
    const key = String(appId ?? "").trim();
    if (!key) {
      return null;
    }

    const all = getAllStatusOverrides();
    return all[key] ?? null;
  },

  setByAppId({ appId, status, updatedBy = null }) {
    const key = String(appId ?? "").trim();
    const normalizedStatus = normalizeStatus(status);
    if (!key || !normalizedStatus) {
      return null;
    }

    const all = getAllStatusOverrides();
    const record = {
      status: normalizedStatus,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    all[key] = record;
    saveAllStatusOverrides(all);
    return record;
  },

  removeByAppId(appId) {
    const key = String(appId ?? "").trim();
    if (!key) {
      return;
    }

    const all = getAllStatusOverrides();
    if (!(key in all)) {
      return;
    }

    delete all[key];
    saveAllStatusOverrides(all);
  },

  applyToApplication(application) {
    if (!application?.appId) {
      return application;
    }

    const override = this.getByAppId(application.appId);
    if (!override?.status) {
      return application;
    }

    return {
      ...application,
      status: override.status,
      statusMeta: override,
    };
  },

  applyToApplications(applications) {
    if (!Array.isArray(applications)) {
      return [];
    }
    return applications.map((item) => this.applyToApplication(item));
  },
};
