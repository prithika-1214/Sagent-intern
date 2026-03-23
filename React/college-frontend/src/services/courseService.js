import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

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

const buildCourseDedupKey = (course, index) => {
  const name = String(course?.courseName ?? "").trim().toLowerCase();
  const type = String(course?.courseType ?? "").trim().toLowerCase();
  const duration = String(course?.duration ?? "").trim().toLowerCase();

  if (!name && !type) {
    const courseId = course?.courseId ?? course?.couId;
    return courseId ? `id:${courseId}` : `idx:${index}`;
  }

  return `${name}|${type}|${duration}`;
};

const dedupeCourses = (courses) => {
  const unique = new Map();

  courses.forEach((course, index) => {
    const key = buildCourseDedupKey(course, index);
    if (!unique.has(key)) {
      unique.set(key, course);
    }
  });

  return Array.from(unique.values());
};

export const courseService = {
  async getCourses() {
    const { data } = await api.get(ENDPOINTS.COURSES.BASE);
    if (!Array.isArray(data)) {
      return [];
    }

    const normalized = data.map(normalizeCourse);
    return dedupeCourses(normalized);
  },

  async getCourseById(id) {
    const { data } = await api.get(ENDPOINTS.COURSES.BY_ID(id));
    return normalizeCourse(data);
  },
};
