import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VenueImage } from './VenueImage';

describe('VenueImage', () => {
  it('shows the venue photo when there is one', () => {
    render(<VenueImage url="/uploads/rave.jpg" seed={2} alt="Rave futsal" />);
    expect(screen.getByAltText('Rave futsal')).toHaveAttribute('src', '/uploads/rave.jpg');
  });

  it('gives venues without a photo different court artwork', () => {
    const { rerender } = render(<VenueImage seed={4} alt="a" />);
    const first = screen.getByAltText('a').getAttribute('src');
    rerender(<VenueImage seed={5} alt="a" />);
    const second = screen.getByAltText('a').getAttribute('src');

    expect(first).toMatch(/venue-court-\d\.svg$/);
    expect(second).toMatch(/venue-court-\d\.svg$/);
    // Venues sitting next to each other in a grid must not repeat one illustration.
    expect(first).not.toEqual(second);
  });

  it('falls back to court artwork when an upload has gone missing', () => {
    // Uploads live on the server filesystem, so a URL that worked yesterday can 404 after a
    // redeploy. Without this the browser renders its broken-image glyph.
    render(<VenueImage url="/uploads/deleted.jpg" seed={6} alt="Bhaktapur Turf Park" />);
    const img = screen.getByAltText('Bhaktapur Turf Park');
    expect(img).toHaveAttribute('src', '/uploads/deleted.jpg');

    fireEvent.error(img);

    expect(img.getAttribute('src')).toMatch(/venue-court-\d\.svg$/);
  });

  it('stops rather than looping if the fallback itself cannot load', () => {
    render(<VenueImage seed={1} alt="x" />);
    const img = screen.getByAltText('x');
    const fallback = img.getAttribute('src');

    fireEvent.error(img);

    expect(img.getAttribute('src')).toEqual(fallback);
  });
});
