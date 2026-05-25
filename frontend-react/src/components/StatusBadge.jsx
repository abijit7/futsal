import { statusClass } from '../utils/format.js';

export default function StatusBadge({ status }) {
  return <span className={`badge ${statusClass(status)}`}>{status}</span>;
}

