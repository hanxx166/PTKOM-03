import { useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "../lib/motion";

/**
 * Kotak feedback di bawah section Bacaan.
 *
 * Penilaian 1-5 bintang, tiap bintang punya wajah dan kalimatnya sendiri,
 * lalu pengguna bisa menulis masukan singkat sebelum mengirim.
 *
 * Simpanan masih lokal (localStorage) karena belum ada endpoint feedback di
 * backend. Kalau nanti mau disimpan ke database, cukup tambahkan model Prisma
 * dan panggil API di fungsi submit().
 */

type Rating = 1 | 2 | 3 | 4 | 5;

const RATINGS: Record<
  Rating,
  { emoji: string; label: string; message: string; tone: string }
> = {
  1: {
    emoji: "😞",
    label: "Sangat kurang",
    message: "Maaf sekali. Boleh diceritakan bagian mana yang tidak membantu?",
    tone: "is-rate-1",
  },
  2: {
    emoji: "😕",
    label: "Kurang",
    message: "Masih ada yang keliru. Apa yang bisa kami perjelas?",
    tone: "is-rate-2",
  },
  3: {
    emoji: "😐",
    label: "Cukup",
    message: "Lumayan. Ada bagian yang ingin ditambahkan?",
    tone: "is-rate-3",
  },
  4: {
    emoji: "🙂",
    label: "Bagus",
    message: "Terima kasih! Masih ada yang bisa ditingkatkan?",
    tone: "is-rate-4",
  },
  5: {
    emoji: "🤩",
    label: "Luar biasa",
    message: "Wah, senang dengarnya! Bagian mana yang paling membantu?",
    tone: "is-rate-5",
  },
};

const STORAGE_KEY = "dbd-bacaan-feedback-v1";

/** Ambil penilaian terakhir pengguna dari localStorage, kalau ada dan valid. */
function loadSaved(): { rating: Rating; note: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { rating?: number; note?: string };
    if (!saved.rating || !RATINGS[saved.rating as Rating]) return null;
    return { rating: saved.rating as Rating, note: saved.note || "" };
  } catch {
    // Data rusak diabaikan, kotak tetap dalam keadaan awal.
    return null;
  }
}

export default function Feedback() {
  const reduced = useReducedMotion();
  const [saved] = useState(loadSaved);
  const [picked, setPicked] = useState<Rating | 0>(saved ? saved.rating : 0);
  const [hover, setHover] = useState<Rating | 0>(0);
  const [note, setNote] = useState(saved ? saved.note : "");
  const [sent, setSent] = useState(Boolean(saved));

  const active = hover || picked;
  const info = active ? RATINGS[active] : null;
  const sentEmoji = picked ? RATINGS[picked].emoji : "";

  const choose = (r: Rating) => {
    setPicked(r);
    setSent(false);
  };

  const reset = () => {
    setPicked(0);
    setHover(0);
    setNote("");
    setSent(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Tanpa localStorage pun kotak tetap bisa dipakai.
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!picked) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rating: picked,
          note: note.trim(),
          at: new Date().toISOString(),
        }),
      );
    } catch {
      // Penyimpanan gagal, tidak menghalangi pengguna mengirim.
    }
    setSent(true);
  };

  return (
    <form
      className={`dbd-card dbd-feedback-card ${info ? info.tone : ""}`}
      onSubmit={submit}
      aria-labelledby="feedback-title"
    >
      <span className="dbd-kicker">Masukan pembaca</span>
      <h3 id="feedback-title">Bagaimana bacaan di atas?</h3>
      <p className="dbd-feedback-hint">
        Pilih bintang dari 1 sampai 5 — tiap penilaian punya wajahnya sendiri.
      </p>

      <div className="dbd-feedback-stars" role="radiogroup" aria-label="Penilaian bacaan">
        {([1, 2, 3, 4, 5] as Rating[]).map((r) => {
          const filled = r <= active;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={picked === r}
              aria-label={`Beri ${r} bintang`}
              title={RATINGS[r].label}
              className={`dbd-feedback-star${filled ? " is-active" : ""}`}
              onMouseEnter={() => setHover(r)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(r)}
              onBlur={() => setHover(0)}
              onClick={() => choose(r)}
              disabled={sent}
            >
              {filled ? "⭐" : "☆"}
            </button>
          );
        })}
      </div>

      <div className="dbd-feedback-face" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={info ? info.emoji : "idle"}
            className="dbd-feedback-emoji"
            initial={reduced ? false : { scale: 0.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={reduced ? undefined : { scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            {info ? info.emoji : "✍️"}
          </motion.span>
        </AnimatePresence>
        <p className="dbd-feedback-message">
          {info ? (
            <>
              <strong>{info.label}</strong> — {info.message}
            </>
          ) : (
            <>Sentuh bintangnya dulu, nanti wajahnya berubah sesuai penilaianmu.</>
          )}
        </p>
      </div>

      {!sent && picked > 0 && (
        <div className="dbd-feedback-form">
          <label className="dbd-feedback-label" htmlFor="dbd-feedback-note">
            Tulis masukan (opsional)
          </label>
          <textarea
            id="dbd-feedback-note"
            className="dbd-feedback-note"
            rows={3}
            maxLength={400}
            value={note}
            placeholder="Ceritakan singkat apa yang kurang atau sudah bagus..."
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="dbd-feedback-actions">
            <button className="dbd-button dbd-button-primary" type="submit">
              Kirim masukan
            </button>
            <button className="dbd-button dbd-button-muted" type="button" onClick={reset}>
              Ganti penilaian
            </button>
          </div>
        </div>
      )}

      {sent && picked > 0 && (
        <div className="dbd-feedback-sent">
          <p>
            Terima kasih! Penilaianmu <strong>{picked} bintang</strong> sudah kami terima{" "}
            {sentEmoji}
          </p>
          <button className="dbd-button dbd-button-muted dbd-button-small" type="button" onClick={reset}>
            Beri penilaian lain
          </button>
        </div>
      )}
    </form>
  );
}
