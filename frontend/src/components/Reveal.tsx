import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  REVEAL_DISTANCE,
  REVEAL_DURATION,
  useReducedMotion,
} from "../lib/motion";

/**
 * Tier 1 section reveal: fades + slides up once when scrolled into view.
 * Renders a plain div when the user prefers reduced motion.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: REVEAL_DISTANCE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: REVEAL_DURATION, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
