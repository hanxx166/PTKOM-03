import CekGejala from "./CekGejala";
import Education from "../components/Education";
import FluidCalculator from "../components/FluidCalculator";
import Hero from "../components/Hero";
import TemperatureTracker from "../components/TemperatureTracker";
import { useContent } from "../lib/content";

const PHASES = [
  {
    title: "🔥 Fase Demam (Hari 1–2)",
    text: "Demam dapat muncul mendadak disertai nyeri kepala, sendi, atau belakang mata.",
    steps: ["Catat suhu dan kondisi", "Cukupkan cairan", "Konsultasikan obat ke tenaga kesehatan"],
  },
  {
    title: "⚠️ Fase Kritis (Hari 3–5)",
    text: "Demam yang turun bukan selalu tanda sembuh. Waspadai tanda bahaya dan perubahan kondisi.",
    steps: ["Jangan terkecoh suhu turun", "Ikuti pemantauan dokter", "Segera ke IGD jika ada tanda bahaya"],
  },
  {
    title: "💚 Fase Pemulihan (Hari 6–7)",
    text: "Pemulihan dan durasi setiap orang dapat berbeda; tetap ikuti arahan dokter.",
    steps: ["Tetap pantau kondisi", "Kontrol ulang sesuai jadwal", "Istirahat yang cukup"],
  },
];

export default function Dashboard({ onNeedAuth }: { onNeedAuth: () => void }) {
  const { totalChecks, content } = useContent();
  const mapsQuery = encodeURIComponent(content?.contact?.maps || "Poliklinik ITERA, Lampung Selatan");

  return (
    <>
      <Hero totalChecks={totalChecks} />

      <section className="dbd-emergency-strip" aria-label="Kontak darurat dan layanan kesehatan">
        <article className="dbd-card dbd-emergency-card">
          <span className="dbd-emergency-icon is-red" aria-hidden="true">🚑</span>
          <div><h2>Ambulans / IGD</h2><p>Hubungi <b>119</b> atau ke IGD terdekat</p></div>
        </article>
        <article className="dbd-card dbd-emergency-card">
          <span className="dbd-emergency-icon is-orange" aria-hidden="true">🏥</span>
          <div><h2>Poliklinik ITERA</h2><p>Labtek O Lt.1 · <b>(0721) 8030188</b></p></div>
        </article>
        <article className="dbd-card dbd-emergency-card">
          <span className="dbd-emergency-icon is-blue" aria-hidden="true">☎️</span>
          <div><h2>RS Airan Raya</h2><p>IGD 24 jam, dekat kampus</p></div>
        </article>
      </section>

      <section className="dbd-section dbd-phase-section" aria-labelledby="phase-title">
        <div className="dbd-section-heading">
          <span className="dbd-kicker">Panduan fase</span>
          <h2 id="phase-title">Pahami 3 Fase DBD</h2>
          <p>Kenali perubahan kondisi dan jangan menunda pertolongan bila muncul tanda bahaya.</p>
        </div>
        <div className="dbd-phase-bar" aria-label="Fase demam, kritis, dan pemulihan">
          <span className="is-fever">Hari 1–2 · Fase Demam</span>
          <span className="is-critical">Hari 3–5 · ⚠️ Fase Kritis</span>
          <span className="is-recovery">Hari 6–7 · Pemulihan</span>
        </div>
        <div className="dbd-phase-grid">
          {PHASES.map((phase, index) => (
            <article className={`dbd-card dbd-phase-card${index === 1 ? " is-critical" : ""}`} key={phase.title}>
              <h3>{phase.title}</h3>
              <p>{phase.text}</p>
              <ul>{phase.steps.map((step) => <li key={step}>{step}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <CekGejala onNeedAuth={onNeedAuth} />
      <TemperatureTracker />
      <FluidCalculator />
      <Education />

      <footer className="dbd-footer">
        <div className="dbd-footer-grid">
          <div>
            <h2>cekDBD</h2>
            <p>Sistem edukasi dan pemantauan mandiri DBD untuk sivitas akademika ITERA.</p>
            <p className="dbd-footer-muted">⚕️ Bukan pengganti diagnosis dokter.</p>
          </div>
          <div>
            <h3>Kontak Medis</h3>
            <p>📍 Poliklinik ITERA, Labtek O Lt.1, Jati Agung</p>
            <p>📞 <a href="tel:+627218030188">(0721) 8030188</a></p>
            <p>🕐 Senin–Jumat: 08.00–16.30 WIB</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer">Buka lokasi di Google Maps ↗</a>
            <p><a href="https://www.instagram.com/poliklinik_itera/" target="_blank" rel="noreferrer">Instagram Poliklinik ITERA ↗</a></p>
          </div>
          <div>
            <h3>Rujukan</h3>
            <p>🏥 RS Airan Raya — IGD 24 jam</p>
            <p>🏥 RSUD Dr. H. Abdul Moeloek</p>
            <p>🚨 Darurat: <a href="tel:119"><b>119</b></a></p>
          </div>
        </div>
        <p className="dbd-copyright">© 2026 cekDBD – Poliklinik ITERA. Informasi ini bukan pengganti nasihat dokter.</p>
      </footer>
    </>
  );
}
