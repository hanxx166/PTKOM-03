import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { apiPost } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useContent } from "../lib/content";
import Reveal from "../components/Reveal";
import {
  instantTransition,
  stepSlide,
  useReducedMotion,
} from "../lib/motion";

type Risk = "tinggi" | "sedang" | "rendah";
interface TriageResult {
  level: Risk;
  score: number;
  emergency: boolean;
}

const ADVICE: Record<Risk, string> = {
  tinggi: "Segera cari pertolongan medis. Jika ada tanda bahaya, jangan menunda untuk pergi ke IGD.",
  sedang: "Tetap waspada, catat suhu tiap 6 jam, cukupkan cairan, dan konsultasikan kondisi ke tenaga kesehatan.",
  rendah: "Pantau suhu dan kondisi tubuh. Jika demam berlanjut atau memburuk, konsultasikan ke dokter.",
};

/** Tier 3: animated score counter (useMotionValue + animate). */
function ScoreCount({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const rounded = useTransform(motionValue, (latest) => String(Math.round(latest)));

  useEffect(() => {
    if (reduced) return;
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [motionValue, reduced, value]);

  return <motion.span>{rounded}</motion.span>;
}

export default function CekGejala({ onNeedAuth }: { onNeedAuth: () => void }) {
  const { content, loading, error } = useContent();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [day, setDay] = useState("");
  const [temperature, setTemperature] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [formError, setFormError] = useState("");
  const reduced = useReducedMotion();

  if (loading) return <p className="dbd-loading">Memuat pemeriksaan...</p>;
  if (error || !content) return <p className="dbd-error">Data gejala gagal dimuat. Silakan muat ulang halaman.</p>;

  const regularSymptoms = content.symptoms.filter((item) => !item.danger);
  const dangerSymptoms = content.symptoms.filter((item) => item.danger);
  const toggle = (id: string) => {
    setChecked((selected) => selected.includes(id)
      ? selected.filter((value) => value !== id)
      : [...selected, id]);
  };

  const nextStep = (next: number) => {
    if (next === 2) {
      if (!day || !temperature) {
        setFormError("Isi hari demam dan suhu tubuh untuk melanjutkan.");
        return;
      }
      const temp = Number(temperature);
      if (!Number.isFinite(temp) || temp < 34 || temp > 43) {
        setFormError("Masukkan suhu antara 34°C dan 43°C.");
        return;
      }
    }
    setFormError("");
    setStep(next);
    if (next === 4) calculateResult();
  };

  const calculateResult = () => {
    const selected = content.symptoms.filter((item) => checked.includes(String(item.id)));
    const emergency = selected.some((item) => item.danger);
    let score = selected.reduce((total, item) => total + item.w, 0);
    if (Number(day) >= 3 && Number(day) <= 5) score += 3;
    if (Number(temperature) >= 39) score += 2;
    else if (Number(temperature) >= 38) score += 1;
    const level: Risk = emergency || score >= 8 ? "tinggi" : score >= 4 ? "sedang" : "rendah";
    setResult({ level, score, emergency });

    if (user) {
      apiPost("/api/checks", {
        level,
        score,
        symptomIds: selected.map((item) => String(item.id)),
      }).catch(() => {
        // The local screening result remains available if statistics cannot be reached.
      });
    }
  };

  const reset = () => {
    setDay("");
    setTemperature("");
    setChecked([]);
    setResult(null);
    setFormError("");
    setStep(1);
  };

  const continueToResult = () => {
    if (!user) {
      onNeedAuth();
      return;
    }
    nextStep(4);
  };

  return (
    <section className="dbd-section" id="cek-gejala">
      <Reveal className="dbd-section-heading">
        <span className="dbd-kicker">Skrining awal</span>
        <h2>🩺 Cek Gejala (Smart Triage)</h2>
        <p>Jawab beberapa pertanyaan untuk mengukur risiko DBD. Hasil bersifat edukasi, <b>bukan diagnosis medis</b>.</p>
      </Reveal>

      <div className="dbd-info-box">
        <p><b>Cara pakai:</b> 1) isi hari demam + suhu → 2) centang gejala → 3) centang tanda bahaya → 4) lihat hasil.</p>
        <p>Ini <b>skrining awal</b>, bukan diagnosis dokter. Kalau ada 1 saja tanda bahaya, langsung ke IGD.</p>
      </div>

      <div className="dbd-card dbd-triage-card">
        <div className="dbd-steps" aria-label={`Langkah ${step} dari 4`}>
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className={index < step ? "is-done" : ""} />
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
        {step === 1 && (
          <motion.div
            key="step-1"
            className="dbd-step-panel"
            variants={stepSlide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduced ? instantTransition : undefined}
          >
            <h3>Langkah 1: Informasi Dasar</h3>
            <div className="dbd-form-group">
              <label htmlFor="fever-day">Sudah berapa hari demam?</label>
              <select id="fever-day" value={day} onChange={(event) => setDay(event.target.value)}>
                <option value="">- Pilih -</option>
                {Array.from({ length: 6 }, (_, index) => (
                  <option value={index + 1} key={index}>Hari {index + 1}</option>
                ))}
                <option value={7}>Hari 7+</option>
              </select>
            </div>
            <div className="dbd-form-group">
              <label htmlFor="fever-temperature">Suhu tubuh saat ini (°C)</label>
              <input
                id="fever-temperature"
                type="number"
                min="34"
                max="43"
                step="0.1"
                placeholder="Contoh: 39.2"
                value={temperature}
                onChange={(event) => setTemperature(event.target.value)}
              />
            </div>
            <div className="dbd-step-actions dbd-step-actions-end">
              <button className="dbd-button dbd-button-primary" type="button" onClick={() => nextStep(2)}>Lanjut →</button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            className="dbd-step-panel"
            variants={stepSlide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduced ? instantTransition : undefined}
          >
            <h3>Langkah 2: Gejala yang Dirasakan</h3>
            <div className="dbd-check-grid">
              {regularSymptoms.map((symptom) => {
                const id = String(symptom.id);
                return (
                  <label className={`dbd-check-item${checked.includes(id) ? " is-checked" : ""}`} key={id}>
                    <input type="checkbox" checked={checked.includes(id)} onChange={() => toggle(id)} />
                    <span>{symptom.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="dbd-step-actions">
              <button className="dbd-button dbd-button-muted" type="button" onClick={() => nextStep(1)}>← Kembali</button>
              <button className="dbd-button dbd-button-primary" type="button" onClick={() => nextStep(3)}>Lanjut →</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            className="dbd-step-panel"
            variants={stepSlide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduced ? instantTransition : undefined}
          >
            <h3>Langkah 3: Tanda Bahaya ⚠️</h3>
            <p className="dbd-step-description">Jika mengalami salah satu tanda bahaya, segera cari pertolongan medis.</p>
            <div className="dbd-check-grid">
              {dangerSymptoms.map((symptom) => {
                const id = String(symptom.id);
                return (
                  <label className={`dbd-check-item dbd-check-danger${checked.includes(id) ? " is-checked" : ""}`} key={id}>
                    <input type="checkbox" checked={checked.includes(id)} onChange={() => toggle(id)} />
                    <span>{symptom.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="dbd-step-actions">
              <button className="dbd-button dbd-button-muted" type="button" onClick={() => nextStep(2)}>← Kembali</button>
              <button className="dbd-button dbd-button-primary" type="button" onClick={continueToResult}>Lihat Hasil</button>
            </div>
          </motion.div>
        )}

        {step === 4 && result && (
          <motion.div
            key="step-4"
            className={`dbd-result dbd-risk-${result.level}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={reduced ? instantTransition : { type: "spring", stiffness: 260, damping: 22 }}
          >
            <motion.div
              className="dbd-result-icon"
              aria-hidden="true"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={reduced ? instantTransition : { type: "spring", stiffness: 400, damping: 15, delay: 0.12 }}
            >
              {result.level === "tinggi" ? "🚨" : result.level === "sedang" ? "🟡" : "🟢"}
            </motion.div>
            <h3>{result.emergency ? "Tanda Bahaya - Segera ke IGD" : `Risiko ${result.level}`}</h3>
            <p>{result.emergency ? "Ada tanda bahaya yang perlu segera ditangani." : ADVICE[result.level]}</p>
            {result.emergency && <a className="dbd-button dbd-button-red" href="tel:119">📞 Hubungi 119 / Ke IGD</a>}
            <p className="dbd-result-score">Skor skrining: <ScoreCount value={result.score} />. Hasil ini bukan diagnosis dan tidak menggantikan pemeriksaan tenaga kesehatan.</p>
            <button className="dbd-button dbd-button-muted" type="button" onClick={reset}>🔄 Ulangi Pemeriksaan</button>
          </motion.div>
        )}
        </AnimatePresence>

        {formError && <p className="dbd-error" role="alert">{formError}</p>}
        {!user && step < 4 && (
          <p className="dbd-login-note">Masuk untuk melihat dan menyimpan hasil skrining Anda.</p>
        )}
      </div>
    </section>
  );
}
