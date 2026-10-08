import { useState } from "react";

interface TemperatureEntry {
  id: string;
  day: number;
  temperature: number;
  time: string;
}

const KEY = "dbd-temp";
const TIMES = ["Pagi", "Siang", "Sore", "Malam"];

function initialEntries(): { entries: TemperatureEntry[]; error: string } {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(value)) throw new Error("Format data suhu tidak valid.");
    return {
      entries: value.flatMap((item, index): TemperatureEntry[] => {
        if (!item || !Number.isFinite(item.day) || typeof item.time !== "string") return [];
        const temperature = Number.isFinite(item.temperature) ? item.temperature : item.temp;
        if (!Number.isFinite(temperature)) return [];
        return [{ id: typeof item.id === "string" ? item.id : `legacy-${index}`, day: item.day, temperature, time: item.time }];
      }),
      error: "",
    };
  } catch (error) {
    return { entries: [], error: error instanceof Error ? error.message : "Data suhu lokal tidak dapat dibaca." };
  }
}

export default function TemperatureTracker() {
  const [initial] = useState(initialEntries);
  const [entries, setEntries] = useState(initial.entries);
  const [day, setDay] = useState("");
  const [temperature, setTemperature] = useState("");
  const [time, setTime] = useState("Malam");
  const [message, setMessage] = useState(initial.error);

  const persist = (next: TemperatureEntry[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setEntries(next);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? `Gagal menyimpan data suhu: ${error.message}` : "Gagal menyimpan data suhu di browser.");
    }
  };

  const addEntry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dayNumber = Number(day);
    const temperatureNumber = Number(temperature);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 14) {
      setMessage("Hari harus berupa angka 1–14.");
      return;
    }
    if (!Number.isFinite(temperatureNumber) || temperatureNumber < 34 || temperatureNumber > 43) {
      setMessage("Masukkan suhu antara 34°C dan 43°C.");
      return;
    }
    const next = [...entries, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      day: dayNumber,
      temperature: temperatureNumber,
      time,
    }].sort((a, b) => a.day - b.day || TIMES.indexOf(a.time) - TIMES.indexOf(b.time));
    persist(next);
    setDay("");
    setTemperature("");
  };

  const removeEntry = (id: string) => persist(entries.filter((entry) => entry.id !== id));
  const points = entries.map((entry, index) => {
    const x = entries.length === 1 ? 340 : 48 + (index / (entries.length - 1)) * 584;
    const y = 170 - ((entry.temperature - 34) / 9) * 132;
    return { ...entry, x, y };
  });

  return (
    <section className="dbd-section" id="pelacak-suhu">
      <div className="dbd-section-heading">
        <span className="dbd-kicker">Pantau kondisi</span>
        <h2>🌡️ Pelacak Suhu (Dengue Tracker)</h2>
        <p>Catat suhu beberapa kali sehari. Perubahan suhu saja tidak bisa memastikan fase atau diagnosis DBD.</p>
      </div>

      <div className="dbd-card">
        <form className="dbd-tracker-form" onSubmit={addEntry}>
          <div className="dbd-form-group">
            <label htmlFor="track-day">Hari ke-</label>
            <input id="track-day" type="number" min="1" max="14" required value={day} onChange={(event) => setDay(event.target.value)} placeholder="1" />
          </div>
          <div className="dbd-form-group">
            <label htmlFor="track-temperature">Suhu (°C)</label>
            <input id="track-temperature" type="number" min="34" max="43" step="0.1" required value={temperature} onChange={(event) => setTemperature(event.target.value)} placeholder="38.5" />
          </div>
          <div className="dbd-form-group">
            <label htmlFor="track-time">Waktu</label>
            <select id="track-time" value={time} onChange={(event) => setTime(event.target.value)}>
              {TIMES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <button className="dbd-button dbd-button-primary" type="submit">＋ Catat</button>
        </form>

        <div className="dbd-chart-wrap">
          {points.length ? (
            <svg className="dbd-chart" viewBox="0 0 680 220" role="img" aria-label="Grafik catatan suhu tubuh">
              {[36, 38, 40, 42].map((value) => {
                const y = 170 - ((value - 34) / 9) * 132;
                return (
                  <g key={value}>
                    <line x1="42" y1={y} x2="638" y2={y} className={value === 38 ? "dbd-chart-danger-line" : "dbd-chart-gridline"} />
                    <text x="4" y={y + 4} className="dbd-chart-label">{value}°</text>
                  </g>
                );
              })}
              {points.length > 1 && <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} className="dbd-chart-line" />}
              {points.map((point) => (
                <g key={point.id}>
                  <circle cx={point.x} cy={point.y} r="6" className={point.temperature >= 38 ? "dbd-chart-hot-point" : "dbd-chart-point"} />
                  <text x={point.x} y="198" textAnchor="middle" className="dbd-chart-label">H{point.day} {point.time.slice(0, 2)}</text>
                </g>
              ))}
            </svg>
          ) : (
            <p className="dbd-empty-state">Belum ada catatan suhu. Tambahkan catatan pertama di atas.</p>
          )}
        </div>
        <p className="dbd-chart-caption"><span>● Suhu di bawah 38°C</span><span className="is-hot">● Suhu 38°C atau lebih</span></p>
        <div className="dbd-log-list">
          {[...entries].reverse().map((entry) => (
            <div className="dbd-log-row" key={entry.id}>
              <span><b>Hari {entry.day}</b> · {entry.time} · {entry.temperature.toFixed(1)}°C</span>
              <button className="dbd-text-button" type="button" onClick={() => removeEntry(entry.id)} aria-label={`Hapus catatan Hari ${entry.day} ${entry.time}`}>Hapus</button>
            </div>
          ))}
        </div>
        {message && <p className="dbd-error" role="alert">{message}</p>}
        <p className="dbd-disclaimer">🟠 Hari 1–2 demam &nbsp;|&nbsp; 🔴 Hari 3–5 berisiko kritis &nbsp;|&nbsp; 🟢 Hari 6–7 pemulihan. Fase tiap orang dapat berbeda; selalu ikuti arahan tenaga kesehatan.</p>
      </div>
    </section>
  );
}
