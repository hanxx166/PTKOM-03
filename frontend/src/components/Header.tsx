import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import BlindPullToggle from "./BlindPullToggle";

const LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/edukasi", label: "Edukasi" },
  { to: "/cek-kesehatan", label: "Cek Gejala & Lab" },
  // Halaman ini menyimpan data pribadi, jadi hanya untuk pengguna login.
  { to: "/pemantauan", label: "Suhu & Kalkulator", needsAuth: true },
  { to: "/faq-lokasi", label: "FAQ & Lokasi" },
];

export default function Header({
  onAuth,
}: {
  onAuth: (mode: "in" | "up", redirectTo?: string) => void;
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
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
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
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
          header.style.setProperty(
            "--hdr-blur",
            `${Math.round(2 + progress * 14)}px`,
          );
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
    if (!confirmLogout) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmLogout(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmLogout]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("dbd-theme", dark ? "dark" : "light");
    } catch {
      // The theme still works for this session when storage is unavailable.
    }
  }, [dark]);

  return (
    <header
      ref={headerRef}
      className={`dbd-header${scrolled ? " is-scrolled" : ""}`}
    >
      <div className="dbd-header-inner">
        <Link to="/" onClick={() => setOpen(false)} className="dbd-logo">
          <img src="/img/logo.png" alt="" />
          <span>
            Cek<span className="dbd-logo-light">DBD</span>
          </span>
        </Link>

        <button
          className="dbd-menu-toggle"
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span
            className={`dbd-menu-icon${open ? " is-open" : ""}`}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
          </span>
        </button>

        <nav
          className={`dbd-nav${open ? " is-open" : ""}`}
          aria-label="Navigasi utama"
        >
          {LINKS.map((link) =>
            link.needsAuth && !user ? (
              <button
                key={link.to}
                type="button"
                className="dbd-nav-link is-locked"
                aria-haspopup="dialog"
                title="Login untuk membuka halaman ini"
                onClick={() => {
                  setOpen(false);
                  onAuth("in", link.to);
                }}
              >
                🔒 {link.label}
              </button>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `dbd-nav-link${isActive ? " is-active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ),
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              className="dbd-admin-link"
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="dbd-header-actions">
          <BlindPullToggle
            dark={dark}
            onToggle={() => setDark((value) => !value)}
          />
          {!user ? (
            <>
              <button
                className="dbd-button dbd-button-outline dbd-button-small"
                onClick={() => onAuth("in")}
              >
                Masuk
              </button>
              <button
                className="dbd-button dbd-button-primary dbd-button-small"
                onClick={() => onAuth("up")}
              >
                Daftar
              </button>
            </>
          ) : (
            <span className="dbd-user">
              <span>
                {user.name}
                {isAdmin ? " · Admin" : ""}
              </span>
              <button
                className="dbd-button dbd-button-outline dbd-button-small"
                onClick={() => setConfirmLogout(true)}
              >
                Keluar
              </button>
            </span>
          )}
        </div>
      </div>
      {confirmLogout && (
        <div
          className="dbd-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmLogout(false);
          }}
        >
          <section className="dbd-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <h2 id="logout-title">Apakah Anda yakin ingin keluar?</h2>
            <div className="dbd-confirm-actions">
              <button
                className="dbd-button dbd-button-primary"
                type="button"
                onClick={async () => {
                  setConfirmLogout(false);
                  await logout();
                }}
              >
                Ya, keluar
              </button>
              <button
                className="dbd-button dbd-button-outline"
                type="button"
                autoFocus
                onClick={() => setConfirmLogout(false)}
              >
                Batal
              </button>
            </div>
          </section>
        </div>
      )}
    </header>
  );
}
