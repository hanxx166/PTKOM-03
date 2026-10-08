import { useEffect, useRef, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthModal from "./components/AuthModal";
import Header from "./components/Header";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./lib/auth";
import { ContentProvider } from "./lib/content";

function Shell() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"in" | "up">("in");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pendingSection = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== "/" || !pendingSection.current) return;
    const section = pendingSection.current;
    pendingSection.current = null;
    window.requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [pathname]);

  const needAuth = () => {
    setAuthMode("in");
    setAuthOpen(true);
  };

  const navigateToSection = (id: string) => {
    if (pathname !== "/") {
      pendingSection.current = id;
      navigate("/");
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen">
      <Header
        onAuth={(mode) => {
          setAuthMode(mode);
          setAuthOpen(true);
        }}
        onNavigate={navigateToSection}
      />
      <main className="dbd-main">
        <Routes>
          <Route path="/" element={<Dashboard onNeedAuth={needAuth} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
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
