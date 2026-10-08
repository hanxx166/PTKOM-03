import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

const LINKS = [
  { id: "beranda", label: "Beranda" },
  { id: "cek-gejala", label: "Cek Gejala" },
  { id: "pelacak-suhu", label: "Pelacak Suhu" },
  { id: "kalkulator", label: "Kalkulator" },
  { id: "edukasi", label: "Edukasi" },
];

export default function Header({
  onAuth,
  onNavigate,
}: {
  onAuth: (mode: "in" | "up") => void;
  onNavigate: (id: string) => void;
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("dbd-theme") === "dark";
    } catch {
      return false;
    }
  });
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("dbd-theme", dark ? "dark" : "light");
    } catch {
      // The theme still works for this session when storage is unavailable.
    }
  }, [dark]);

  const goTo = (id: string) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <header className="dbd-header">
      <div className="dbd-header-inner">
        <Link to="/" onClick={() => goTo("beranda")} className="dbd-logo">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21c-4.4-3.2-8-6.4-8-10a8 8 0 0 1 16 0c0 3.6-3.6 6.8-8 10Z" />
            <path d="M12 7v4l2.5 1.5" />
          </svg>
          <span>cek<span className="dbd-logo-light">DBD</span></span>
        </Link>

        <button
          className="dbd-menu-toggle"
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "×" : "☰"}
        </button>

        <nav className={`dbd-nav${open ? " is-open" : ""}`} aria-label="Navigasi utama">
          {LINKS.map((link) => (
            <button key={link.id} type="button" onClick={() => goTo(link.id)}>
              {link.label}
            </button>
          ))}
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setOpen(false)} className="dbd-admin-link">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="dbd-header-actions">
          <button
            className="dbd-theme-toggle"
            type="button"
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            title="Mode Gelap/Terang"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          {!user ? (
            <>
              <button className="dbd-button dbd-button-outline dbd-button-small" onClick={() => onAuth("in")}>
                Masuk
              </button>
              <button className="dbd-button dbd-button-primary dbd-button-small" onClick={() => onAuth("up")}>
                Daftar
              </button>
            </>
          ) : (
            <span className="dbd-user">
              <span>{user.name}{isAdmin ? " · Admin" : ""}</span>
              <button className="dbd-button dbd-button-outline dbd-button-small" onClick={logout}>
                Keluar
              </button>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
