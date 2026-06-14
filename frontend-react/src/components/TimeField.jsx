import { useEffect, useState } from 'react';
import { formatTime } from '../utils/format.js';

export default function TimeField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  hint = 'Use 12-hour time, for example 07:00 PM'
}) {
  const current = getDisplayTime(value);
  const [timeText, setTimeText] = useState(current.text);
  const [period, setPeriod] = useState(current.period);
  const previewId = `${id}-preview`;
  const isComplete = Boolean(value);

  useEffect(() => {
    const next = getDisplayTime(value);
    setTimeText(next.text);
    setPeriod(next.period);
  }, [value]);

  const commitTime = (nextText, nextPeriod, shouldNormalize = false) => {
    const parsed = parseTimeInput(nextText, nextPeriod);
    if (parsed.empty) {
      onChange('');
      return;
    }
    if (!parsed.value) return;

    onChange(parsed.value);
    setPeriod(parsed.period);
    if (shouldNormalize) {
      setTimeText(parsed.text);
    }
  };

  const handleTextChange = (event) => {
    const nextText = event.target.value;
    setTimeText(nextText);
    commitTime(nextText, period);
  };

  const handlePeriodChange = (event) => {
    const nextPeriod = event.target.value;
    setPeriod(nextPeriod);
    commitTime(timeText, nextPeriod, true);
  };

  const handleBlur = () => {
    commitTime(timeText, period, true);
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="time-input-shell">
        <input
          id={id}
          type="text"
          className="form-control time-input-control"
          value={timeText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder="07:00"
          pattern="^\s*((0?[1-9]|1[0-2])(:[0-5]?[0-9])?|((0?[1-9]|1[0-2])[0-5][0-9]))\s*([AaPp]\.?[Mm]\.?)?\s*$"
          autoComplete="off"
          aria-describedby={previewId}
        />
        <select
          className="time-period-select"
          value={period}
          onChange={handlePeriodChange}
          disabled={disabled}
          aria-label={`${label} period`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <div id={previewId} className={`time-preview ${isComplete ? 'show' : ''}`}>
        {isComplete ? formatTime(`${value}:00`) : hint}
      </div>
    </div>
  );
}

function getDisplayTime(value) {
  if (!value) {
    return { text: '', period: 'AM' };
  }

  const [hours = '0', minutes = '00'] = value.split(':');
  const hour = Number(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return {
    text: `${String(hour12).padStart(2, '0')}:${minutes.padStart(2, '0')}`,
    period
  };
}

function parseTimeInput(text, selectedPeriod) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { empty: true };
  }

  const periodMatch = trimmed.match(/([ap])\.?\s*m\.?\s*$/i);
  const period = periodMatch ? `${periodMatch[1].toUpperCase()}M` : selectedPeriod;
  const timePart = trimmed
    .replace(/([ap])\.?\s*m\.?\s*$/i, '')
    .replace(/\s+/g, '');

  let hour;
  let minute;

  if (timePart.includes(':')) {
    const [hourPart, minutePart = '0'] = timePart.split(':');
    hour = Number(hourPart);
    minute = Number(minutePart.padStart(2, '0').slice(0, 2));
  } else if (/^\d{1,4}$/.test(timePart)) {
    if (timePart.length <= 2) {
      hour = Number(timePart);
      minute = 0;
    } else {
      hour = Number(timePart.slice(0, -2));
      minute = Number(timePart.slice(-2));
    }
  } else {
    return { value: null };
  }

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return { value: null };
  }

  const hour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;
  const value = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const normalizedText = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return { value, period, text: normalizedText };
}
