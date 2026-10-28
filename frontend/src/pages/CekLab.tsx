import { motion } from "framer-motion";
import Reveal from "../components/Reveal";
import {
  cardHoverBox,
  cardHoverTransition,
  staggerChild,
  staggerParent,
  useReducedMotion,
} from "../lib/motion";

const TESTS = [
  {
    icon: "🩸",
    name: "Tes Darah Lengkap (CBC)",
    detects: "Jumlah trombosit dan hematokrit",
    detail: "Trombosit sering menurun pada DBD; hematokrit menandakan kebocoran plasma.",
    when: "Bisa dilakukan kapan saja saat demam. Pada fase kritis (hari ke-3 sampai ke-7), periksa secara berkala.",
  },
  {
    icon: "🔬",
    name: "Tes NS1 (Antigen)",
    detects: "Protein permukaan virus dengue",
    detail: "Paling berguna untuk deteksi dini DBD sebelum tubuh sempat membentuk antibodi.",
    when: "Efektif pada hari pertama sampai hari ke-9 sejak gejala muncul.",
  },
  {
    icon: "🧬",
    name: "Serologi IgM & IgG",
    detects: "Antibodi respons infeksi dengue",
    detail: "IgM menandakan infeksi akut; IgG menandakan infeksi lama atau tahap pemulihan.",
    when: "Umumnya mulai terdeteksi sejak hari ke-5 sejak gejala; dapat dipakai bersama tes NS1.",
  },
];

const WHEN_TO_CHECK = [
  "Demam tinggi berlangsung lebih dari 2 hari tanpa perbaikan.",
  "Muncul tanda bahaya: perdarahan, nyeri perut hebat, atau muntah terus-menerus.",
  "Memasuki fase kritis (hari ke-3 sampai ke-7): pantau trombosit secara berkala.",
  "Kontrol pemulihan: pastikan trombosit kembali naik sebelum aktivitas normal.",
];

export default function CekLab() {
  const reduced = useReducedMotion();

  return (
    <section className="dbd-section" id="cek-lab">
      <Reveal className="dbd-section-heading">
        <span className="dbd-kicker">Diagnosis &amp; pemantauan</span>
        <h2>🔬 Cek Lab di Poliklinik</h2>
        <p>Tes laboratorium membantu memastikan DBD dan memantau kondisi. Kenali jenis tes dan kapan waktu yang tepat untuk memeriksakan diri.</p>
      </Reveal>

      <div className="dbd-info-box">
        <p><b>Siapa yang perlu cek?</b> Bila demam tinggi lebih dari 2 hari, ada tanda bahaya, atau sedang menjalani pemantauan fase kritis DBD.</p>
        <p>Tes laboratorium <b>bukan satu-satunya dasar diagnosis</b> — dokter juga mempertimbangkan gejala dan riwayat kesehatan.</p>
      </div>

      <motion.div
        className="dbd-lab-grid"
        variants={staggerParent}
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "show"}
        viewport={{ once: true }}
      >
        {TESTS.map((test) => (
          <motion.article
            className="dbd-card dbd-lab-card"
            key={test.name}
            variants={staggerChild}
            whileHover={{ y: -4, boxShadow: cardHoverBox }}
            transition={cardHoverTransition}
          >
            <span className="dbd-lab-icon" aria-hidden="true">{test.icon}</span>
            <h3>{test.name}</h3>
            <p className="dbd-lab-detects">Mendeteksi: <b>{test.detects}</b></p>
            <p>{test.detail}</p>
            <p className="dbd-lab-when">🗓️ {test.when}</p>
          </motion.article>
        ))}
      </motion.div>

      <div className="dbd-lab-split">
        <article className="dbd-card">
          <h3>❓ Kapan Perlu Cek Darah?</h3>
          <ul className="dbd-lab-when-list">
            {WHEN_TO_CHECK.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="dbd-card dbd-lab-cta">
          <h3>🏥 Cek Lab di Poliklinik ITERA</h3>
          <p>Pemeriksaan darah dasar (golongan darah, gula darah, dan pemeriksaan umum) tersedia di:</p>
          <p><b>Poliklinik ITERA</b><br />Labtek O Lt.1, Jati Agung<br />📞 <a href="tel:+627218030188">(0721) 8030188</a><br />🕐 Senin–Jumat: 08.00–16.30 WIB</p>
          <p>Untuk tes spesifik DBD (NS1, IgM/IgG), tanyakan ketersediaan saat konsultasi; dokter akan merujuk bila perlu pemeriksaan lanjutan.</p>
          <a className="dbd-button dbd-button-primary" href="#/cek-gejala">🩺 Mulai dari Cek Gejala</a>
        </article>
      </div>

      <p className="dbd-disclaimer dbd-disclaimer-wide">
        ⚠️ Setelah cek lab, kamu bisa mencatat hasil trombosit di <a href="#/pelacak-suhu">Pelacak Suhu &amp; Trombosit</a> untuk memantau tren harian.
      </p>
    </section>
  );
}
