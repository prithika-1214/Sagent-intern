import { getValue } from './entity';

const normalizeText = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || '';
};

const createHue = (value) =>
  Array.from(String(value || '')).reduce((total, char) => ((total * 31 + char.charCodeAt(0)) % 360 + 360) % 360, 160);

const parseCastMembers = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  const serializedValue = normalizeText(value);
  if (!serializedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(serializedValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeCastMember = (member = {}, index = 0) => {
  const name = normalizeText(getValue(member, ['name', 'actor_name', 'actorName']));
  const role = normalizeText(getValue(member, ['role', 'character_name', 'characterName', 'character', 'as']));
  const imageUrl = normalizeText(getValue(member, ['image_url', 'imageUrl', 'photo_url', 'photoUrl']));

  return {
    id: `${name || 'cast'}-${index}`,
    name,
    role,
    imageUrl
  };
};

export const normalizeCastMembers = (value) =>
  parseCastMembers(value)
    .map((member, index) => normalizeCastMember(member, index))
    .filter((member) => member.name);

export const getEventCastMembers = (event) => normalizeCastMembers(getValue(event, ['cast_members', 'castMembers'], []));

export const getCastInitials = (name) => {
  const parts = normalizeText(name).split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return 'C';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

export const getCastFallbackStyle = (name) => {
  const hue = createHue(name);
  return {
    background: `linear-gradient(145deg, hsl(${hue}, 68%, 44%) 0%, hsl(${(hue + 32) % 360}, 72%, 58%) 100%)`
  };
};
