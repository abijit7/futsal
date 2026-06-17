export type Period = 'AM' | 'PM';

export function toBackendTime(hourInput: string | number, minuteInput: string | number, period: Period) {
  let hour = Number(hourInput);
  const minute = Number(minuteInput);
  if (!Number.isFinite(hour) || hour < 1 || hour > 12) throw new Error('Hour must be between 1 and 12');
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) throw new Error('Minute must be between 0 and 59');
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

export function fromBackendTime(value = '06:00:00') {
  const [hourRaw, minuteRaw = '00'] = value.split(':');
  let hour = Number(hourRaw);
  const period: Period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return { hour: String(hour), minute: minuteRaw, period };
}
