import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "./Reveal";
import {
  cardHoverBox,
  cardHoverTransition,
  instantTransition,
  staggerChild,
  staggerParent,
  useReducedMotion,
} from "../lib/motion";

const TOPICS = [
  {
    tag: "Pencegahan",
    className: "is-prevention",
    title: "3M Plus di Kos & Asrama",
    text: <> <b>Menguras</b> bak mandi, <b>Menutup</b> wadah air, <b>Mendaur ulang</b> barang bekas. Plus: gunakan repellent, pasang kasa, dan periksa tempat penampungan air.</>,
  },
  {
    tag: "P3K",
    className: "is-first-aid",
    title: "Pertolongan Pertama Demam Tinggi",
    text: <>Kompres hangat, cukupkan minum, dan gunakan obat hanya sesuai petunjuk tenaga kesehatan. <b>Hindari ibuprofen dan aspirin bila dicurigai DBD</b> kecuali diarahkan dokter.</>,
  },
  {
    tag: "Pencegahan",
    className: "is-prevention",
    title: "Jam Rawan Nyamuk Aedes",
    text: <>Aedes aegypti lebih aktif pada <b>pagi (06-09)</b> dan <b>sore (15-18)</b>. Gunakan lotion antinyamuk dan periksa tatakan dispenser atau vas bunga.</>,
  },
];

const FAQS = [
  {
    question: "Jambu biji menaikkan trombosit?",
    answer: <>Belum ada bukti klinis kuat bahwa jambu biji secara langsung menaikkan trombosit. Buah dapat menjadi bagian dari pola makan, tetapi tidak menggantikan cairan dan penanganan medis.</>,
  },
  {
    question: "Fogging saja cukup mencegah DBD?",
    answer: <><b>Tidak.</b> Fogging menyasar nyamuk dewasa dan tidak menghilangkan jentik. Pencegahan perlu dilengkapi pemberantasan sarang nyamuk dan 3M Plus.</>,
  },
  {
    question: "Suhu turun berarti sudah sembuh?",
    answer: <><b>Belum tentu.</b> Pada DBD, kondisi dapat memburuk ketika demam turun. Tetap waspadai tanda bahaya dan ikuti pemantauan tenaga kesehatan.</>,
  },
  {
    question: "Antibiotik menyembuhkan DBD?",
    answer: <>DBD disebabkan virus dengue, sehingga antibiotik tidak mengobati virus. Penanganan ditentukan dokter berdasarkan kondisi pasien.</>,
  },
  {
    question: "Sudah pernah DBD, tidak bisa kena lagi?",
    answer: <><b>Salah.</b> Terdapat beberapa serotipe virus dengue. Seseorang dapat terinfeksi kembali, jadi pencegahan tetap penting.</>,
  },
  {
    question: "Aedes aktif di malam hari?",
    answer: <>Aedes aegypti umumnya lebih aktif pada pagi dan sore hari. Gunakan perlindungan dari gigitan nyamuk sepanjang hari sesuai kebutuhan.</>,
  },
];

export default function Education() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const reduced = useReducedMotion();

  return (
    <section className="dbd-section" id="edukasi">
      <Reveal className="dbd-section-heading">
        <span className="dbd-kicker">Kenali dan cegah</span>
        <h2>📚 Edukasi &amp; 3M Plus</h2>
        <p>Panduan pencegahan, pertolongan pertama, dan klarifikasi mitos seputar DBD.</p>
      </Reveal>

      <motion.div
        className="dbd-education-grid"
        variants={staggerParent}
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "show"}
        viewport={{ once: true }}
      >
        {TOPICS.map((topic) => (
          <motion.article
            className="dbd-card dbd-education-card"
            key={topic.title}
            variants={staggerChild}
            whileHover={{ y: -4, boxShadow: cardHoverBox }}
            transition={cardHoverTransition}
          >
            <span className={`dbd-tag ${topic.className}`}>{topic.tag}</span>
            <h3>{topic.title}</h3>
            <p>{topic.text}</p>
          </motion.article>
        ))}
      </motion.div>

      <h3 className="dbd-faq-heading">Mitos vs Fakta</h3>
      <motion.div
        className="dbd-faq-list"
        variants={staggerParent}
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "show"}
        viewport={{ once: true }}
      >
        {FAQS.map((faq, index) => {
          const isOpen = openFaq === index;
          const answerId = `dbd-faq-answer-${index}`;
          return (
            <motion.article
              className={`dbd-faq-item${isOpen ? " is-open" : ""}`}
              key={faq.question}
              variants={staggerChild}
            >
              <h4>
                <button
                  type="button"
                  className="dbd-faq-question"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <span>{faq.question}</span><span className="dbd-faq-arrow" aria-hidden="true">▼</span>
                </button>
              </h4>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={reduced ? instantTransition : { duration: 0.28, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="dbd-faq-answer" id={answerId}>{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
