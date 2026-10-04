import { useAuth } from "../lib/auth";
import { apiPost } from "../lib/api";
import { useContent } from "../lib/content";

function scoreLevel(score: number, hasDanger: boolean): "tinggi" | "sedang" | "rendah" {
  if (hasDanger || score >= 6) return "tinggi";
  if (score >= 3) return "sedang";
  return "rendah";
}

const ADVICE: Record<string, string> = {
  tinggi: "Segera periksa ke dokter atau IGD terdekat dan lakukan cek laboratorium.",
  sedang: "Istirahat, banyak minum, dan periksa ke dokter bila demam berlanjut lebih dari 2 hari.",
  rendah: "Gejala belum mengarah kuat ke DBD. Tetap pantau kondisi Anda.",
};

export default function CekGejala({ onNeedAuth }: { onNeedAuth: () => void }) {
  const { content, loading } = useContent();
  const { user } = useAuth();
  const [checked, setChecked] = React.useState<string[]>([]);
  const [result, setResult] = React.useState<string | null>(null);

  if (loading || !content) return <p className="py-10">Memuat...</p>;

  const show = () => {
    if (!user) {
      onNeedAuth();
      return;
    }
    if (!checked.length) {
      setResult("Pilih minimal satu gejala.");
      return;
    }
    const ch = content.symptoms.filter((x) => checked.includes(String(x.id)));
    const sc = ch.reduce((a, x) => a + x.w, 0);
    const lv = scoreLevel(sc, ch.some((x) => x.danger));
    setResult(`${lv}|${sc}`);
    // Catat ke statistik (best-effort, boleh anonim)
    apiPost("/api/checks", { level: lv, score: sc, symptomIds: checked }).catch(() => {});
  };

  const toggle = (id: string) =>
    setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const [lv, sc] = result?.includes("|") ? result.split("|") : [];
  const cls = lv === "tinggi" ? "bg-[#fde8e8] border-danger" : lv === "sedang" ? "bg-[#fff3cd] border-[#e0a100]" : lv === "rendah" ? "bg-[#e3f5ea] border-okgreen" : "bg-white border-line";

  return (
    <section className="py-11">
      <h2 className="text-2xl font-bold">Cek Gejala</h2>
      <p className="text-sm text-muted">Centang gejala yang sedang Anda alami. Hasil hanya skrining awal, bukan diagnosis.</p>
      <div className="my-4 grid gap-2.5 md:grid-cols-2">
        {content.symptoms.map((x) => (
          <label key={String(x.id)} className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-line bg-white p-3 hover:border-acc">
            <input type="checkbox" className="h-[18px] w-[18px] accent-[#1366d6]" checked={checked.includes(String(x.id))} onChange={() => toggle(String(x.id))} />
            <span>{x.label}</span>
          </label>
        ))}
      </div>
      <button onClick={show} className="rounded-[10px] bg-acc px-5 py-2.5 font-bold text-white">Lihat hasil</button>
      {result && (
        <div className={`mt-4 rounded-xl border-l-[6px] p-4 ${cls}`}>
          {lv ? (
            <>
              <b>{lv === "tinggi" ? "Risiko tinggi" : lv === "sedang" ? "Risiko sedang" : "Risiko rendah"} (skor {sc})</b>
              <p>{ADVICE[lv]} Ini hanya skrining awal, bukan diagnosis medis.</p>
            </>
          ) : (
            <p>{result}</p>
          )}
        </div>
      )}
      {!user && <p className="mt-2 text-sm text-muted">Hasil hanya untuk pengguna yang sudah masuk.</p>}
    </section>
  );
}

import * as React from "react";
