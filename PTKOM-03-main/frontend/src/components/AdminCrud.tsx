import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

/**
 * Panel CRUD generik untuk konten admin yang bentuknya sederhana: daftar teks
 * dengan beberapa field. Dipakai untuk gejala (label, bobot, tanda bahaya) dan
 * FAQ (pertanyaan, jawaban). Artikel tidak ikut memakai ini karena punya tag
 * pilihan dan isi per paragraf.
 *
 * Bold pada jawaban ditulis dengan markdown **tebal**, bukan HTML, supaya
 * teks yang disimpan admin tidak pernah dieksekusi sebagai markup.
 */
type Kind = "text" | "textarea" | "number" | "checkbox";

export interface CrudField {
  name: string;
  label: string;
  kind: Kind;
  min?: number;
  max?: number;
}

type Row = Record<string, number | string | boolean> & { id: number | string };
type Values = Record<string, number | string | boolean>;

const empty = (fields: CrudField[]): Values =>
  Object.fromEntries(fields.map((f) => [f.name, f.kind === "checkbox" ? false : f.kind === "number" ? (f.min ?? 1) : ""]));

/** Label ringkas untuk baris daftar, supaya admin tahu sedang mengedit apa. */
const ringkas = (row: Row, fields: CrudField[]) =>
  fields
    .map((f) => String(row[f.name] ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" Â· ");

export default function AdminCrud({ title, endpoint, fields }: { title: string; endpoint: string; fields: CrudField[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Values>(() => empty(fields));
  const [editId, setEditId] = useState<number | string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    apiGet<Row[]>(endpoint)
      .then(setRows)
      .catch((e: Error) => setMsg(e.message));
  }, [endpoint]);

  useEffect(load, [load]);

  const reset = () => {
    setEditId(null);
    setForm(empty(fields));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const body: Values = { ...form };
    for (const f of fields) {
      if (f.kind === "number") body[f.name] = Number(body[f.name]);
    }
    try {
      if (editId === null) await apiPost(endpoint, body);
      else await apiPut(`${endpoint}/${editId}`, body);
      reset();
      load();
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Gagal menyimpan");
    }
  };

  const del = async (row: Row) => {
    if (!confirm(`Hapus "${ringkas(row, fields)}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setMsg("");
    try {
      await apiDelete(`${endpoint}/${row.id}`);
      if (String(editId) === String(row.id)) reset();
      load();
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Gagal menghapus");
    }
  };

  const startEdit = (row: Row) => {
    setEditId(row.id);
    setForm({ ...Object.fromEntries(fields.map((f) => [f.name, row[f.name] ?? empty(fields)[f.name]])) });
  };

  return (
    <>
      <h3 className="mt-6 font-bold">
        {editId === null ? `Tambah ${title}` : `Edit ${title}`} ({rows.length})
      </h3>
      <form onSubmit={submit} className="mt-2 grid gap-2.5 rounded-[14px] border border-line bg-surface p-4">
        {fields.map((f) => (
          <label key={f.name} className="grid gap-1 text-sm">
            <span className="text-muted">{f.label}</span>
            {f.kind === "textarea" && (
              <textarea
                value={String(form[f.name] ?? "")}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                rows={3}
                required
                className="rounded-[10px] border border-line px-3 py-2"
              />
            )}
            {f.kind === "text" && (
              <input
                value={String(form[f.name] ?? "")}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                required
                className="rounded-[10px] border border-line px-3 py-2"
              />
            )}
            {f.kind === "number" && (
              <input
                type="number"
                min={f.min}
                max={f.max}
                value={Number(form[f.name] ?? f.min ?? 1)}
                onChange={(e) => setForm({ ...form, [f.name]: Number(e.target.value) })}
                required
                className="w-24 rounded-[10px] border border-line px-3 py-2"
              />
            )}
            {f.kind === "checkbox" && (
              <input
                type="checkbox"
                checked={Boolean(form[f.name])}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                className="size-4 justify-self-start"
              />
            )}
          </label>
        ))}
        <div className="flex gap-2.5">
          <button className="w-fit rounded-[10px] bg-acc px-5 py-2 font-bold text-onfill">Simpan</button>
          {editId !== null && (
            <button type="button" onClick={reset} className="rounded-[10px] border border-line px-3 py-2 text-sm">
              Batal edit
            </button>
          )}
        </div>
      </form>

      <ul className="mt-2 divide-y divide-line rounded-[14px] border border-line bg-surface">
        {rows.map((row) => (
          <li key={String(row.id)} className="flex items-center justify-between gap-2 p-3 text-sm">
            <span className="truncate">{ringkas(row, fields)}</span>
            <span className="flex shrink-0 gap-1.5">
              <button
                onClick={() => startEdit(row)}
                className="rounded-lg border border-line px-2.5 py-0.5 text-xs font-semibold hover:border-acc hover:text-acc"
              >
                Edit
              </button>
              <button
                onClick={() => del(row)}
                className="rounded-lg border border-line px-2.5 py-0.5 text-xs font-semibold text-danger hover:border-danger"
              >
                Hapus
              </button>
            </span>
          </li>
        ))}
      </ul>
      {msg && <p className="mt-3 text-sm text-danger">{msg}</p>}
    </>
  );
}