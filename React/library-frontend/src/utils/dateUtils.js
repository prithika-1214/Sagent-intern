export function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) {
    return "-";
  }

  return date.toLocaleDateString();
}

export function formatDateForInput(value) {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayInputValue() {
  return formatDateForInput(new Date());
}

export function addDays(base, days) {
  const date = parseDate(base) || new Date();
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffInDays(from, to) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);

  if (!fromDate || !toDate) {
    return 0;
  }

  const millisPerDay = 1000 * 60 * 60 * 24;
  const fromUtc = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const toUtc = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.floor((toUtc - fromUtc) / millisPerDay);
}
