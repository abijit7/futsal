/** The shared futsal-ball mark. Used by the navbar and the footer so the logo lives in one place. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{ background: 'var(--futsal-green)', height: size, width: size }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
        <path d="M12 2L14.5 7H9.5L12 2Z" fill="white" />
        <path d="M12 22L9.5 17H14.5L12 22Z" fill="white" />
        <path d="M2 12L7 9.5V14.5L2 12Z" fill="white" />
        <path d="M22 12L17 14.5V9.5L22 12Z" fill="white" />
        <polygon points="12,7 14.5,9.5 13.5,12.5 10.5,12.5 9.5,9.5" fill="white" />
      </svg>
    </span>
  );
}
