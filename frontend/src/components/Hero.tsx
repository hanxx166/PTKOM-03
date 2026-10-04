import { useState } from "react";
import { Link } from "react-router-dom";

function Mosquito({ left, top, delay, onHit }: { left: string; top: string; delay: string; onHit: () => void }) {
  const [hit, setHit] = useState(false);
  return (
    <img
      src="img/mosquito.svg"
      alt=""
      aria-hidden
      className={`fly${hit ? " hit" : ""}`}
      style={{ left, top, animationDelay: delay }}
      onClick={() => {
        onHit();
        setHit(true);
        setTimeout(() => setHit(false), 2500);
      }}
    />
  );
}

export default function Hero({ totalChecks }: { totalChecks: number }) {
  const [hits, setHits] = useState(0);

  return (
    <section
      className="relative mt-6 grid items-center gap-10 overflow-hidden rounded-[22px] border-0 bg-[#dfeaf7] p-10 md:grid-cols-[1.4fr_1fr]"
      style={{
        backgroundImage: "url(img/hero.svg)",
        backgroundPosition: "right center",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Mosquito left="46%" top="14%" delay="0s" onHit={() => setHits((h) => h + 1)} />
      <Mosquito left="70%" top="58%" delay="-4s" onHit={() => setHits((h) => h + 1)} />
      <Mosquito left="8%" top="70%" delay="-8s" onHit={() => setHits((h) => h + 1)} />
      <Mosquito left="88%" top="12%" delay="-2s" onHit={() => setHits((h) => h + 1)} />
      <div className="relative z-[1]">
        <p className="mb-1 text-[0.78rem] font-bold uppercase tracking-widest text-acc">
          Poliklinik ITERA · Edukasi Kesehatan
        </p>
        <h1 className="text-4xl font-bold md:text-5xl">Kenali DBD sebelum terlambat.</h1>
        <p className="mt-2 max-w-[34em] text-lg">
          Panduan singkat tentang gejala, pencegahan, dan kapan harus ke dokter, dibuat mudah dipahami.
        </p>
        <div className="my-5 flex flex-wrap gap-3">
          <Link to="/cek-gejala" className="rounded-[10px] bg-acc px-5 py-2.5 font-bold text-white no-underline hover:bg-[#0d4fae]">
            Cek gejala saya
          </Link>
          <Link to="/artikel" className="rounded-[10px] border-2 border-acc px-5 py-2.5 font-bold text-acc no-underline hover:bg-acc hover:text-white">
            Baca artikel
          </Link>
        </div>
        <p className="text-sm text-muted">Klik nyamuk yang beterbangan! Nyamuk ditepuk: <b>{hits}</b></p>
        {totalChecks > 0 && (
          <p className="text-sm text-muted">{totalChecks} pengecekan gejala telah dilakukan di website ini</p>
        )}
      </div>
      <aside className="relative z-[1] rounded-[14px] border border-[#f0c4c4] border-l-[6px] border-l-danger bg-white p-6">
        <h2 className="text-base text-danger">Segera ke IGD jika ada:</h2>
        <ul className="mb-3 pl-[18px]">
          <li>Nyeri perut hebat</li>
          <li>Muntah terus-menerus</li>
          <li>Mimisan / gusi berdarah / bintik merah</li>
          <li>Sangat lemas, tangan-kaki dingin</li>
        </ul>
        <p className="text-sm">Darurat: <b>112</b> · Ambulans: <b>119</b></p>
      </aside>
    </section>
  );
}
