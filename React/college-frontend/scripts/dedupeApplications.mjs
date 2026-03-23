#!/usr/bin/env node

const args = process.argv.slice(2);

const hasFlag = (flag) => args.includes(flag);
const getArgValue = (name) => {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) {
    return "";
  }
  return String(args[index + 1] ?? "").trim();
};

const usage = () => {
  console.log("Usage:");
  console.log(
    "  node scripts/dedupeApplications.mjs --email <officer_email> --password <officer_password> [--base-url <url>] [--apply]",
  );
  console.log("");
  console.log("Defaults:");
  console.log("  --base-url uses API_BASE_URL or VITE_API_BASE_URL or http://localhost:8080");
  console.log("  no --apply means dry run (no delete calls)");
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getStudentId = (application) =>
  toPositiveNumber(application?.user?.userId ?? application?.user?.stuId ?? application?.student?.stuId);

const getCourseId = (application) =>
  toPositiveNumber(application?.course?.courseId ?? application?.course?.couId);

const getBusinessKey = (application) => {
  const studentId = getStudentId(application);
  const courseId = getCourseId(application);

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

const getApplicationId = (application) =>
  toPositiveNumber(application?.appId ?? application?.applicationId ?? application?.id);

const authFetchJson = async ({ url, method = "GET", authHeader }) => {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    let payload = "";
    try {
      payload = await response.text();
    } catch {
      payload = "";
    }
    throw new Error(`${method} ${url} failed with ${response.status}${payload ? `: ${payload}` : ""}`);
  }

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
};

const fetchAllApplications = async ({ baseUrl, authHeader }) => {
  const pageSize = 500;
  const firstUrl = `${baseUrl}/applications?page=0&size=${pageSize}`;
  const firstPayload = await authFetchJson({ url: firstUrl, authHeader });

  if (Array.isArray(firstPayload)) {
    return firstPayload;
  }

  const firstPageItems = Array.isArray(firstPayload?.content) ? firstPayload.content : [];
  const totalPages = Math.max(Number(firstPayload?.totalPages) || 1, 1);

  if (totalPages <= 1) {
    return firstPageItems;
  }

  const all = [...firstPageItems];
  for (let page = 1; page < totalPages; page += 1) {
    const pageUrl = `${baseUrl}/applications?page=${page}&size=${pageSize}`;
    const pagePayload = await authFetchJson({ url: pageUrl, authHeader });
    const pageItems = Array.isArray(pagePayload?.content) ? pagePayload.content : [];
    all.push(...pageItems);
  }

  return all;
};

const selectApplicationsToDelete = (applications) => {
  const groups = new Map();

  applications.forEach((application) => {
    const key = getBusinessKey(application);
    if (!key) {
      return;
    }

    const existing = groups.get(key) || [];
    existing.push(application);
    groups.set(key, existing);
  });

  const duplicates = [];
  groups.forEach((group, key) => {
    if (group.length <= 1) {
      return;
    }

    const sorted = [...group].sort((a, b) => {
      const aId = getApplicationId(a) ?? Number.MAX_SAFE_INTEGER;
      const bId = getApplicationId(b) ?? Number.MAX_SAFE_INTEGER;
      return aId - bId;
    });

    const keep = sorted[0];
    const drop = sorted.slice(1).filter((application) => getApplicationId(application));
    if (!drop.length) {
      return;
    }

    duplicates.push({
      key,
      keepId: getApplicationId(keep),
      deleteIds: drop.map((application) => getApplicationId(application)),
    });
  });

  return duplicates;
};

const main = async () => {
  const email = getArgValue("--email");
  const password = getArgValue("--password");
  const baseUrlRaw =
    getArgValue("--base-url") || process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";
  const baseUrl = baseUrlRaw.replace(/\/+$/, "");
  const apply = hasFlag("--apply");

  if (!email || !password) {
    usage();
    process.exitCode = 1;
    return;
  }

  const authHeader = `Basic ${Buffer.from(`${email}:${password}`).toString("base64")}`;

  const applications = await fetchAllApplications({ baseUrl, authHeader });
  const duplicateGroups = selectApplicationsToDelete(applications);
  const deleteIds = duplicateGroups.flatMap((group) => group.deleteIds);

  console.log(`Loaded applications: ${applications.length}`);
  console.log(`Duplicate groups: ${duplicateGroups.length}`);
  console.log(`${apply ? "Deleting" : "Would delete"} duplicate rows: ${deleteIds.length}`);

  if (!duplicateGroups.length) {
    console.log("No duplicate applications found.");
    return;
  }

  duplicateGroups.forEach((group) => {
    console.log(`- ${group.key} -> keep #${group.keepId}, delete [${group.deleteIds.join(", ")}]`);
  });

  if (!apply) {
    console.log("Dry run completed. Re-run with --apply to delete duplicates.");
    return;
  }

  let deleted = 0;
  let failed = 0;

  for (const id of deleteIds) {
    const url = `${baseUrl}/applications/${id}`;
    try {
      await authFetchJson({ url, method: "DELETE", authHeader });
      deleted += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed to delete application #${id}: ${error.message}`);
    }
  }

  console.log(`Deleted: ${deleted}`);
  console.log(`Failed: ${failed}`);
};

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
