import { CURRENCY_SYMBOL } from "./constants";

export const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${CURRENCY_SYMBOL} ${number.toFixed(2)}`;
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const normalizeStatus = (status) => (status || "").trim();

export const generateLocalToken = (userId) =>
  `token-${userId || "guest"}-${Date.now()}`;

export const toTitleCase = (value = "") =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
