import type { TrackerRow } from "./tracker";

const PAGE_WIDTH = 595;

function pdfText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/[\\()]/g, "\\$&");
}

function createContent(entries: TrackerRow[], pageHeight: number): string {
  const commands = [`1 0 0 -1 0 ${pageHeight} cm`];
  const text = (x: number, y: number, size: number, value: string, font = "F1") => {
    commands.push(`BT /${font} ${size} Tf 1 0 0 -1 ${x} ${y} Tm (${pdfText(value)}) Tj ET`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    commands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };

  commands.push("0.08 0.4 0.84 RG 0.08 0.4 0.84 rg 1.5 w");
  text(44, 46, 19, "Catatan Suhu Harian", "F2");
  commands.push("0.34 0.42 0.5 rg");
  text(44, 65, 9, `Dibuat ${new Date().toLocaleString("id-ID")}`);
  text(44, 80, 9, `${entries.length} catatan suhu | Data dari Pelacak Suhu CekDBD`);

  text(44, 106, 11, "Grafik suhu tubuh", "F2");
  commands.push("0.82 0.87 0.93 RG 0.6 w");
  const chartLeft = 66;
  const chartRight = 550;
  const chartTop = 120;
  const chartBottom = 244;
  for (const temp of [36, 38, 40, 42]) {
    const y = chartBottom - ((temp - 34) / 9) * (chartBottom - chartTop);
    line(chartLeft, y, chartRight, y);
    commands.push("0.34 0.42 0.5 rg");
    text(42, y + 3, 7, `${temp} C`);
    commands.push("0.82 0.87 0.93 RG");
  }
  commands.push("0.08 0.4 0.84 RG 1.5 w");
  if (entries.length) {
    const points = entries.map((entry, index) => ({
      x: entries.length === 1 ? (chartLeft + chartRight) / 2 : chartLeft + (index / (entries.length - 1)) * (chartRight - chartLeft),
      y: chartBottom - ((entry.temp - 34) / 9) * (chartBottom - chartTop),
    }));
    commands.push(`${points[0].x} ${points[0].y} m`);
    for (const point of points.slice(1)) commands.push(`${point.x} ${point.y} l`);
    if (points.length > 1) commands.push("S");
    commands.push("0.08 0.4 0.84 rg");
    for (const point of points) commands.push(`${point.x - 2} ${point.y - 2} 4 4 re f`);
  } else {
    commands.push("0.34 0.42 0.5 rg");
    text(66, 180, 9, "Belum ada catatan suhu.");
  }

  text(44, 276, 11, "Daftar catatan", "F2");
  commands.push("0.08 0.4 0.84 rg");
  commands.push("44 287 506 18 re f");
  commands.push("1 1 1 rg");
  text(52, 299, 8, "Hari");
  text(130, 299, 8, "Waktu");
  text(225, 299, 8, "Suhu");
  text(320, 299, 8, "Status catatan");

  let y = 312;
  const rows = [...entries].reverse();
  rows.forEach((entry, index) => {
    if (index % 2 === 0) {
      commands.push("0.95 0.97 0.99 rg");
      commands.push(`44 ${y - 6} 506 8 re f`);
    }
    commands.push("0.08 0.15 0.24 rg");
    text(52, y, 6.5, `Hari ${entry.day}`);
    text(130, y, 6.5, entry.time || "-");
    text(225, y, 6.5, `${entry.temp.toFixed(1)} C`);
    text(320, y, 6.5, entry.temp >= 38 ? "Perlu konsultasi" : "Catatan");
    y += 8;
  });

  commands.push("0.34 0.42 0.5 rg");
  text(44, y + 18, 7, "Catatan ini untuk pemantauan edukatif dan bukan diagnosis medis.");
  return commands.join("\n");
}

export function downloadFeverPdf(entries: TrackerRow[]): void {
  const pageHeight = Math.max(400, 368 + entries.length * 8);
  const stream = createContent(entries, pageHeight);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(document.length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = Uint8Array.from(document, (character) => character.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `catatan-suhu-${new Date().toISOString().slice(0, 10)}.pdf`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
