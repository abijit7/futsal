import { useEffect, useState } from 'react';
import { imageForVenue } from '../utils/format';

/**
 * A venue photograph that degrades to court artwork instead of a broken-image icon.
 *
 * <p>Uploads live on the server's filesystem, so a URL that resolved yesterday can 404 after a
 * redeploy or a scale-out — and a plain `<img>` renders that as the browser's broken-image glyph,
 * which looks like the site is broken rather than like a venue without a photo. Falling back to the
 * same illustration a photo-less venue would have shown keeps the page intact either way.
 */
export function VenueImage({
  url,
  seed,
  alt,
  className,
  loading = 'lazy'
}: {
  url?: string;
  seed?: number;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  const fallback = imageForVenue(undefined, seed);
  const [src, setSrc] = useState(() => imageForVenue(url, seed));

  // A venue can change under the same mounted component - paginating a list, or an admin saving a
  // new photo - so the resolved source has to follow the props rather than stay at its initial value.
  useEffect(() => { setSrc(imageForVenue(url, seed)); }, [url, seed]);

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => { if (src !== fallback) setSrc(fallback); }}
    />
  );
}
