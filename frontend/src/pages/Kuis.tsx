import { useState } from "react";
import { useContent } from "../lib/content";
import { useReveal } from "../lib/ui";

export default function Kuis() {
  const { content, loading } = useContent();
  const [qi, setQi] = useState(0);
  const [qs, setQs] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  useReveal([content, qi]);

  if (loading || !content) return <p className="py-10">Memuat...</p>;
  const Q = content.quiz;
  if (!Q.length) return <p>Belum ada pernyataan.</p>;

  if (qi >= Q.length) {
    return (
      <section className="rv py-11">
        <h2 className="text-2xl font-bold">Fakta atau Mitos?</h2>
        <div className="mt-3 rounded-2xl border border-line bg-white p-6">
          <h3 className="text-xl font-bold">Skor Anda: {qs} dari {Q.length}</h3>
          <p>{qs >= Q.length - 1 ? "Hebat! Anda sudah paham DBD." : qs >= Q.length / 2 ? "Lumayan! Baca artikel lagi untuk melengkapi." : "Yuk baca artikelnya dulu, lalu coba lagi."}</p>
          <button className="mt-3 rounded-[10px] bg-acc px-5 py-2 font-bold text-white" onClick={() => { setQi(0); setQs(0); setPicked(null); }}>
            Main lagi
          </button>
        </div>
      </section>
    );
  }

  const q = Q[qi];
  return (
    <section className="rv py-11">
      <h2 className="text-2xl font-bold">Fakta atau Mitos?</h2>
      <div className="mt-3 rounded-2xl border border-line bg-white p-6">
        <span className="text-xs font-bold uppercase tracking-wide text-acc">Pernyataan {qi + 1} dari {Q.length}</span>
        <h3 className="my-2 text-lg font-bold">{q.s}</h3>
        <div className="my-4 flex gap-3">
          {([["Fakta", true], ["Mitos", false]] as [string, boolean][]).map(([t, v]) => (
            <button
              key={t}
              disabled={picked !== null}
              onClick={() => {
                setPicked(v);
                if (v === q.a) setQs((s) => s + 1);
              }}
              className={`rounded-[10px] border-2 px-7 py-2.5 font-bold disabled:cursor-default ${
                picked === null
                  ? "border-ink bg-white hover:bg-ink hover:text-white"
                  : v === q.a
                    ? "border-okgreen bg-okgreen text-white"
                    : picked === v
                      ? "border-danger bg-[#fde8e8] text-danger"
                      : "border-ink bg-white opacity-40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {picked !== null && (
          <>
            <p className={`rounded-[10px] p-3 ${picked === q.a ? "bg-[#e3f5ea]" : "bg-[#fde8e8]"}`}>
              {(picked === q.a ? "Benar! " : "Kurang tepat. ") + q.e}
            </p>
            <button
              className="mt-3 rounded-[10px] bg-acc px-5 py-2 font-bold text-white"
              onClick={() => { setQi((i) => i + 1); setPicked(null); }}
            >
              {qi + 1 < Q.length ? "Lanjut" : "Lihat skor"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
