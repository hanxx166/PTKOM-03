import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "./api";
import { HAS_BACKEND } from "./backend";
import { useAuth } from "./auth";

export type TrackerKind = "fever" | "platelet";
export type TrackerStatus = "loading" | "local" | "server";

export interface TrackerRow {
  id: number | string;
  day: number;
  time: string;
  temp: number;
  value: number;
}

const KEYS: Record<TrackerKind, string> = { fever: "dbd-temp", platelet: "dbd-plt" };
const PATHS: Record<TrackerKind, string> = { fever: "/api/fever-log", platelet: "/api/platelets" };
const TIMES = ["Pagi", "Siang", "Sore", "Malam"];

function sortRows(kind: TrackerKind, rows: TrackerRow[]): TrackerRow[] {
  return [...rows].sort((a, b) => a.day - b.day || (kind === "fever" ? TIMES.indexOf(a.time) - TIMES.indexOf(b.time) : 0));
}

function readLocal(kind: TrackerKind): TrackerRow[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEYS[kind]) || "[]");
    if (!Array.isArray(raw)) return [];
    const rows = raw.flatMap((item, index): TrackerRow[] => {
      const day = Number((item as Record<string, unknown>)?.day);
      if (!Number.isFinite(day)) return [];
      if (kind === "fever") {
        const time = typeof (item as Record<string, unknown>)?.time === "string" ? (item as { time: string }).time : "";
        const record = item as Record<string, unknown>;
        const temp = Number.isFinite(record.temperature) ? record.temperature : record.temp;
        if (!TIMES.includes(time) || !Number.isFinite(temp)) return [];
        return [{ id: typeof record.id === "string" ? record.id : `legacy-${index}`, day, time, temp: temp as number, value: 0 }];
      }
      const record = item as Record<string, unknown>;
      const value = Number.isFinite(record.value) ? record.value : record.val;
      if (!Number.isFinite(value)) return [];
      return [{ id: typeof record.id === "string" ? record.id : `legacy-${index}`, day, time: "", temp: 0, value: value as number }];
    });
    return sortRows(kind, rows);
  } catch {
    return [];
  }
}

function writeLocal(kind: TrackerKind, rows: TrackerRow[]) {
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify(rows));
  } catch {
    /* lokasi penyimpanan penuh atau diblokir: sampah tetap, tak menggagalkan UI */
  }
}

/** Catatan pantau kondisi: login → server per-user, anonim → localStorage browser. */
export function useTrackerLog(kind: TrackerKind) {
  const { user } = useAuth();
  const online = HAS_BACKEND && !!user;
  const [entries, setEntries] = useState<TrackerRow[]>([]);
  const [status, setStatus] = useState<TrackerStatus>(() => (online ? "loading" : "local"));
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    if (!online) {
      const local = readLocal(kind);
      if (alive) {
        setEntries(local);
        setStatus("local");
        setMessage("");
      }
      return;
    }
    setStatus("loading");
    apiGet<{ entries: TrackerRow[] }>(PATHS[kind])
      .then((j) => {
        if (!alive) return;
        const rows = sortRows(kind, j.entries || []);
        setEntries(rows);
        setStatus("server");
        setMessage("");
      })
      .catch(() => {
        if (!alive) return;
        setStatus("server");
        setMessage("Gagal memuat catatan dari akun.");
      });
    return () => {
      alive = false;
    };
  }, [online, kind]);

  const persist = async (rows: TrackerRow[], payload: Record<string, unknown>) => {
    if (online) {
      const j = (await apiPost(PATHS[kind], payload)) as { entry: TrackerRow };
      setEntries(sortRows(kind, [...rows, j.entry]));
      return;
    }
    writeLocal(kind, rows);
    setEntries(sortRows(kind, rows));
  };

  const add = (row: Partial<TrackerRow> & { day: number }) =>
    persist(
      [...entries, { ...row, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, time: row.time ?? "", temp: row.temp ?? 0, value: row.value ?? 0 }],
      kind === "fever" ? { day: row.day, time: row.time ?? "", temp: row.temp ?? 0 } : { day: row.day, value: row.value ?? 0 },
    );

  const remove = async (id: number | string) => {
    if (online) await apiDelete(`${PATHS[kind]}/${id}`);
    const rows = entries.filter((entry) => entry.id !== id);
    writeLocal(kind, rows);
    setEntries(rows);
  };

  return { entries, status, message, add, remove };
}