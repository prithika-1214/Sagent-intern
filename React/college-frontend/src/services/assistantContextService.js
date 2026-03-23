import { applicationService } from "./applicationService";
import { courseService } from "./courseService";
import { documentService } from "./documentService";
import { paymentService } from "./paymentService";
import { reviewService } from "./reviewService";
import {
  APPLICATION_STATUS,
  DEFAULT_APPLICATION_FEE,
  DOCUMENT_TYPES,
  MAX_APPLICATIONS_PER_STUDENT,
  PAYMENT_METHODS,
} from "../constants/appConstants";

const SNAPSHOT_TTL_MS = 3000;

let cachedPayload = null;
let cacheExpiresAt = 0;
let cachedPayloadScope = "";

const APPLICATION_STEPS = [
  "Fill personal details",
  "Fill academic details",
  "Select a course",
  "Upload at least 1 document",
  "Pay application fee",
  "Submit application",
];

const PORTAL_QUERY_PATTERNS = [
  /\bapplication\b/i,
  /\bapp\b/i,
  /\brecord\b/i,
  /\brecords\b/i,
  /\bdata\b/i,
  /\badmission\b/i,
  /\bcourse\b/i,
  /\bprogram\b/i,
  /\bpayment\b/i,
  /\bfee\b/i,
  /\bdocument\b/i,
  /\busers\b/i,
  /\bstudents\b/i,
  /\bupload\b/i,
  /\bstatus\b/i,
  /\bdraft\b/i,
  /\bofficer\b/i,
  /\bstudent\b/i,
  /\bsubmit\b/i,
  /\bcancel\b/i,
  /\bedit\b/i,
  /\blogin\b/i,
  /\bregister\b/i,
];

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const matchesAny = (value, patterns) => patterns.some((pattern) => pattern.test(value));

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const formatINR = (value) => {
  const amount = toAmount(value);
  return amount === null ? "N/A" : `Rs. ${amount}`;
};

const toTimestamp = (value) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const safeLoad = async (loader, fallbackValue) => {
  try {
    return await loader();
  } catch {
    return fallbackValue;
  }
};

const summarizeApplication = (application) => ({
  appId: Number(application?.appId) || null,
  status: String(application?.status || "Unknown").trim(),
  statusNormalized: normalizeText(application?.status),
  studentName: application?.user?.name || application?.student?.name || "N/A",
  studentEmail: application?.user?.email || application?.student?.email || "N/A",
  courseName: application?.course?.courseName || "N/A",
  courseType: application?.course?.courseType || application?.course?.dept || "N/A",
  percentage: toAmount(application?.percentage),
  address: String(application?.address || "").trim(),
  submittedDate: application?.submittedDate || application?.subDate || null,
});

const countByAppId = (records, appIdSelector) => {
  const counts = {};
  records.forEach((record) => {
    const appId = Number(appIdSelector(record));
    if (!Number.isFinite(appId) || appId <= 0) {
      return;
    }
    const key = String(appId);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

const collectByAppId = (records, appIdSelector) => {
  const grouped = {};
  records.forEach((record) => {
    const appId = Number(appIdSelector(record));
    if (!Number.isFinite(appId) || appId <= 0) {
      return;
    }

    const key = String(appId);
    if (!Array.isArray(grouped[key])) {
      grouped[key] = [];
    }
    grouped[key].push(record);
  });
  return grouped;
};

const summarizeDocument = (document) => ({
  documentId: Number(document?.documentId) || Number(document?.docId) || null,
  appId: Number(document?.application?.appId) || null,
  docType: String(document?.docType || document?.type || "Document").trim() || "Document",
});

const summarizeUser = (userRecord) => ({
  userId: Number(userRecord?.stuId ?? userRecord?.userId) || null,
  name: String(userRecord?.name || "").trim() || "N/A",
  email: String(userRecord?.email || "").trim() || "N/A",
});

const dedupeUsers = (users = []) => {
  const unique = new Map();
  users.forEach((userRecord) => {
    const userId = Number(userRecord?.userId);
    const email = String(userRecord?.email || "").trim().toLowerCase();
    const key = userId > 0 ? `id:${userId}` : email ? `email:${email}` : null;
    if (!key || unique.has(key)) {
      return;
    }
    unique.set(key, userRecord);
  });
  return Array.from(unique.values());
};

const summarizeReviewNote = (note) => ({
  id: Number(note?.id) || null,
  appId: Number(note?.appId) || null,
  officerName: String(note?.officerName || "Officer").trim(),
  note: String(note?.note || "").trim(),
  createdAt: note?.createdAt || null,
});

const summarizePayment = (payment) => ({
  paymentId: Number(payment?.paymentId) || Number(payment?.payId) || null,
  appId: Number(payment?.application?.appId) || null,
  amount: toAmount(payment?.amount ?? payment?.fee),
  status: String(payment?.status || "Unknown").trim(),
  payMethod: payment?.payMethod || "N/A",
  transactionDate: payment?.transactionDate || payment?.payDate || null,
});

const summarizePaymentsByApp = (payments) => {
  const map = {};

  payments.forEach((payment) => {
    const appId = Number(payment?.appId);
    if (!Number.isFinite(appId) || appId <= 0) {
      return;
    }

    const key = String(appId);
    const existing = map[key] || {
      count: 0,
      totalAmount: 0,
      latestAmount: null,
      latestStatus: null,
      latestMethod: null,
      latestDate: null,
      latestDateTs: 0,
    };

    const amount = toAmount(payment?.amount) || 0;
    existing.count += 1;
    existing.totalAmount += amount;

    const currentTs = toTimestamp(payment?.transactionDate);
    if (!existing.latestDateTs || currentTs >= existing.latestDateTs) {
      existing.latestDateTs = currentTs;
      existing.latestAmount = toAmount(payment?.amount);
      existing.latestStatus = payment?.status || "Unknown";
      existing.latestMethod = payment?.payMethod || "N/A";
      existing.latestDate = payment?.transactionDate || null;
    }

    map[key] = existing;
  });

  Object.keys(map).forEach((key) => {
    delete map[key].latestDateTs;
  });

  return map;
};

const getBackendPayload = async ({ role }) => {
  const normalizedRole = String(role || "STUDENT").toUpperCase();
  const scopeKey = normalizedRole === "OFFICER" ? "OFFICER" : "STUDENT";

  if (cachedPayload && Date.now() < cacheExpiresAt && cachedPayloadScope === scopeKey) {
    return cachedPayload;
  }

  const [applications, courses, documents, payments, reviewNotes] = await Promise.all([
    safeLoad(() => applicationService.getApplications(), []),
    safeLoad(() => courseService.getCourses(), []),
    safeLoad(() => documentService.getDocuments(), []),
    safeLoad(() => paymentService.getPayments(), []),
    safeLoad(() => reviewService.getAllNotes(), []),
  ]);

  cachedPayload = {
    applications: Array.isArray(applications) ? applications : [],
    courses: Array.isArray(courses) ? courses : [],
    documents: Array.isArray(documents) ? documents : [],
    payments: Array.isArray(payments) ? payments : [],
    reviewNotes: Array.isArray(reviewNotes) ? reviewNotes : [],
  };
  cachedPayloadScope = scopeKey;

  cacheExpiresAt = Date.now() + SNAPSHOT_TTL_MS;
  return cachedPayload;
};

const buildSnapshot = ({ applications, courses, documents, payments, reviewNotes, user, role }) => {
  const normalizedRole = String(role || "STUDENT").toUpperCase();
  const userId = Number(user?.userId);
  const hasUserId = Number.isFinite(userId) && userId > 0;

  const currentUser = summarizeUser({
    userId: hasUserId ? userId : null,
    name: user?.name,
    email: user?.email,
  });

  const scopedApplications =
    normalizedRole === "OFFICER"
      ? applications
      : hasUserId
        ? applications.filter((app) => Number(app?.user?.userId) === userId)
        : [];

  const mapApplicationToUser = (application) =>
    summarizeUser({
      userId: application?.user?.userId ?? application?.student?.stuId,
      name: application?.user?.name ?? application?.student?.name,
      email: application?.user?.email ?? application?.student?.email,
    });

  const normalizedUsers = dedupeUsers(
    applications
      .map((application) => mapApplicationToUser(application))
      .filter((userRecord) => userRecord.userId || userRecord.email !== "N/A"),
  );
  const scopedUsers =
    normalizedRole === "OFFICER"
      ? dedupeUsers(
          scopedApplications
            .map((application) => mapApplicationToUser(application))
            .filter((userRecord) => userRecord.userId || userRecord.email !== "N/A"),
        )
      : currentUser?.email !== "N/A"
        ? [currentUser]
        : [];

  const sortedApplications = scopedApplications
    .slice()
    .sort((a, b) => toTimestamp(b?.submittedDate || b?.subDate) - toTimestamp(a?.submittedDate || a?.subDate));

  const allApplications = sortedApplications.map((app) => summarizeApplication(app));
  const appIds = new Set(
    allApplications
      .map((application) => Number(application?.appId))
      .filter((appId) => Number.isFinite(appId) && appId > 0),
  );

  const scopedDocuments =
    normalizedRole === "OFFICER"
      ? documents
      : documents.filter((item) => appIds.has(Number(item?.application?.appId)));
  const summarizedDocuments = scopedDocuments.map((item) => summarizeDocument(item));

  const scopedPayments =
    normalizedRole === "OFFICER"
      ? payments
      : payments.filter((item) => appIds.has(Number(item?.application?.appId)));
  const sortedPayments = scopedPayments
    .slice()
    .sort((a, b) => toTimestamp(b?.transactionDate || b?.payDate) - toTimestamp(a?.transactionDate || a?.payDate));
  const summarizedPayments = sortedPayments.map((payment) => summarizePayment(payment));

  const normalizedReviewNotes = Array.isArray(reviewNotes) ? reviewNotes.map((item) => summarizeReviewNote(item)) : [];
  const scopedReviewNotes =
    normalizedRole === "OFFICER"
      ? normalizedReviewNotes
      : normalizedReviewNotes.filter((note) => appIds.has(Number(note?.appId)));
  const sortedReviewNotes = scopedReviewNotes
    .slice()
    .sort((a, b) => toTimestamp(b?.createdAt) - toTimestamp(a?.createdAt));

  const applicationById = {};
  allApplications.forEach((summary) => {
    if (summary.appId) {
      applicationById[String(summary.appId)] = summary;
    }
  });

  const briefApplications = allApplications.slice(0, 12);
  const latestApplication = briefApplications[0] || null;
  const latestDraft = briefApplications.find((application) => application.statusNormalized === "draft") || null;

  const draftCount = allApplications.filter((app) => normalizeText(app?.status) === "draft").length;
  const submittedCount = allApplications.filter((app) => normalizeText(app?.status) === "submitted").length;
  const underReviewCount = allApplications.filter((app) => normalizeText(app?.status) === "under review").length;
  const acceptedCount = allApplications.filter((app) => normalizeText(app?.status) === "accepted").length;
  const rejectedCount = allApplications.filter((app) => normalizeText(app?.status) === "rejected").length;

  const availableCourses = courses.slice(0, 30).map((course) => ({
    courseId: Number(course?.courseId) || Number(course?.couId) || null,
    courseName: String(course?.courseName || course?.couName || "N/A").trim(),
    courseType: String(course?.courseType || course?.dept || "N/A").trim(),
  }));

  const paymentBrief = summarizedPayments.slice(0, 10);
  const latestPayment = paymentBrief[0] || null;

  const documentsByApp = collectByAppId(summarizedDocuments, (item) => item?.appId);
  const paymentsByApp = collectByAppId(summarizedPayments, (item) => item?.appId);
  const reviewNotesByApp = collectByAppId(sortedReviewNotes, (item) => item?.appId);
  const documentCountByApp = countByAppId(summarizedDocuments, (item) => item?.appId);
  const paymentCountByApp = countByAppId(summarizedPayments, (item) => item?.appId);
  const paymentSummaryByApp = summarizePaymentsByApp(summarizedPayments);

  return {
    role: normalizedRole,
    userId: hasUserId ? userId : null,
    totals: {
      applications: applications.length,
      courses: courses.length,
      documents: documents.length,
      payments: payments.length,
      users: normalizedUsers.length,
      reviewNotes: normalizedReviewNotes.length,
    },
    mine: {
      applications: allApplications.length,
      drafts: draftCount,
      submitted: submittedCount,
      underReview: underReviewCount,
      accepted: acceptedCount,
      rejected: rejectedCount,
      documents: summarizedDocuments.length,
      payments: summarizedPayments.length,
      reviewNotes: sortedReviewNotes.length,
      users: scopedUsers.length,
    },
    latestApplication,
    latestDraft,
    applicationsBrief: briefApplications,
    applicationsDetailed: allApplications,
    applicationById,
    availableCourses,
    usersBrief: scopedUsers.slice(0, 40),
    usersDetailed: scopedUsers,
    documentsBrief: summarizedDocuments.slice(0, 40),
    documentsByApp,
    paymentCountByApp,
    paymentsByApp,
    paymentSummaryByApp,
    paymentBrief,
    latestPayment,
    reviewNotesByApp,
    reviewNotesBrief: sortedReviewNotes.slice(0, 40),
    documentCountByApp,
    rules: {
      applicationLimitPerStudent: MAX_APPLICATIONS_PER_STUDENT,
      minDocumentsBeforeSubmit: 1,
      minPaymentsBeforeSubmit: 1,
      editAllowedOnlyForDraft: true,
      defaultApplicationFee: toAmount(DEFAULT_APPLICATION_FEE),
      supportedDocumentTypes: DOCUMENT_TYPES,
      supportedPaymentMethods: PAYMENT_METHODS,
      statusValues: Object.values(APPLICATION_STATUS),
      knownEndpoints: ["/applications", "/courses", "/documents", "/payments", "/students"],
    },
  };
};

const toJson = (value) => JSON.stringify(value ?? null);

const extractRequestedAppId = (question) => {
  const text = String(question || "");
  const parseId = (value) => {
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : null;
  };

  const direct = text.match(/\b(?:application|app)\s*(?:id|#)\s*(\d+)\b/i);
  if (direct?.[1]) {
    return parseId(direct[1]);
  }

  const inline = text.match(/\b(?:application|app)\s*(\d+)\b/i);
  if (inline?.[1]) {
    return parseId(inline[1]);
  }

  if (/\b(?:application|app)\b/i.test(text)) {
    const loose = text.match(/\b(?:id|#)\s*(\d+)\b/i);
    if (loose?.[1]) {
      return parseId(loose[1]);
    }
  }

  return null;
};

const formatContextText = (snapshot) => {
  const lines = [
    `role=${snapshot.role}`,
    snapshot.userId ? `user_id=${snapshot.userId}` : "user_id=unknown",
    `my_applications=${snapshot.mine.applications}`,
    `my_draft_applications=${snapshot.mine.drafts}`,
    `my_submitted_applications=${snapshot.mine.submitted}`,
    `my_under_review_applications=${snapshot.mine.underReview}`,
    `my_accepted_applications=${snapshot.mine.accepted}`,
    `my_rejected_applications=${snapshot.mine.rejected}`,
    `my_documents=${snapshot.mine.documents}`,
    `my_payments=${snapshot.mine.payments}`,
    `my_review_notes=${snapshot.mine.reviewNotes}`,
    `my_users=${snapshot.mine.users}`,
    `total_courses=${snapshot.totals.courses}`,
    `total_users=${snapshot.totals.users}`,
    `total_review_notes=${snapshot.totals.reviewNotes}`,
    `application_limit_per_student=${
      snapshot.rules.applicationLimitPerStudent === null ? "not_defined_in_backend" : snapshot.rules.applicationLimitPerStudent
    }`,
    `latest_application=${toJson(snapshot.latestApplication)}`,
    `latest_draft_application=${toJson(snapshot.latestDraft)}`,
    `applications_brief=${toJson(snapshot.applicationsBrief)}`,
    `users_brief=${toJson(snapshot.usersBrief)}`,
    `documents_brief=${toJson(snapshot.documentsBrief)}`,
    `payments_brief=${toJson(snapshot.paymentBrief)}`,
    `review_notes_brief=${toJson(snapshot.reviewNotesBrief)}`,
    `available_courses=${toJson(snapshot.availableCourses)}`,
    `document_count_by_app=${toJson(snapshot.documentCountByApp)}`,
    `documents_by_app=${toJson(snapshot.documentsByApp)}`,
    `payment_count_by_app=${toJson(snapshot.paymentCountByApp)}`,
    `payments_by_app=${toJson(snapshot.paymentsByApp)}`,
    `payment_summary_by_app=${toJson(snapshot.paymentSummaryByApp)}`,
    `review_notes_by_app=${toJson(snapshot.reviewNotesByApp)}`,
    `latest_payment=${toJson(snapshot.latestPayment)}`,
    `default_application_fee=${toJson(snapshot.rules.defaultApplicationFee)}`,
    `supported_document_types=${toJson(snapshot.rules.supportedDocumentTypes)}`,
    `supported_payment_methods=${toJson(snapshot.rules.supportedPaymentMethods)}`,
    `application_status_values=${toJson(snapshot.rules.statusValues)}`,
    `application_steps=${toJson(APPLICATION_STEPS)}`,
  ];

  return lines.join("\n");
};

const getReferencedApplication = ({ question, snapshot }) => {
  const requestedAppId = extractRequestedAppId(question);
  if (requestedAppId) {
    return snapshot.applicationById?.[String(requestedAppId)] || null;
  }

  const normalized = normalizeText(question);
  if (
    matchesAny(normalized, [
      /\blatest application\b/i,
      /\bcurrent application\b/i,
      /\bmy application\b/i,
      /\bthis application\b/i,
    ])
  ) {
    return snapshot.latestApplication;
  }

  return null;
};

const getAppValidationSummary = (snapshot, application) => {
  if (!application?.appId) {
    return "No application found.";
  }

  const appIdKey = String(application.appId);
  const documentCount = Number(snapshot.documentCountByApp?.[appIdKey] || 0);
  const paymentCount = Number(snapshot.paymentCountByApp?.[appIdKey] || 0);

  if (
    documentCount >= snapshot.rules.minDocumentsBeforeSubmit &&
    paymentCount >= snapshot.rules.minPaymentsBeforeSubmit
  ) {
    return `Application #${application.appId} is ready to submit.`;
  }

  const missingItems = [];
  if (documentCount < snapshot.rules.minDocumentsBeforeSubmit) {
    missingItems.push("at least 1 document");
  }
  if (paymentCount < snapshot.rules.minPaymentsBeforeSubmit) {
    missingItems.push("at least 1 payment");
  }

  return `Application #${application.appId} is not ready. Missing ${missingItems.join(" and ")}.`;
};

const getPaymentInfoForApp = (snapshot, appId) => {
  if (!appId) {
    return null;
  }
  return snapshot.paymentSummaryByApp?.[String(appId)] || null;
};

const getCourseFromQuestion = (question, snapshot) => {
  const q = normalizeText(question);
  const sanitized = q
    .replace(/\?/g, " ")
    .replace(/\b(is|are|do|does|have|has|available|course|program|in|for|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized || sanitized.length < 3) {
    return null;
  }

  return (
    snapshot.availableCourses.find((course) => normalizeText(course.courseName).includes(sanitized)) ||
    snapshot.availableCourses.find((course) => normalizeText(`${course.courseName} ${course.courseType}`).includes(sanitized)) ||
    null
  );
};

const formatDateValue = (value) => {
  if (!value) {
    return "N/A";
  }

  const text = String(value).trim();
  if (!text) {
    return "N/A";
  }

  return text.replace("T", " ").replace("Z", "");
};

const buildApplicationDetailsAnswer = ({ snapshot, application }) => {
  if (!application?.appId) {
    return "No application found.";
  }

  const appIdKey = String(application.appId);
  const documents = snapshot.documentsByApp?.[appIdKey] || [];
  const payments = snapshot.paymentsByApp?.[appIdKey] || [];
  const reviewNotes = snapshot.reviewNotesByApp?.[appIdKey] || [];

  const documentPreview = documents
    .slice(0, 8)
    .map((document) => `${document.docType}${document.documentId ? ` (#${document.documentId})` : ""}`)
    .join(", ");

  const paymentPreview = payments
    .slice(0, 5)
    .map(
      (payment) =>
        `${formatINR(payment.amount)} ${payment.status || "Unknown"} via ${payment.payMethod || "N/A"} (${formatDateValue(payment.transactionDate)})`,
    )
    .join("; ");

  const notePreview = reviewNotes
    .slice(0, 4)
    .map((note) => `${note.officerName}: ${note.note}`)
    .filter(Boolean)
    .join(" | ");

  const lines = [
    `Application #${application.appId}`,
    `Status: ${application.status}`,
    `Course: ${application.courseName} (${application.courseType || "N/A"})`,
    `Submitted: ${formatDateValue(application.submittedDate)}`,
    `Percentage: ${application.percentage ?? "N/A"}%`,
    `Address: ${application.address || "N/A"}`,
  ];

  if (snapshot.role === "OFFICER") {
    lines.push(`Student: ${application.studentName} (${application.studentEmail})`);
  }

  lines.push(`Documents (${documents.length}): ${documentPreview || "None"}`);
  lines.push(`Payments (${payments.length}): ${paymentPreview || "None"}`);
  lines.push(`Review notes (${reviewNotes.length}): ${notePreview || "None"}`);

  return lines.join("\n");
};

const buildApplicationsListAnswer = (snapshot) => {
  const applications = snapshot.applicationsDetailed || [];
  if (!applications.length) {
    return "No application records found.";
  }

  const limit = 25;
  const lines = [`Applications (${applications.length}):`];
  applications.slice(0, limit).forEach((application) => {
    const base = `#${application.appId} | ${application.status} | ${application.courseName} | ${formatDateValue(application.submittedDate)}`;
    if (snapshot.role === "OFFICER") {
      lines.push(`${base} | ${application.studentName}`);
      return;
    }
    lines.push(base);
  });

  if (applications.length > limit) {
    lines.push(`Showing first ${limit}. Ask with app ID for exact details.`);
  }

  return lines.join("\n");
};

const buildAppliedCoursesAnswer = ({ snapshot, referencedApplication, requestedAppId }) => {
  if (requestedAppId && !referencedApplication?.appId) {
    return `Application #${requestedAppId} was not found in your backend data.`;
  }

  if (referencedApplication?.appId) {
    return `Application #${referencedApplication.appId} is for ${referencedApplication.courseName} (${referencedApplication.courseType || "N/A"}) with status ${referencedApplication.status}.`;
  }

  const applications = snapshot.applicationsDetailed || [];
  if (!applications.length) {
    return "You do not have any applications yet.";
  }

  const uniqueCourses = [];
  const seen = new Set();
  applications.forEach((application) => {
    const key = `${normalizeText(application.courseName)}|${normalizeText(application.courseType)}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    uniqueCourses.push(application);
  });

  if (uniqueCourses.length === 1) {
    const onlyCourse = uniqueCourses[0];
    return `You have applied for ${onlyCourse.courseName} (${onlyCourse.courseType || "N/A"}) in application #${onlyCourse.appId}.`;
  }

  const preview = uniqueCourses
    .slice(0, 8)
    .map((application) => `${application.courseName} (#${application.appId})`)
    .join(", ");
  const suffix = uniqueCourses.length > 8 ? ", ..." : "";
  return `You have applied for ${uniqueCourses.length} courses: ${preview}${suffix}.`;
};

const buildDocumentsListAnswer = ({ snapshot, requestedAppId }) => {
  const documentsByApp = snapshot.documentsByApp || {};
  const appKeys = Object.keys(documentsByApp);
  if (!appKeys.length) {
    return "No document records found.";
  }

  if (requestedAppId) {
    const documents = documentsByApp[String(requestedAppId)] || [];
    if (!documents.length) {
      return `No document records found for application #${requestedAppId}.`;
    }
    const lines = [`Documents for application #${requestedAppId} (${documents.length}):`];
    documents.slice(0, 25).forEach((document) => {
      lines.push(`${document.docType} | ID #${document.documentId || "N/A"}`);
    });
    if (documents.length > 25) {
      lines.push("Showing first 25 documents.");
    }
    return lines.join("\n");
  }

  const lines = [`Document records (${snapshot.mine.documents}):`];
  appKeys
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 20)
    .forEach((appId) => {
      const documents = documentsByApp[appId] || [];
      const types = [...new Set(documents.map((document) => document.docType).filter(Boolean))]
        .slice(0, 4)
        .join(", ");
      lines.push(`App #${appId}: ${documents.length} document(s)${types ? ` [${types}]` : ""}`);
    });

  if (appKeys.length > 20) {
    lines.push("Showing first 20 applications with documents.");
  }

  return lines.join("\n");
};

const buildPaymentsListAnswer = ({ snapshot, requestedAppId }) => {
  const paymentsByApp = snapshot.paymentsByApp || {};
  const appKeys = Object.keys(paymentsByApp);
  if (!appKeys.length) {
    return "No payment records found.";
  }

  if (requestedAppId) {
    const payments = paymentsByApp[String(requestedAppId)] || [];
    if (!payments.length) {
      return `No payment records found for application #${requestedAppId}.`;
    }

    const lines = [`Payments for application #${requestedAppId} (${payments.length}):`];
    payments.slice(0, 20).forEach((payment) => {
      lines.push(
        `${formatINR(payment.amount)} | ${payment.status || "Unknown"} | ${payment.payMethod || "N/A"} | ${formatDateValue(payment.transactionDate)}`,
      );
    });
    if (payments.length > 20) {
      lines.push("Showing first 20 payments.");
    }
    return lines.join("\n");
  }

  const paymentSummaryByApp = snapshot.paymentSummaryByApp || {};
  const lines = [`Payment records (${snapshot.mine.payments}):`];
  Object.keys(paymentSummaryByApp)
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 20)
    .forEach((appId) => {
      const summary = paymentSummaryByApp[appId];
      lines.push(
        `App #${appId}: ${summary.count} payment(s), total ${formatINR(summary.totalAmount)}, latest ${summary.latestStatus || "Unknown"}`,
      );
    });

  if (Object.keys(paymentSummaryByApp).length > 20) {
    lines.push("Showing first 20 applications with payments.");
  }

  return lines.join("\n");
};

const buildUsersListAnswer = (snapshot) => {
  if (snapshot.role !== "OFFICER") {
    const profile = snapshot.usersBrief?.[0];
    if (!profile) {
      return "User profile data is not available.";
    }
    return `Your profile: ${profile.name} (${profile.email}) | user ID ${profile.userId || "N/A"}.`;
  }

  const users = snapshot.usersDetailed || [];
  if (!users.length) {
    return "No user records found.";
  }

  const limit = 25;
  const lines = [`Student records (${users.length}):`];
  users.slice(0, limit).forEach((user) => {
    lines.push(`#${user.userId || "N/A"} | ${user.name} | ${user.email}`);
  });
  if (users.length > limit) {
    lines.push(`Showing first ${limit} users.`);
  }

  return lines.join("\n");
};

const buildAllRecordsAnswer = (snapshot) => {
  const applications = snapshot.applicationsDetailed || [];
  const preview = applications
    .slice(0, 8)
    .map((application) => `#${application.appId} ${application.status} (${application.courseName})`)
    .join("; ");
  const previewSuffix = applications.length > 8 ? "; ..." : "";

  const lines = [
    snapshot.role === "OFFICER" ? "Portal records summary:" : "Your records summary:",
    `Applications: ${snapshot.mine.applications}`,
    `Documents: ${snapshot.mine.documents}`,
    `Payments: ${snapshot.mine.payments}`,
    `Review notes: ${snapshot.mine.reviewNotes}`,
  ];

  if (snapshot.role === "OFFICER") {
    lines.push(`Users: ${snapshot.mine.users}`);
  }

  if (snapshot.latestApplication?.appId) {
    lines.push(`Latest application: #${snapshot.latestApplication.appId} (${snapshot.latestApplication.status})`);
  }

  if (preview) {
    lines.push(`Recent applications: ${preview}${previewSuffix}`);
  } else {
    lines.push("No applications found.");
  }

  return lines.join("\n");
};

export const isPortalQuery = (question) => matchesAny(normalizeText(question), PORTAL_QUERY_PATTERNS);

const buildPortalFallbackAnswer = (snapshot, question = "") => {
  const q = normalizeText(question);
  const applications = snapshot.applicationsDetailed || [];
  const latestApplication = snapshot.latestApplication;
  const latestPayment = snapshot.latestPayment;

  if (matchesAny(q, [/\bflow\b/i, /\bprocess\b/i, /\bsteps?\b/i, /\bfrontend\b/i, /\bui\b/i, /\bhow to use\b/i])) {
    const base = `Student flow: Register -> Login -> New Application -> Fill details -> Upload document -> Pay fee -> Submit. Officer flow: Login -> Review applications -> Update status -> Add notes.`;
    if (snapshot.role === "OFFICER") {
      return `${base} You can also filter by status/course/date in Officer Dashboard.`;
    }
    return base;
  }

  if (matchesAny(q, [/\bbackend\b/i, /\bapi\b/i, /\bendpoints?\b/i])) {
    return `Backend endpoints used in this portal: ${snapshot.rules.knownEndpoints.join(", ")}.`;
  }

  if (matchesAny(q, [/\bcourse\b/i])) {
    if (!applications.length) {
      return "You do not have any applications yet, so no course has been applied yet.";
    }
    const uniqueCourses = [...new Set(applications.map((app) => app.courseName).filter(Boolean))];
    const firstFew = uniqueCourses.slice(0, 8).join(", ");
    const suffix = uniqueCourses.length > 8 ? ", ..." : "";
    return `Applied courses (${uniqueCourses.length}): ${firstFew}${suffix}. Latest application is #${latestApplication?.appId} (${latestApplication?.courseName || "N/A"}).`;
  }

  if (matchesAny(q, [/\bpayment\b/i, /\bfee\b/i])) {
    if (!latestPayment?.paymentId) {
      return "No payment record found yet.";
    }
    return `Latest payment: ${formatINR(latestPayment.amount)} via ${latestPayment.payMethod} (${latestPayment.status}).`;
  }

  if (matchesAny(q, [/\bdocument\b/i, /\bupload\b/i])) {
    return `You have ${snapshot.mine.documents} document record${snapshot.mine.documents === 1 ? "" : "s"} in backend data.`;
  }

  if (matchesAny(q, [/\bstatus\b/i])) {
    if (!latestApplication?.appId) {
      return "You do not have any applications yet.";
    }
    return `Latest application #${latestApplication.appId} is ${latestApplication.status}.`;
  }

  if (latestApplication?.appId) {
    return `Latest application is #${latestApplication.appId} (${latestApplication.status}) for ${latestApplication.courseName}. You have ${snapshot.mine.applications} application${snapshot.mine.applications === 1 ? "" : "s"} in total.`;
  }

  return "I can answer portal queries for applications, documents, payments, users, courses, process flow, and backend endpoints. Try asking with app ID for exact details.";
};

export const tryAnswerFromSnapshot = ({ question, snapshot }) => {
  const q = normalizeText(question);
  const mine = snapshot?.mine;

  if (!snapshot || !mine) {
    return null;
  }

  const requestedAppId = extractRequestedAppId(question);
  const referencedApplication = getReferencedApplication({ question, snapshot });
  const referencedPayment = referencedApplication?.appId
    ? getPaymentInfoForApp(snapshot, referencedApplication.appId)
    : null;

  if (
    matchesAny(q, [
      /\bapplication details?\b/i,
      /\bapp details?\b/i,
      /\bdetails?\b.*\bapplication\b/i,
      /\bdetails?\b.*\bapp\b/i,
      /\bapplication\b.*\bdetails?\b/i,
      /\bapp\b.*\bdetails?\b/i,
      /\bapplication (info|information|summary)\b/i,
      /\bapp (info|information|summary)\b/i,
    ])
  ) {
    if (requestedAppId && !referencedApplication?.appId) {
      return `Application #${requestedAppId} was not found in your backend data.`;
    }

    const targetApplication = referencedApplication || snapshot.latestApplication;
    if (!targetApplication?.appId) {
      return "You do not have any applications yet.";
    }

    return buildApplicationDetailsAnswer({
      snapshot,
      application: targetApplication,
    });
  }

  if (
    matchesAny(q, [
      /\b(show|list|display|fetch|get)\b.*\b(all|my)\b.*\b(records|record|data)\b/i,
      /\b(all|full|complete)\b.*\b(my|portal)\b.*\b(records|record|data)\b/i,
      /\bmy\b.*\b(records|record|data)\b/i,
    ])
  ) {
    return buildAllRecordsAnswer(snapshot);
  }

  if (
    matchesAny(q, [
      /\b(list|show|display|fetch|get)\b.*\b(my|all)?\s*\b(applications|apps)\b/i,
      /\ball\b.*\b(applications|apps)\b/i,
    ])
  ) {
    return buildApplicationsListAnswer(snapshot);
  }

  if (
    matchesAny(q, [
      /\b(list|show|display|fetch|get)\b.*\b(my|all)?\s*\b(documents|docs)\b/i,
      /\ball\b.*\b(documents|docs)\b/i,
    ])
  ) {
    return buildDocumentsListAnswer({
      snapshot,
      requestedAppId,
    });
  }

  if (
    matchesAny(q, [
      /\b(list|show|display|fetch|get)\b.*\b(my|all)?\s*\b(payments|payment records|fees|fee records)\b/i,
      /\ball\b.*\b(payments|payment records|fees|fee records)\b/i,
    ])
  ) {
    return buildPaymentsListAnswer({
      snapshot,
      requestedAppId,
    });
  }

  if (matchesAny(q, [/\b(list|show|display|fetch|get)\b.*\b(users|students|profiles)\b/i, /\ball users\b/i])) {
    return buildUsersListAnswer(snapshot);
  }

  if (
    matchesAny(q, [
      /how many.*application.*(can i|allowed|limit|max)/i,
      /application.*(limit|max|maximum)/i,
      /how many applications can/i,
      /how many.*applications?.*can.*(apply|submit)/i,
      /single student.*how many.*applications?/i,
      /applications?.*per student/i,
    ])
  ) {
    const limit = snapshot?.rules?.applicationLimitPerStudent ?? MAX_APPLICATIONS_PER_STUDENT;
    return `Application rules: maximum ${limit} per student, no duplicate course applications, and no re-application for a rejected course. You currently have ${mine.applications} application${mine.applications === 1 ? "" : "s"}.`;
  }

  if (
    matchesAny(q, [
      /\bwhat\b.*\bcourse\b.*\b(applied|apply|application|app|filled|fill|selected)\b/i,
      /\bwhich\b.*\bcourse\b.*\b(applied|apply|application|app|filled|fill|selected)\b/i,
      /\bcourse\b.*\b(app id|application id|application|app)\b/i,
      /\bapp(?:lication)?\s*(?:id|#)?\s*\d+\b.*\bcourse\b/i,
      /\bmy\b.*\bcourse\b.*\bappl/i,
    ])
  ) {
    return buildAppliedCoursesAnswer({
      snapshot,
      referencedApplication,
      requestedAppId,
    });
  }

  if (
    matchesAny(q, [
      /\bpayment fee\b/i,
      /\bpayment fees\b/i,
      /\bfee amount\b/i,
      /\bapplication fee\b/i,
      /how much.*fee/i,
      /what.*payment fee/i,
      /what.*fee amount/i,
    ])
  ) {
    const configuredFee = snapshot.rules.defaultApplicationFee;

    if (referencedApplication?.appId && referencedPayment?.latestAmount != null) {
      return `Payment fee for application #${referencedApplication.appId} is ${formatINR(referencedPayment.latestAmount)}.`;
    }

    if (snapshot.latestPayment?.amount != null) {
      if (configuredFee !== null && configuredFee !== snapshot.latestPayment.amount) {
        return `Configured application fee is ${formatINR(configuredFee)}. Latest paid fee is ${formatINR(snapshot.latestPayment.amount)}.`;
      }
      return `Application fee is ${formatINR(snapshot.latestPayment.amount)}.`;
    }

    if (configuredFee !== null) {
      return `Configured application fee is ${formatINR(configuredFee)}.`;
    }

    return "Payment fee is not configured in backend data.";
  }

  if (
    matchesAny(q, [
      /\ba payment has been\b/i,
      /\bpayment has been\b/i,
      /\bpayment done\b/i,
      /\bpayment completed\b/i,
      /\bhas payment been done\b/i,
      /\bpayment status\b/i,
    ])
  ) {
    if (!snapshot.latestPayment?.paymentId) {
      return "No payment record found yet.";
    }

    const status = snapshot.latestPayment.status || "Unknown";
    return `Latest payment is ${status} for ${formatINR(snapshot.latestPayment.amount)} via ${snapshot.latestPayment.payMethod}.`;
  }

  if (matchesAny(q, [/\bpayment method\b/i, /\bhow can i pay\b/i, /\bmode of payment\b/i])) {
    return `Supported payment methods: ${snapshot.rules.supportedPaymentMethods.join(", ")}.`;
  }

  if (
    matchesAny(q, [
      /\bwhat.*document\b/i,
      /\bdocument types\b/i,
      /\brequired documents\b/i,
      /\bupload documents\b/i,
    ])
  ) {
    return `Supported document types: ${snapshot.rules.supportedDocumentTypes.join(", ")}.`;
  }

  if (
    matchesAny(q, [/\bapplication process\b/i, /\bhow to apply\b/i, /\bsteps\b/i, /\bapply for admission\b/i])
  ) {
    return `Application steps: ${APPLICATION_STEPS.join(" -> ")}.`;
  }

  if (matchesAny(q, [/\bwho can login\b/i, /\buser roles\b/i, /\bofficer and student\b/i])) {
    return "Two roles are supported: Student and Officer.";
  }

  if (matchesAny(q, [/\bapplication statuses\b/i, /\bstatus values\b/i, /\ball status\b/i])) {
    return `Application statuses: ${snapshot.rules.statusValues.join(", ")}.`;
  }

  if (
    !requestedAppId &&
    matchesAny(q, [/\bmy latest application\b/i, /\blatest app\b/i, /\bmy application id\b/i])
  ) {
    if (!snapshot.latestApplication?.appId) {
      return "You do not have any applications yet.";
    }
    return `Latest application is #${snapshot.latestApplication.appId} with status ${snapshot.latestApplication.status}.`;
  }

  if (matchesAny(q, [/how many.*application.*(i have|do i have|my)/i, /\bmy applications\b/i])) {
    return `You have ${mine.applications} application${mine.applications === 1 ? "" : "s"} (${mine.drafts} draft, ${mine.submitted + mine.underReview} active, ${mine.accepted} accepted, ${mine.rejected} rejected).`;
  }

  if (matchesAny(q, [/\bstatus\b/i, /\bapplication status\b/i])) {
    if (requestedAppId && !referencedApplication?.appId) {
      return `Application #${requestedAppId} was not found in your backend data.`;
    }
    if (referencedApplication?.appId) {
      return `Application #${referencedApplication.appId} is ${referencedApplication.status}.`;
    }
    if (snapshot.latestApplication?.appId) {
      return `Your latest application #${snapshot.latestApplication.appId} is ${snapshot.latestApplication.status}.`;
    }
    return "You do not have any applications yet.";
  }

  if (matchesAny(q, [/\baccepted\b/i, /how many.*accepted/i])) {
    return `Accepted applications: ${mine.accepted}.`;
  }

  if (matchesAny(q, [/\brejected\b/i, /how many.*rejected/i])) {
    return `Rejected applications: ${mine.rejected}.`;
  }

  if (matchesAny(q, [/\bdraft\b/i, /how many.*draft/i])) {
    return `Draft applications: ${mine.drafts}.`;
  }

  if (matchesAny(q, [/\bcan i edit\b/i, /\bedit application\b/i])) {
    if (referencedApplication?.appId) {
      if (referencedApplication.statusNormalized === "draft") {
        return `Yes, application #${referencedApplication.appId} can be edited because it is Draft.`;
      }
      return `No, application #${referencedApplication.appId} is ${referencedApplication.status} and only Draft can be edited.`;
    }
    return "Only Draft applications can be edited.";
  }

  if (matchesAny(q, [/\bcan i submit\b/i, /\bready to submit\b/i, /\bfinal submit\b/i])) {
    const targetApplication = referencedApplication || snapshot.latestDraft || snapshot.latestApplication;
    if (!targetApplication?.appId) {
      return "You do not have an application to submit yet.";
    }
    return getAppValidationSummary(snapshot, targetApplication);
  }

  if (matchesAny(q, [/\bcancel application\b/i, /\bcan i cancel\b/i])) {
    return "You can cancel from Application Details using the Cancel Application button.";
  }

  if (matchesAny(q, [/how many.*course/i, /\btotal courses\b/i])) {
    return `There are ${snapshot.totals.courses} courses available in the backend.`;
  }

  if (matchesAny(q, [/\bis .* course available\b/i, /\bdo you have .* course\b/i, /\bavailable course\b/i])) {
    const matchedCourse = getCourseFromQuestion(question, snapshot);
    if (matchedCourse) {
      return `Yes, ${matchedCourse.courseName} is available (${matchedCourse.courseType}).`;
    }
  }

  if (matchesAny(q, [/\bavailable courses\b/i, /\blist.*course/i, /\bwhich courses\b/i, /\bshow courses\b/i])) {
    if (!snapshot.availableCourses.length) {
      return "No courses are available in backend data.";
    }
    const names = snapshot.availableCourses.slice(0, 8).map((course) => course.courseName).join(", ");
    const suffix = snapshot.availableCourses.length > 8 ? ", ..." : "";
    return `Available courses (${snapshot.totals.courses}): ${names}${suffix}.`;
  }

  if (
    matchesAny(q, [/\bdocument\b/i, /\bupload\b/i]) &&
    matchesAny(q, [/\brequired\b/i, /\bneed\b/i, /\bmandatory\b/i])
  ) {
    return "At least 1 document is required before final submission.";
  }

  if (
    matchesAny(q, [/\bpayment\b/i, /\bfee\b/i]) &&
    matchesAny(q, [/\brequired\b/i, /\bneed\b/i, /\bmandatory\b/i])
  ) {
    return "At least 1 payment record is required before final submission.";
  }

  if (matchesAny(q, [/how many.*document/i, /\bmy documents\b/i])) {
    return `You have ${mine.documents} document record${mine.documents === 1 ? "" : "s"} in backend data.`;
  }

  if (matchesAny(q, [/how many.*payment/i, /\bmy payments\b/i, /\bfee records\b/i])) {
    return `You have ${mine.payments} payment record${mine.payments === 1 ? "" : "s"} in backend data.`;
  }

  if (requestedAppId) {
    if (!referencedApplication?.appId) {
      return `Application #${requestedAppId} was not found in your backend data.`;
    }
    return buildApplicationDetailsAnswer({
      snapshot,
      application: referencedApplication,
    });
  }

  if (isPortalQuery(question)) {
    return buildPortalFallbackAnswer(snapshot, question);
  }

  return null;
};

export const buildAssistantContext = async ({ user, role }) => {
  const payload = await getBackendPayload({ role });

  const snapshot = buildSnapshot({
    ...payload,
    user,
    role,
  });

  return {
    snapshot,
    context: formatContextText(snapshot),
  };
};

export const invalidateAssistantContextCache = () => {
  cachedPayload = null;
  cacheExpiresAt = 0;
  cachedPayloadScope = "";
};
