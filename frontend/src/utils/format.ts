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

// Self-hosted so that a venue without a photo does not depend on a third-party CDN being
// reachable, and so the CSP does not have to allow a remote image origin.
export const VENUE_PLACEHOLDER_IMAGE = '/venue-placeholder.svg';

export function imageForVenue(url?: string) {
  return url || VENUE_PLACEHOLDER_IMAGE;
}

function minutesFromTime(value?: string) {
  if (!value) return null;
  const [hourRaw, minuteRaw = '0'] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}
