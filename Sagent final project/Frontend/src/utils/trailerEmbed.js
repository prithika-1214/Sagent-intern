import { getValue } from './entity';

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg)(\?|#|$)/i;

const normalizeUrl = (value) => String(value || '').trim();

const toUrl = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const getYouTubeVideoId = (url) => {
  const parsedUrl = toUrl(url);
  if (!parsedUrl) {
    return '';
  }

  const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') {
    return parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
  }

  if (!['youtube.com', 'm.youtube.com'].includes(host)) {
    return '';
  }

  if (parsedUrl.searchParams.get('v')) {
    return parsedUrl.searchParams.get('v') || '';
  }

  const segments = parsedUrl.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    return '';
  }

  if (['embed', 'shorts', 'live'].includes(segments[0])) {
    return segments[1] || '';
  }

  return '';
};

const getVimeoVideoId = (url) => {
  const parsedUrl = toUrl(url);
  if (!parsedUrl) {
    return '';
  }

  const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
  if (!host.includes('vimeo.com')) {
    return '';
  }

  const segments = parsedUrl.pathname.split('/').filter(Boolean);
  return segments.find((segment) => /^\d+$/.test(segment)) || '';
};

export const getEventTrailerMedia = (event) => {
  const sourceUrl = normalizeUrl(getValue(event, ['trailer_url', 'trailerUrl']));
  if (!sourceUrl) {
    return null;
  }

  if (DIRECT_VIDEO_PATTERN.test(sourceUrl)) {
    return {
      kind: 'file',
      sourceUrl
    };
  }

  const youTubeVideoId = getYouTubeVideoId(sourceUrl);
  if (youTubeVideoId) {
    return {
      kind: 'iframe',
      sourceUrl,
      embedUrl: `https://www.youtube.com/embed/${youTubeVideoId}?rel=0&modestbranding=1`,
      autoplayUrl: `https://www.youtube.com/embed/${youTubeVideoId}?autoplay=1&rel=0&modestbranding=1`
    };
  }

  const vimeoVideoId = getVimeoVideoId(sourceUrl);
  if (vimeoVideoId) {
    return {
      kind: 'iframe',
      sourceUrl,
      embedUrl: `https://player.vimeo.com/video/${vimeoVideoId}?title=0&byline=0&portrait=0`,
      autoplayUrl: `https://player.vimeo.com/video/${vimeoVideoId}?autoplay=1&title=0&byline=0&portrait=0`
    };
  }

  return {
    kind: 'external',
    sourceUrl
  };
};
