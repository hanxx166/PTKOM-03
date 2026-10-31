import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Admin from "./pages/Admin";
import AuthModal from "./components/AuthModal";
import CekGejala from "./pages/CekGejala";
import CekLab from "./pages/CekLab";
import Dashboard from "./pages/Dashboard";
import Education from "./components/Education";
import FluidCalculator from "./components/FluidCalculator";
import Footer from "./components/Footer";
import Header from "./components/Header";
import TemperatureTracker from "./components/TemperatureTracker";
import { AuthProvider, useAuth } from "./lib/auth";
import { ContentProvider } from "./lib/content";

/**
 * Each section is its own route now, so a route change has to reset the
 * scroll position; otherwise the new page can open halfway down.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

/**
 * Rute khusus pengguna login. Selama sesi lama belum dipulihkan (ready false)
 * tidak ada keputusan apa pun, supaya pengguna yang sudah login tidak dilempar
 * ke beranda ketika refresh token masih diproses.
 */
function RequireAuth({
  children,
  onNeedAuth,
}: {
  children: ReactNode;
  onNeedAuth: () => void;
}) {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) onNeedAuth();
  }, [ready, user, onNeedAuth]);

  if (!ready) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Shell() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"in" | "up">("in");
  // Halaman yang diminta sebelum pengguna diminta login, dibuka lagi setelah
  // berhasil masuk supaya alurnya tidak putus di beranda. Disimpan di ref,
  // bukan state, supaya tidak memicu render tambahan.
  const pendingPath = useRef<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // AuthModal sudah menutup dirinya sendiri setelah login berhasil, jadi di
    // sini cukup membuka halaman yang tadi diminta.
    if (!user || !pendingPath.current) return;
    const to = pendingPath.current;
    pendingPath.current = null;
    navigate(to);
  }, [user, navigate]);

  const needAuth = useCallback((to?: string) => {
    setAuthMode("in");
    setAuthOpen(true);
    pendingPath.current = to ?? null;
  }, []);

  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <Header
        onAuth={(mode, to) => {
          setAuthMode(mode);
          setAuthOpen(true);
          pendingPath.current = to ?? null;
        }}
      />
      <main className="dbd-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/cek-kesehatan"
            element={
              <>
                <CekGejala />
                <CekLab />
              </>
            }
          />
          <Route
            path="/pemantauan"
            element={
              <RequireAuth onNeedAuth={needAuth}>
                <>
                  <TemperatureTracker />
                  <FluidCalculator />
                </>
              </RequireAuth>
            }
          />
          <Route
            path="/cek-gejala"
            element={<Navigate to="/cek-kesehatan" replace />}
          />
          <Route
            path="/cek-lab"
            element={<Navigate to="/cek-kesehatan" replace />}
          />
          <Route
            path="/pelacak-suhu"
            element={<Navigate to="/pemantauan" replace />}
          />
          <Route
            path="/kalkulator"
            element={<Navigate to="/pemantauan" replace />}
          />
          <Route path="/edukasi" element={<Education />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <AuthModal
        open={authOpen}
        mode={authMode}
        setMode={setAuthMode}
        onClose={() => setAuthOpen(false)}
      />
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
