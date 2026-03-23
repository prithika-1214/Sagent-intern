import dayjs from "dayjs";

export const formatDate = (value, fallback = "-") => {
  if (!value) {
    return fallback;
  }

  const date = dayjs(value);
  if (!date.isValid()) {
    return fallback;
  }

  return date.format("DD MMM YYYY");
};

export const formatDateTime = (value, fallback = "-") => {
  if (!value) {
    return fallback;
  }

  const date = dayjs(value);
  if (!date.isValid()) {
    return fallback;
  }

  return date.format("DD MMM YYYY, hh:mm A");
};

export const formatDateOrDateTime = (value, fallback = "-") => {
  if (!value) {
    return fallback;
  }

  const raw = String(value).trim();
  if (!raw) {
    return fallback;
  }

  // Backend LocalDate values like "2026-02-19" should not render fake midnight time.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return formatDate(raw, fallback);
  }

  return formatDateTime(raw, fallback);
};
