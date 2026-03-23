import { getEventImageCandidates } from './eventImage';

const posterCache = new Map();

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });

const blobToPngDataUrl = async (blob) => {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context unavailable');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const fetchImageDataUrl = async (url) => {
  if (!url) {
    return '';
  }

  if (String(url).startsWith('data:image/')) {
    return url;
  }

  if (posterCache.has(url)) {
    return posterCache.get(url);
  }

  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url}`);
  }

  const blob = await response.blob();
  const dataUrl = await blobToPngDataUrl(blob);
  posterCache.set(url, dataUrl);
  return dataUrl;
};

export const resolveTicketPosterDataUrl = async (ticket = {}) => {
  const posterSource = {
    eventName: ticket.eventName,
    imageUrl: ticket.eventImageUrl,
    category: ticket.eventCategory,
    genre: ticket.eventGenre,
    language: ticket.eventLanguage
  };

  const candidates = getEventImageCandidates(posterSource);

  for (const candidate of candidates) {
    try {
      return await fetchImageDataUrl(candidate);
    } catch {
      // Try the next candidate until one succeeds.
    }
  }

  return '';
};
