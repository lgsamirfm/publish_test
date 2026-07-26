import type { SVGProps } from "react";

/** A crochet hook icon. */
export function CrochetHook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 21c1-1 2-4 2-7 0-3 1-5 3-7 1-1 2.5-1.5 4-1.5s2.5.5 3 1.5" />
      <path d="M17 7a2 2 0 1 1 0 4" />
      <path d="M12 10c-1 1-2 3-2 5" />
      <circle cx="18" cy="5" r="2" />
    </svg>
  );
}

/** A cotton ball / yarn ball icon. */
export function CottonBall(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9c3 1.5 13.5 1.5 17 0" />
      <path d="M3.5 15c3-1.5 13.5-1.5 17 0" />
      <path d="M9 3.5c1.5 3 1.5 13.5 0 17" />
      <path d="M15 3.5c-1.5 3-1.5 13.5 0 17" />
    </svg>
  );
}

// Keep old names as aliases for backward compatibility
export const KnittingNeedle = CrochetHook;
export const YarnBall = CottonBall;
