import { createContext, useContext, useEffect, useState } from "react";
import { getContent, getStats } from "./api";
import type { ContentBundle } from "./types";

interface Ctx {
  content: ContentBundle | null;
  totalChecks: number;
  error: string;
  loading: boolean;
}

const C = createContext<Ctx>({ content: null, totalChecks: 0, error: "", loading: true });

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ContentBundle | null>(null);
  const [totalChecks, setTotalChecks] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContent()
      .then(({ data }) => setContent(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    getStats().then(setTotalChecks).catch(() => {});
  }, []);

  return <C.Provider value={{ content, totalChecks, error, loading }}>{children}</C.Provider>;
}

export const useContent = () => useContext(C);
