import { useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthModal from "./components/AuthModal";
import Header from "./components/Header";
import { AuthProvider } from "./lib/auth";
import { ContentProvider } from "./lib/content";
import Artikel from "./pages/Artikel";
import Admin from "./pages/Admin";
import Beranda from "./pages/Beranda";
import Catatan from "./pages/Catatan";
import Cegah from "./pages/Cegah";
import CekGejala from "./pages/CekGejala";
import Kuis from "./pages/Kuis";
import Poliklinik from "./pages/Poliklinik";

function Shell() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"in" | "up">("in");

  const needAuth = () => {
    setAuthMode("in");
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header onAuth={(m) => { setAuthMode(m); setAuthOpen(true); }} />
      <main className="mx-auto min-h-[60vh] max-w-[1000px] px-[6%]">
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/artikel" element={<Artikel />} />
          <Route path="/cek-gejala" element={<CekGejala onNeedAuth={needAuth} />} />
          <Route path="/cegah" element={<Cegah />} />
          <Route path="/fakta-mitos" element={<Kuis />} />
          <Route path="/catatan" element={<Catatan onNeedAuth={needAuth} />} />
          <Route path="/poliklinik" element={<Poliklinik />} />
          <Route path="/admin" element={<Admin />} />
          {/* Redirect legacy hash lama (#/cek, #/kuis, #/jurnal, #/poli, #top) */}
          <Route path="/cek" element={<Navigate to="/cek-gejala" replace />} />
          <Route path="/kuis" element={<Navigate to="/fakta-mitos" replace />} />
          <Route path="/jurnal" element={<Navigate to="/catatan" replace />} />
          <Route path="/poli" element={<Navigate to="/poliklinik" replace />} />
          <Route path="/top" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="mt-8 bg-ink px-[6%] pb-5 pt-10 text-sm text-[#d6e2f0]">
        <p className="mx-auto mt-6 max-w-[1000px] border-t border-white/20 pt-4 text-center text-xs text-[#9fb4cc]">
          Informasi ini bukan pengganti nasihat dokter. Proyek Akhir PTKOM 2026 · HMIF ITERA
        </p>
      </footer>
      <AuthModal open={authOpen} mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ContentProvider>
          <Shell />
        </ContentProvider>
      </AuthProvider>
    </HashRouter>
  );
}
