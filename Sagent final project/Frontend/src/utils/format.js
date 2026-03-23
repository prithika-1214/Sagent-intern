export const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const formatTime = (value) => {
  if (!value) {
    return '-';
  }

  if (typeof value === 'string' && value.length <= 8 && value.includes(':')) {
    const [hour, minute] = value.split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

export const formatDateTime = (value) => `${formatDate(value)} ${formatTime(value)}`;

const formatHoursValue = (value) => {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${text} ${rounded === 1 ? 'hour' : 'hours'}`;
};

export const formatDuration = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '-';
  }

  const minuteMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(mins?|minutes?)$/i);
  if (minuteMatch) {
    return formatHoursValue(Number(minuteMatch[1]) / 60);
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return formatHoursValue(numeric > 24 ? numeric / 60 : numeric);
  }

  return raw;
};

export const truncateText = (value, max = 130) => {
  if (!value) {
    return '';
  }

  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max)}...`;
};

export const limitWords = (value, maxWords = 4) => {
  const normalized = String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!normalized) {
    return '';
  }

  const words = normalized.split(' ');
  if (words.length <= maxWords) {
    return normalized;
  }

  return words.slice(0, maxWords).join(' ');
};

export const toTitleCase = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
