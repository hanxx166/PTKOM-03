document.documentElement.classList.add("js");
const $ = (s) => document.querySelector(s);
const el = (t, c, x) => {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (x != null) e.textContent = x;
  return e;
};
const get = async (u) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(r.status);
  return r.json();
};
const post = async (u, b) => {
  const r = await fetch(u, { method: "POST", body: JSON.stringify(b) });
  let j;
  try {
    j = await r.json();
  } catch {
    throw new Error("backend PHP belum berjalan");
  }
  if (!r.ok) throw new Error(j.error || r.status);
  return j;
};
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/* Animasi scroll + nyamuk */
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.1 },
);
function watchReveals(root) {
  (root || document)
    .querySelectorAll(".rv:not(.in)")
    .forEach((x) => io.observe(x));
}
watchReveals(document);
let hits = 0;
document.querySelectorAll(".fly").forEach(
  (f) =>
    (f.onclick = () => {
      f.classList.add("hit");
      $("#hits").textContent = ++hits;
      setTimeout(() => f.classList.remove("hit"), 2500);
    }),
);

/* Router 1 navbar = 1 halaman (hash-based, tanpa reload) */
const PAGES = [
  "beranda",
  "artikel",
  "cek-gejala",
  "cegah",
  "fakta-mitos",
  "catatan",
  "poliklinik",
];
const LEGACY = {
  top: "beranda",
  artikel: "artikel",
  cek: "cek-gejala",
  cegah: "cegah",
  kuis: "fakta-mitos",
  jurnal: "catatan",
  poli: "poliklinik",
};
function currentRoute() {
  const h = (location.hash || "")
    .replace(/^#\/?/, "")
    .split("?")[0]
    .split("/")[0]
    .trim();
  if (!h) return "beranda";
  if (PAGES.includes(h)) return h;
  if (LEGACY[h]) return LEGACY[h];
  return "beranda";
}
function navigate() {
  const r = currentRoute();
  const raw = (location.hash || "")
    .replace(/^#\/?/, "")
    .split("?")[0]
    .split("/")[0]
    .trim();
  if (raw && !PAGES.includes(raw) && LEGACY[raw]) {
    history.replaceState(null, "", "#/" + LEGACY[raw]);
  }
  document.querySelectorAll("[data-page]").forEach((s) => {
    s.hidden = s.dataset.page !== r;
  });
  document
    .querySelectorAll("#mainnav a")
    .forEach((a) => a.classList.toggle("active", a.dataset.route === r));
  document.body.dataset.page = r;
  window.scrollTo(0, 0);
  const hdr = document.querySelector("header");
  if (hdr) hdr.classList.remove("open");
  const bg = $("#burger");
  if (bg) bg.setAttribute("aria-expanded", "false");
  // Halaman aktif harus langsung visible: tambah .in sinkron (bukan setTimeout),
  // supaya tidak bergantung pada timing IntersectionObserver.
  const vis = document.querySelectorAll('[data-page="' + r + '"]');
  vis.forEach((s) => {
    s.classList.add("in");
    io.unobserve(s);
  });
}
window.addEventListener("hashchange", navigate);
window.addEventListener("popstate", navigate);
navigate();
$("#burger").onclick = () => {
  const h = document.querySelector("header"),
    open = h.classList.toggle("open");
  $("#burger").setAttribute("aria-expanded", String(open));
};
document.querySelectorAll("#mainnav a[data-route]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    if (location.hash !== a.hash) history.pushState(null, "", a.hash);
    navigate();
  }),
);

/* Data: semua konten ada di data/content.json (server: api/content.php) */
let C = null,
  MODE = "local",
  USER = null;
const FACTS = [
  { id: 1, big: "2-7 hari", text: "lama demam tinggi pada DBD" },
  { id: 2, big: "Hari 3-7", text: "fase kritis, saat demam turun" },
  { id: 3, big: "Pagi & sore", text: "waktu nyamuk Aedes menggigit" },
];
const isAdmin = () => USER && USER.role === "admin";
async function init() {
  let base;
  try {
    base = await get("api/content.php");
    MODE = "server";
  } catch {
    try {
      base = await get("data/content.json");
    } catch {
      $("#list").textContent =
        "Data gagal dimuat. Buka lewat server (Live Server atau php -S), bukan klik dua kali file HTML.";
      return;
    }
  }
  let loc = null;
  if (MODE === "local") {
    try {
      loc = JSON.parse(localStorage.getItem("content"));
    } catch {}
  }
  C = loc && loc.articles ? loc : base;
  C.contact = C.contact || { maps: "Poliklinik ITERA, Lampung Selatan" };
  C.facts = C.facts || FACTS;
  if (MODE === "server") {
    try {
      setUser((await get("api/auth.php?action=me")).user);
    } catch {}
  } else {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    } catch {}
  }
  renderAll();
}
function renderAll() {
  qi = qs = 0;
  drawFacts();
  drawArts();
  drawSym();
  draw3m();
  quiz();
  renderContact();
  navigate();
}
async function save() {
  if (!isAdmin()) throw new Error("Hanya admin yang boleh mengubah data");
  if (MODE === "server") await post("api/save.php", C);
  else {
    try {
      localStorage.setItem("content", JSON.stringify(C));
    } catch {
      throw new Error("Gagal menyimpan di browser");
    }
  }
}

const preview = (b) => {
  const t = b.join(" ");
  return t.length > 110 ? t.slice(0, 107).trimEnd() + "…" : t;
};
function ask(t) {
  return new Promise((res) => {
    const d = $("#cf");
    $("#cfmsg").textContent = t;
    const end = (v) => {
      d.close();
      res(v);
    };
    $("#cf-ok").onclick = () => end(true);
    $("#cf-no").onclick = () => end(false);
    d.oncancel = () => res(false);
    d.showModal();
  });
}
function drawFacts() {
  const b = $("#facts");
  b.textContent = "";
  C.facts.forEach((x) => {
    const d = el("div");
    d.append(el("b", "", x.big), el("span", "", x.text), ctl("facts", x));
    b.append(d);
  });
}

/* Editor umum untuk artikel, gejala, langkah 3M, kuis, dan kontak */
const SCHEMA = {
  articles: {
    name: "Artikel",
    f: [
      ["title", "Judul", "text"],
      ["tag", "Kategori", "cat"],
      ["body", "Isi artikel (satu paragraf per baris)", "lines"],
    ],
  },
  symptoms: {
    name: "Gejala",
    f: [
      ["label", "Nama gejala", "text"],
      ["w", "Bobot skor (1-3)", "num"],
      ["danger", "Tanda bahaya (langsung risiko tinggi)", "bool"],
    ],
  },
  tasks: { name: "Langkah 3M Plus", f: [["text", "Langkah", "text"]] },
  quiz: {
    name: "Pernyataan",
    f: [
      ["s", "Pernyataan", "text"],
      ["a", "Jawaban yang benar", "tf"],
      ["e", "Penjelasan", "text"],
    ],
  },
  facts: {
    name: "Informasi",
    f: [
      ["big", "Judul singkat (mis. 2-7 hari)", "text"],
      ["text", "Keterangan", "text"],
    ],
  },
  contact: {
    name: "Lokasi Peta",
    f: [["maps", "Kata kunci lokasi di Google Maps", "text"]],
  },
};
function ctl(type, item, cls = "ctl") {
  const s = el("span", "ab " + cls),
    e = el("button", "mini", "Edit"),
    d = el("button", "mini", "Hapus");
  e.type = d.type = "button";
  e.onclick = (ev) => {
    ev.stopPropagation();
    openEditor(type, item);
  };
  d.onclick = (ev) => {
    ev.stopPropagation();
    del(type, item);
  };
  s.append(e, d);
  return s;
}
async function del(type, item) {
  if (!(await ask("Hapus item ini? Tindakan ini tidak bisa dibatalkan.")))
    return;
  C[type] = C[type].filter((x) => x !== item);
  save()
    .then(renderAll)
    .catch((e) => alert(e.message));
}
function openEditor(type, item) {
  const S = SCHEMA[type],
    box = $("#edfields");
  box.textContent = "";
  $("#edt").textContent = (item ? "Edit " : "Tambah ") + S.name;
  const inputs = S.f.map(([k, lab, t]) => {
    const w = el("label", "fld"),
      v = item ? item[k] : undefined;
    let i,
      n = null;
    if (t === "lines") {
      i = el("textarea");
      i.rows = 6;
      i.required = true;
      i.value = (v || []).join("\n");
    } else if (t === "cat") {
      const base = [
        ...new Set([
          "Dasar",
          "Gejala",
          "Pencegahan",
          "Penanganan",
          "Tips",
          ...C.articles.map((a) => a.tag),
        ]),
      ];
      i = el("select");
      base.forEach((o) => i.append(new Option(o)));
      i.append(new Option("+ Kategori baru...", "__new"));
      i.value = v || base[0];
      n = el("input");
      n.placeholder = "Nama kategori baru";
      n.maxLength = 20;
      n.hidden = true;
      i.onchange = () => {
        n.hidden = i.value !== "__new";
        n.required = !n.hidden;
      };
    } else if (t === "tf") {
      i = el("select");
      ["Fakta", "Mitos"].forEach((o) => i.append(new Option(o)));
      i.value = v === false ? "Mitos" : "Fakta";
    } else if (t === "bool") {
      i = el("input");
      i.type = "checkbox";
      i.checked = !!v;
    } else {
      i = el("input");
      i.type = t === "num" ? "number" : "text";
      if (t === "num") {
        i.min = 1;
        i.max = 3;
      }
      i.value = v ?? (t === "num" ? 1 : "");
      i.required = t === "text";
    }
    w.append(el("span", "", lab), i);
    if (n) w.append(n);
    box.append(w);
    return [k, t, i, n];
  });
  $("#edf").onsubmit = (e) => {
    e.preventDefault();
    const o = {};
    inputs.forEach(([k, t, i, n]) => {
      o[k] =
        t === "lines"
          ? i.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : t === "num"
            ? Math.min(3, Math.max(1, +i.value || 1))
            : t === "bool"
              ? i.checked
              : t === "tf"
                ? i.value === "Fakta"
                : t === "cat"
                  ? i.value === "__new"
                    ? n.value.trim()
                    : i.value
                  : i.value.trim();
    });
    if (type === "articles") {
      if (!o.body.length) return;
      o.mins = Math.max(
        1,
        Math.ceil(o.body.join(" ").split(/\s+/).length / 180),
      );
    }
    if (item) Object.assign(item, o);
    else {
      o.id = type === "symptoms" ? "s" + Date.now() : Date.now();
      if (type === "articles") {
        o.date = today();
        C.articles.unshift(o);
      } else C[type].push(o);
    }
    save()
      .then(() => {
        $("#ed").close();
        renderAll();
      })
      .catch((x) => {
        $("#edmsg").textContent = x.message;
      });
  };
  $("#edmsg").textContent = "";
  $("#ed").showModal();
}
$("#edx").onclick = () => $("#ed").close();
document
  .querySelectorAll("[data-add]")
  .forEach((b) => (b.onclick = () => openEditor(b.dataset.add)));
document
  .querySelectorAll("[data-edit]")
  .forEach(
    (b) => (b.onclick = () => openEditor(b.dataset.edit, C[b.dataset.edit])),
  );

/* Masuk / Daftar / Lupa password */
const sha = async (s) =>
  crypto.subtle
    ? [
        ...new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
        ),
      ]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    : "p" + btoa(unescape(encodeURIComponent(s)));
async function localAuth(act, d) {
  const U = JSON.parse(localStorage.getItem("users") || "[]"),
    email = (d.email || "").trim().toLowerCase(),
    i = U.findIndex((u) => u.email === email),
    pw = d.password || "";
  const pub = (u) => ({ name: u.name, email: u.email, role: u.role }),
    put = () => localStorage.setItem("users", JSON.stringify(U));
  if (act === "signup") {
    if (!(d.name || "").trim() || !email.includes("@") || pw.length < 6)
      throw new Error(
        "Lengkapi data dengan benar (password minimal 6 karakter)",
      );
    if (i >= 0) throw new Error("Email sudah terdaftar");
    const u = {
      name: d.name.trim(),
      email,
      hash: await sha(pw),
      role: U.length ? "user" : "admin",
    };
    U.push(u);
    put();
    return { user: pub(u) };
  }
  if (act === "login") {
    if (i < 0 || U[i].hash !== (await sha(pw)))
      throw new Error("Email atau password salah");
    return { user: pub(U[i]) };
  }
  const RS = JSON.parse(localStorage.getItem("resets") || "{}"),
    sv = () => localStorage.setItem("resets", JSON.stringify(RS));
  if (act === "sendcode") {
    if (i < 0) throw new Error("Email tidak terdaftar");
    const code = String(100000 + Math.floor(Math.random() * 900000));
    RS[email] = { code, exp: Date.now() + 600000 };
    sv();
    return { ok: true, demo: code };
  }
  const r = RS[email];
  if (!r || r.exp < Date.now() || r.code !== String(d.code || "").trim())
    throw new Error("Kode salah atau sudah kedaluwarsa");
  if (i < 0 || pw.length < 6)
    throw new Error("Password baru minimal 6 karakter");
  U[i].hash = await sha(pw);
  put();
  delete RS[email];
  sv();
  return { ok: true };
}
const auth = (act, d) =>
  MODE === "server"
    ? post("api/auth.php", { action: act, ...d })
    : localAuth(act, d);
function setUser(u) {
  USER = u || null;
  $("#guest").hidden = !!USER;
  $("#me").hidden = !USER;
  $("#mename").textContent = USER
    ? USER.name + (isAdmin() ? " (Admin)" : "")
    : "";
  document.body.classList.toggle("is-admin", !!isAdmin());
  renderJournal();
  if (MODE === "local") {
    try {
      USER
        ? localStorage.setItem("user", JSON.stringify(USER))
        : localStorage.removeItem("user");
    } catch {}
  }
}
let rs2 = false;
function msg(t, ok) {
  const m = $("#aerr");
  m.textContent = t;
  m.classList.toggle("ok", !!ok);
}
function showAuth(v) {
  ["in", "up", "rs"].forEach((k) => ($("#f-" + k).hidden = k !== v));
  $("#tab-in").classList.toggle("on", v !== "up");
  $("#tab-up").classList.toggle("on", v === "up");
  const f = $("#f-rs");
  rs2 = false;
  $("#rs2").hidden = true;
  f.email.readOnly = false;
  f.code.required = f.password.required = false;
  $("#rsbtn").textContent = "Kirim kode";
  $("#admc").hidden = true;
  msg("");
  if (!$("#auth").open) $("#auth").showModal();
}
$("#b-in").onclick =
  $("#tab-in").onclick =
  $("#back").onclick =
    (e) => {
      e.preventDefault();
      showAuth("in");
    };
$("#b-up").onclick = $("#tab-up").onclick = () => showAuth("up");
$("#lupa").onclick = (e) => {
  e.preventDefault();
  showAuth("rs");
};
$("#admt").onclick = (e) => {
  e.preventDefault();
  $("#admc").hidden = !$("#admc").hidden;
};
["in", "up"].forEach(
  (k) =>
    ($("#f-" + k).onsubmit = async (e) => {
      e.preventDefault();
      try {
        const r = await auth(
          k === "in" ? "login" : "signup",
          Object.fromEntries(new FormData(e.target)),
        );
        const p = pendingCheck;
        setUser(r.user);
        e.target.reset();
        $("#auth").close();
        if (p) showResult();
      } catch (x) {
        msg(x.message);
      }
    }),
);
$("#f-rs").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target,
    d = Object.fromEntries(new FormData(f));
  try {
    if (!rs2) {
      const r = await auth("sendcode", { email: d.email });
      rs2 = true;
      $("#rs2").hidden = false;
      f.code.required = f.password.required = true;
      f.email.readOnly = true;
      $("#rsbtn").textContent = "Reset password";
      msg(
        r.demo
          ? "Mode demo (belum ada server email): kode Anda " +
              r.demo +
              ". Di hosting dengan email, kode dikirim ke email."
          : r.mailed
            ? "Kode telah dikirim ke email Anda. Berlaku 10 menit."
            : "Pengiriman email belum aktif di server ini. Kode demo tersimpan di file data/kode-reset.txt pada server.",
        true,
      );
    } else {
      await auth("reset", d);
      f.reset();
      showAuth("in");
      msg("Password berhasil diubah, silakan masuk.", true);
    }
  } catch (x) {
    msg(x.message);
  }
};
$("#b-out").onclick = async () => {
  if (MODE === "server")
    await post("api/auth.php", { action: "logout" }).catch(() => {});
  setUser(null);
};

/* Artikel */
function drawArts() {
  const q = $("#search").value.toLowerCase(),
    box = $("#list");
  box.textContent = "";
  const f = C.articles.filter((a) =>
    (a.title + " " + a.body.join(" ")).toLowerCase().includes(q),
  );
  if (!f.length) box.textContent = "Artikel tidak ditemukan.";
  f.forEach((a) => {
    const c = el("div", "card"),
      dt = a.date ? "Diunggah " + fmt(a.date) : "";
    c.tabIndex = 0;
    c.append(
      el("span", "tag", a.tag + " · " + a.mins + " menit"),
      el("h3", "", a.title),
      el("p", "", preview(a.body)),
      el("small", "date", dt),
      ctl("articles", a),
    );
    const open = () => {
      const b = $("#dbody");
      b.textContent = "";
      b.append(el("h3", "", a.title), el("small", "date", dt));
      a.body.forEach((t) => b.append(el("p", "", t)));
      $("#dlg").showModal();
    };
    c.onclick = open;
    c.onkeydown = (e) => {
      if (e.key === "Enter") open();
    };
    box.append(c);
  });
}
$("#search").oninput = drawArts;

/* Cek gejala */
function drawSym() {
  const b = $("#sym");
  b.textContent = "";
  C.symptoms.forEach((x) => {
    const l = el("label", "chk"),
      i = document.createElement("input");
    i.type = "checkbox";
    i.value = x.id;
    l.append(i, el("span", "", x.label), ctl("symptoms", x, "ctl push"));
    b.append(l);
  });
}
const LV = {
  tinggi: [
    "Risiko tinggi",
    "Segera periksa ke dokter atau IGD terdekat dan lakukan cek laboratorium.",
  ],
  sedang: [
    "Risiko sedang",
    "Istirahat, banyak minum, dan periksa ke dokter bila demam berlanjut lebih dari 2 hari.",
  ],
  rendah: [
    "Risiko rendah",
    "Gejala belum mengarah kuat ke DBD. Tetap pantau kondisi Anda.",
  ],
};
function stats() {
  get("api/log.php")
    .then((s) => {
      $("#stat").textContent =
        s.total + " pengecekan gejala telah dilakukan di website ini";
    })
    .catch(() => {});
}
function showResult() {
  const on = [...document.querySelectorAll("#sym input:checked")].map(
      (i) => i.value,
    ),
    r = $("#res");
  if (!on.length) {
    r.className = "res";
    r.textContent = "Pilih minimal satu gejala.";
    return;
  }
  const ch = C.symptoms.filter((x) => on.includes(String(x.id))),
    sc = ch.reduce((a, x) => a + x.w, 0);
  const l =
    ch.some((x) => x.danger) || sc >= 6
      ? "tinggi"
      : sc >= 3
        ? "sedang"
        : "rendah";
  r.className = "res " + l;
  r.textContent = "";
  r.append(
    el("b", "", LV[l][0] + " (skor " + sc + ")"),
    el("p", "", LV[l][1] + " Ini hanya skrining awal, bukan diagnosis medis."),
  );
  post("api/log.php", { level: l })
    .then(stats)
    .catch(() => {});
}
let pendingCheck = false;
$("#go").onclick = () => {
  if (!USER) {
    pendingCheck = true;
    $("#gate").showModal();
    return;
  }
  showResult();
};
$("#g-in").onclick = () => {
  $("#gate").close();
  showAuth("in");
};
$("#g-up").onclick = () => {
  $("#gate").close();
  showAuth("up");
};
$("#g-x").onclick = () => {
  pendingCheck = false;
  $("#gate").close();
};
$("#auth").addEventListener("close", () => {
  pendingCheck = false;
});
stats();

/* Checklist 3M Plus */
let done = [];
try {
  done = JSON.parse(localStorage.getItem("m3ids") || "[]");
} catch {}
function draw3m() {
  const box = $("#tasks"),
    T = C.tasks;
  box.textContent = "";
  done = done.filter((x) => T.some((t) => t.id === x));
  T.forEach((t) => {
    const l = el("label", "chk"),
      c = document.createElement("input");
    c.type = "checkbox";
    c.checked = done.includes(t.id);
    c.onchange = () => {
      done = c.checked ? [...done, t.id] : done.filter((x) => x !== t.id);
      try {
        localStorage.setItem("m3ids", JSON.stringify(done));
      } catch {}
      draw3m();
      if (c.checked && done.length === T.length)
        celebrate(
          "🎉",
          "Rumahmu siap lawan DBD!",
          "Semua langkah 3M Plus minggu ini sudah selesai. Terus jaga kebersihan lingkungan ya!",
        );
    };
    l.append(c, el("span", "", t.text), ctl("tasks", t, "ctl push"));
    box.append(l);
  });
  const p = T.length ? Math.round((done.length / T.length) * 100) : 0;
  $("#bar").style.width = p + "%";
  $("#pct").textContent = p + "% selesai";
}

/* Popup perayaan + konfeti emoji */
function celebrate(emoji, title, text, conf = true) {
  $("#pemoji").textContent = emoji;
  $("#ptitle").textContent = title;
  $("#ptext").textContent = text;
  const c = $("#conf");
  c.textContent = "";
  if (conf) {
    const E = ["🎉", "🎊", "✨", "🥳", "🎈"];
    for (let i = 0; i < 45; i++) {
      const x = el("span", "cf", E[i % E.length]);
      x.style.cssText =
        "left:" +
        Math.random() * 100 +
        "%;animation-duration:" +
        (2.5 + Math.random() * 2.5) +
        "s;animation-delay:" +
        Math.random() * 1.2 +
        "s;font-size:" +
        (18 + Math.random() * 20) +
        "px";
      c.append(x);
    }
  }
  $("#pop").showModal();
}
$("#pop").addEventListener("close", () => {
  $("#conf").textContent = "";
});

/* Kuis Fakta atau Mitos */
let qi = 0,
  qs = 0;
function quiz() {
  const Q = C.quiz,
    b = $("#quiz");
  b.textContent = "";
  if (!Q.length) {
    b.textContent = "Belum ada pernyataan.";
    return;
  }
  if (qi >= Q.length) {
    b.append(
      el("h3", "", "Skor Anda: " + qs + " dari " + Q.length),
      el(
        "p",
        "",
        qs >= Q.length - 1
          ? "Hebat! Anda sudah paham DBD."
          : qs >= Q.length / 2
            ? "Lumayan! Baca artikel lagi untuk melengkapi."
            : "Yuk baca artikelnya dulu, lalu coba lagi.",
      ),
    );
    const r = el("button", "btn", "Main lagi");
    r.onclick = () => {
      qi = qs = 0;
      quiz();
    };
    b.append(r);
    if (qs > 0)
      celebrate(
        "🏆",
        "Selamat!",
        "Anda benar " + qs + " pernyataan dari " + Q.length + ".",
      );
    else
      celebrate(
        "💪",
        "Tetap semangat!",
        "Anda benar 0 pernyataan. Baca artikelnya lalu coba lagi ya.",
        false,
      );
    return;
  }
  const q = Q[qi],
    row = el("div", "qrow"),
    fb = el("p", "fb");
  b.append(
    el("span", "tag", "Pernyataan " + (qi + 1) + " dari " + Q.length),
    el("h3", "", q.s),
    ctl("quiz", q),
  );
  [
    ["Fakta", true],
    ["Mitos", false],
  ].forEach(([t, v]) => {
    const x = el("button", "btn opt", t);
    x.dataset.v = v;
    x.onclick = () => {
      const ok = v === q.a;
      if (ok) qs++;
      row.querySelectorAll("button").forEach((y) => {
        y.disabled = true;
        if (y.dataset.v === String(q.a)) y.classList.add("right");
      });
      if (!ok) x.classList.add("wrong");
      fb.className = "fb " + (ok ? "ok" : "no");
      fb.textContent = (ok ? "Benar! " : "Kurang tepat. ") + q.e;
      const n = el(
        "button",
        "btn",
        qi + 1 < Q.length ? "Lanjut" : "Lihat skor",
      );
      n.onclick = () => {
        qi++;
        quiz();
      };
      b.append(n);
    };
    row.append(x);
  });
  b.append(row, fb);
}

/* Kontak Instagram + peta */
const IG =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>';
function renderContact() {
  const k = $("#kontak");
  k.textContent = "";
  const a = el("a", "ig");
  a.innerHTML = IG;
  a.href = "https://www.instagram.com/poliklinik_itera/";
  a.target = "_blank";
  a.rel = "noopener";
  a.title = "Instagram Poliklinik ITERA";
  a.setAttribute("aria-label", "Instagram Poliklinik ITERA");
  k.append(a);
  const q = encodeURIComponent(C.contact.maps || "Poliklinik ITERA");
  $("#map").src = "https://www.google.com/maps?q=" + q + "&output=embed";
  $("#maplink").href = "https://www.google.com/maps/search/?api=1&query=" + q;
}

/* Catatan Demam Saya (khusus pengguna yang masuk) */
let J = [];
async function jLoad() {
  if (MODE === "server") return (await get("api/journal.php")).entries;
  try {
    return JSON.parse(localStorage.getItem("journal:" + USER.email) || "[]");
  } catch {
    return [];
  }
}
async function jSave() {
  if (MODE === "server") await post("api/journal.php", { entries: J });
  else localStorage.setItem("journal:" + USER.email, JSON.stringify(J));
}
async function renderJournal() {
  $("#jguest").hidden = !!USER;
  $("#juser").hidden = !USER;
  if (!USER) return;
  try {
    J = await jLoad();
  } catch {
    J = [];
  }
  drawJournal();
}
function insight(s) {
  if (!s.length)
    return ["", "Belum ada catatan. Mulai catat suhu tubuh Anda hari ini."];
  const fever = (i) => {
    let n = 0;
    for (; i >= 0 && s[i].temp >= 38; i--) n++;
    return n;
  };
  const last = s[s.length - 1],
    run = fever(s.length - 1);
  if (run >= 2)
    return [
      "tinggi",
      "Demam 38°C atau lebih tercatat " +
        run +
        " entri berturut-turut. Segera periksa ke dokter atau Poliklinik ITERA.",
    ];
  if (run === 1)
    return [
      "sedang",
      "Demam terdeteksi. Banyak minum, istirahat, dan periksa ke dokter bila berlanjut lebih dari 2 hari.",
    ];
  const before = fever(s.length - 2);
  if (before >= 2)
    return [
      "sedang",
      "Suhu sudah turun, tetapi sebelumnya demam " +
        before +
        " entri berturut-turut. Demam turun belum tentu sembuh, bisa jadi awal fase kritis DBD. Waspadai tanda bahaya.",
    ];
  return [
    "rendah",
    "Suhu terakhir " +
      last.temp.toFixed(1) +
      "°C, dalam batas normal. Tetap catat setiap hari.",
  ];
}
function drawJournal() {
  const s = [...J].sort((a, b) =>
      a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1,
    ),
    [lv, t] = insight(s);
  const r = $("#jin");
  r.className = "res " + lv;
  r.textContent = t;
  const c = $("#jchart");
  c.textContent = "";
  if (s.length) {
    const w = el("div", "bars");
    s.slice(-14).forEach((x) => {
      const b = el("div", "bcol"),
        bar = el("div", "bar" + (x.temp >= 38 ? " hot" : ""));
      bar.style.height =
        Math.max(4, Math.min(110, ((x.temp - 35) / 6) * 110)) + "px";
      bar.title = x.temp + "°C";
      b.append(
        el("span", "", x.temp.toFixed(1)),
        bar,
        el("span", "", x.date.slice(8) + "/" + x.date.slice(5, 7)),
      );
      w.append(b);
    });
    c.append(w);
  }
  const L = $("#jlist");
  L.textContent = "";
  [...s].reverse().forEach((x) => {
    const row = el("div", "jrow"),
      d = el("button", "mini", "Hapus");
    d.type = "button";
    d.onclick = async () => {
      if (!(await ask("Hapus catatan ini?"))) return;
      J = J.filter((y) => y !== x);
      jSave()
        .then(drawJournal)
        .catch((e) => alert(e.message));
    };
    row.append(
      el(
        "span",
        "",
        fmt(x.date) +
          " · " +
          x.temp.toFixed(1) +
          "°C" +
          (x.note ? " · " + x.note : ""),
      ),
      d,
    );
    L.append(row);
  });
}
$("#jf").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target.elements;
  J.push({
    id: Date.now(),
    date: f.date.value,
    temp: +f.temp.value,
    note: f.note.value.trim(),
  });
  jSave()
    .then(() => {
      f.temp.value = "";
      f.note.value = "";
      drawJournal();
    })
    .catch((x) => alert(x.message));
};
$("#jf").elements.date.value = today();
$("#j-in").onclick = () => showAuth("in");
init();
