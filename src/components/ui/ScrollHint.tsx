/**
 * Edge fade plus a chevron, marking that a rail continues past the right edge.
 * Purely an affordance — the rail itself stays reachable, so this is hidden
 * from assistive tech and never intercepts a tap.
 */
export function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 right-0 flex w-16 items-center justify-end bg-linear-to-l from-panel from-40% to-transparent transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="none"
        focusable="false"
        className="text-accent-panel"
      >
        <path
          d="M6 3.5 10.5 8 6 12.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
