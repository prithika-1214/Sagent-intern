import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

const todayISO = () => new Date().toISOString().slice(0, 10);

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

const normalizeApplication = (app) => ({
  appId: app?.appId ?? null,
  address: app?.address ?? "",
  percentage: app?.percentage ?? null,
  submittedDate: app?.submittedDate ?? app?.subDate ?? null,
  subDate: app?.subDate ?? app?.submittedDate ?? null,
  status: app?.status ?? "Submitted",
  student: app?.student ?? null,
  user: app?.user ?? {
    userId: app?.student?.stuId ?? null,
    name: app?.student?.name ?? "",
    email: app?.student?.email ?? "",
    role: app?.student?.role ?? "STUDENT",
  },
  course: normalizeCourse(app?.course),
});

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
    student: { stuId },
    course: { couId },
  };
};

export const applicationService = {
  async createApplication(payload) {
    const body = buildCreatePayload(payload);
    const { data } = await api.post(ENDPOINTS.APPLICATIONS.BASE, body);
    return normalizeApplication(data);
  },

  async getApplications() {
    const { data } = await api.get(ENDPOINTS.APPLICATIONS.BASE);
    return Array.isArray(data) ? data.map(normalizeApplication) : [];
  },

  async getApplicationById(id) {
    const { data } = await api.get(ENDPOINTS.APPLICATIONS.BY_ID(id));
    return normalizeApplication(data);
  },

  async updateApplication(id, payload) {
    const existing = await this.getApplicationById(id);

    const stuId = Number(existing?.student?.stuId ?? existing?.user?.userId);
    const couId = Number(existing?.course?.couId ?? existing?.course?.courseId);

    const body = {
      address: payload?.address ?? existing?.address ?? "",
      percentage: Number(payload?.percentage ?? existing?.percentage ?? 0),
      subDate: payload?.subDate ?? existing?.subDate ?? todayISO(),
      student: { stuId },
      course: { couId },
    };

    const { data } = await api.put(ENDPOINTS.APPLICATIONS.BY_ID(id), body);
    return normalizeApplication(data);
  },

  async deleteApplication(id) {
    const { data } = await api.delete(ENDPOINTS.APPLICATIONS.BY_ID(id));
    return data;
  },
};
