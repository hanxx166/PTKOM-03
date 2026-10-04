import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

const LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/artikel", label: "Artikel" },
  { to: "/cek-gejala", label: "Cek Gejala" },
  { to: "/cegah", label: "Cegah" },
  { to: "/fakta-mitos", label: "Fakta/Mitos" },
  { to: "/catatan", label: "Catatan Saya" },
  { to: "/poliklinik", label: "Info Poliklinik" },
];

export default function Header({ onAuth }: { onAuth: (mode: "in" | "up") => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white/95 px-[6%] py-3 backdrop-blur">
      <Link to="/" className="flex items-center gap-2 font-head text-lg font-bold text-ink no-underline">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#1366d6" aria-hidden>
          <rect x="9" y="3" width="6" height="18" rx="1.5" />
          <rect x="3" y="9" width="18" height="6" rx="1.5" />
        </svg>
        Poliklinik ITERA
      </Link>
      <button
        className="flex flex-col gap-[5px] rounded-[10px] border border-line bg-transparent p-2 md:hidden"
        aria-label="Buka menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="block h-[2.5px] w-[22px] rounded bg-ink" />
        <span className="block h-[2.5px] w-[22px] rounded bg-ink" />
        <span className="block h-[2.5px] w-[22px] rounded bg-ink" />
      </button>
      <nav className={`${open ? "flex" : "hidden"} w-full flex-col gap-1 md:flex md:w-auto md:flex-row md:items-center`}>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `rounded px-2 py-1.5 text-[0.93rem] font-semibold no-underline ${
                isActive ? "text-acc underline decoration-acc decoration-2 underline-offset-4" : "text-ink hover:text-acc"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `rounded px-2 py-1.5 text-[0.93rem] font-semibold no-underline ${
                isActive ? "text-acc underline decoration-acc decoration-2 underline-offset-4" : "text-ink hover:text-acc"
              }`
            }
          >
            Admin
          </NavLink>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {!user ? (
          <>
            <button className="rounded-[10px] border-2 border-acc bg-transparent px-3 py-1.5 text-sm font-bold text-acc hover:bg-acc hover:text-white" onClick={() => onAuth("in")}>
              Masuk
            </button>
            <button className="rounded-[10px] bg-acc px-3 py-1.5 text-sm font-bold text-white hover:bg-[#0d4fae]" onClick={() => onAuth("up")}>
              Daftar
            </button>
          </>
        ) : (
          <span className="flex items-center gap-2 text-sm font-bold">
            {user.name}{isAdmin ? " (Admin)" : ""}
            <button className="rounded-[10px] border-2 border-acc bg-transparent px-3 py-1 text-sm font-bold text-acc hover:bg-acc hover:text-white" onClick={logout}>
              Keluar
            </button>
          </span>
        )}
      </div>
    </header>
  );
}
