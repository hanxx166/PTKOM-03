import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "../lib/motion";

/**
 * Popup peringatan tanda bahaya yang muncul sekali saat halaman Edukasi dibuka,
 * lalu menutup sendiri setelah beberapa detik (bar waktu di bagian bawah).
 *
 * Isinya sama dengan kotak peringatan lama di bagian bawah kotak obat, hanya
 * bentuknya dipindah ke popup supaya tidak memenuhi panjang halaman.
 */

const DANGER = [
  "Nyeri perut hebat",
  "Muntah terus-menerus",
  "Perdarahan (gusi, hidung, BAB hitam)",
  "Tangan dan kaki dingin, lemas",
  "Sulit bernapas",
];

/** Berapa lama popup tampil sebelum menutup sendiri (milidetik). */
const SHOW_MS = 8000;

export default function DangerPopup() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), SHOW_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div className="dbd-popup-wrap">
          <motion.aside
            className="dbd-popup"
            role="status"
            aria-live="polite"
            initial={reduced ? false : { opacity: 0, y: 34, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <span className="dbd-popup-icon" aria-hidden="true">
              ⚠️
            </span>

            <div className="dbd-popup-body">
              <strong>Jangan menunggu obat bekerja</strong>
              <p>
                Segera ke IGD atau hubungi <b>119</b> bila muncul:
              </p>
              <ul className="dbd-popup-chips">
                {DANGER.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="dbd-popup-close"
              aria-label="Tutup peringatan"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <span className="dbd-popup-progress" aria-hidden="true" />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
