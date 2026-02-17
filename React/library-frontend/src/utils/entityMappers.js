const DEFAULT_ID_CANDIDATES = [
  "id",
  "bookId",
  "book_id",
  "memberId",
  "member_id",
  "libraryId",
  "copyId",
  "copy_id",
  "reservationId",
  "reservation_id",
  "borrowId",
  "borrow_id",
  "fineId",
  "fine_id",
];

function readPath(source, path) {
  if (!source || !path) {
    return undefined;
  }

  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), source);
}

export function pickFieldValue(source, candidates = []) {
  for (const candidate of candidates) {
    const value = readPath(source, candidate);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

export function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function toIdString(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return String(value);
}

export function getRecordId(record, extraCandidates = []) {
  return pickFieldValue(record, [...extraCandidates, ...DEFAULT_ID_CANDIDATES]);
}

export function getBookId(record) {
  return pickFieldValue(record, ["bookId", "book_id", "book.id", "book.bookId", "id"]);
}

export function getMemberId(record) {
  return pickFieldValue(record, ["memberId", "member_id", "member.id", "userId", "user.id", "id"]);
}

export function getCopyId(record) {
  return pickFieldValue(record, ["copyId", "copy_id", "bookCopyId", "bookCopy.id", "copy.id", "id"]);
}

export function getReservationId(record) {
  return pickFieldValue(record, ["reservationId", "reservation_id", "id"]);
}

export function getBorrowId(record) {
  return pickFieldValue(record, ["borrowId", "borrow_id", "id"]);
}

export function getFineId(record) {
  return pickFieldValue(record, ["fineId", "fine_id", "id"]);
}

export function getLibraryId(member) {
  return pickFieldValue(member, ["libraryId", "memberId", "member_id", "id"]);
}

export function getDisplayName(record) {
  return (
    pickFieldValue(record, ["name", "fullName", "username", "email", "title", "id"]) ??
    "Unknown"
  );
}

export function getStatus(record) {
  return pickFieldValue(record, [
    "status",
    "reservationStatus",
    "borrowStatus",
    "fineStatus",
    "availabilityStatus",
    "copyStatus",
    "condition",
  ]);
}

export function withUpdatedStatus(record, status) {
  if (!record || typeof record !== "object") {
    return { status };
  }

  if (Object.prototype.hasOwnProperty.call(record, "status")) {
    return { ...record, status };
  }
  if (Object.prototype.hasOwnProperty.call(record, "reservationStatus")) {
    return { ...record, reservationStatus: status };
  }
  if (Object.prototype.hasOwnProperty.call(record, "borrowStatus")) {
    return { ...record, borrowStatus: status };
  }
  if (Object.prototype.hasOwnProperty.call(record, "fineStatus")) {
    return { ...record, fineStatus: status };
  }
  if (Object.prototype.hasOwnProperty.call(record, "copyStatus")) {
    return { ...record, copyStatus: status };
  }

  return { ...record, status };
}

export function recordMatchesMember(record, memberId) {
  const recordMemberId = toIdString(getMemberId(record));
  return recordMemberId !== "" && recordMemberId === toIdString(memberId);
}

export function getBookTitle(book) {
  return (
    pickFieldValue(book, ["title", "name", "bookTitle"]) ??
    `Book #${pickFieldValue(book, ["id", "bookId"]) ?? "?"}`
  );
}

function evaluateCopyState(copy) {
  const status = normalizeText(pickFieldValue(copy, ["status", "availabilityStatus", "copyStatus"]));
  const condition = normalizeText(pickFieldValue(copy, ["condition", "state"]));
  const damaged = /damaged|lost/.test(condition) || /damaged|lost/.test(status);
  const available = (/available|in_stock|instock|ready/.test(status) || status === "") && !damaged;

  return { damaged, available };
}

/**
 * Best-effort availability mapping when backend relationships are not fully specified.
 */
export function computeBookAvailabilityMap(books, copies) {
  const map = new Map();

  asArray(books).forEach((book) => {
    const key = toIdString(getBookId(book));
    if (!key) {
      return;
    }

    map.set(key, {
      totalCopies: 0,
      availableCopies: 0,
      damagedCopies: 0,
      status: "Not Available",
    });
  });

  asArray(copies).forEach((copy) => {
    const bookId = toIdString(getBookId(copy));
    if (!bookId) {
      return;
    }

    const aggregate = map.get(bookId) || {
      totalCopies: 0,
      availableCopies: 0,
      damagedCopies: 0,
      status: "Not Available",
    };

    const state = evaluateCopyState(copy);
    aggregate.totalCopies += 1;
    if (state.available) {
      aggregate.availableCopies += 1;
    }
    if (state.damaged) {
      aggregate.damagedCopies += 1;
    }

    map.set(bookId, aggregate);
  });

  map.forEach((value) => {
    if (value.availableCopies > 0) {
      value.status = "Available";
      return;
    }

    if (value.totalCopies > 0 && value.damagedCopies === value.totalCopies) {
      value.status = "Damaged";
      return;
    }

    value.status = "Not Available";
  });

  return map;
}

export function selectAvailableCopyForBook(bookId, copies) {
  const target = toIdString(bookId);
  if (!target) {
    return null;
  }

  return (
    asArray(copies).find((copy) => {
      const relatedBookId = toIdString(getBookId(copy));
      if (relatedBookId !== target) {
        return false;
      }
      return evaluateCopyState(copy).available;
    }) || null
  );
}

export function collectExtraFields(source, knownFieldNames) {
  const extras = {};
  const known = new Set(knownFieldNames);

  Object.entries(source || {}).forEach(([key, value]) => {
    if (!known.has(key)) {
      extras[key] = value;
    }
  });

  return extras;
}
