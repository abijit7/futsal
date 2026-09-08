export function money(value?: number) {
  return `NPR ${Number(value || 0).toLocaleString('en-NP')}`;
}

export function formatDate(value?: string) {
  if (!value) return 'Not set';
  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  return new Date(normalized).toLocaleDateString('en-NP', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(value?: string) {
  if (!value) return 'Not set';
  const [hourRaw, minute = '00'] = value.split(':');
  let hour = Number(hourRaw);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute.padStart(2, '0')} ${suffix}`;
}

export function formatTimeCompact(value?: string) {
  if (!value) return 'Not set';
  const [hourRaw, minute = '00'] = value.split(':');
  let hour = Number(hourRaw);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${minute.padStart(2, '0')} ${suffix}`;
}

export function timeRange(start?: string, end?: string) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function slotDuration(start?: string, end?: string) {
  const startMinutes = minutesFromTime(start);
  const endMinutes = minutesFromTime(end);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return '';

  const totalMinutes = endMinutes - startMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  return parts.join(' ');
}

export function timeRangeWithDuration(start?: string, end?: string) {
  const duration = slotDuration(start, end);
  return duration ? `${timeRange(start, end)} (${duration})` : timeRange(start, end);
}

export function todayInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

/**
 * Title-cases a place name for display only; the stored value is untouched. Venues are typed in by
 * hand from the admin form, so the same city arrives as both "kathmandu" and "Kathmandu" and the
 * two sit next to each other in a listing. A word that already carries capitals is left alone, so
 * "KTM" and other abbreviations survive.
 */
export function placeName(value?: string) {
  if (!value) return '';
  return value
    .split(/(\s+)/)
    .map((word) => (word === word.toLowerCase() ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join('');
}

// Self-hosted so that a venue without a photo does not depend on a third-party CDN being
// reachable, and so the CSP does not have to allow a remote image origin.
export const VENUE_PLACEHOLDER_IMAGE = '/venue-placeholder.svg';

/**
 * Four court illustrations rather than one. A grid of venues that have not uploaded photos used to
 * repeat a single image down the page, which read as a broken loading state rather than as
 * artwork.
 */
const VENUE_PLACEHOLDER_VARIANTS = [
  '/venue-court-1.svg',
  '/venue-court-2.svg',
  '/venue-court-3.svg',
  '/venue-court-4.svg'
];

/**
 * A venue's image, or a fallback court illustration chosen from `seed` (the venue id). The choice
 * is deterministic so a venue keeps the same artwork across pages, reloads and pagination.
 */
export function imageForVenue(url?: string, seed?: number) {
  if (url) return url;
  if (!Number.isFinite(seed)) return VENUE_PLACEHOLDER_VARIANTS[0];
  const index = Math.abs(Math.trunc(seed as number)) % VENUE_PLACEHOLDER_VARIANTS.length;
  return VENUE_PLACEHOLDER_VARIANTS[index];
}

export function minutesFromTime(value?: string) {
  if (!value) return null;
  const [hourRaw, minuteRaw = '0'] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}
