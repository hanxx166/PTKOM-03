import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  mode: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, adminCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function getToken(): string {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

function setToken(t: string) {
  try {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  } catch {
    /* abaikan */
  }
}
async function sha(s: string): Promise<string> {
  if (crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "p" + btoa(unescape(encodeURIComponent(s)));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mode] = useState(() => (API_BASE ? "server" : "local"));

  useEffect(() => {
    // Coba sesi BE baru, fallback localStorage (mode gratis/standalone)
    (async () => {
      if (API_BASE) {
        try {
          const r = await fetch(`${API_BASE}/api/auth/me`, {
            headers: getToken() ? { Authorization: "Bearer " + getToken() } : {},
          });
          const j = await r.json();
          if (j.user) {
            setUser(j.user);
            return;
          }
        } catch {
          /* abaikan */
        }
      }
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        if (u) setUser(u);
      } catch {
        /* abaikan */
      }
    })();
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem("user", JSON.stringify(u));
      else localStorage.removeItem("user");
    } catch {
      /* abaikan */
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const em = email.trim().toLowerCase();
    if (API_BASE) {
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: em, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Login gagal");
      setToken(j.token || "");
      persist(j.user);
      return;
    }
    // Fallback lokal untuk penggunaan tanpa backend.
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const u = users.find((x: { email: string }) => x.email === em);
    if (!u || u.hash !== (await sha(password))) throw new Error("Email atau password salah");
    persist({ name: u.name, email: u.email, role: (u.role === "admin" ? "admin" : "user") as "user" | "admin" });
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, adminCode = "") => {
    const em = email.trim().toLowerCase();
    if (!name.trim() || !em.includes("@") || password.length < 6)
      throw new Error("Lengkapi data dengan benar (password minimal 6 karakter)");
    if (API_BASE) {
      const r = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: em, password, admin_code: adminCode }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Daftar gagal");
      setToken(j.token || "");
      persist(j.user);
      return;
    }
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some((x: { email: string }) => x.email === em)) throw new Error("Email sudah terdaftar");
    const u = { name: name.trim(), email: em, hash: await sha(password), role: (users.length ? "user" : "admin") as "user" | "admin" };
    users.push(u);
    localStorage.setItem("users", JSON.stringify(users));
    persist({ name: u.name, email: u.email, role: u.role });
  }, []);

  const logout = useCallback(async () => {
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
      } catch {
        /* abaikan */
      }
    }
    persist(null);
    setToken("");
  }, []);

  return <Ctx.Provider value={{ user, mode, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth harus di dalam AuthProvider");
  return v;
}
