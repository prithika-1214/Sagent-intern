export const normalizeArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

export const formatCurrency = (value) => {
  const amount = Number(value);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString();
};

export const toDateInputValue = (value) => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().split('T')[0];
};

export const getMonthKey = (value) => {
  if (!value) {
    return 'unknown';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'unknown';
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

export const getFirstDefined = (item, keys, fallback = '') => {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return fallback;
};

export const getId = (item) =>
  getFirstDefined(item, ['id', 'userId', 'incomeId', 'expenseId', 'categoryId', 'catId', 'savingsId', 'balanceId'], null);

export const toNumber = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

export const required = (value) => String(value ?? '').trim().length > 0;

export const isPositiveNumber = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0;
};

export const getErrorMessage = (error) => {
  if (error?.message === 'Network Error') {
    const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').trim();
    const proxyTarget = String(import.meta.env.VITE_API_PROXY_TARGET || 'http://localhost:8082').trim();

    if (baseUrl.startsWith('http')) {
      return `Cannot connect to backend at ${baseUrl}. Check that Spring Boot is running and CORS is configured.`;
    }

    return `Cannot connect to backend. If using Vite proxy, verify Spring Boot is running at ${proxyTarget}.`;
  }

  const payload = error?.response?.data;

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload?.message) {
    return payload.message;
  }

  if (payload?.error) {
    return payload.error;
  }

  return error?.message || 'Request failed. Please try again.';
};

export const sortByDateDesc = (items, dateKeys = ['date']) =>
  [...items].sort((a, b) => {
    const aDate = new Date(getFirstDefined(a, dateKeys, '')).getTime();
    const bDate = new Date(getFirstDefined(b, dateKeys, '')).getTime();

    return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
  });

export const belongsToUser = (item, activeUserId) => {
  if (!activeUserId) {
    return false;
  }

  const directUserId = getFirstDefined(item, ['userId', 'user_id'], null);
  const nestedUserId = getFirstDefined(item?.user, ['id', 'userId', 'user_id'], null);

  if (directUserId === null && nestedUserId === null) {
    return false;
  }

  return String(directUserId ?? nestedUserId) === String(activeUserId);
};

const hasOwn = (item, key) => Object.prototype.hasOwnProperty.call(item || {}, key);

export const buildUserAwarePayloads = (basePayload, activeUser, sampleItem) => {
  if (!activeUser?.id) {
    return [basePayload];
  }

  const userIdPayload = { ...basePayload, userId: activeUser.id };
  const userObjectPayload = { ...basePayload, user: { id: activeUser.id } };
  const userObjectPayloadUserId = { ...basePayload, user: { userId: activeUser.id } };

  if (sampleItem && hasOwn(sampleItem, 'userId')) {
    return [userIdPayload, userObjectPayloadUserId, userObjectPayload];
  }

  if (sampleItem && hasOwn(sampleItem, 'user')) {
    return [userObjectPayloadUserId, userObjectPayload, userIdPayload];
  }

  return [userObjectPayloadUserId, userObjectPayload, userIdPayload, basePayload];
};

export const dedupePayloads = (payloads) => {
  const seen = new Set();

  return payloads.filter((payload) => {
    const serialized = JSON.stringify(payload);

    if (seen.has(serialized)) {
      return false;
    }

    seen.add(serialized);
    return true;
  });
};

export const runWithPayloadFallbacks = async (request, payloads) => {
  const uniquePayloads = dedupePayloads(payloads);
  let lastError;

  for (const payload of uniquePayloads) {
    try {
      return await request(payload);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;

      if (!status || status >= 500) {
        break;
      }
    }
  }

  throw lastError;
};
