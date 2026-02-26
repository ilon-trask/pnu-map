import type { Building } from "../lib/types";

type Props = {
  open: boolean;
  buildings: Building[];
  onClose: () => void;
};

function openInMaps(query: string, app: "google" | "apple") {
  const encodedQuery = encodeURIComponent(query || "Івано-Франківськ");

  if (app === "google") {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`, "_blank");
    return;
  }

  window.open(`https://maps.apple.com/?q=${encodedQuery}`, "_blank");
}

export default function BuildingsPanel({ open, buildings, onClose }: Props) {
  return (
    <>
      <div className={`overlay ${open ? "visible" : ""}`} hidden={!open} onClick={onClose} />
      <div className={`side-panel rounded-edge ${open ? "visible" : ""}`} hidden={!open}>
        <div className="side-panel-header">
          <h2>Інші будівлі</h2>
          <button type="button" className="icon-btn close-panel" aria-label="Закрити" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="panel-hint">Натисніть Google або Apple, щоб відкрити будівлю в картах.</p>
        <ul className="buildings-list building-cards">
          {buildings.map((building) => (
            <li key={building.id}>
              <div className="building-item">
                <div className="building-info">
                  <span className="name">{building.name}</span>
                  <div className="address">{building.address}</div>
                </div>
                <div className="building-actions">
                  <button
                    type="button"
                    className="btn-map-inline"
                    title="Google Maps"
                    onClick={() => openInMaps(building.address, "google")}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    className="btn-map-inline"
                    title="Apple Maps"
                    onClick={() => openInMaps(building.address, "apple")}
                  >
                    Apple
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
