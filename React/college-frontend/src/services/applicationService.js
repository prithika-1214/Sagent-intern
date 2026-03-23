import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { APPLICATION_STATUS, MAX_APPLICATIONS_PER_STUDENT } from "../constants/appConstants";
import { applicationStatusService } from "./applicationStatusService";

const todayISO = () => new Date().toISOString().slice(0, 10);
const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeStatus = (status) => String(status ?? "").trim().toLowerCase();

const isRejectedStatus = (status) => normalizeStatus(status) === APPLICATION_STATUS.REJECTED.toLowerCase();

const getStudentIdFromApplication = (application) =>
  toPositiveNumber(application?.user?.userId ?? application?.student?.stuId);

const getCourseIdFromApplication = (application) =>
  toPositiveNumber(application?.course?.courseId ?? application?.course?.couId);

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getApplicationBusinessKey = (application) => {
  const studentId = getStudentIdFromApplication(application);
  const courseId = getCourseIdFromApplication(application);

  if (studentId && courseId) {
    return `student:${studentId}|course:${courseId}`;
  }

  const email = normalizeText(application?.user?.email ?? application?.student?.email);
  const courseName = normalizeText(application?.course?.courseName ?? application?.course?.couName);

  if (email && courseName) {
    return `email:${email}|course:${courseName}`;
  }

  return null;
};

const dedupeApplications = (applications) => {
  if (!Array.isArray(applications) || applications.length <= 1) {
    return Array.isArray(applications) ? applications : [];
  }

  const seenByAppId = new Set();
  const seenByBusinessKey = new Set();
  return applications.filter((application) => {
    const appId = application?.appId;
    if (appId !== null && appId !== undefined && appId !== "") {
      const appIdKey = String(appId);
      if (seenByAppId.has(appIdKey)) {
        return false;
      }
      seenByAppId.add(appIdKey);
    }

    const businessKey = getApplicationBusinessKey(application);
    if (!businessKey) {
      return true;
    }

    if (seenByBusinessKey.has(businessKey)) {
      return false;
    }

    seenByBusinessKey.add(businessKey);
    return true;
  });
};

const fetchAllNormalizedApplications = async () => {
  const { data } = await api.get(ENDPOINTS.APPLICATIONS.BASE);
  return normalizeApplicationsArray(data);
};

const normalizeApplicationsArray = (data) => {
  const normalized = Array.isArray(data) ? data.map(normalizeApplication) : [];
  const withAppliedStatus = applicationStatusService.applyToApplications(normalized);
  return dedupeApplications(withAppliedStatus);
};

const assertStudentApplicationRules = async ({
  userId,
  courseId,
  excludeAppId = null,
  enforceMaxApplications = false,
}) => {
  const normalizedUserId = toPositiveNumber(userId);
  const normalizedCourseId = toPositiveNumber(courseId);
  if (!normalizedUserId || !normalizedCourseId) {
    return;
  }

  const applications = await fetchAllNormalizedApplications();
  const studentApplications = applications.filter((app) => getStudentIdFromApplication(app) === normalizedUserId);
  const excludedAppId = toPositiveNumber(excludeAppId);

  if (enforceMaxApplications && studentApplications.length >= MAX_APPLICATIONS_PER_STUDENT) {
    throw new Error(`You can submit a maximum of ${MAX_APPLICATIONS_PER_STUDENT} applications.`);
  }

  const sameCourseApplications = studentApplications.filter((app) => {
    const appCourseId = getCourseIdFromApplication(app);
    const appId = toPositiveNumber(app?.appId);
    if (!appCourseId || appCourseId !== normalizedCourseId) {
      return false;
    }
    if (excludedAppId && appId === excludedAppId) {
      return false;
    }
    return true;
  });

  if (sameCourseApplications.length === 0) {
    return;
  }

  const rejectedConflict = sameCourseApplications.find((app) => isRejectedStatus(app?.status));
  if (rejectedConflict) {
    throw new Error("You cannot apply again for this course because your previous application was rejected.");
  }

  throw new Error("You have already applied for this course. Please choose a different course.");
};

const normalizeCourse = (course) => ({
  courseId: course?.courseId ?? course?.couId ?? null,
  courseName: course?.courseName ?? course?.couName ?? "",
  courseType: course?.courseType ?? course?.dept ?? "",
  duration:
    course?.duration ??
    (course?.durationDays !== undefined && course?.durationDays !== null
      ? `${course.durationDays} days`
      : ""),
  couId: course?.couId ?? course?.courseId ?? null,
  couName: course?.couName ?? course?.courseName ?? "",
  dept: course?.dept ?? course?.courseType ?? "",
  durationDays: course?.durationDays ?? null,
});

const normalizeApplication = (app) => {
  const normalizedUser = app?.user
    ? {
        ...app.user,
        userId: app?.user?.userId ?? app?.user?.stuId ?? app?.student?.stuId ?? null,
        name: app?.user?.name ?? app?.student?.name ?? "",
        email: app?.user?.email ?? app?.student?.email ?? "",
        role: app?.user?.role ?? app?.student?.role ?? "STUDENT",
        dob: app?.user?.dob ?? app?.student?.dob ?? null,
      }
    : {
        userId: app?.student?.stuId ?? null,
        name: app?.student?.name ?? "",
        email: app?.student?.email ?? "",
        role: app?.student?.role ?? "STUDENT",
        dob: app?.student?.dob ?? null,
      };

  return {
    appId: app?.appId ?? null,
    address: app?.address ?? "",
    percentage: app?.percentage ?? null,
    submittedDate: app?.submittedDate ?? app?.subDate ?? null,
    subDate: app?.subDate ?? app?.submittedDate ?? null,
    dob: app?.dob ?? normalizedUser.dob ?? null,
    status: app?.status ?? app?.applicationStatus ?? app?.appStatus?.status ?? "Submitted",
    student: app?.student ?? null,
    user: normalizedUser,
    course: normalizeCourse(app?.course),
  };
};

const buildCreatePayload = (payload) => {
  const stuId = Number(payload?.user?.userId ?? payload?.student?.stuId ?? payload?.userId);
  const couId = Number(payload?.course?.courseId ?? payload?.course?.couId ?? payload?.courseId);

  if (!stuId || !couId) {
    throw new Error("Student ID and Course ID are required.");
  }

  return {
    address: payload.address,
    percentage: Number(payload.percentage),
    subDate: payload.subDate || todayISO(),
    status: payload.status,
    student: { stuId },
    course: { couId },
  };
};

const maybePersistStatusOverride = ({ appId, payload, updatedBy = null }) => {
  if (!payload || typeof payload.status !== "string") {
    return;
  }

  applicationStatusService.setByAppId({
    appId,
    status: payload.status,
    updatedBy,
  });
};

export const applicationService = {
  async createApplication(payload) {
    const body = buildCreatePayload(payload);
    await assertStudentApplicationRules({
      userId: body?.student?.stuId,
      courseId: body?.course?.couId,
      enforceMaxApplications: true,
    });
    const { data } = await api.post(ENDPOINTS.APPLICATIONS.BASE, body);
    const normalized = normalizeApplication(data);

    maybePersistStatusOverride({
      appId: normalized.appId,
      payload,
      updatedBy: payload?.user?.name ?? "student",
    });

    return applicationStatusService.applyToApplication(normalized);
  },

  async getApplications() {
    const { data } = await api.get(ENDPOINTS.APPLICATIONS.BASE);
    return normalizeApplicationsArray(data);
  },

  async getApplicationsPaginated({
    page = 0,
    pageSize = 10,
    search = "",
    status = "ALL",
    courseId = "ALL",
    dateFrom = "",
    dateTo = "",
    excludeDraft = false,
  } = {}) {
    const normalizedPage = Math.max(Number(page) || 0, 0);
    const normalizedPageSize = Math.max(Number(pageSize) || 10, 1);

    const params = {
      page: normalizedPage,
      size: normalizedPageSize,
    };

    const trimmedSearch = String(search ?? "").trim();
    if (trimmedSearch) {
      params.search = trimmedSearch;
    }

    if (status && status !== "ALL") {
      params.status = status;
    }

    const normalizedCourseId = toPositiveNumber(courseId);
    if (normalizedCourseId) {
      params.courseId = normalizedCourseId;
    }

    if (dateFrom) {
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      params.dateTo = dateTo;
    }

    if (excludeDraft) {
      params.excludeDraft = true;
    }

    const { data } = await api.get(ENDPOINTS.APPLICATIONS.BASE, { params });

    // Fallback for older backends that still return full array payload.
    if (Array.isArray(data)) {
      const normalized = normalizeApplicationsArray(data);
      const start = normalizedPage * normalizedPageSize;
      const content = normalized.slice(start, start + normalizedPageSize);
      const totalElements = normalized.length;
      const totalPages =
        normalizedPageSize > 0 ? Math.max(Math.ceil(totalElements / normalizedPageSize), 1) : 1;

      return {
        content,
        page: normalizedPage,
        pageSize: normalizedPageSize,
        totalElements,
        totalPages,
      };
    }

    const content = normalizeApplicationsArray(data?.content);
    const totalElements = Number(data?.totalElements);
    const resolvedTotalElements = Number.isFinite(totalElements) ? totalElements : content.length;
    const totalPages = Number(data?.totalPages);
    const resolvedTotalPages = Number.isFinite(totalPages)
      ? totalPages
      : Math.max(Math.ceil(resolvedTotalElements / normalizedPageSize), 1);
    const responsePage = Number(data?.number);
    const responseSize = Number(data?.size);

    return {
      content,
      page: Number.isFinite(responsePage) ? responsePage : normalizedPage,
      pageSize: Number.isFinite(responseSize) ? responseSize : normalizedPageSize,
      totalElements: resolvedTotalElements,
      totalPages: resolvedTotalPages,
    };
  },

  async getApplicationById(id) {
    const { data } = await api.get(ENDPOINTS.APPLICATIONS.BY_ID(id));
    return applicationStatusService.applyToApplication(normalizeApplication(data));
  },

  async updateApplication(id, payload) {
    const existing = await this.getApplicationById(id);

    const stuId =
      toPositiveNumber(payload?.user?.userId ?? payload?.student?.stuId ?? payload?.userId) ??
      toPositiveNumber(existing?.student?.stuId ?? existing?.user?.userId);
    const couId =
      toPositiveNumber(payload?.course?.courseId ?? payload?.course?.couId ?? payload?.courseId) ??
      toPositiveNumber(existing?.course?.couId ?? existing?.course?.courseId);

    if (!stuId || !couId) {
      throw new Error("Student ID and Course ID are required.");
    }

    const hasCourseInPayload =
      payload?.courseId != null || payload?.course?.courseId != null || payload?.course?.couId != null;

    if (hasCourseInPayload) {
      await assertStudentApplicationRules({
        userId: stuId,
        courseId: couId,
        excludeAppId: id,
      });
    }

    const body = {
      address: payload?.address ?? existing?.address ?? "",
      percentage: Number(payload?.percentage ?? existing?.percentage ?? 0),
      subDate: payload?.subDate ?? existing?.subDate ?? todayISO(),
      status: payload?.status ?? existing?.status ?? APPLICATION_STATUS.SUBMITTED,
      student: { stuId },
      course: { couId },
    };

    const { data } = await api.put(ENDPOINTS.APPLICATIONS.BY_ID(id), body);
    const normalized = normalizeApplication(data);

    maybePersistStatusOverride({
      appId: normalized.appId ?? id,
      payload,
      updatedBy: payload?.updatedBy ?? null,
    });

    return applicationStatusService.applyToApplication(normalized);
  },

  async deleteApplication(id) {
    const { data } = await api.delete(ENDPOINTS.APPLICATIONS.BY_ID(id));
    applicationStatusService.removeByAppId(id);
    return data;
  },
};
