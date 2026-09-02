import { useEffect } from 'react';

export const SITE_NAME = 'MeroFutsal';
const DEFAULT_TITLE = `${SITE_NAME} — Book futsal courts in Nepal`;

/**
 * Sets the document title for the current page.
 *
 * A single-page app never reloads, so without this every route keeps whatever title the
 * previous one left behind. That matters for browser history, for bookmarks and tabs, and for
 * screen readers, which announce the title on navigation.
 *
 * Pass `undefined` to fall back to the site-wide title, which is what pages that are still
 * loading their subject (a venue name, say) should do.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  }, [title]);
}
