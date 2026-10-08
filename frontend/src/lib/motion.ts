import { useEffect, useState } from "react";
import type { Variants } from "framer-motion";

/** Accessibility hook (Tier bonus): true when the user prefers reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/** Tier 1: base reveal timing. */
export const REVEAL_DURATION = 0.45;
export const REVEAL_DISTANCE = 30;

/** Tier 2: stagger container for lists/grids (staggerChildren: 0.08). */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/** Tier 2: stagger item for lists/grids. */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: REVEAL_DISTANCE },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: REVEAL_DURATION, ease: "easeOut" },
  },
};

/** Tier 2: multi-step form slide transitions. */
export const stepSlide: Variants = {
  enter: { x: 30, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { x: -30, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

/** Tier 1: card hover spring (stiffness: 400). */
export const cardHoverTransition = {
  type: "spring",
  stiffness: 400,
  damping: 28,
} as const;

/** Tier 1: card hover lift + shadow (transform/opacity only, no scale). */
export const cardHoverBox = "0 12px 32px rgba(20, 38, 61, 0.14)";

/** Instant transition used when reduced motion is preferred. */
export const instantTransition = { duration: 0 } as const;
