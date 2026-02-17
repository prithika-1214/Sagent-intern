export const STORAGE_KEYS = {
  AUTH_SESSION: "college_admission_session",
  OFFICER_NOTES: "college_officer_review_notes",
};

export const ROLES = {
  STUDENT: "STUDENT",
  OFFICER: "OFFICER",
  ADMIN: "ADMIN",
};

export const APPLICATION_STATUS = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const PAYMENT_METHODS = ["UPI", "Card", "Net Banking", "Cash", "Wallet"];

export const PAYMENT_STATUS = {
  SUCCESS: "Success",
  FAILED: "Failed",
  PENDING: "Pending",
};

export const DOCUMENT_TYPES = ["Marksheet", "ID Proof", "Photo", "Certificate"];

export const DEFAULT_APPLICATION_FEE = 1000;

export const AUTH_EVENTS = {
  FORCE_LOGOUT: "auth:logout",
};
