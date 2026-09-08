/** Shared brand and locale copy — Nepal market, NPR via format.ts */
export const BRAND_NAME = 'MeroFutsal';
export const BRAND_DISPLAY = 'MEROFUTSAL';
export const BRAND_TAGLINE = "Nepal's futsal court booking platform. Find and book courts instantly.";

export const POPULAR_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar'] as const;

/**
 * Earliest-start buckets for the venue search. The value is the hour a slot must start at or
 * after, so `''` means no time filter at all. Coarse on purpose: nobody browsing for a game
 * wants to pick between 7:00 and 7:30, they want "sometime this evening".
 */
export const TIME_WINDOWS = [
  { value: '', label: 'Any time' },
  { value: '06:00', label: 'Morning · 6 AM onwards' },
  { value: '12:00', label: 'Afternoon · 12 PM onwards' },
  { value: '17:00', label: 'Evening · 5 PM onwards' },
  { value: '20:00', label: 'Late · 8 PM onwards' }
] as const;

/** Short form of the same buckets, for filter chips where the long label does not fit. */
export function timeWindowLabel(value: string) {
  return TIME_WINDOWS.find((window) => window.value === value)?.label ?? value;
}
