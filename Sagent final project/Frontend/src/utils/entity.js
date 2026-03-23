const ID_CANDIDATES = [
  'id',
  'user_id',
  'event_id',
  'venue_id',
  'seat_id',
  'schedule_id',
  'event_seat_id',
  'booking_id',
  'booked_seat_id',
  'payment_id',
  'cancellation_id'
];

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const toCamelCase = (value) => {
  if (typeof value !== 'string' || !value.includes('_')) {
    return value;
  }
  return value.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
};

const toSnakeCase = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
};

const buildKeyCandidates = (key) => {
  const candidates = [key, toCamelCase(key), toSnakeCase(key)];
  return Array.from(new Set(candidates.filter(Boolean)));
};

export const getEntityId = (entity) => {
  if (!entity || typeof entity !== 'object') {
    return '';
  }

  for (const key of ID_CANDIDATES) {
    for (const candidate of buildKeyCandidates(key)) {
      if (hasValue(entity[candidate])) {
        return entity[candidate];
      }
    }
  }

  return '';
};

export const getValue = (entity, keys, fallback = '') => {
  if (!entity || typeof entity !== 'object') {
    return fallback;
  }

  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    for (const candidate of buildKeyCandidates(key)) {
      if (hasValue(entity[candidate])) {
        return entity[candidate];
      }
    }
  }

  return fallback;
};

export const normalizeArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
};
