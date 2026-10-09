import { useEffect, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthModal from "./components/AuthModal";
import CekGejala from "./pages/CekGejala";
import Education from "./components/Education";
import FluidCalculator from "./components/FluidCalculator";
import Footer from "./components/Footer";
import Header from "./components/Header";
import TemperatureTracker from "./components/TemperatureTracker";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./lib/auth";
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

function Shell() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"in" | "up">("in");

  const needAuth = () => {
    setAuthMode("in");
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <Header
        onAuth={(mode) => {
          setAuthMode(mode);
          setAuthOpen(true);
        }}
      />
      <main className="dbd-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cek-gejala" element={<CekGejala onNeedAuth={needAuth} />} />
          <Route path="/pelacak-suhu" element={<TemperatureTracker />} />
          <Route path="/kalkulator" element={<FluidCalculator />} />
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
