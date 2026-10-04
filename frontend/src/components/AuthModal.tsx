import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function AuthModal({
  open,
  mode,
  setMode,
  onClose,
}: {
  open: boolean;
  mode: "in" | "up";
  setMode: (m: "in" | "up") => void;
  onClose: () => void;
}) {
  const { login, signup } = useAuth();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const d = Object.fromEntries(new FormData(e.currentTarget) as unknown as Iterable<[string, string]>);
      if (mode === "in") await login(d.email, d.password);
      else await signup(d.name, d.email, d.password);
      onClose();
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-[400px] rounded-[18px] bg-white p-7">
        <div className="mb-3 flex gap-2">
          <button className={`flex-1 rounded-[9px] px-2 py-2 font-bold ${mode === "in" ? "bg-acc text-white" : "bg-[#eaf0f7]"}`} onClick={() => setMode("in")}>
            Masuk
          </button>
          <button className={`flex-1 rounded-[9px] px-2 py-2 font-bold ${mode === "up" ? "bg-acc text-white" : "bg-[#eaf0f7]"}`} onClick={() => setMode("up")}>
            Daftar
          </button>
        </div>
        <form onSubmit={submit} className="grid gap-2.5">
          {mode === "up" && <input name="name" placeholder="Nama lengkap" required className="rounded-[10px] border border-line px-3 py-2" />}
          <input name="email" type="email" placeholder="Email" required className="rounded-[10px] border border-line px-3 py-2" />
          <input name="password" type="password" placeholder={mode === "up" ? "Buat password (min. 6 karakter)" : "Password"} minLength={6} required className="rounded-[10px] border border-line px-3 py-2" />
          <button disabled={loading} className="rounded-[10px] bg-acc px-5 py-2.5 font-bold text-white disabled:opacity-60">
            {loading ? "Memproses..." : mode === "in" ? "Masuk" : "Daftar"}
          </button>
        </form>
        {err && <p className="mt-2 text-center text-sm text-danger">{err}</p>}
        <p className="mt-2 text-center text-xs text-muted">
          Mode standalone: akun tersimpan di browser ini. Setelah backend deploy, akun tersimpan terpusat.
        </p>
        <div className="mt-2 text-center">
          <button className="text-sm text-muted underline" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
