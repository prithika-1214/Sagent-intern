const DAY_MS = 24 * 60 * 60 * 1000;

function toDateOnly(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).includes("T") ? String(value) : `${value}T00:00:00`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = toDateOnly(value);

  if (!date) {
    return "-";
  }

  return date.toLocaleDateString();
}

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

export function getDaysDiff(fromDate, toDate) {
  const from = toDateOnly(fromDate);
  const to = toDateOnly(toDate);

  if (!from || !to) {
    return 0;
  }

  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

export function getOverdueDays(dueDate, returnDate = getTodayISO()) {
  const days = getDaysDiff(dueDate, returnDate);
  return days > 0 ? days : 0;
}

export function isBorrowReturned(borrow) {
  return Boolean(borrow?.returnDate);
}

export function isOverdueBorrow(borrow) {
  if (!borrow || isBorrowReturned(borrow)) {
    return false;
  }

  return getOverdueDays(borrow.dueDate) > 0;
}

export function isDueSoonBorrow(borrow, days = 2) {
  if (!borrow || isBorrowReturned(borrow)) {
    return false;
  }

  const diff = getDaysDiff(getTodayISO(), borrow.dueDate);
  return diff >= 0 && diff <= days;
}
