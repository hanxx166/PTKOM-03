import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "./types";
import { API_BASE, forgetAccessToken, HAS_BACKEND, refreshSession, setAccessToken, setSessionLostHandler } from "./backend";

interface AuthCtx {
  user: User | null;
  mode: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

async function sha(s: string): Promise<string> {
  if (crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "p" + btoa(unescape(encodeURIComponent(s)));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mode] = useState(() => (HAS_BACKEND ? "server" : "local"));

  useEffect(() => {
    // Refresh gagal = sesi benar-benar habis. Bersihkan state supaya header
    // tidak masih menampilkan orang yang sudah logout di server.
    setSessionLostHandler(() => {
      forgetAccessToken();
      setUser(null);
      try {
        localStorage.removeItem("user");
      } catch {
        /* abaikan */
      }
    });

    // Sumber kebenaran di mode server adalah refresh cookie, bukan localStorage:
    // cookie httpOnly bertahan 7 hari, sedangkan access token hanya 15 menit.
    // Refresh gagal berarti sesi habis, jadi jangan fallback ke localStorage;
    // itu akan menampilkan login yang sudah tidak berlaku di server.
    (async () => {
      if (HAS_BACKEND) {
        setUser(await refreshSession());
        return;
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
    if (HAS_BACKEND) {
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: em, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Login gagal");
      setAccessToken(j.token || "");
      persist(j.user);
      return;
    }
    // Fallback lokal untuk penggunaan tanpa backend.
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const u = users.find((x: { email: string }) => x.email === em);
    if (!u || u.hash !== (await sha(password))) throw new Error("Email atau password salah");
    persist({ name: u.name, email: u.email, role: (u.role === "admin" ? "admin" : "user") as "user" | "admin" });
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const em = email.trim().toLowerCase();
    if (!name.trim() || !em.includes("@") || password.length < 6)
      throw new Error("Lengkapi data dengan benar (password minimal 6 karakter)");
    if (HAS_BACKEND) {
      const r = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: em, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Daftar gagal");
      setAccessToken(j.token || "");
      persist(j.user);
      return;
    }
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some((x: { email: string }) => x.email === em)) throw new Error("Email sudah terdaftar");
    const u = { name: name.trim(), email: em, hash: await sha(password), role: "user" as const };
    users.push(u);
    localStorage.setItem("users", JSON.stringify(users));
    persist({ name: u.name, email: u.email, role: u.role });
  }, []);

  const logout = useCallback(async () => {
    if (HAS_BACKEND) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
      } catch {
        /* abaikan */
      }
    }
    persist(null);
    setAccessToken("");
  }, []);

  return <Ctx.Provider value={{ user, mode, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth harus di dalam AuthProvider");
  return v;
}
