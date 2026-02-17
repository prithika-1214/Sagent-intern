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
