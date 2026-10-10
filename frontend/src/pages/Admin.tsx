import { useEffect, useState } from "react";
import AdminCrud from "../components/AdminCrud";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import { useAuth } from "../lib/auth";

interface Row {
  id: number | string;
  title?: string;
  tag?: string;
  body?: string[];
  maps?: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Row[]>([]);
  const [stats, setStats] = useState<{ total: number; rendah: number; sedang: number; tinggi: number } | null>(null);
  const [maps, setMaps] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ id: "", title: "", tag: "Tips", body: "" });

  const load = () => {
    apiGet<Row[]>("/api/articles").then(setArticles).catch((e: Error) => setMsg(e.message));
    apiGet<{ total: number; rendah: number; sedang: number; tinggi: number }>("/api/checks/stats")
      .then(setStats)
      .catch(() => {});
    apiGet<{ maps: string }>("/api/settings/contact")
      .then((j) => setMaps(j.maps))
      .catch(() => {});
  };
  useEffect(load, []);

  if (user?.role !== "admin") {
    return (
      <section className="py-11">
        <h2 className="text-2xl font-bold">Admin</h2>
        <p className="text-sm text-muted">Halaman khusus admin. {user ? "Akun Anda bukan admin." : "Silakan masuk sebagai admin."}</p>
      </section>
    );
  }

  const submitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      const body = { title: form.title, tag: form.tag, body: form.body.split("\n").map((s) => s.trim()).filter(Boolean) };
      if (form.id) await apiPut(`/api/articles/${form.id}`, body);
      else await apiPost("/api/articles", body);
      setForm({ id: "", title: "", tag: "Tips", body: "" });
      load();
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Gagal menyimpan");
    }
  };

  const del = async (id: number | string) => {
    if (!confirm("Hapus artikel ini? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await apiDelete(`/api/articles/${id}`);
      load();
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Gagal menghapus");
    }
  };

  const saveMaps = async () => {
    try {
      await apiPut("/api/settings/contact", { maps });
      setMsg("Lokasi peta tersimpan.");
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Gagal menyimpan");
    }
  };

  return (
    <section className="py-11">
      <h2 className="text-2xl font-bold">Panel Admin</h2>
      {stats && (
        <p className="text-sm text-muted">
          Statistik cek gejala - total {stats.total} (rendah {stats.rendah}, sedang {stats.sedang}, tinggi {stats.tinggi})
        </p>
      )}

      <h3 className="mt-6 font-bold">{form.id ? "Edit artikel" : "Tambah artikel"}</h3>
      <form onSubmit={submitArticle} className="mt-2 grid gap-2.5 rounded-[14px] border border-line bg-surface p-4">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul" required className="rounded-[10px] border border-line px-3 py-2" />
        <div className="flex gap-2.5">
          <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="rounded-[10px] border border-line px-3 py-2">
            {["Dasar", "Gejala", "Pencegahan", "Penanganan", "Tips"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {form.id && (
            <button type="button" onClick={() => setForm({ id: "", title: "", tag: "Tips", body: "" })} className="rounded-[10px] border border-line px-3 py-2 text-sm">
              Batal edit
            </button>
          )}
        </div>
        <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Isi artikel (satu paragraf per baris)" rows={5} required className="rounded-[10px] border border-line px-3 py-2" />
        <button className="w-fit rounded-[10px] bg-acc px-5 py-2 font-bold text-onfill">Simpan</button>
      </form>

      <h3 className="mt-6 font-bold">Daftar artikel ({articles.length})</h3>
      <ul className="mt-2 divide-y divide-line rounded-[14px] border border-line bg-surface">
        {articles.map((a) => (
          <li key={String(a.id)} className="flex items-center justify-between gap-2 p-3 text-sm">
            <span><b>{a.title}</b> <span className="text-muted">· {a.tag}</span></span>
            <span className="flex shrink-0 gap-1.5">
              <button onClick={() => setForm({ id: String(a.id), title: a.title || "", tag: a.tag || "Tips", body: (a.body || []).join("\n") })} className="rounded-lg border border-line px-2.5 py-0.5 text-xs font-semibold hover:border-acc hover:text-acc">
                Edit
              </button>
              <button onClick={() => del(a.id)} className="rounded-lg border border-line px-2.5 py-0.5 text-xs font-semibold text-danger hover:border-danger">
                Hapus
              </button>
            </span>
          </li>
        ))}
      </ul>

      <AdminCrud
        title="gejala"
        endpoint="/api/symptoms"
        fields={[
          { name: "label", label: "Nama gejala", kind: "text" },
          { name: "w", label: "Bobot 1-3", kind: "number", min: 1, max: 3 },
          { name: "danger", label: "Tandai sebagai gejala bahaya", kind: "checkbox" },
        ]}
      />

      <AdminCrud
        title="FAQ"
        endpoint="/api/faq"
        fields={[
          { name: "question", label: "Pertanyaan", kind: "text" },
          { name: "answer", label: "Jawaban (tebal pakai **teks**)", kind: "textarea" },
        ]}
      />

      <h3 className="mt-6 font-bold">Lokasi peta</h3>
      <div className="mt-2 flex gap-2.5">
        <input value={maps} onChange={(e) => setMaps(e.target.value)} placeholder="Kata kunci lokasi di Google Maps" className="flex-1 rounded-[10px] border border-line px-3 py-2" />
        <button onClick={saveMaps} className="rounded-[10px] bg-acc px-5 py-2 font-bold text-onfill">Simpan</button>
      </div>
      {msg && <p className="mt-3 text-sm text-danger">{msg}</p>}
    </section>
  );
}
