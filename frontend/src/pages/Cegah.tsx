import { useEffect, useState } from "react";
import { getToken, useAuth } from "../lib/auth";
import { apiGet } from "../lib/api";
import { useContent } from "../lib/content";
import { Confetti, useReveal } from "../lib/ui";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function Cegah() {
  const { content, loading } = useContent();
  const { user } = useAuth();
  const [done, setDone] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("m3ids") || "[]");
    } catch {
      return [];
    }
  });
  const [celebrate, setCelebrate] = useState(false);
  useReveal(content);

  // Sinkron progres dari server saat login
  useEffect(() => {
    if (!user || !API_BASE || !getToken()) return;
    apiGet<{ done: string[] }>("/api/checklist")
      .then((j) => setDone(j.done))
      .catch(() => {});
  }, [user]);

  const toggle = (id: string, checked: boolean) => {
    setDone((d) => {
      const next = checked ? d.filter((x) => x !== id) : [...d, id];
      try {
        localStorage.setItem("m3ids", JSON.stringify(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
    if (user && API_BASE && getToken()) {
      fetch(`${API_BASE}/api/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + getToken() },
        body: JSON.stringify({ taskId: Number(id), done: !checked }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (content && content.tasks.length > 0 && done.length === content.tasks.length) setCelebrate(true);
  }, [done, content]);

  if (loading || !content) return <p className="py-10">Memuat...</p>;
  const pct = content.tasks.length ? Math.round((done.length / content.tasks.length) * 100) : 0;

  return (
    <section className="rv border-b border-line py-11">
      <h2 className="text-2xl font-bold">Checklist 3M Plus</h2>
      <p className="text-sm text-muted">Tandai yang sudah Anda lakukan minggu ini. Progres tersimpan di browser.</p>
      <div className="mt-3 h-[10px] overflow-hidden rounded-full bg-line">
        <i className="block h-full bg-okgreen transition-all" style={{ width: pct + "%" }} />
      </div>
      <p className="text-sm text-muted">{pct}% selesai</p>
      <div className="my-4 grid gap-2.5 md:grid-cols-2">
        {content.tasks.map((t) => {
          const id = String(t.id);
          const checked = done.includes(id);
          return (
            <label key={id} className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-line bg-white p-3 hover:border-acc">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] accent-[#1366d6]"
                checked={checked}
                onChange={() => toggle(id, checked)}
              />
              <span>{t.text}</span>
            </label>
          );
        })}
      </div>
      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCelebrate(false)}>
          <div className="rounded-[18px] bg-white p-7 text-center">
            <div className="pop-emoji">🎉</div>
            <h3 className="text-xl font-bold">Rumahmu siap lawan DBD!</h3>
            <p className="mb-4">Semua langkah 3M Plus minggu ini sudah selesai. Terus jaga kebersihan lingkungan ya!</p>
            <button className="rounded-[10px] bg-acc px-5 py-2 font-bold text-white" onClick={() => setCelebrate(false)}>Tutup</button>
          </div>
        </div>
      )}
      <Confetti show={false} />
    </section>
  );
}
