import { useState } from "react";
import Reveal from "./Reveal";

export default function FluidCalculator() {
  const [weight, setWeight] = useState("");
  const [ageGroup, setAgeGroup] = useState("dewasa");
  const [fluidEstimate, setFluidEstimate] = useState<number | null>(null);
  const isUnderTwenty = ["bayi-balita", "anak-anak", "remaja"].includes(
    ageGroup,
  );

  const calculateFluid = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const kg = Number(weight);
    if (!Number.isFinite(kg) || kg < 1 || kg > 250) {
      return;
    }
    const ml = isUnderTwenty
      ? kg <= 10
        ? kg * 100
        : kg <= 20
          ? 1000 + (kg - 10) * 50
          : 1500 + (kg - 20) * 20
      : kg * 35;
    setFluidEstimate(Math.round(ml));
  };

  return (
    <section className="dbd-section" id="kalkulator">
      <Reveal className="dbd-section-heading">
        <span className="dbd-kicker">Alat bantu edukasi</span>
        <h2>Kalkulator Kebutuhan Cairan</h2>
        <p>
          Estimasi sederhana minum harian dari berat badan.{" "}
          <b>Bukan pengganti penilaian dokter.</b>
        </p>
      </Reveal>

      <div className="dbd-disclaimer dbd-disclaimer-wide">
        <b>Penting:</b> Angka di bawah hanya estimasi umum, bukan acuan klinis.
        Konsultasikan ke dokter atau fasilitas kesehatan, terutama bila kondisi
        memburuk atau ada tanda syok.
      </div>

      <div className="dbd-calc-single">
        <div className="dbd-card">
          <h3>Perkiraan Asupan Cairan Harian</h3>
          <div className="dbd-info-box dbd-info-box-compact">
            <p>
              <b>Ini perkiraan minum harian biasa</b> (bukan dosis infus),
              dihitung dari berat badan.
            </p>
            <p>
              Tetap ikuti anjuran dokter, apalagi kalau muntah terus atau tidak
              bisa minum.
            </p>
          </div>
          <form className="dbd-calc-form" onSubmit={calculateFluid}>
            <div className="dbd-form-group">
              <label htmlFor="calc-weight">Berat badan (kg)</label>
              <input
                id="calc-weight"
                type="number"
                min="1"
                max="250"
                step="0.1"
                required
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="Contoh: 55"
              />
            </div>
            <div className="dbd-form-group">
              <label htmlFor="calc-age">Kategori usia</label>
              <select
                id="calc-age"
                value={ageGroup}
                onChange={(event) => setAgeGroup(event.target.value)}
              >
                <option value="bayi-balita">
                  Bayi &amp; Balita (&lt; 5 tahun)
                </option>
                <option value="anak-anak">Anak-anak (5-9 tahun)</option>
                <option value="remaja">Remaja (10-19 tahun)</option>
                <option value="dewasa">Dewasa (20-59 tahun)</option>
                <option value="lansia">Lansia (60+ tahun)</option>
              </select>
            </div>
            <button className="dbd-button dbd-button-primary" type="submit">
              Hitung Estimasi
            </button>
          </form>
          {fluidEstimate !== null && (
            <div className="dbd-calc-result" aria-live="polite">
              <b>{fluidEstimate.toLocaleString("id-ID")} ml/hari</b>
              <span>
                ≈ {Math.round(fluidEstimate / 240)} gelas 240 ml. Kebutuhan
                dapat berbeda; minta saran tenaga kesehatan.
              </span>
            </div>
          )}
          {ageGroup === "bayi-balita" && (
            <p className="dbd-disclaimer">
              Kebutuhan cairan bayi dan balita dapat berbeda. Konsultasikan
              takaran yang sesuai dengan tenaga kesehatan.
            </p>
          )}
          <p className="dbd-disclaimer">
            Pasien yang muntah hebat atau tidak bisa minum perlu penilaian
            tenaga medis.
          </p>
        </div>
      </div>
    </section>
  );
}
