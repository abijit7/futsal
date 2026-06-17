export function money(value?: number) {
  return `NPR ${Number(value || 0).toLocaleString('en-NP')}`;
}

export function formatDate(value?: string) {
  if (!value) return 'Not set';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-NP', {
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

export function timeRange(start?: string, end?: string) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function todayInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export function imageForVenue(url?: string) {
  return url || 'https://images.unsplash.com/photo-1520470082789-e347ad8b1944?w=900&h=650&fit=crop&auto=format';
}
