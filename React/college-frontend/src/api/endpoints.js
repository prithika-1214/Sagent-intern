/*
  Endpoints inferred from available backend controllers at:
  - UserController.java
  - ApplicationController.java
  - DesiredCourseController.java
  - DocumentController.java
  - FeesPaymentController.java

  Requested controllers `ReviewRecordController` and `AppStatusController` were not present
  in the inspected backend project. Those features are handled as frontend fallbacks.
*/

export const ENDPOINTS = {
  AUTH: {
    STUDENT_REGISTER: "/auth/student/register",
    STUDENT_LOGIN: "/auth/student/login",
    OFFICER_REGISTER: "/auth/officer/register",
    OFFICER_LOGIN: "/auth/officer/login",
    STUDENTS: "/students",
    STUDENT_BY_ID: (id) => `/students/${id}`,
    OFFICERS: "/officers",
    OFFICER_BY_ID: (id) => `/officers/${id}`,
  },
  APPLICATIONS: {
    BASE: "/applications",
    BY_ID: (id) => `/applications/${id}`,
  },
  COURSES: {
    BASE: "/courses",
    BY_ID: (id) => `/courses/${id}`,
  },
  DOCUMENTS: {
    BASE: "/documents",
    BY_ID: (id) => `/documents/${id}`,
  },
  PAYMENTS: {
    BASE: "/payments",
    BY_ID: (id) => `/payments/${id}`,
  },
};

export const BACKEND_CAPABILITIES = {
  hasReviewRecordController: false,
  hasAppStatusController: false,
  hasMultipartDocumentUpload: false,
};
