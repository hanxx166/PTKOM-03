import { useEffect, useState } from "react";
import { getToken, useAuth } from "../lib/auth";
import { apiDelete, apiGet, apiPost } from "../lib/api";

interface Entry {
  id: number;
  date: string;
  temp: number;
  note: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const useServer = () => Boolean(API_BASE && getToken());

function insight(s: Entry[]): [string, string] {
  if (!s.length) return ["", "Belum ada catatan. Mulai catat suhu tubuh Anda hari ini."];
  const fever = (i: number) => {
    let n = 0;
    for (; i >= 0 && s[i].temp >= 38; i--) n++;
    return n;
  };
  const last = s[s.length - 1];
  const run = fever(s.length - 1);
  if (run >= 2)
    return ["tinggi", `Demam 38°C atau lebih tercatat ${run} entri berturut-turut. Segera periksa ke dokter atau Poliklinik ITERA.`];
  if (run === 1)
    return ["sedang", "Demam terdeteksi. Banyak minum, istirahat, dan periksa ke dokter bila berlanjut lebih dari 2 hari."];
  const before = fever(s.length - 2);
  if (before >= 2)
    return ["sedang", `Suhu sudah turun, tetapi sebelumnya demam ${before} entri berturut-turut. Demam turun belum tentu sembuh, bisa jadi awal fase kritis DBD. Waspadai tanda bahaya.`];
  return ["rendah", `Suhu terakhir ${last.temp.toFixed(1)}°C, dalam batas normal. Tetap catat setiap hari.`];
}

export default function Catatan({ onNeedAuth }: { onNeedAuth: () => void }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("journal-local") || "[]");
    } catch {
      return [];
    }
  });
  const [synced, setSynced] = useState(false);

  // Sinkron dari server saat login (fallback tetap localStorage)
  useEffect(() => {
    if (!user || !useServer()) return;
    apiGet<{ entries: Entry[] }>("/api/journal")
      .then((j) => {
        setEntries(j.entries);
        setSynced(true);
      })
      .catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <section className="py-11">
        <h2 className="text-2xl font-bold">Catatan Demam Saya</h2>
        <p className="text-sm text-muted">Fitur khusus pengguna terdaftar: catat suhu tubuh harian, lihat grafiknya, dan dapatkan peringatan otomatis bila demam berlanjut.</p>
        <button onClick={onNeedAuth} className="mt-3 rounded-[10px] bg-acc px-5 py-2.5 font-bold text-white">Masuk / Daftar</button>
      </section>
    );
  }

  const s = [...entries].sort((a, b) => (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));
  const [lv, txt] = insight(s);
  const cls = lv === "tinggi" ? "bg-[#fde8e8] border-danger" : lv === "sedang" ? "bg-[#fff3cd] border-[#e0a100]" : lv === "rendah" ? "bg-[#e3f5ea] border-okgreen" : "bg-white border-line";

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget.elements as unknown as { date: { value: string }; temp: { value: string }; note: { value: string } };
    const payload = { date: f.date.value, temp: +f.temp.value, note: f.note.value.trim() };
    if (useServer()) {
      apiPost("/api/journal", payload)
        .then((j) => {
          const entry = (j as { entry: Entry }).entry;
          setEntries((prev) => {
            const next = [...prev.filter((x) => x.date !== entry.date), entry];
            try {
              localStorage.setItem("journal-local", JSON.stringify(next));
            } catch {
              /* abaikan */
            }
            return next;
          });
        })
        .catch(() => alert("Gagal menyimpan ke server"));
    } else {
      const next = [...entries, { id: Date.now(), ...payload }];
      setEntries(next);
      try {
        localStorage.setItem("journal-local", JSON.stringify(next));
      } catch {
        /* abaikan */
      }
    }
    e.currentTarget.reset();
  };

  const remove = (x: Entry) => {
    if (useServer()) {
      apiDelete(`/api/journal/${x.id}`)
        .then(() => setEntries((prev) => prev.filter((y) => y.id !== x.id)))
        .catch(() => alert("Gagal menghapus di server"));
      return;
    }
    const next = entries.filter((y) => y !== x);
    setEntries(next);
    try {
      localStorage.setItem("journal-local", JSON.stringify(next));
    } catch {
      /* abaikan */
    }
  };

  return (
    <section className="py-11">
      <h2 className="text-2xl font-bold">Catatan Demam Saya</h2>
      <p className="text-sm text-muted">Mode standalone: tersimpan di browser ini. Setelah backend deploy, tersimpan per-akun lintas device. Batang merah = suhu 38°C atau lebih.{user && (synced ? " (tersinkron ke server)" : "")}</p>
      <form onSubmit={save} className="my-3 grid gap-2.5 md:grid-cols-[150px_140px_1fr_auto]">
        <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-[10px] border border-line px-3 py-2" />
        <input type="number" name="temp" step="0.1" min="34" max="43" placeholder="Suhu (°C)" required className="rounded-[10px] border border-line px-3 py-2" />
        <input name="note" maxLength={200} placeholder="Catatan (opsional)" className="rounded-[10px] border border-line px-3 py-2" />
        <button className="rounded-[10px] bg-acc px-5 py-2 font-bold text-white">Simpan</button>
      </form>
      <div className={`rounded-xl border-l-[6px] p-4 ${cls}`}>{txt}</div>
      {s.length > 0 && (
        <div className="my-4 flex items-end gap-1.5 overflow-x-auto">
          {s.slice(-14).map((x) => (
            <div key={x.id} className="flex min-w-[34px] flex-1 flex-col items-center justify-end gap-0.5 text-xs text-muted">
              <span>{x.temp.toFixed(1)}</span>
              <div
                className={`w-[70%] rounded-t-md ${x.temp >= 38 ? "bg-danger" : "bg-[#8fb4e8]"}`}
                style={{ height: Math.max(4, Math.min(110, ((x.temp - 35) / 6) * 110)) + "px" }}
                title={`${x.temp}°C`}
              />
              <span>{x.date.slice(8)}/{x.date.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      )}
      {[...s].reverse().map((x) => (
        <div key={x.id} className="flex items-center justify-between gap-2 border-b border-line py-2 text-sm">
          <span>{x.date} · {x.temp.toFixed(1)}°C{x.note ? " · " + x.note : ""}</span>
          <button
            className="rounded-lg border border-line bg-white px-2.5 py-0.5 text-xs font-semibold hover:border-acc hover:text-acc"
            onClick={() => remove(x)}
          >
            Hapus
          </button>
        </div>
      ))}
    </section>
  );
}
