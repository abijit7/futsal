export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NP', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '-';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  let h12 = hr % 12;
  if (hr === 0) h12 = 0;
  if (hr === 12) h12 = 12;
  const hh = String(h12).padStart(2, '0');
  return `${hh}:${m} ${ampm}`;
}

export function compactTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return '-';
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  const startPeriod = start.slice(-2);
  const endPeriod = end.slice(-2);
  const startCore = start.replace(/\s?(AM|PM)$/i, '');
  const endCore = end.replace(/\s?(AM|PM)$/i, '');
  if (startPeriod === endPeriod) {
    return `${startCore}-${endCore} ${endPeriod}`;
  }
  return `${startCore} ${startPeriod}-${endCore} ${endPeriod}`;
}

export function formatDateTime(dtStr) {
  if (!dtStr) return '-';
  const d = new Date(dtStr);
  return d.toLocaleString('en-NP', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return '-';
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? mins % 60 + 'm' : ''}`.trim();
  return `${mins} min`;
}

export function statusClass(status) {
  const map = {
    PENDING: 'badge-pending',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    CANCELLED: 'badge-cancelled'
  };
  return map[status] || '';
}
