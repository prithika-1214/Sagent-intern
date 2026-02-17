import { createCrudService } from "./baseCrudService";
import { getLibraryId, normalizeText, pickFieldValue } from "../../utils/entityMappers";

const baseService = createCrudService("/members", { hasGetById: false });

async function getById(memberId) {
  const members = await baseService.list();
  return (
    members.find((member) => String(getLibraryId(member)) === String(memberId)) || null
  );
}

function getMemberEmail(member) {
  return pickFieldValue(member, ["email", "memberEmail", "emailAddress", "mail", "user.email"]);
}

function sanitizePayload(payload) {
  const clean = {
    name: String(payload?.name || "").trim(),
    email: String(payload?.email || "").trim(),
    password: String(payload?.password || "").trim(),
  };

  const extras = { ...(payload || {}) };
  delete extras.name;
  delete extras.email;
  delete extras.password;

  return { ...clean, ...extras };
}

function buildIdCandidates() {
  const base = Date.now();
  return [base, base + 1, base + 2];
}

function buildInferredPayloadFromSample(sample, clean, idValue) {
  if (!sample || typeof sample !== "object") {
    return null;
  }

  const inferred = {};
  Object.entries(sample).forEach(([key, value]) => {
    const keyLower = key.toLowerCase();
    if (keyLower === "id" || keyLower.endsWith("id")) {
      inferred[key] = idValue;
      return;
    }

    if (keyLower.includes("name")) {
      inferred[key] = clean.name;
      return;
    }

    if (keyLower.includes("mail") || keyLower === "email") {
      inferred[key] = clean.email;
      return;
    }

    if (keyLower.includes("pass")) {
      inferred[key] = clean.password;
      return;
    }

    if (typeof value === "number") {
      inferred[key] = value;
      return;
    }

    if (typeof value === "boolean") {
      inferred[key] = value;
      return;
    }

    if (typeof value === "string") {
      inferred[key] = "";
      return;
    }

    inferred[key] = value;
  });

  return inferred;
}

function buildRegistrationPayloadVariants(payload, sampleMember) {
  const clean = sanitizePayload(payload);
  const idCandidates = buildIdCandidates();

  const variants = [
    clean,
    {
      ...clean,
      fullName: clean.name,
      memberName: clean.name,
      memberEmail: clean.email,
      memberPassword: clean.password,
    },
    {
      name: clean.name,
      emailAddress: clean.email,
      password: clean.password,
    },
    {
      memberName: clean.name,
      email: clean.email,
      password: clean.password,
    },
    {
      name: clean.name,
      email: clean.email,
    },
    ...idCandidates.map((id) => ({
      ...clean,
      id,
    })),
    ...idCandidates.map((id) => ({
      ...clean,
      memberId: id,
      libraryId: id,
    })),
    ...idCandidates.map((id) => ({
      id,
      memberId: id,
      libraryId: id,
      name: clean.name,
      fullName: clean.name,
      memberName: clean.name,
      email: clean.email,
      emailAddress: clean.email,
      memberEmail: clean.email,
      password: clean.password,
      memberPassword: clean.password,
      role: "MEMBER",
      status: "ACTIVE",
      active: true,
      joinDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      ...clean,
    })),
  ];

  const inferredWithId = buildInferredPayloadFromSample(sampleMember, clean, idCandidates[0]);
  if (inferredWithId) {
    variants.push({
      ...inferredWithId,
      ...clean,
    });
  }

  const seen = new Set();
  return variants.filter((variant) => {
    const key = JSON.stringify(variant);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function shouldRetryWithAnotherPayload(error) {
  const status = Number(error?.status);
  if (!status) {
    return false;
  }
  return status === 400 || status === 415 || status === 422 || status >= 500;
}

async function create(payload) {
  const clean = sanitizePayload(payload);

  if (!clean.name || !clean.email || clean.password.length < 4) {
    throw new Error("Please provide valid name, email, and password.");
  }

  try {
    const existingMembers = await baseService.list();
    const alreadyExists = existingMembers.some(
      (member) => normalizeText(getMemberEmail(member)) === normalizeText(clean.email)
    );

    if (alreadyExists) {
      throw new Error("Email is already registered. Please sign in.");
    }
  } catch (error) {
    if (String(error?.message || "").includes("already registered")) {
      throw error;
    }
    // Ignore pre-check failures and attempt create directly.
  }

  let sampleMember = null;
  try {
    const members = await baseService.list();
    sampleMember = Array.isArray(members) && members.length ? members[0] : null;
  } catch {
    // Continue without schema inference.
  }

  const variants = buildRegistrationPayloadVariants(clean, sampleMember);
  let lastError = null;

  for (const variant of variants) {
    try {
      return await baseService.create(variant);
    } catch (error) {
      lastError = error;
      if (!shouldRetryWithAnotherPayload(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Member registration failed.");
}

export const membersService = {
  ...baseService,
  create,
  getById,
};
