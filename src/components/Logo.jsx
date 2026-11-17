export function Mark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1d1d1f" />
      <path d="M7 15h18v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 7 23.5z" fill="#fff" />
      <path d="M7 15a9 8 0 0 1 18 0z" fill="#ff6a3d" />
      <rect x="14" y="17.5" width="4" height="4.5" rx="1.2" fill="#1d1d1f" />
    </svg>
  );
}
export function Logo({ size = 24 }) {
  return (
    <span className="logo" style={{ fontSize: size * 0.82 }}>
      <Mark size={size} />
      <span>trove</span>
    </span>
  );
}
