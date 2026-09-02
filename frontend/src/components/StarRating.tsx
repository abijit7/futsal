import { Star } from 'lucide-react';

/**
 * Read-only star display. Renders a half-open star as a clipped overlay so a 4.3 average does
 * not round up to something the venue has not earned.
 */
export function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, clamped - index));
        return (
          <span key={index} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-slate-300" strokeWidth={2} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="text-amber-400" fill="currentColor" strokeWidth={2} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Interactive rating input, built as a radio group so it is reachable and operable by keyboard -
 * a row of clickable icons alone would not be.
 */
export function StarRatingInput({
  value,
  onChange,
  name = 'rating',
  disabled
}: {
  value: number;
  onChange: (next: number) => void;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Rating" className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className={`cursor-pointer rounded p-1 focus-within:ring-2 focus-within:ring-green-400 ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={star}
            checked={value === star}
            disabled={disabled}
            onChange={() => onChange(star)}
            className="sr-only"
          />
          <Star
            size={26}
            strokeWidth={2}
            className={star <= value ? 'text-amber-400' : 'text-slate-300'}
            fill={star <= value ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
          <span className="sr-only">{star} star{star === 1 ? '' : 's'}</span>
        </label>
      ))}
    </div>
  );
}
