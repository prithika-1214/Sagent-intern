function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

export function isCopyDamaged(copy) {
  return normalizeStatus(copy?.status).includes("damaged");
}

export function isCopyLost(copy) {
  return normalizeStatus(copy?.status).includes("lost");
}

export function isCopyAvailable(copy) {
  const status = normalizeStatus(copy?.status);
  return status.includes("available") && !isCopyDamaged(copy) && !isCopyLost(copy);
}

export function getBookAvailability(bookId, copies = []) {
  const relatedCopies = copies.filter((copy) => copy?.book?.id === bookId);
  const totalCount = relatedCopies.length;
  const availableCount = relatedCopies.filter(isCopyAvailable).length;
  const damagedCount = relatedCopies.filter(isCopyDamaged).length;
  const lostCount = relatedCopies.filter(isCopyLost).length;

  let label = "Book Not Available";
  if (totalCount > 0 && damagedCount === totalCount) {
    label = "Damaged";
  } else if (availableCount > 0) {
    label = "Book Available";
  }

  return {
    totalCount,
    availableCount,
    damagedCount,
    lostCount,
    label,
    canRequest: availableCount > 0,
  };
}
