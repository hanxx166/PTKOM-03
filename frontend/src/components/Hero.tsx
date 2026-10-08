import { useState } from "react";

function Mosquito({ left, top, delay, onHit }: { left: string; top: string; delay: string; onHit: () => void }) {
  const [hit, setHit] = useState(false);
  return (
    <button
      type="button"
      aria-label="Tepuk nyamuk"
      className={`dbd-fly${hit ? " is-hit" : ""}`}
      style={{ left, top, animationDelay: delay }}
      onClick={() => {
        onHit();
        setHit(true);
        window.setTimeout(() => setHit(false), 1200);
      }}
    >
      🦟
    </button>
  );
}

export default function Hero({ totalChecks }: { totalChecks: number }) {
  const [hits, setHits] = useState(0);
  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const id = event.currentTarget.getAttribute("href")?.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="dbd-hero" id="beranda">
      <Mosquito left="46%" top="14%" delay="0s" onHit={() => setHits((value) => value + 1)} />
      <Mosquito left="70%" top="58%" delay="-4s" onHit={() => setHits((value) => value + 1)} />
      <Mosquito left="8%" top="70%" delay="-8s" onHit={() => setHits((value) => value + 1)} />
      <Mosquito left="88%" top="12%" delay="-2s" onHit={() => setHits((value) => value + 1)} />

      <div className="dbd-hero-copy">
        <p className="dbd-eyebrow">Poliklinik ITERA · Portal Siaga DBD</p>
        <h1>Kenali DBD Sebelum Terlambat.</h1>
        <p className="dbd-hero-lead">
          Skrining gejala mandiri, pantau suhu harian, dan hitung kebutuhan cairan —
          langsung dari kamar kos atau asrama. <strong>Bukan pengganti dokter,</strong> tapi
          teman pertamamu saat demam menyerang.
        </p>
        <div className="dbd-actions">
          <a href="#cek-gejala" onClick={scrollToSection} className="dbd-button dbd-button-primary">🩺 Cek Gejala Sekarang</a>
          <a href="#pelacak-suhu" onClick={scrollToSection} className="dbd-button dbd-button-outline">🌡️ Lacak Suhu Harian</a>
        </div>
        <p className="dbd-muted dbd-hit-count">
          Klik nyamuk yang beterbangan! Nyamuk ditepuk: <b>{hits}</b>
        </p>
        {totalChecks > 0 && (
          <p className="dbd-muted">{totalChecks} pengecekan gejala telah dilakukan di website ini.</p>
        )}
      </div>

      <aside className="dbd-hero-side">
        <div className="dbd-card dbd-danger-card">
          <h2>🚨 Segera ke IGD jika ada:</h2>
          <ul>
            <li>Nyeri perut hebat dan konstan</li>
            <li>Muntah terus-menerus (&gt;3×)</li>
            <li>Perdarahan gusi, mimisan, atau BAB hitam</li>
            <li>Tangan dan kaki dingin, gelisah</li>
          </ul>
        </div>
        <div className="dbd-card dbd-tip-card">
          <p>🕐 <b>Jam aktif Aedes aegypti:</b> pagi 06–09 dan sore 15–18. Gunakan lotion anti-nyamuk di jam ini!</p>
        </div>
      </aside>

    </section>
  );
}
