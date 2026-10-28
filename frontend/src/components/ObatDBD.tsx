import { useMemo, useState } from "react";
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
import "../obat.css";

type Level = "ok" | "care" | "avoid";
type Filter = "all" | Level;

interface Drug {
  id: string;
  name: string;
  icon: string;
  level: Level;
  use: string;
  note: string;
  /** Nama bahan / merek yang dicocokkan di "Cek Nama Obat" (huruf kecil, min. 4 huruf). */
  aliases: string[];
  /** Foto obat opsional. */
  image?: string;
}

const LEVELS: Record<Level, { label: string; icon: string; title: string }> = {
  ok: { label: "Boleh", icon: "✅", title: "Umumnya boleh" },
  care: { label: "Hati-hati", icon: "⚠️", title: "Hanya atas arahan dokter" },
  avoid: { label: "Hindari", icon: "⛔", title: "Hindari" },
};

/** Urutan keparahan: bila satu kata cocok ke beberapa obat, yang paling berisiko ditampilkan. */
const SEVERITY: Record<Level, number> = { ok: 0, care: 1, avoid: 2 };

const DRUGS: Drug[] = [
  {
    id: "paracetamol",
    name: "Paracetamol",
    icon: "💊",
    level: "ok",
    use: "Menurunkan demam dan meredakan nyeri.",
    note: "Penurun demam yang umum dianjurkan saat DBD. Ikuti dosis di kemasan atau arahan tenaga kesehatan, jangan melebihi batas harian, dan jangan digabung dengan produk lain yang juga mengandung paracetamol.",
    aliases: ["paracetamol", "parasetamol", "acetaminophen", "sanmol", "tempra", "biogesic", "panadol"],
  },
  {
    id: "oralit",
    name: "Oralit & cairan",
    icon: "🥤",
    level: "ok",
    use: "Mengganti cairan dan elektrolit yang hilang.",
    note: "Cairan adalah penanganan utama. Selain oralit, bisa dari air putih, jus buah, susu, atau sup hangat. Minum sedikit tapi sering bila mual.",
    aliases: ["oralit", "rehidrasi", "elektrolit", "air putih"],
  },
  {
    id: "infus",
    name: "Infus cairan",
    icon: "💧",
    level: "care",
    use: "Diberikan di fasilitas kesehatan bila tidak bisa minum cukup atau kondisi memburuk.",
    note: "Jenis dan kecepatan cairan diatur dokter berdasarkan hasil pemeriksaan. Tidak boleh dipasang atau diatur sendiri.",
    aliases: ["infus", "ringer", "intravena"],
  },
  {
    id: "antimual",
    name: "Obat anti-mual",
    icon: "🤢",
    level: "care",
    use: "Untuk mual atau muntah yang mengganggu minum.",
    note: "Diberikan dokter bila mual membuat cairan sulit masuk. Muntah terus-menerus adalah tanda bahaya, jangan hanya ditangani sendiri di rumah.",
    aliases: ["antimual", "anti mual", "antimuntah", "ondansetron", "domperidon", "metoklopramid"],
  },
  {
    id: "maag",
    name: "Obat maag / antasida",
    icon: "🫧",
    level: "care",
    use: "Meredakan perih ulu hati atau perut kembung.",
    note: "Dokter kadang meresepkannya karena DBD bisa mengiritasi lambung. Nyeri perut hebat bukan sekadar maag, segera periksa.",
    aliases: ["antasida", "maag", "promag", "mylanta", "omeprazole", "lansoprazole"],
  },
  {
    id: "kombinasi",
    name: "Obat flu & sakit kepala kombinasi",
    icon: "🧪",
    level: "care",
    use: "Produk berisi beberapa bahan aktif sekaligus.",
    note: "Komposisinya beragam. Ada yang sudah mengandung paracetamol (risiko dosis ganda) atau bahan lain yang tidak cocok untuk DBD. Baca komposisi dan tanyakan apoteker atau dokter sebelum minum.",
    aliases: ["obat flu", "obat batuk", "sakit kepala", "kombinasi", "decolgen", "paramex", "bodrex", "neozep", "oskadon", "procold"],
  },
  {
    id: "herbal",
    name: "Herbal & suplemen",
    icon: "🌿",
    level: "care",
    use: "Jus jambu, ekstrak daun jambu, angkak, vitamin, dan sejenisnya.",
    note: "Belum ada bukti klinis kuat bahwa herbal atau suplemen menaikkan trombosit. Boleh sebagai pelengkap bila disetujui dokter, tapi tidak menggantikan cairan dan pemantauan.",
    aliases: ["herbal", "suplemen", "jamu", "angkak", "jambu", "vitamin"],
  },
  {
    id: "antibiotik",
    name: "Antibiotik",
    icon: "🦠",
    level: "care",
    use: "Melawan bakteri, bukan virus dengue.",
    note: "Tidak menyembuhkan DBD. Hanya diberikan bila dokter menemukan infeksi bakteri lain. Jangan membeli atau memakai sisa antibiotik sendiri.",
    aliases: ["antibiotik", "amoxicillin", "amoksisilin", "azithromycin", "ciprofloxacin", "cefixime"],
  },
  {
    id: "aspirin",
    name: "Aspirin (asetosal)",
    icon: "🚫",
    level: "avoid",
    use: "Pereda nyeri dan penurun demam golongan NSAID.",
    note: "Mengganggu pembekuan darah dan mengiritasi lambung sehingga memperbesar risiko perdarahan saat DBD.",
    aliases: ["aspirin", "asetosal", "aspilets", "acetylsalicylic"],
  },
  {
    id: "ibuprofen",
    name: "Ibuprofen",
    icon: "🚫",
    level: "avoid",
    use: "Pereda nyeri dan penurun demam golongan NSAID.",
    note: "Dapat memperburuk risiko perdarahan dan iritasi lambung. Pilih paracetamol, kecuali dokter mengarahkan lain.",
    aliases: ["ibuprofen", "proris", "brufen"],
  },
  {
    id: "naproxen",
    name: "Naproxen",
    icon: "🚫",
    level: "avoid",
    use: "Pereda nyeri dan antiradang golongan NSAID.",
    note: "Sama seperti NSAID lain, dapat meningkatkan risiko perdarahan pada DBD.",
    aliases: ["naproxen", "naproksen"],
  },
  {
    id: "mefenamat",
    name: "Asam mefenamat",
    icon: "🚫",
    level: "avoid",
    use: "Pereda nyeri golongan NSAID, sering dipakai untuk sakit gigi atau nyeri haid.",
    note: "Termasuk NSAID, jadi sebaiknya dihindari saat dicurigai DBD kecuali diarahkan dokter.",
    aliases: ["mefenamat", "mefenamic", "ponstan", "mefinal"],
  },
  {
    id: "diklofenak",
    name: "Diklofenak",
    icon: "🚫",
    level: "avoid",
    use: "Pereda nyeri dan antiradang golongan NSAID.",
    note: "Golongan NSAID yang juga sebaiknya dihindari saat dicurigai DBD.",
    aliases: ["diklofenak", "diclofenac", "voltaren", "cataflam"],
  },
];

const RULES = [
  { title: "Cairan dulu", text: "Obat hanya pendukung. Yang utama adalah minum cukup sepanjang hari." },
  { title: "Baca komposisi", text: "Nama dagang bisa menyesatkan. Cek bahan aktif di kemasan sebelum minum." },
  { title: "Catat jam & jenis obat", text: "Tulis kapan dan apa yang diminum, lalu tunjukkan ke dokter saat periksa." },
  { title: "Demam turun ≠ sembuh", text: "Hari ke-3 sampai ke-7 adalah fase kritis. Tetap pantau meski suhu sudah turun." },
];

const DANGER = [
  "Nyeri perut hebat",
  "Muntah terus-menerus",
  "Perdarahan (gusi, hidung, BAB hitam)",
  "Tangan dan kaki dingin, lemas",
  "Sulit bernapas",
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "ok", label: "✅ Boleh" },
  { id: "care", label: "⚠️ Hati-hati" },
  { id: "avoid", label: "⛔ Hindari" },
];

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

/** Cari obat dari nama bahan atau merek. Bila cocok ke beberapa, ambil yang paling berisiko. */
function findDrug(query: string): Drug | null {
  const q = normalize(query);
  if (q.length < 4) return null;
  const hits = DRUGS.filter((d) => d.aliases.some((a) => a.includes(q) || q.includes(a)));
  if (hits.length === 0) return null;
  return hits.sort((a, b) => SEVERITY[b.level] - SEVERITY[a.level])[0];
}

export default function ObatDBD() {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const searched = normalize(query).length >= 4;
  const result = useMemo(() => findDrug(query), [query]);
  const visible = filter === "all" ? DRUGS : DRUGS.filter((d) => d.level === filter);
  const count = (l: Level) => DRUGS.filter((d) => d.level === l).length;

  return (
    <section className="dbd-obat" id="obat" aria-labelledby="dbd-obat-title">
      <Reveal>
        <div className="dbd-obat-banner">
          <div>
            <span className="dbd-kicker">Kotak obat</span>
            <h3 id="dbd-obat-title">💊 Obat Saat DBD: Mana yang Aman?</h3>
            <p>
              Belum ada obat khusus untuk virus dengue. Pegang tiga warna ini: <b>hijau</b> boleh,{" "}
              <b>kuning</b> tunggu arahan dokter, <b>merah</b> hindari.
            </p>
            <div className="dbd-obat-stats">
              <span className="dbd-obat-stat is-ok"><i aria-hidden="true" />{count("ok")} boleh</span>
              <span className="dbd-obat-stat is-care"><i aria-hidden="true" />{count("care")} hati-hati</span>
              <span className="dbd-obat-stat is-avoid"><i aria-hidden="true" />{count("avoid")} hindari</span>
            </div>
          </div>
          <div className="dbd-obat-art" aria-hidden="true">
            <span className="dbd-obat-capsule is-big" />
            <span className="dbd-obat-capsule is-small" />
            <span className="dbd-obat-dot" />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="dbd-card dbd-obat-check">
          <label htmlFor="dbd-obat-input">🔎 Cek nama obat</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <input
              id="dbd-obat-input"
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Contoh: ibuprofen, Sanmol, antibiotik"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="dbd-obat-filter is-active"
                onClick={() => setFilterOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
              >
                Filter
              </button>
              {filterOpen && (
                <div
                  role="listbox"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 4px)",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 4,
                    zIndex: 10,
                    minWidth: 140,
                  }}
                >
                  {FILTERS.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      role="option"
                      aria-selected={filter === f.id}
                      onClick={() => {
                        setFilter(f.id);
                        setFilterOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "6px 8px",
                        border: "none",
                        background: filter === f.id ? "#eee" : "transparent",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="dbd-obat-result-wrap" aria-live="polite">
            {result && (
              <div className={`dbd-obat-result is-${result.level}`}>
                <strong>
                  {LEVELS[result.level].icon} {result.name}: {LEVELS[result.level].title}
                </strong>
                <p>{result.note}</p>
              </div>
            )}
            {searched && !result && (
              <div className="dbd-obat-result is-care">
                <strong>⚠️ Belum ada di daftar</strong>
                <p>Jangan diminum dulu. Tanyakan ke apoteker atau dokter, dan sebutkan bahwa Anda dicurigai DBD.</p>
              </div>
            )}
          </div>
          <small>Pencarian berdasarkan nama bahan dan merek umum. Selalu baca komposisi di kemasan.</small>
        </div>
      </Reveal>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="dbd-obat-grid"
          key={filter}
          variants={staggerParent}
          initial={reduced ? false : "hidden"}
          animate="show"
          exit={{ opacity: 0 }}
          transition={reduced ? instantTransition : { duration: 0.12 }}
        >
          {visible.map((d) => (
            <motion.article
              className={`dbd-card dbd-obat-card is-${d.level}`}
              key={d.id}
              variants={staggerChild}
              whileHover={{ y: -4, boxShadow: cardHoverBox }}
              transition={cardHoverTransition}
              onClick={() => setOpenId(openId === d.id ? null : d.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="dbd-obat-card-head">
                {d.image ? <img className="dbd-obat-photo" src={d.image} alt="" /> : <span className="dbd-obat-icon" aria-hidden="true">{d.icon}</span>}
                <h4>{d.name}</h4>
                <span className={`dbd-obat-badge is-${d.level}`}>{LEVELS[d.level].label}</span>
              </div>
              <p className="dbd-obat-use">{d.use}</p>
              {openId === d.id && <p className="dbd-obat-note">{d.note}</p>}
            </motion.article>
          ))}
        </motion.div>
      </AnimatePresence>

      <h3 className="dbd-subheading">4 Aturan Pakai Obat saat DBD</h3>
      <motion.ol
        className="dbd-obat-rules"
        variants={staggerParent}
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "show"}
        viewport={{ once: true }}
      >
        {RULES.map((r, i) => (
          <motion.li className="dbd-card" key={r.title} variants={staggerChild}>
            <span className="dbd-obat-num" aria-hidden="true">{i + 1}</span>
            <b>{r.title}</b>
            <p>{r.text}</p>
          </motion.li>
        ))}
      </motion.ol>

      <Reveal>
        <div className="dbd-obat-alert" role="note">
          <strong>🚑 Jangan menunggu obat bekerja. Segera ke IGD atau hubungi 119 bila muncul:</strong>
          <ul>
            {DANGER.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <p className="dbd-obat-disclaimer">
          Informasi ini untuk edukasi, bukan pengganti konsultasi tenaga kesehatan. Dosis dan jenis obat
          selalu mengikuti petunjuk dokter atau apoteker.
        </p>
      </Reveal>
    </section>
  );
}
