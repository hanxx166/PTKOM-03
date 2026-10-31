import ObatDBD, { MedicationRules } from "./ObatDBD";
import { motion } from "framer-motion";
import Checklist3M from "./Checklist3M";
import DangerPopup from "./DangerPopup";
import Reveal from "./Reveal";
import {
  cardHoverBox,
  cardHoverTransition,
  staggerChild,
  staggerParent,
  useReducedMotion,
} from "../lib/motion";

const TOPICS = [
  {
    tag: "Pencegahan",
    className: "is-prevention",
    title: "3M Plus di Kos & Asrama",
    text: (
      <>
        {" "}
        <b>Menguras</b> bak mandi, <b>Menutup</b> wadah air,{" "}
        <b>Mendaur ulang</b> barang bekas. Plus: gunakan repellent, pasang kasa,
        dan periksa tempat penampungan air.
      </>
    ),
  },
  {
    tag: "P3K",
    className: "is-first-aid",
    title: "Pertolongan Pertama Demam Tinggi",
    text: (
      <>
        Kompres hangat, cukupkan minum, dan gunakan obat hanya sesuai petunjuk
        tenaga kesehatan.{" "}
        <b>Hindari ibuprofen dan aspirin bila dicurigai DBD</b> kecuali
        diarahkan dokter.
      </>
    ),
  },
  {
    tag: "Pencegahan",
    className: "is-prevention",
    title: "Jam Rawan Nyamuk Aedes",
    text: (
      <>
        Aedes aegypti lebih aktif pada <b>pagi (06-09)</b> dan{" "}
        <b>sore (15-18)</b>. Gunakan lotion antinyamuk dan periksa tatakan
        dispenser atau vas bunga.
      </>
    ),
  },
  {
    tag: "Dasar",
    className: "is-basic",
    title: "Faktor Risiko DBD",
    text: (
      <>
        Risiko lebih besar jika <b>tinggal atau bepergian di daerah tropis</b>{" "}
        (Asia Tenggara, Pasifik Barat, Amerika Latin, Afrika) atau{" "}
        <b>pernah mengidap DBD sebelumnya</b>. Infeksi kedua dari serotipe lain
        berisiko lebih parah.
      </>
    ),
  },
  {
    tag: "Penanganan",
    className: "is-handling",
    title: "Komplikasi yang Harus Diwaspadai",
    text: (
      <>
        DBD berat dapat menyebabkan{" "}
        <b>perdarahan internal, syok dengue (DSS), dan kerusakan organ</b>. Pada
        ibu hamil, berisiko kelahiran prematur dan berat badan lahir rendah.
        Segera ke IGD bila muncul tanda bahaya.
      </>
    ),
  },
  {
    tag: "Tips",
    className: "is-tip",
    title: "Makanan Saat DBD",
    text: (
      <>
        Utamakan <b>makanan lembut dan mudah dicerna</b>: bubur, jeruk, ikan,
        sup daging sapi cincang, dan agar-agar.{" "}
        <b>Hindari makanan pedas, berminyak, dan sulit dicerna</b> yang bisa
        memperburuk kondisi perut.
      </>
    ),
  },
];

export default function Education() {
  const reduced = useReducedMotion();

  return (
    <section className="dbd-section" id="edukasi">
      {/* Popup posisi fixed, jadi aman ditaruh di awal section. */}
      <DangerPopup />
      <Reveal className="dbd-section-heading">
        <span className="dbd-kicker">Kenali dan cegah</span>
        <h2>Edukasi &amp; 3M Plus</h2>
        <p>
          Panduan pencegahan, pertolongan pertama, dan pertanyaan yang sering
          muncul seputar DBD.
        </p>
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

      <Checklist3M />

      <MedicationRules />

      <ObatDBD />
    </section>
  );
}
