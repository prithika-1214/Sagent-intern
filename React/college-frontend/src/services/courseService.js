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

export const courseService = {
  async getCourses() {
    const { data } = await api.get(ENDPOINTS.COURSES.BASE);
    return Array.isArray(data) ? data.map(normalizeCourse) : [];
  },

  async getCourseById(id) {
    const { data } = await api.get(ENDPOINTS.COURSES.BY_ID(id));
    return normalizeCourse(data);
  },
};
