import { useContent } from "../lib/content";
import { Link } from "react-router-dom";

/**
 * Site footer, shared by every page so the medical references stay
 * reachable no matter which route is active.
 */
export default function Footer() {
  const { content } = useContent();
  const mapsQuery = encodeURIComponent(
    content?.contact?.maps || "Poliklinik ITERA, Lampung Selatan",
  );

  return (
    <footer className="dbd-footer">
      <div className="dbd-footer-grid">
        <div>
          <h2>CekDBD</h2>
          <p>
            Sistem edukasi dan pemantauan mandiri DBD untuk sivitas akademika
            ITERA.
          </p>
          <p className="dbd-footer-muted">Bukan pengganti diagnosis dokter.</p>
        </div>
        <div>
          <h3>Navigasi</h3>
          <ul className="dbd-footer-list">
            <li>
              <Link to="/">Beranda</Link>
            </li>
            <li>
              <Link to="/cek-kesehatan">Cek Gejala &amp; Lab</Link>
            </li>
            <li>
              <Link to="/pemantauan">Suhu &amp; Kalkulator</Link>
            </li>
            <li>
              <Link to="/edukasi">Edukasi</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3>Kontak &amp; Rujukan</h3>
          <ul className="dbd-footer-list">
            <li>Poliklinik ITERA, Labtek O Lt.1, Jati Agung</li>
            <li>
              <a href="tel:+627218030188">(0721) 8030188</a>
            </li>
            <li>Senin-Jumat: 08.00-16.30 WIB</li>
            <li>
              Darurat:{" "}
              <a href="tel:119">
                <b>119</b>
              </a>
            </li>
            <li>RS Airan Raya - IGD 24 jam</li>
            <li>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
              >
                Lokasi Poliklinik
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="dbd-copyright">
        © 2026 CekDBD. Informasi ini bukan pengganti nasihat dokter.
      </p>
    </footer>
  );
}
