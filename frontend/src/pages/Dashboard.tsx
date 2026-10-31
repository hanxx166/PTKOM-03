import { motion } from "framer-motion";
import Feedback from "../components/Feedback";
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
    period: "Hari 1–2",
    title: "Fase demam",
    text: "Demam dapat muncul mendadak disertai nyeri kepala, sendi, atau belakang mata.",
    steps: [
      "Catat suhu dan kondisi",
      "Cukupkan cairan",
      "Konsultasikan obat ke tenaga kesehatan",
    ],
  },
  {
    period: "Hari 3–5",
    title: "Fase kritis",
    text: "Demam yang turun bukan selalu tanda sembuh. Waspadai tanda bahaya dan perubahan kondisi.",
    steps: [
      "Jangan terkecoh suhu turun",
      "Ikuti pemantauan dokter",
      "Segera ke IGD jika ada tanda bahaya",
    ],
  },
  {
    period: "Hari 6–7",
    title: "Fase pemulihan",
    text: "Pemulihan dan durasi setiap orang dapat berbeda; tetap ikuti arahan dokter.",
    steps: [
      "Tetap pantau kondisi",
      "Kontrol ulang sesuai jadwal",
      "Istirahat yang cukup",
    ],
  },
];

const EMERGENCY = [
  {
    className: "is-red",
    title: "IGD Terdekat",
    text: (
      <>
        Segera menuju IGD. <a href="https://maps.app.goo.gl/8bYLizYsvQsZoQta7" target="_blank" rel="noreferrer">Lihat rute ke RS Airan Raya</a>
      </>
    ),
  },
  {
    className: "is-orange",
    title: "Poliklinik ITERA",
    text: (
      <>
        Labtek O Lt.1 · <a href="https://maps.app.goo.gl/zeYtJC7PJbj8nbJb7" target="_blank" rel="noreferrer">Lihat peta</a>
      </>
    ),
  },
  {
    className: "is-blue",
    title: "RS Airan Raya",
    text: <>IGD 24 jam · <a href="https://maps.app.goo.gl/8bYLizYsvQsZoQta7" target="_blank" rel="noreferrer">Lihat peta</a></>,
  },
];

export default function Dashboard() {
  const { totalChecks, content, error, loading } = useContent();
  const reduced = useReducedMotion();
  const articles = content?.articles ?? [];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const formatDate = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return months[month - 1] && day
      ? `${day} ${months[month - 1]} ${year}`
      : iso;
  };
  const renderBold = (text: string) =>
    text
      .split(/(\*\*[^*]+\*\*)/g)
      .filter(Boolean)
      .map((part, index) =>
        part.startsWith("**") ? <b key={index}>{part.slice(2, -2)}</b> : part,
      );
  const tagClass: Record<string, string> = {
    Dasar: "is-basic",
    Gejala: "is-symptom",
    Pencegahan: "is-prevention",
    Penanganan: "is-handling",
    Tips: "is-tip",
  };

  return (
    <div className="dbd-home">
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
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          </motion.article>
        ))}
      </motion.section>

      <section
        className="dbd-section dbd-phase-section"
        aria-labelledby="phase-title"
      >
        <Reveal className="dbd-section-heading">
          <span className="dbd-kicker">Panduan fase</span>
          <h2 id="phase-title">Pahami 3 Fase DBD</h2>
          <p>
            Kenali perubahan kondisi dan jangan menunda pertolongan bila muncul
            tanda bahaya.
          </p>
        </Reveal>
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
            >
              <p className="dbd-phase-period">{phase.period}</p>
              <h3>{phase.title}</h3>
              <p>{phase.text}</p>
              <ul>
                {phase.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section
        className="dbd-section"
        id="bacaan"
        aria-labelledby="bacaan-title"
      >
        <Reveal className="dbd-section-heading">
          <span className="dbd-kicker">Informasi kesehatan</span>
          <h2 id="bacaan-title">Bacaan</h2>
          <p>Artikel ringkas untuk memahami pencegahan dan penanganan DBD.</p>
        </Reveal>
        {loading ? (
          <p className="dbd-card dbd-article-state" role="status">
            Memuat bacaan…
          </p>
        ) : error ? (
          <p className="dbd-card dbd-article-state" role="alert">
            Bacaan belum dapat dimuat. Silakan muat ulang halaman.
          </p>
        ) : articles.length === 0 ? (
          <p className="dbd-card dbd-article-state" role="status">
            Belum ada artikel yang tersedia saat ini.
          </p>
        ) : (
          <>
            <div className="dbd-article-list">
              {articles.map((article) => (
                <article
                  className="dbd-card dbd-article-card"
                  key={String(article.id)}
                >
                  <span
                    className={`dbd-tag ${tagClass[article.tag || ""] ?? ""}`}
                  >
                    {article.tag}
                  </span>
                  <h3>{article.title}</h3>
                  <p className="dbd-article-meta">
                    {article.mins} menit baca
                    {article.date ? ` · ${formatDate(article.date)}` : ""}
                  </p>
                  {article.body?.length > 0 && (
                    <details className="dbd-article-details">
                      <summary>Baca isi artikel</summary>
                      <div className="dbd-article-content">
                        {article.body.map((paragraph, index) => (
                          <p key={index}>{renderBold(paragraph)}</p>
                        ))}
                      </div>
                    </details>
                  )}
                </article>
              ))}
            </div>
            <Feedback />
          </>
        )}
      </section>
    </div>
  );
}
