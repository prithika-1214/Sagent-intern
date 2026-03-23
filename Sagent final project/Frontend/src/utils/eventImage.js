import { getValue } from './entity';

const THEMED_IMAGE_BASE_URL = 'https://loremflickr.com/1200/720/';

const normalizeUrl = (value) => String(value || '').trim();

const sanitizeTag = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ',')
    .replace(/^,+|,+$/g, '');

const createLockId = (value) =>
  Array.from(String(value || '')).reduce((total, char) => ((total * 31 + char.charCodeAt(0)) % 100000) + 1, 17);

const buildThemedFallbackUrl = ({ name, genre, category, language }) => {
  const tags = [name, genre, category, language, 'event', 'poster'].map(sanitizeTag).filter(Boolean);
  if (!tags.length) {
    return '';
  }

  const lockSeed = [name, genre, category, language].filter(Boolean).join('|');
  return `${THEMED_IMAGE_BASE_URL}${tags.join(',')}?lock=${createLockId(lockSeed)}`;
};

export const getEventImageCandidates = (event) => {
  const name = getValue(event, ['event_name', 'eventName', 'name']);
  const genre = getValue(event, ['genre']);
  const category = getValue(event, ['category']);
  const language = getValue(event, ['language']);
  const imageUrl = normalizeUrl(getValue(event, ['image_url', 'imageUrl']));

  return Array.from(
    new Set(
      [imageUrl, buildThemedFallbackUrl({ name, genre, category, language })].filter(Boolean)
    )
  );
};
