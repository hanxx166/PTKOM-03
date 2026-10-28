import { useContent } from "../lib/content";

/**
 * Site footer, shared by every page so the medical references stay
 * reachable no matter which route is active.
 */
export default function Footer() {
  const { content } = useContent();
  const mapsQuery = encodeURIComponent(content?.contact?.maps || "Poliklinik ITERA, Lampung Selatan");

  return (
    <footer className="dbd-footer">
      <div className="dbd-footer-grid">
        <div>
          <h2>CekDBD</h2>
          <p>Sistem edukasi dan pemantauan mandiri DBD untuk sivitas akademika ITERA.</p>
          <p className="dbd-footer-muted">⚕️ Bukan pengganti diagnosis dokter.</p>
        </div>
        <div>
          <h3>Kontak Medis</h3>
          <p>📍 Poliklinik ITERA, Labtek O Lt.1, Jati Agung</p>
          <p>📞 <a href="tel:+627218030188">(0721) 8030188</a></p>
          <p>🕐 Senin-Jumat: 08.00-16.30 WIB</p>
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer">Buka lokasi di Google Maps ↗</a>
          <p><a href="https://www.instagram.com/poliklinik_itera/" target="_blank" rel="noreferrer">Instagram Poliklinik ITERA ↗</a></p>
        </div>
        <div>
          <h3>Rujukan</h3>
          <p>🏥 RS Airan Raya - IGD 24 jam</p>
          <p>🏥 RSUD Dr. H. Abdul Moeloek</p>
          <p>🚨 Darurat: <a href="tel:119"><b>119</b></a></p>
        </div>
      </div>
      <p className="dbd-copyright">© 2026 CekDBD. Informasi ini bukan pengganti nasihat dokter.</p>
    </footer>
  );
}