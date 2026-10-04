import { useEffect, useState } from "react";

export function useReveal(dep: unknown = null) {
  useEffect(() => {
    const els = document.querySelectorAll(".rv:not(.in)");
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { threshold: 0.1 }
    );
    els.forEach((x) => io.observe(x));
    // Halaman aktif langsung visible (port dari app.js navigate())
    document.querySelectorAll("main [data-page]:not([hidden])").forEach((s) => s.classList.add("in"));
    return () => io.disconnect();
  }, [dep]);
}

export function Confetti({ show, emoji = "🎉" }: { show: boolean; emoji?: string }) {
  const [items] = useState(() =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      e: ["🎉", "🎊", "✨", "🥳", "🎈"][i % 5],
      left: Math.random() * 100,
      dur: 2.5 + Math.random() * 2.5,
      delay: Math.random() * 1.2,
      size: 18 + Math.random() * 20,
    }))
  );
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="pop-emoji text-center text-6xl">{emoji}</div>
      {items.map((x) => (
        <span
          key={x.id}
          className="cf"
          style={{ left: `${x.left}%`, animationDuration: `${x.dur}s`, animationDelay: `${x.delay}s`, fontSize: x.size }}
        >
          {x.e}
        </span>
      ))}
    </div>
  );
}
