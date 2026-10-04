import { useContent } from "../lib/content";
import { useReveal } from "../lib/ui";

export default function Poliklinik() {
  const { content, loading } = useContent();
  useReveal(content);
  if (loading || !content) return <p className="py-10">Memuat...</p>;

  const mapsQuery = encodeURIComponent(content.contact?.maps || "Poliklinik ITERA");
  const embed = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const link = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <section className="rv py-11">
      <h2 className="text-2xl font-bold">Info Poliklinik</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <h4 className="font-bold">Poliklinik ITERA</h4>
          <p className="text-sm text-muted">Layanan kesehatan dasar untuk mahasiswa, dosen, dan tenaga kependidikan Institut Teknologi Sumatera.</p>
        </div>
        <div>
          <h4 className="font-bold">Jam Operasional</h4>
          <p>Senin - Jumat<br /><b>08.00 - 16.00 WIB</b></p>
          <p className="text-sm text-muted">Jadwal dapat berubah, cek pengumuman di akun resmi.</p>
        </div>
        <div>
          <h4 className="font-bold">Lokasi</h4>
          <p>Area kampus ITERA, dekat Galeri ITERA.<br />Jl. Terusan Ryacudu, Way Huwi, Jati Agung, Lampung Selatan 35365</p>
        </div>
        <div>
          <h4 className="font-bold">Layanan</h4>
          <p>Pemeriksaan umum, pengobatan ringan, konsultasi medis, dan rujukan ke fasilitas kesehatan lain. Gratis bagi sivitas akademika.</p>
        </div>
        <div>
          <h4 className="font-bold">Kontak Resmi</h4>
          <a href="https://www.instagram.com/poliklinik_itera/" target="_blank" rel="noopener" aria-label="Instagram Poliklinik ITERA"
            className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 border-acc text-acc transition hover:-translate-y-0.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
            </svg>
          </a>
        </div>
      </div>
      <div className="mt-6">
        <iframe title="Peta lokasi Poliklinik ITERA" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={embed} className="block h-[280px] w-full rounded-xl border-0" />
        <a href={link} target="_blank" rel="noopener" className="mt-2 inline-block text-sm text-acc">Buka di Google Maps</a>
      </div>
    </section>
  );
}
