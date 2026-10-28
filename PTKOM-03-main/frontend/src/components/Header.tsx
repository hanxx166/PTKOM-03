import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import BlindPullToggle from "./BlindPullToggle";

const LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/cek-gejala", label: "Cek Gejala" },
  { to: "/pelacak-suhu", label: "Pelacak Suhu" },
  { to: "/kalkulator", label: "Kalkulator" },
  { to: "/edukasi", label: "Edukasi" },
];

export default function Header({ onAuth }: { onAuth: (mode: "in" | "up") => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("dbd-theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    let raf = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      // Smooth 0→1 progress over 120px so the frosted glass fades in gradually.
      const progress = Math.min(Math.max(y / 120, 0), 1);
      const header = headerRef.current;
      if (header) {
        if (reduceMotion) {
          header.style.setProperty("--hdr-blur", y > 8 ? "16px" : "0px");
          header.style.setProperty("--hdr-alpha", y > 8 ? "1" : "0");
        } else {
          header.style.setProperty("--hdr-blur", `${Math.round(2 + progress * 14)}px`);
          header.style.setProperty("--hdr-alpha", progress.toFixed(3));
        }
      }
      // Hysteresis for border/shadow so it doesn't flicker around the threshold.
      setScrolled((prev) => (prev ? y > 4 : y > 12));
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("dbd-theme", dark ? "dark" : "light");
    } catch {
      // The theme still works for this session when storage is unavailable.
    }
  }, [dark]);

  return (
    <header ref={headerRef} className={`dbd-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="dbd-header-inner">
        <Link to="/" onClick={() => setOpen(false)} className="dbd-logo">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21c-4.4-3.2-8-6.4-8-10a8 8 0 0 1 16 0c0 3.6-3.6 6.8-8 10Z" />
            <path d="M12 7v4l2.5 1.5" />
          </svg>
          <span>Cek<span className="dbd-logo-light">DBD</span></span>
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
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `dbd-nav-link${isActive ? " is-active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setOpen(false)} className="dbd-admin-link">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="dbd-header-actions">
          <BlindPullToggle dark={dark} onToggle={() => setDark((value) => !value)} />
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
