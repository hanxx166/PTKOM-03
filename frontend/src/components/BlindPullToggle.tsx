import { useCallback, useState } from "react";
import { motion, useAnimate, stagger } from "framer-motion";
import { Moon, Sun } from "@phosphor-icons/react";
import { useReducedMotion } from "../lib/motion";

const SLATS = 6;
// Compact fixed size that fits inside the 72px header.
const SIZE = 42;

const ICON_SIZE = Math.round(SIZE * 0.45);
const RADIUS = Math.round(SIZE * 0.275);

export default function BlindPullToggle({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  const [animating, setAnimating] = useState(false);
  const [scope, animate] = useAnimate();
  const reduced = useReducedMotion();

  const handleToggle = useCallback(async () => {
    if (animating) return;
    if (reduced) {
      onToggle();
      return;
    }
    setAnimating(true);

    await animate(
      ".blind-pull-slat",
      { scaleY: 0 },
      { delay: stagger(0.04), duration: 0.1, ease: "easeIn" },
    );
    onToggle();
    await animate(
      ".blind-pull-slat",
      { scaleY: 1 },
      { delay: stagger(0.04), duration: 0.13, ease: "easeOut" },
    );

    setAnimating(false);
  }, [animating, animate, onToggle, reduced]);

  return (
    <motion.div
      ref={scope}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex select-none"
    >
      <motion.button
        type="button"
        onClick={handleToggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
        title="Mode Gelap/Terang"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: RADIUS,
          border: "1px solid var(--dbd-border)",
          boxShadow: "var(--dbd-shadow)",
          cursor: "pointer",
          position: "relative",
          background:
            "linear-gradient(145deg, var(--dbd-surface), var(--dbd-soft))",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: RADIUS - 1,
            overflow: "hidden",
          }}
        >
          {Array.from({ length: SLATS }).map((_, i) => {
            const topPx = Math.round((i / SLATS) * SIZE);
            const nextTopPx =
              i === SLATS - 1 ? SIZE : Math.round(((i + 1) / SLATS) * SIZE);
            const heightPx = nextTopPx - topPx;

            return (
              <div
                key={i}
                className="blind-pull-slat"
                style={{
                  position: "absolute",
                  top: topPx,
                  left: 0,
                  width: "100%",
                  height: heightPx,
                  overflow: "hidden",
                  transformOrigin: "50% 50%",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -topPx,
                    left: 0,
                    width: SIZE,
                    height: SIZE,
                    background:
                      "linear-gradient(145deg, var(--dbd-surface), var(--dbd-soft))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--dbd-text)",
                  }}
                >
                  {dark ? (
                    <Sun size={ICON_SIZE} weight="regular" />
                  ) : (
                    <Moon size={ICON_SIZE} weight="regular" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.button>
    </motion.div>
  );
}
