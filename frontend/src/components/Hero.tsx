import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useAnimation } from "framer-motion";
import MosquitoIcon from "./MosquitoIcon";
import {
  cardHoverBox,
  cardHoverTransition,
  staggerChild,
  staggerParent,
  useReducedMotion,
} from "../lib/motion";

// Button footprint (30px icon + 2x6px padding) so roam targets stay inside.
const FLY_SIZE = 42;
// Slow glide speed in px per second.
const SPEED = 40;
// Perched (mangkal) behaviour: chance to rest at a random spot after each leg.
const PERCH_CHANCE = 0.45;
const PERCH_MIN_S = 1.8;
const PERCH_MAX_S = 3.2;

function Mosquito({
  arena,
  startDelay,
  onHit,
}: {
  arena: HTMLDivElement | null;
  startDelay: number;
  onHit: (x: number, y: number) => void;
}) {
  const [hit, setHit] = useState(false);
  const [visible, setVisible] = useState(false);
  const [perched, setPerched] = useState(false);
  const controls = useAnimation();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!arena) return;
    let alive = true;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => resolve(), ms);
        timers.push(id);
      });
    const randomPoint = () => {
      const rect = arena.getBoundingClientRect();
      return {
        x: Math.random() * Math.max(0, rect.width - FLY_SIZE),
        y: Math.random() * Math.max(0, rect.height - FLY_SIZE),
      };
    };
    const fly = async () => {
      if (startDelay > 0) await wait(startDelay * 1000);
      if (!alive) return;
      // Randomize the starting spot so mosquitoes don't bunch up at a corner.
      // Only show the mosquito after the staggered spawn delay so it never
      // flashes at (0,0) while waiting.
      let current = randomPoint();
      controls.set({ x: current.x, y: current.y });
      setVisible(true);
      if (reduced) return;
      while (alive) {
        const target = randomPoint();
        const dist = Math.hypot(target.x - current.x, target.y - current.y);
        // Slight speed variation per leg keeps the flight organic but slow.
        const pace = SPEED * (0.8 + Math.random() * 0.4);
        const leg = Math.max(1.2, dist / pace);
        try {
          // Different rhythm per axis (linear x, eased y) draws curved
          // swoops instead of rigid straight lines.
          await controls.start({
            x: target.x,
            y: target.y,
            transition: {
              x: { duration: leg, ease: "linear" },
              y: { duration: leg * 1.2, ease: "easeInOut" },
            },
          });
        } catch {
          break; // stopped on unmount
        }
        if (!alive) break;
        current = target;
        // Mangkal: rest at a random spot for a while before taking off again.
        if (Math.random() < PERCH_CHANCE) {
          setPerched(true);
          const rest = PERCH_MIN_S + Math.random() * (PERCH_MAX_S - PERCH_MIN_S);
          await wait(rest * 1000);
          if (!alive) break;
          setPerched(false);
          await wait(250);
          if (!alive) break;
        }
      }
    };
    fly();
    return () => {
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
      controls.stop();
    };
  }, [arena, controls, reduced, startDelay]);

  return (
    <motion.button
      type="button"
      aria-label="Tepuk nyamuk"
      className={`dbd-fly${perched ? " is-perched" : ""}`}
      style={{ opacity: visible ? 1 : 0 }}
      initial={false}
      animate={controls}
      onClick={(event) => {
        const rect = arena?.getBoundingClientRect();
        onHit(event.clientX - (rect?.left ?? 0), event.clientY - (rect?.top ?? 0));
        setHit(true);
        window.setTimeout(() => setHit(false), 1200);
      }}
    >
      <motion.span
        style={{ display: "block", lineHeight: 0 }}
        initial={false}
        animate={
          hit
            ? { scale: 0.2, opacity: 0, rotate: 110 }
            : perched
              ? { scale: 0.9, opacity: 0.92, rotate: -8 }
              : { scale: 1, opacity: 1, rotate: 0 }
        }
        transition={{
          scale: { type: "spring", stiffness: 500, damping: 18 },
          opacity: { duration: 0.18 },
          rotate: { duration: 0.25 },
        }}
      >
        <MosquitoIcon />
      </motion.span>
    </motion.button>
  );
}

const PARTICLE_COLORS = [
  "var(--dbd-red)",
  "var(--dbd-accent)",
  "var(--dbd-orange)",
];

/** Tier 3: decorative water ripples, drawn once on load. */
function WaterRipples({ reduced }: { reduced: boolean }) {
  const rings = [
    { r: 70, delay: 0.3, duration: 1.6 },
    { r: 45, delay: 0.5, duration: 1.4 },
  ];
  return (
    <svg className="dbd-ripple" viewBox="0 0 200 200" aria-hidden="true">
      {rings.map((ring) => (
        <motion.circle
          key={ring.r}
          cx="100"
          cy="100"
          r={ring.r}
          fill="none"
          stroke="var(--dbd-accent)"
          strokeWidth="2"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.22 }}
          transition={{ duration: ring.duration, ease: "easeOut", delay: ring.delay }}
        />
      ))}
    </svg>
  );
}

interface FxParticle {
  color: string;
  tx: number;
  ty: number;
}

function MosquitoSplat({ x, y, particles }: { x: number; y: number; particles: FxParticle[] }) {
  return (
    <span className="dbd-fx" style={{ left: x, top: y }} aria-hidden="true">
      <span className="dbd-splat">💥</span>
      {particles.map((particle, index) => (
        <span
          key={index}
          className="dbd-particle"
          style={
            {
              background: particle.color,
              "--tx": `${particle.tx}px`,
              "--ty": `${particle.ty}px`,
            } as CSSProperties
          }
        />
      ))}
      <span className="dbd-score-float">+1 🦟</span>
    </span>
  );
}

export default function Hero({ totalChecks }: { totalChecks: number }) {
  const [hits, setHits] = useState(0);
  const [arena, setArena] = useState<HTMLDivElement | null>(null);
  const [fx, setFx] = useState<{ x: number; y: number; id: number; particles: FxParticle[] } | null>(null);
  const fxId = useRef(0);
  const reduced = useReducedMotion();
  const handleHit = (x: number, y: number) => {
    setHits((value) => value + 1);
    const id = ++fxId.current;
    const particles = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      const dist = 25 + Math.random() * 35;
      return {
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
      };
    });
    setFx({ x, y, id, particles });
    window.setTimeout(() => {
      setFx((current) => (current?.id === id ? null : current));
    }, 850);
  };
  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const id = event.currentTarget.getAttribute("href")?.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="dbd-hero" id="beranda">
      <WaterRipples reduced={reduced} />
      <div ref={setArena} className="dbd-fly-arena">
        <Mosquito arena={arena} startDelay={0.2} onHit={handleHit} />
        <Mosquito arena={arena} startDelay={1.7} onHit={handleHit} />
        <Mosquito arena={arena} startDelay={3.2} onHit={handleHit} />
        <Mosquito arena={arena} startDelay={4.7} onHit={handleHit} />
        <Mosquito arena={arena} startDelay={6.2} onHit={handleHit} />
        {fx && <MosquitoSplat key={fx.id} x={fx.x} y={fx.y} particles={fx.particles} />}
      </div>

      <motion.div
        className="dbd-hero-copy"
        variants={staggerParent}
        initial={reduced ? false : "hidden"}
        animate={reduced ? undefined : "show"}
      >
        <motion.h1 variants={staggerChild}>Kenali DBD Sebelum Terlambat.</motion.h1>
        <motion.p className="dbd-hero-lead" variants={staggerChild}>
          Skrining gejala mandiri, pantau suhu harian, dan hitung kebutuhan cairan -
          langsung dari kamar kos atau asrama. <strong>Bukan pengganti dokter,</strong> tapi
          teman pertamamu saat demam menyerang.
        </motion.p>
        <motion.div className="dbd-actions" variants={staggerChild}>
          <a href="#cek-gejala" onClick={scrollToSection} className="dbd-button dbd-button-primary">🩺 Cek Gejala Sekarang</a>
          <a href="#pelacak-suhu" onClick={scrollToSection} className="dbd-button dbd-button-outline">🌡️ Lacak Suhu Harian</a>
        </motion.div>
        <motion.p className="dbd-muted dbd-hit-count" variants={staggerChild}>
          Klik nyamuk yang beterbangan! Nyamuk ditepuk:{" "}
          <motion.b
            key={hits}
            style={{ display: "inline-block" }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            {hits}
          </motion.b>
        </motion.p>
        {totalChecks > 0 && (
          <motion.p className="dbd-muted" variants={staggerChild}>{totalChecks} pengecekan gejala telah dilakukan di website ini.</motion.p>
        )}
      </motion.div>

      <motion.aside
        className="dbd-hero-side"
        variants={staggerParent}
        initial={reduced ? false : "hidden"}
        animate={reduced ? undefined : "show"}
      >
        <motion.div
          className="dbd-card dbd-danger-card"
          variants={staggerChild}
          whileHover={{ y: -4, boxShadow: cardHoverBox }}
          transition={cardHoverTransition}
        >
          <h2>🚨 Segera ke IGD jika ada:</h2>
          <ul>
            <li>Nyeri perut hebat dan konstan</li>
            <li>Muntah terus-menerus (&gt;3×)</li>
            <li>Perdarahan gusi, mimisan, atau BAB hitam</li>
            <li>Tangan dan kaki dingin, gelisah</li>
          </ul>
        </motion.div>
        <motion.div
          className="dbd-card dbd-tip-card"
          variants={staggerChild}
          whileHover={{ y: -4, boxShadow: cardHoverBox }}
          transition={cardHoverTransition}
        >
          <p>🕐 <b>Jam aktif Aedes aegypti:</b> pagi 06-09 dan sore 15-18. Gunakan lotion anti-nyamuk di jam ini!</p>
        </motion.div>
      </motion.aside>

    </section>
  );
}
