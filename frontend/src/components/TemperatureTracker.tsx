import { useState } from "react";
import Reveal from "./Reveal";
import { useTrackerLog } from "../lib/tracker";
import { downloadFeverPdf } from "../lib/feverPdf";

const TIMES = ["Pagi", "Siang", "Sore", "Malam"];

function plateletStatus(value: number): { label: string; className: string } {
  if (value < 50_000) return { label: "Rendah", className: "is-danger" };
  if (value < 100_000)
    return { label: "Perlu konsultasi", className: "is-warning" };
  return { label: "Catatan", className: "is-normal" };
}

export default function TemperatureTracker() {
  const fever = useTrackerLog("fever");
  const platelet = useTrackerLog("platelet");
  const [day, setDay] = useState("");
  const [temperature, setTemperature] = useState("");
  const [time, setTime] = useState("Malam");
  const [message, setMessage] = useState("");
  const [pltDay, setPltDay] = useState("");
  const [pltValue, setPltValue] = useState("");

  const addEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dayNumber = Number(day);
    const temperatureNumber = Number(temperature);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 14) {
      setMessage("Hari harus berupa angka 1-14.");
      return;
    }
    if (
      !Number.isFinite(temperatureNumber) ||
      temperatureNumber < 34 ||
      temperatureNumber > 43
    ) {
      setMessage("Masukkan suhu antara 34°C dan 43°C.");
      return;
    }
    try {
      await fever.add({ day: dayNumber, time, temp: temperatureNumber });
      setMessage("");
      setDay("");
      setTemperature("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan catatan suhu.",
      );
    }
  };

  const removeFever = async (id: number | string) => {
    try {
      await fever.remove(id);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal menghapus catatan suhu.",
      );
    }
  };

  const addPlatelet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dayNumber = Number(pltDay);
    const plateletValue = Number(pltValue);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 14) {
      setMessage("Hari harus berupa angka 1-14.");
      return;
    }
    if (
      !Number.isInteger(plateletValue) ||
      plateletValue < 0 ||
      plateletValue > 500_000
    ) {
      setMessage("Masukkan trombosit antara 0-500.000/µL.");
      return;
    }
    try {
      await platelet.add({ day: dayNumber, value: plateletValue });
      setMessage("");
      setPltDay("");
      setPltValue("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan catatan trombosit.",
      );
    }
  };

  const removePlatelet = async (id: number | string) => {
    try {
      await platelet.remove(id);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal menghapus catatan trombosit.",
      );
    }
  };

  const feverPoints = fever.entries.map((entry, index) => {
    const x =
      fever.entries.length === 1
        ? 340
        : 48 + (index / (fever.entries.length - 1)) * 584;
    const y = 170 - ((entry.temp - 34) / 9) * 132;
    return { ...entry, x, y };
  });

  const pltPoints = platelet.entries.map((entry, index) => {
    const x =
      platelet.entries.length === 1
        ? 340
        : 48 + (index / (platelet.entries.length - 1)) * 584;
    const y = 166 - (Math.min(entry.value, 500_000) / 500_000) * 132;
    return { ...entry, x, y };
  });

  return (
    <section className="dbd-section" id="pelacak-suhu">
      <Reveal className="dbd-section-heading">
        <span className="dbd-kicker">Pantau kondisi</span>
        <h2>Pelacak Suhu &amp; Trombosit</h2>
        <p>
          Catat suhu beberapa kali sehari dan hasil lab trombosit. Perubahan
          suhu saja tidak bisa memastikan fase atau diagnosis DBD.
        </p>
      </Reveal>

      <div className="dbd-card">
        <div className="dbd-tracker-heading-row">
          <h3 className="dbd-subheading-top">Catatan Suhu Harian</h3>
          <button
            className="dbd-button dbd-button-outline dbd-button-small"
            type="button"
            onClick={() => downloadFeverPdf(fever.entries)}
          >
            Unduh PDF
          </button>
        </div>
        <form className="dbd-tracker-form" onSubmit={addEntry}>
          <div className="dbd-form-group">
            <label htmlFor="track-day">Hari ke-</label>
            <input
              id="track-day"
              type="number"
              min="1"
              max="14"
              required
              value={day}
              onChange={(event) => setDay(event.target.value)}
              placeholder="1"
            />
          </div>
          <div className="dbd-form-group">
            <label htmlFor="track-temperature">Suhu (°C)</label>
            <input
              id="track-temperature"
              type="number"
              min="34"
              max="43"
              step="0.1"
              required
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              placeholder="38.5"
            />
          </div>
          <div className="dbd-form-group">
            <label htmlFor="track-time">Waktu</label>
            <select
              id="track-time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            >
              {TIMES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <button className="dbd-button dbd-button-primary" type="submit" disabled={fever.saving}>
            {fever.saving ? "Menyimpan..." : "＋ Catat"}
          </button>
        </form>

        <div className="dbd-chart-wrap">
          {feverPoints.length ? (
            <svg
              className="dbd-chart"
              viewBox="0 0 680 220"
              role="img"
              aria-label="Grafik catatan suhu tubuh"
            >
              {[36, 38, 40, 42].map((value) => {
                const y = 170 - ((value - 34) / 9) * 132;
                return (
                  <g key={value}>
                    <line
                      x1="42"
                      y1={y}
                      x2="638"
                      y2={y}
                      className={
                        value === 38
                          ? "dbd-chart-danger-line"
                          : "dbd-chart-gridline"
                      }
                    />
                    <text x="4" y={y + 4} className="dbd-chart-label">
                      {value}°
                    </text>
                  </g>
                );
              })}
              {feverPoints.length > 1 && (
                <polyline
                  points={feverPoints
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  className="dbd-chart-line"
                />
              )}
              {feverPoints.map((point) => (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    className={
                      point.temp >= 38
                        ? "dbd-chart-hot-point"
                        : "dbd-chart-point"
                    }
                  />
                </g>
              ))}
            </svg>
          ) : (
            <p className="dbd-empty-state">
              Belum ada catatan suhu. Tambahkan catatan pertama di atas.
            </p>
          )}
        </div>
        <div className="dbd-log-list">
          {[...fever.entries].reverse().map((entry) => (
            <div className="dbd-log-row" key={entry.id}>
              <span>
                <b>Hari {entry.day}</b> · {entry.time} · {entry.temp.toFixed(1)}
                °C
              </span>
              <button
                className="dbd-text-button"
                type="button"
                onClick={() => removeFever(entry.id)}
                aria-label={`Hapus catatan Hari ${entry.day} ${entry.time}`}
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="dbd-card dbd-platelet-card">
        <h3 className="dbd-subheading-top">Catatan Trombosit (Hasil Lab)</h3>
        <div className="dbd-info-box dbd-info-box-compact">
          <p>
            <b>Trombosit = keping darah</b> yang membantu darah membeku.
            Normalnya sekitar 150–400 ribu/µL, saat DBD bisa turun.
          </p>
          <ul>
            <li>Di bawah 100 ribu → segera konsultasi ke dokter.</li>
            <li>Di bawah 50 ribu → kondisi bahaya, ke IGD.</li>
            <li>
              Isi angka <b>hanya dari hasil lab</b>, bukan tebak sendiri.
            </li>
          </ul>
        </div>
        <form
          className="dbd-tracker-form dbd-tracker-compact"
          onSubmit={addPlatelet}
        >
          <div className="dbd-form-group">
            <label htmlFor="platelet-day">Hari ke-</label>
            <input
              id="platelet-day"
              type="number"
              min="1"
              max="14"
              required
              value={pltDay}
              onChange={(event) => setPltDay(event.target.value)}
              placeholder="1"
            />
          </div>
          <div className="dbd-form-group">
            <label htmlFor="platelet-value">Trombosit (/µL)</label>
            <input
              id="platelet-value"
              type="number"
              min="0"
              max="500000"
              step="1000"
              required
              value={pltValue}
              onChange={(event) => setPltValue(event.target.value)}
              placeholder="150000"
            />
          </div>
          <button className="dbd-button dbd-button-primary" type="submit" disabled={platelet.saving}>
            {platelet.saving ? "Menyimpan..." : "＋ Catat"}
          </button>
        </form>

        <div className="dbd-chart-wrap dbd-platelet-chart">
          {pltPoints.length ? (
            <svg
              className="dbd-chart"
              viewBox="0 0 680 220"
              role="img"
              aria-label="Grafik catatan trombosit"
            >
              {[100_000, 250_000, 400_000].map((count) => {
                const y = 166 - (count / 500_000) * 132;
                return (
                  <g key={count}>
                    <line
                      x1="72"
                      y1={y}
                      x2="638"
                      y2={y}
                      className="dbd-chart-gridline"
                    />
                    <text x="2" y={y + 4} className="dbd-chart-label">
                      {(count / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}
              {pltPoints.length > 1 && (
                <polyline
                  points={pltPoints
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  className="dbd-chart-line"
                />
              )}
              {pltPoints.map((point) => (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    className={
                      point.value < 100_000
                        ? "dbd-chart-hot-point"
                        : "dbd-chart-point"
                    }
                  />
                  <text
                    x={point.x}
                    y="198"
                    textAnchor="middle"
                    className="dbd-chart-label"
                  >
                    Hari {point.day}
                  </text>
                </g>
              ))}
            </svg>
          ) : (
            <p className="dbd-empty-state">
              Belum ada hasil laboratorium yang dicatat.
            </p>
          )}
        </div>

        <div className="dbd-log-list">
          {[...platelet.entries].reverse().map((entry) => {
            const status = plateletStatus(entry.value);
            return (
              <div className="dbd-log-row" key={entry.id}>
                <span>
                  <b>Hari {entry.day}</b> ·{" "}
                  {entry.value.toLocaleString("id-ID")} /µL ·{" "}
                  <span className={`dbd-status ${status.className}`}>
                    {status.label}
                  </span>
                </span>
                <button
                  className="dbd-text-button"
                  type="button"
                  onClick={() => removePlatelet(entry.id)}
                  aria-label={`Hapus catatan trombosit Hari ${entry.day}`}
                >
                  Hapus
                </button>
              </div>
            );
          })}
        </div>
        <p className="dbd-disclaimer">
          Interpretasi trombosit harus dilakukan dokter. Nilai trombosit rendah
          perlu dibahas dengan tenaga kesehatan, bukan digunakan sendiri untuk
          menentukan diagnosis. Info tes lab ada di halaman{" "}
          <a href="#/cek-kesehatan">Cek Gejala &amp; Lab</a>.
        </p>
      </div>
      {message || fever.message || platelet.message ? (
        <p className="dbd-error" role="alert">
          {message || fever.message || platelet.message}
        </p>
      ) : null}
    </section>
  );
}
