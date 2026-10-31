import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowSquareOut,
  MapPin,
} from "@phosphor-icons/react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Reveal from "../components/Reveal";
import { useContent } from "../lib/content";
import {
  instantTransition,
  useReducedMotion,
} from "../lib/motion";

const LOCATIONS = [
  {
    name: "Poliklinik ITERA",
    url: "https://maps.app.goo.gl/zeYtJC7PJbj8nbJb7",
    position: [-5.3577029, 105.3159198] as [number, number],
  },
  {
    name: "Puskesmas Rawat Inap Permata Sukarame",
    url: "https://maps.app.goo.gl/nq1W6FDq66RuWN6R7",
    position: [-5.3858709, 105.3039476] as [number, number],
  },
  {
    name: "Rumah Sakit Airan Raya",
    url: "https://maps.app.goo.gl/8bYLizYsvQsZoQta7",
    position: [-5.3508725, 105.2979986] as [number, number],
  },
  {
    name: "Klinik Pratama Raffasya Sentra Medika",
    url: "https://maps.app.goo.gl/njPYBg32bMT1i9R88",
    position: [-5.353997, 105.2905124] as [number, number],
  },
  {
    name: "Puskesmas KORPRI",
    url: "https://maps.app.goo.gl/C9FmyPWJZtEvem9z9",
    position: [-5.3713905, 105.3020706] as [number, number],
  },
  {
    name: "Puskesmas Sukarame",
    url: "https://maps.app.goo.gl/ctJuBfyGhtpvkZSo6",
    position: [-5.3866608, 105.2924467] as [number, number],
  },
  {
    name: "Klinik Cendana Rawat Inap",
    url: "https://maps.app.goo.gl/M1uvCKgPHB42VNZWA",
    position: [-5.3419305, 105.2937293] as [number, number],
  },
  {
    name: "Romulya Medical Centre",
    url: "https://maps.app.goo.gl/sjYqfrRr36m49bjd7",
    position: [-5.3479119, 105.2943409] as [number, number],
  },
  {
    name: "Puskesmas Way Kandis",
    url: "https://maps.app.goo.gl/YVG2XjApLvASMvRE8",
    position: [-5.3629828, 105.2894328] as [number, number],
  },
];

const MAP_BOUNDS = L.latLngBounds(LOCATIONS.map(({ position }) => position));

function FitAllFacilities() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(MAP_BOUNDS, {
      padding: [28, 28],
      maxZoom: 14,
    });
  }, [map]);

  return null;
}

function FocusFacility({ index }: { index: number | null }) {
  const map = useMap();
  const position = index === null ? null : LOCATIONS[index]?.position;

  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 0.45 });
  }, [map, position]);

  return null;
}

function facilityIcon(index: number, active: boolean) {
  return L.divIcon({
    className: "dbd-map-marker-shell",
    html: `<span class="dbd-map-marker${active ? " is-active" : ""}">${index + 1}</span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -37],
  });
}

export default function BantuanLokasi() {
  const { content, error, loading } = useContent();
  const faq = content?.faq ?? [];
  const [openFaq, setOpenFaq] = useState<number | string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const bold = (text: string) =>
    text
      .split(/(\*\*[^*]+\*\*)/g)
      .filter(Boolean)
      .map((part, index) =>
        part.startsWith("**") ? (
          <b key={index}>{part.slice(2, -2)}</b>
        ) : (
          part
        ),
      );

  return (
    <section className="dbd-section dbd-help-page">
      <Reveal className="dbd-section-heading">
        <h2>FAQ &amp; Lokasi Layanan</h2>
        <p>
          Temukan jawaban pertanyaan umum dan tautan lokasi fasilitas kesehatan
          di sekitar ITERA.
        </p>
      </Reveal>

      <section className="dbd-help-section" aria-labelledby="locations-title">
        <div className="dbd-help-section-heading">
          <h3 id="locations-title">Lokasi fasilitas kesehatan</h3>
          <p>
            Pilih lokasi untuk melihat posisinya. Peta menampilkan seluruh
            fasilitas.
          </p>
        </div>
        <div className="dbd-location-explorer">
          <div className="dbd-facility-map" aria-label="Peta fasilitas kesehatan">
            <MapContainer
              className="dbd-leaflet-map"
              center={[-5.36, 105.3]}
              zoom={12}
              scrollWheelZoom={false}
              touchZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitAllFacilities />
              <FocusFacility index={selectedLocation} />
              {LOCATIONS.map((location, index) => (
                <Marker
                  key={location.name}
                  position={location.position}
                  icon={facilityIcon(index, selectedLocation === index)}
                  title={location.name}
                  alt={location.name}
                  eventHandlers={{
                    click: () => setSelectedLocation(index),
                  }}
                >
                  <Popup>
                    <div className="dbd-map-popup">
                      <strong>{location.name}</strong>
                      <a
                        href={location.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Buka di Google Maps
                        <ArrowSquareOut size={15} aria-hidden="true" />
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <aside className="dbd-location-panel" aria-label="Daftar fasilitas">
            <h4>Fasilitas kesehatan</h4>
            <ul className="dbd-location-list">
              {LOCATIONS.map((location, index) => (
                <li
                  className={
                    selectedLocation === index ? "is-selected" : undefined
                  }
                  key={location.name}
                >
                  <button
                    className="dbd-location-select"
                    type="button"
                    aria-pressed={selectedLocation === index}
                    onClick={() => setSelectedLocation(index)}
                  >
                    <MapPin size={19} weight="regular" aria-hidden="true" />
                    <span className="dbd-location-index">{index + 1}</span>
                    <span className="dbd-location-name">{location.name}</span>
                  </button>
                  <a
                    className="dbd-location-action"
                    href={location.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Buka ${location.name} di Google Maps`}
                    title="Buka di Google Maps"
                  >
                    <ArrowSquareOut size={17} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="dbd-help-section" aria-labelledby="faq-title">
        <div className="dbd-help-section-heading">
          <h3 id="faq-title">Pertanyaan yang sering ditanyakan</h3>
          <p>Informasi umum seputar DBD dan perawatan mandiri.</p>
        </div>
        {loading ? (
          <p className="dbd-card dbd-help-state" role="status">
            Memuat pertanyaan...
          </p>
        ) : error ? (
          <p className="dbd-card dbd-help-state" role="alert">
            FAQ belum dapat dimuat. Silakan muat ulang halaman.
          </p>
        ) : faq.length === 0 ? (
          <p className="dbd-card dbd-help-state" role="status">
            Belum ada pertanyaan yang tersedia saat ini.
          </p>
        ) : (
          <div className="dbd-faq-list">
            {faq.map((item, index) => {
              const isOpen = openFaq === item.id;
              const answerId = `dbd-help-faq-answer-${index}`;
              return (
                <article
                  className={`dbd-faq-item${isOpen ? " is-open" : ""}`}
                  key={item.id}
                >
                  <h4>
                    <button
                      type="button"
                      className="dbd-faq-question"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() =>
                        setOpenFaq(isOpen ? null : item.id)
                      }
                    >
                      <span>{item.question}</span>
                      <span className="dbd-faq-arrow" aria-hidden="true">
                        ▶
                      </span>
                    </button>
                  </h4>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={
                          reduced
                            ? instantTransition
                            : { duration: 0.28, ease: "easeInOut" }
                        }
                        style={{ overflow: "hidden" }}
                      >
                        <div className="dbd-faq-answer" id={answerId}>
                          {bold(item.answer)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
