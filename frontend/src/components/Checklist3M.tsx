import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPut } from "../lib/api";
import { HAS_BACKEND } from "../lib/backend";
import { useAuth } from "../lib/auth";
import { useContent } from "../lib/content";
import Reveal from "./Reveal";

const LOCAL_KEY = "dbd-3m";

function readLocal(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

function writeLocal(done: string[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(done));
  } catch {
    /* penyimpanan penuh atau diblokir: centang tetap berlaku sesi ini */
  }
}

/**
 * Checklist 3M Plus. Pengguna login tersimpan per-akun lewat endpoint
 * /api/user/checklist; tamu disimpan di localStorage browser.
 */
export default function Checklist3M() {
  const { content } = useContent();
  const { user } = useAuth();
  const online = HAS_BACKEND && !!user;
  const [done, setDone] = useState<string[]>([]);
  const [loading, setLoading] = useState(online);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    if (!online) {
      setDone(readLocal());
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGet<{ done: string[] }>("/api/user/checklist")
      .then((j) => {
        if (alive) setDone(j.done || []);
      })
      .catch(() => {
        if (alive) setError("Gagal memuat checklist dari akun.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [online]);

  const toggle = useCallback(
    async (id: string) => {
      const next = done.includes(id) ? done.filter((value) => value !== id) : [...done, id];
      setDone(next);
      setError("");
      if (online) {
        try {
          await apiPut("/api/user/checklist", { taskId: id, done: !done.includes(id) });
        } catch {
          setError("Gagal menyimpan checklist ke akun.");
        }
      } else {
        writeLocal(next);
      }
    },
    [done, online],
  );

  const tasks = content?.tasks ?? [];
  if (!tasks.length) return null;
  const total = tasks.length;
  const finished = tasks.filter((task) => done.includes(String(task.id))).length;
  const percent = total ? Math.round((finished / total) * 100) : 0;

  return (
    <section className="dbd-section dbd-checklist-section" aria-labelledby="checklist-title">
      <Reveal className="dbd-section-heading">
        <span className="dbd-kicker">Aksi nyata di rumah</span>
        <h2 id="checklist-title">✅ Checklist 3M Plus Mingguan</h2>
        <p>Centang langkah yang sudah kamu lakukan. {online ? "Tersimpan di akunmu." : "Tersimpan di browser ini."}</p>
      </Reveal>

      <div className="dbd-card dbd-checklist-card">
        <div className="dbd-checklist-progress" role="progressbar" aria-valuenow={finished} aria-valuemin={0} aria-valuemax={total} aria-label="Progres checklist 3M Plus">
          <div className="dbd-checklist-progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="dbd-checklist-count">{finished}/{total} langkah selesai ({percent}%)</p>

        {loading ? (
          <p className="dbd-loading">Memuat checklist...</p>
        ) : (
          <div className="dbd-checklist-grid">
            {tasks.map((task) => {
              const id = String(task.id);
              const checked = done.includes(id);
              return (
                <label className={`dbd-check-item${checked ? " is-checked" : ""}`} key={id}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
                  <span>{task.text}</span>
                </label>
              );
            })}
          </div>
        )}

        {finished === total && (
          <p className="dbd-checklist-done">🎉 Semua langkah selesai! Ulangi rutin tiap minggu untuk memutus siklus jentik.</p>
        )}
        {!online && (
          <p className="dbd-login-note">Masuk akun agar checklist tersimpan lintas perangkat.</p>
        )}
        {error && <p className="dbd-error" role="alert">{error}</p>}
      </div>
    </section>
  );
}
