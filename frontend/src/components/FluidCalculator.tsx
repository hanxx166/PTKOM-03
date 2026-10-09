import { useState } from "react";
import Reveal from "./Reveal";

interface PlateletEntry {
  id: string;
  day: number;
  value: number;
}

const KEY = "dbd-plt";

function readEntries(): { entries: PlateletEntry[]; error: string } {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(value)) throw new Error("Format data trombosit tidak valid.");
    return {
      entries: value.flatMap((item, index): PlateletEntry[] => {
        if (!item || !Number.isFinite(item.day)) return [];
        const plateletValue = Number.isFinite(item.value) ? item.value : item.val;
        if (!Number.isFinite(plateletValue)) return [];
        return [{ id: typeof item.id === "string" ? item.id : `legacy-${index}`, day: item.day, value: plateletValue }];
      }),
      error: "",
    };
  } catch (error) {
    return { entries: [], error: error instanceof Error ? error.message : "Data trombosit lokal tidak dapat dibaca." };
  }
}

function plateletStatus(value: number): { label: string; className: string } {
  if (value < 50_000) return { label: "Rendah", className: "is-danger" };
  if (value < 100_000) return { label: "Perlu konsultasi", className: "is-warning" };
  return { label: "Catatan", className: "is-normal" };
}

export default function FluidCalculator() {
  const [weight, setWeight] = useState("");
  const [ageGroup, setAgeGroup] = useState("dewasa");
  const [fluidEstimate, setFluidEstimate] = useState<number | null>(null);
  const [day, setDay] = useState("");
  const [value, setValue] = useState("");
  const [initial] = useState(readEntries);
  const [entries, setEntries] = useState(initial.entries);
  const [message, setMessage] = useState(initial.error);

  const calculateFluid = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const kg = Number(weight);
    if (!Number.isFinite(kg) || kg < 1 || kg > 250) {
      setMessage("Masukkan berat badan antara 1-250 kg.");
      return;
    }
    const ml = ageGroup === "anak"
      ? kg <= 10 ? kg * 100 : kg <= 20 ? 1000 + (kg - 10) * 50 : 1500 + (kg - 20) * 20
      : kg * 35;
    setFluidEstimate(Math.round(ml));
    setMessage("");
  };

  const persist = (next: PlateletEntry[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setEntries(next);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? `Gagal menyimpan data trombosit: ${error.message}` : "Gagal menyimpan data trombosit di browser.");
    }
  };

  const addPlatelet = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dayNumber = Number(day);
    const plateletValue = Number(value);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 14) {
      setMessage("Hari harus berupa angka 1-14.");
      return;
    }
    if (!Number.isInteger(plateletValue) || plateletValue < 0 || plateletValue > 500_000) {
      setMessage("Masukkan trombosit antara 0-500.000/µL.");
      return;
    }
    persist([...entries, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      day: dayNumber,
      value: plateletValue,
    }].sort((a, b) => a.day - b.day));
    setDay("");
    setValue("");
  };

  const removeEntry = (id: string) => persist(entries.filter((entry) => entry.id !== id));
  const points = entries.map((entry, index) => {
    const x = entries.length === 1 ? 340 : 48 + (index / (entries.length - 1)) * 584;
    const y = 166 - (Math.min(entry.value, 500_000) / 500_000) * 132;
    return { ...entry, x, y };
  });

  return (
    <section className="dbd-section" id="kalkulator">
      <Reveal className="dbd-section-heading">
        <span className="dbd-kicker">Alat bantu edukasi</span>
        <h2>🧮 Kalkulator Cairan &amp; Trombosit</h2>
        <p>Estimasi dan pencatatan sederhana. <b>Bukan pengganti penilaian dokter.</b></p>
      </Reveal>

      <div className="dbd-disclaimer dbd-disclaimer-wide">
        ⚠️ <b>Penting:</b> Angka di bawah hanya estimasi umum, bukan acuan klinis. Konsultasikan ke dokter atau fasilitas kesehatan, terutama bila kondisi memburuk atau ada tanda syok.
      </div>

      <div className="dbd-calc-grid">
        <div className="dbd-card">
          <h3>💧 Kalkulator Asupan Cairan</h3>
          <div className="dbd-info-box dbd-info-box-compact">
            <p><b>Ini perkiraan minum harian biasa</b> (bukan dosis infus), dihitung dari berat badan.</p>
            <p>Tetap ikuti anjuran dokter, apalagi kalau muntah terus atau tidak bisa minum.</p>
          </div>
          <form onSubmit={calculateFluid}>
            <div className="dbd-form-group">
              <label htmlFor="calc-weight">Berat badan (kg)</label>
              <input id="calc-weight" type="number" min="1" max="250" step="0.1" required value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Contoh: 55" />
            </div>
            <div className="dbd-form-group">
              <label htmlFor="calc-age">Kategori usia</label>
              <select id="calc-age" value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)}>
                <option value="anak">Anak (&lt;12 tahun)</option>
                <option value="dewasa">Dewasa (≥12 tahun)</option>
              </select>
            </div>
            <button className="dbd-button dbd-button-primary" type="submit">Hitung Estimasi</button>
          </form>
          {fluidEstimate !== null && (
            <div className="dbd-calc-result" aria-live="polite">
              <b>{fluidEstimate.toLocaleString("id-ID")} ml/hari</b>
              <span>≈ {Math.round(fluidEstimate / 240)} gelas 240 ml. Kebutuhan dapat berbeda; minta saran tenaga kesehatan.</span>
            </div>
          )}
          <p className="dbd-disclaimer">Pasien yang muntah hebat atau tidak bisa minum perlu penilaian tenaga medis.</p>
        </div>

        <div className="dbd-card">
          <h3>🩸 Log Trombosit</h3>
          <div className="dbd-info-box dbd-info-box-compact">
            <p><b>Trombosit = keping darah</b> yang membantu darah membeku. Normalnya sekitar 150–400 ribu/µL, saat DBD bisa turun.</p>
            <ul>
              <li>Di bawah 100 ribu → segera konsultasi ke dokter.</li>
              <li>Di bawah 50 ribu → kondisi bahaya, ke IGD.</li>
              <li>Isi angka <b>hanya dari hasil lab</b>, bukan tebak sendiri.</li>
            </ul>
          </div>
          <form className="dbd-tracker-form dbd-tracker-compact" onSubmit={addPlatelet}>
            <div className="dbd-form-group">
              <label htmlFor="platelet-day">Hari ke-</label>
              <input id="platelet-day" type="number" min="1" max="14" required value={day} onChange={(event) => setDay(event.target.value)} placeholder="1" />
            </div>
            <div className="dbd-form-group">
              <label htmlFor="platelet-value">Trombosit (/µL)</label>
              <input id="platelet-value" type="number" min="0" max="500000" step="1000" required value={value} onChange={(event) => setValue(event.target.value)} placeholder="150000" />
            </div>
            <button className="dbd-button dbd-button-primary" type="submit">＋ Catat</button>
          </form>

          <div className="dbd-chart-wrap dbd-platelet-chart">
            {points.length ? (
              <svg className="dbd-chart" viewBox="0 0 680 220" role="img" aria-label="Grafik catatan trombosit">
                {[100_000, 250_000, 400_000].map((count) => {
                  const y = 166 - (count / 500_000) * 132;
                  return (
                    <g key={count}>
                      <line x1="72" y1={y} x2="638" y2={y} className="dbd-chart-gridline" />
                      <text x="2" y={y + 4} className="dbd-chart-label">{(count / 1000).toFixed(0)}k</text>
                    </g>
                  );
                })}
                {points.length > 1 && <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} className="dbd-chart-line" />}
                {points.map((point) => (
                  <g key={point.id}>
                    <circle cx={point.x} cy={point.y} r="6" className={point.value < 100_000 ? "dbd-chart-hot-point" : "dbd-chart-point"} />
                    <text x={point.x} y="198" textAnchor="middle" className="dbd-chart-label">Hari {point.day}</text>
                  </g>
                ))}
              </svg>
            ) : (
              <p className="dbd-empty-state">Belum ada hasil laboratorium yang dicatat.</p>
            )}
          </div>

          <div className="dbd-log-list">
            {[...entries].reverse().map((entry) => {
              const status = plateletStatus(entry.value);
              return (
                <div className="dbd-log-row" key={entry.id}>
                  <span><b>Hari {entry.day}</b> · {entry.value.toLocaleString("id-ID")} /µL · <span className={`dbd-status ${status.className}`}>{status.label}</span></span>
                  <button className="dbd-text-button" type="button" onClick={() => removeEntry(entry.id)} aria-label={`Hapus catatan trombosit Hari ${entry.day}`}>Hapus</button>
                </div>
              );
            })}
          </div>
          <p className="dbd-disclaimer">Interpretasi trombosit harus dilakukan dokter. Nilai trombosit rendah perlu dibahas dengan tenaga kesehatan, bukan digunakan sendiri untuk menentukan diagnosis.</p>
        </div>
      </div>
      {message && <p className="dbd-error" role="alert">{message}</p>}
    </section>
  );
}
