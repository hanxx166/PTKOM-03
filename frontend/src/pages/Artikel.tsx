import { useMemo, useState } from "react";
import { useContent } from "../lib/content";
import { useReveal } from "../lib/ui";

function preview(body: string[]): string {
  const t = body.join(" ");
  return t.length > 110 ? t.slice(0, 107).trimEnd() + "…" : t;
}

function fmt(d?: string): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function Artikel() {
  const { content, loading, error } = useContent();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | number | null>(null);
  useReveal([content, q]);

  const list = useMemo(() => {
    if (!content) return [];
    const s = q.toLowerCase();
    return content.articles.filter((a) => (a.title + " " + a.body.join(" ")).toLowerCase().includes(s));
  }, [content, q]);

  if (loading) return <p className="py-10">Memuat...</p>;
  if (error || !content) return <p className="py-10">Data gagal dimuat.</p>;

  const open = content.articles.find((a) => a.id === openId);

  return (
    <section className="rv border-b border-line py-11">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Artikel</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Cari artikel..."
          className="rounded-[10px] border border-line bg-white px-3 py-2"
        />
      </div>
      {!list.length && <p>Artikel tidak ditemukan.</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {list.map((a) => (
          <button
            key={String(a.id)}
            onClick={() => setOpenId(a.id)}
            className="cursor-pointer rounded-[14px] border border-line bg-white p-5 text-left transition hover:-translate-y-1 hover:border-acc hover:shadow-lg"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-acc">{a.tag} · {a.mins} menit</span>
            <h3 className="my-2 text-base font-bold">{a.title}</h3>
            <p className="text-sm text-muted">{preview(a.body)}</p>
            <small className="mt-2 block text-xs text-muted">{a.date ? "Diunggah " + fmt(a.date) : ""}</small>
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal onClick={() => setOpenId(null)}>
          <div className="max-h-[80vh] w-full max-w-[520px] overflow-auto rounded-[18px] bg-white p-7" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">{open.title}</h3>
            <small className="text-xs text-muted">{open.date ? "Diunggah " + fmt(open.date) : ""}</small>
            {open.body.map((t, i) => (
              <p key={i} className="mt-3">{t}</p>
            ))}
            <button className="mt-4 rounded-[10px] bg-acc px-5 py-2 font-bold text-white" onClick={() => setOpenId(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
