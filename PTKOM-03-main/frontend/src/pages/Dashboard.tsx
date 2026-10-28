import { motion } from "framer-motion";
import Hero from "../components/Hero";
import Reveal from "../components/Reveal";
import { useContent } from "../lib/content";
import {
  cardHoverBox,
  cardHoverTransition,
  staggerChild,
  staggerParent,
  useReducedMotion,
} from "../lib/motion";

const PHASES = [
  {
    title: "🔥 Fase Demam (Hari 1-2)",
    text: "Demam dapat muncul mendadak disertai nyeri kepala, sendi, atau belakang mata.",
    steps: ["Catat suhu dan kondisi", "Cukupkan cairan", "Konsultasikan obat ke tenaga kesehatan"],
  },
  {
    title: "⚠️ Fase Kritis (Hari 3-5)",
    text: "Demam yang turun bukan selalu tanda sembuh. Waspadai tanda bahaya dan perubahan kondisi.",
    steps: ["Jangan terkecoh suhu turun", "Ikuti pemantauan dokter", "Segera ke IGD jika ada tanda bahaya"],
  },
  {
    title: "💚 Fase Pemulihan (Hari 6-7)",
    text: "Pemulihan dan durasi setiap orang dapat berbeda; tetap ikuti arahan dokter.",
    steps: ["Tetap pantau kondisi", "Kontrol ulang sesuai jadwal", "Istirahat yang cukup"],
  },
];

const EMERGENCY = [
  {
    icon: "🚑",
    className: "is-red",
    title: "Ambulans / IGD",
    text: <>Hubungi <b>119</b> atau ke IGD terdekat</>,
  },
  {
    icon: "🏥",
    className: "is-orange",
    title: "Poliklinik ITERA",
    text: <>Labtek O Lt.1 · <b>(0721) 8030188</b></>,
  },
  {
    icon: "☎️",
    className: "is-blue",
    title: "RS Airan Raya",
    text: <>IGD 24 jam, dekat kampus</>,
  },
];

export default function Dashboard() {
  const { totalChecks } = useContent();
  const reduced = useReducedMotion();

  return (
    <>
      <Hero totalChecks={totalChecks} />

      <motion.section
        className="dbd-emergency-strip"
        aria-label="Kontak darurat dan layanan kesehatan"
        variants={staggerParent}
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "show"}
        viewport={{ once: true }}
      >
        {EMERGENCY.map((item) => (
          <motion.article
            className="dbd-card dbd-emergency-card"
            key={item.title}
            variants={staggerChild}
            whileHover={{ y: -4, boxShadow: cardHoverBox }}
            transition={cardHoverTransition}
          >
            <span className={`dbd-emergency-icon ${item.className}`} aria-hidden="true">{item.icon}</span>
            <div><h2>{item.title}</h2><p>{item.text}</p></div>
          </motion.article>
        ))}
      </motion.section>

      <section className="dbd-section dbd-phase-section" aria-labelledby="phase-title">
        <Reveal className="dbd-section-heading">
          <span className="dbd-kicker">Panduan fase</span>
          <h2 id="phase-title">Pahami 3 Fase DBD</h2>
          <p>Kenali perubahan kondisi dan jangan menunda pertolongan bila muncul tanda bahaya.</p>
        </Reveal>
        <div className="dbd-phase-bar" aria-label="Fase demam, kritis, dan pemulihan">
          <span className="is-fever">Hari 1-2 · Fase Demam</span>
          <span className="is-critical">Hari 3-5 · ⚠️ Fase Kritis</span>
          <span className="is-recovery">Hari 6-7 · Pemulihan</span>
        </div>
        <motion.div
          className="dbd-phase-grid"
          variants={staggerParent}
          initial={reduced ? false : "hidden"}
          whileInView={reduced ? undefined : "show"}
          viewport={{ once: true }}
        >
          {PHASES.map((phase) => (
            <motion.article
              className="dbd-card dbd-phase-card"
              key={phase.title}
              variants={staggerChild}
              whileHover={{ y: -4, boxShadow: cardHoverBox }}
              transition={cardHoverTransition}
            >
              <h3>{phase.title}</h3>
              <p>{phase.text}</p>
              <ul>{phase.steps.map((step) => <li key={step}>{step}</li>)}</ul>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </>
  );
}
