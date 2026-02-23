import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Combobox from "./components/Combobox";
import { createMapCanvas, type MapCanvasApi } from "./lib/mapCanvas";
import { MAP_DATA } from "./lib/mapData";
import { findClassPath, getNodeById } from "./lib/pathfinding";

const FLOORS = [
  { id: 1, name: "1", imageSrc: "/floors/1.svg" },
  { id: 2, name: "2", imageSrc: "/floors/2.svg" },
  { id: 3, name: "3", imageSrc: "/floors/3.svg" },
  { id: 4, name: "4", imageSrc: "/floors/4.svg" },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapApiRef = useRef<MapCanvasApi | null>(null);

  const [pathPanelVisible, setPathPanelVisible] = useState(false);
  const [fromRoom, setFromRoom] = useState("");
  const [toRoom, setToRoom] = useState("");
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [floorDropdownOpen, setFloorDropdownOpen] = useState(false);
  const [buildingsPanelOpen, setBuildingsPanelOpen] = useState(false);

  const roomItems = useMemo(
    () => MAP_DATA.ROOMS.filter((room) => room.id !== "stair").map((room) => ({ id: room.id, name: room.name })),
    []
  );
  const selectedFloorName = useMemo(
    () => FLOORS.find((floor) => floor.id === selectedFloor)?.name ?? `Поверх ${selectedFloor}`,
    [selectedFloor]
  );
  const selectedFloorImageSrc = useMemo(
    () => FLOORS.find((floor) => floor.id === selectedFloor)?.imageSrc ?? FLOORS[0].imageSrc,
    [selectedFloor]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    mapApiRef.current = createMapCanvas(canvasRef.current, {
      getNodeById,
      initialFloorImageSrc: FLOORS[0].imageSrc,
    });

    return () => {
      mapApiRef.current?.destroy();
      mapApiRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapApiRef.current?.setFloorImage(selectedFloorImageSrc);
  }, [selectedFloorImageSrc]);

  function doSearchPath() {
    if (!fromRoom || !toRoom || !mapApiRef.current) return;

    const result = findClassPath(fromRoom, toRoom);
    if (!result) return;

    mapApiRef.current.setFromRoom(result.fromClassId);
    mapApiRef.current.setToRoom(result.toClassId);
    mapApiRef.current.setPath(result.path);
  }

  function clearPath() {
    setFromRoom("");
    setToRoom("");

    if (!mapApiRef.current) return;
    mapApiRef.current.setFromRoom(null);
    mapApiRef.current.setToRoom(null);
    mapApiRef.current.setPath([]);
  }

  function openInMaps(query: string, app: "google" | "apple") {
    const encodedQuery = encodeURIComponent(query || "Івано-Франківськ");

    if (app === "google") {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`, "_blank");
      return;
    }

    window.open(`https://maps.apple.com/?q=${encodedQuery}`, "_blank");
  }

  return (
    <div className="app">
      <main className="map-wrapper">
        <canvas id="map-canvas" ref={canvasRef} width={800} height={600} />

        <div
          className={`overlay  ${pathPanelVisible ? "visible" : ""}`}
          style={{
            background: 'none'
          }}
          hidden={!pathPanelVisible}
          onClick={() => setPathPanelVisible(false)}
          aria-hidden="true"
        />
        <div
          className={`path-search-panel stadium-card ${pathPanelVisible ? "visible" : ""}`}
          style={{
            "zIndex": 101
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="path-fields" >
            <div className="path-field">
              <label htmlFor="from-room-input">З</label>
              <Combobox
                items={roomItems}
                placeholder="Оберіть аудиторію"
                value={fromRoom}
                onValueChange={setFromRoom}
                inputId="from-room-input"
              />
            </div>
            <div className="path-field">
              <label htmlFor="to-room-input">До</label>
              <Combobox
                items={roomItems}
                placeholder="Оберіть аудиторію"
                value={toRoom}
                onValueChange={setToRoom}
                inputId="to-room-input"
              />
            </div>
          </div>

          <div className="path-actions">
            <button type="button" className="btn-primary btn-pill" onClick={doSearchPath}>
              Побудувати маршрут
            </button>
            <button type="button" className="btn-ghost btn-pill" onClick={clearPath}>
              Очистити
            </button>
          </div>
        </div>
      </main>

      <nav className="bottom-bar dock-wrap">
        <div className="dock pill-dock">
          <button type="button" className="icon-btn-nav round-sq" aria-label="Маршрут" onClick={() => setPathPanelVisible((prev) => !prev)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 9l7 6 7-6" />
              <path d="M5 15l7-6 7 6" />
            </svg>
          </button>


          <button type="button" className="icon-btn-nav round-sq" aria-label="Меню" onClick={() => setBuildingsPanelOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <button
            type="button"
            className="btn-floor pill"
            onClick={() => setFloorDropdownOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={floorDropdownOpen}
          >
            <span>{selectedFloorName}</span>
          </button>
        </div>
      </nav>

      <div
        className={`overlay ${floorDropdownOpen ? "visible" : ""}`}
        style={{
          background: 'none'
        }}
        hidden={!floorDropdownOpen}
        onClick={() => setFloorDropdownOpen(false)}
      />
      <div className="dropdown-panel rounded-card floor-dropdown-panel" hidden={!floorDropdownOpen}>
        <h3>Поверх</h3>
        <ul className="floor-list floor-pills">
          {FLOORS.map((floor) => (
            <li
              key={floor.id}
              data-floor={floor.id}
              className={floor.id === selectedFloor ? "active" : ""}
              onClick={() => {
                setSelectedFloor(floor.id);
                setFloorDropdownOpen(false);
              }}
            >
              {floor.name}
            </li>
          ))}
        </ul>
      </div>

      <div className={`overlay ${buildingsPanelOpen ? "visible" : ""}`} hidden={!buildingsPanelOpen} onClick={() => setBuildingsPanelOpen(false)} />
      <div className={`side-panel rounded-edge ${buildingsPanelOpen ? "visible" : ""}`} hidden={!buildingsPanelOpen}>
        <div className="side-panel-header">
          <h2>Інші будівлі</h2>
          <button type="button" className="icon-btn close-panel" aria-label="Закрити" onClick={() => setBuildingsPanelOpen(false)}>
            ×
          </button>
        </div>
        <p className="panel-hint">Натисніть Google або Apple, щоб відкрити будівлю в картах.</p>
        <ul className="buildings-list building-cards">
          {MAP_DATA.OTHER_BUILDINGS.map((building) => (
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
                    onClick={() => openInMaps(`${building.address}`, "google")}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    className="btn-map-inline"
                    title="Apple Maps"
                    onClick={() => openInMaps(`${building.address}`, "apple")}
                  >
                    Apple
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
