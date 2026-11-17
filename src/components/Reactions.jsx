// Trove's own reaction set: drawn glyphs instead of system emoji, tuned to auction moments.
export const REACTIONS = [
  { id: "fire", label: "Heat", c1: "#ffb347", c2: "#ff4d1c", path: "M12 2.5c1.6 4.6 6.5 6.3 6.5 11.6A6.5 6.5 0 0 1 5.5 14c0-3 1.8-4.8 3-5.7.2 2.1 1.1 3.3 2.3 3.4-.4-3.6.1-6.7 1.2-9.2z" },
  { id: "want", label: "Want", c1: "#ff8fb1", c2: "#ff2d6f", path: "M12 20.3s-7.6-4.5-7.6-10A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.6 2.5c0 5.5-7.6 10-7.6 10z" },
  { id: "eyes", label: "Watching", c1: "#9ec9ff", c2: "#2f6bff", path: "M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12zm9.5 3.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm0-1.8a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z" },
  { id: "steal", label: "Steal", c1: "#7ee0a6", c2: "#119a52", path: "M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4l-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z" },
  { id: "gavel", label: "Sold!", c1: "#ffd76a", c2: "#c98a00", path: "M14.6 3.4l6 6-2.1 2.1-1.4-1.4-3.5 3.5 1.4 1.4-2.1 2.1-6-6 2.1-2.1 1.4 1.4 3.5-3.5-1.4-1.4zM3 18.5l5.7-5.7 2.5 2.5L5.5 21H3z" }
];
export const REACTION = Object.fromEntries(REACTIONS.map(r => [r.id, r]));

export function ReactionGlyph({ id, size = 28 }) {
  const r = REACTION[id];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="rglyph">
      <defs><linearGradient id={"rg-" + id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={r.c1} /><stop offset="1" stopColor={r.c2} /></linearGradient></defs>
      <path d={r.path} fill={`url(#rg-${id})`} fillRule="evenodd" />
    </svg>
  );
}
