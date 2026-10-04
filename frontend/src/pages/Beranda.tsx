import { useState } from "react";
import Hero from "../components/Hero";
import { useContent } from "../lib/content";
import { useReveal } from "../lib/ui";

export default function Beranda() {
  const { content, totalChecks, error, loading } = useContent();
  useReveal(content);

  if (loading) return <p className="py-10">Memuat...</p>;
  if (error || !content) return <p className="py-10">Data gagal dimuat: {error}. Pastikan file data/content.json tersedia.</p>;

  return (
    <>
      <Hero totalChecks={totalChecks} />
      <section className="rv border-b border-line py-11">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Seputar Informasi</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {content.facts.map((x) => (
            <div key={String(x.id)} className="rounded-[14px] border border-line bg-white p-5 transition hover:-translate-y-1 hover:border-acc">
              <b className="block font-head text-2xl text-acc">{x.big}</b>
              <span className="text-sm text-muted">{x.text}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function Placeholder({ title, text }: { title: string; text: string }) {
  const [v, setV] = useState(false);
  useReveal(v);
  return (
    <section className="rv py-11" onLoad={() => setV(true)}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted">{text}</p>
    </section>
  );
}
