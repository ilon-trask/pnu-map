import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Select from "./components/Select";
import { createMapCanvas, type MapCanvasApi } from "./lib/mapCanvas";
import { MAP_DATA } from "./lib/mapData";
import { findClassPath, getNodeById } from "./lib/pathfinding";

const FLOORS = [
  { id: 1, name: "1", imageSrc: "/floors/1.svg" },
  { id: 2, name: "2", imageSrc: "/floors/2.svg" },
  { id: 3, name: "3", imageSrc: "/floors/3.svg" },
  { id: 4, name: "4", imageSrc: "/floors/4.svg" },
];
const HIDE_MAP_DATA_POINTS = true;

function getFloorFromRoomId(roomId: string): number | null {
  const numericPart = roomId.match(/(\d{3,4})/)?.[0];
  if (!numericPart) return null;

  const numericValue = Number(numericPart);
  if (!Number.isFinite(numericValue) || numericValue < 100) return null;

  const floor = Math.floor(numericValue / 100);
  return floor > 0 ? floor : null;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapApiRef = useRef<MapCanvasApi | null>(null);

  const [pathPanelVisible, setPathPanelVisible] = useState(false);
  const [findPanelVisible, setFindPanelVisible] = useState(false);
  const [fromRoom, setFromRoom] = useState("");
  const [toRoom, setToRoom] = useState("");
  const [findRoom, setFindRoom] = useState("");
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [floorDropdownOpen, setFloorDropdownOpen] = useState(false);
  const [buildingsPanelOpen, setBuildingsPanelOpen] = useState(false);

  const structureData = useMemo(
    () =>
      HIDE_MAP_DATA_POINTS
        ? { walls: [], corridors: [], junctions: [] }
        : MAP_DATA.getStructureDataByFloor(selectedFloor),
    [selectedFloor]
  );

  const roomItems = useMemo(
    () => {
      const items = new Map<string, string>();

      MAP_DATA.ROOMS.filter((room) => room.show !== false).forEach((room) => {
        items.set(room.id, room.name);
      });

      MAP_DATA.EDITABLE_POINTS.forEach((point) => {
        const existingName = items.get(point.id);
        if (!existingName) {
          items.set(point.id, point.title);
          return;
        }

        if (!existingName.toLowerCase().includes(point.title.toLowerCase())) {
          items.set(point.id, `${point.title} (${existingName})`);
        }
      });

      return Array.from(items.entries()).map(([id, name]) => ({ id, name }));
    },
    []
  );

  const roomPoints = useMemo(
    () => MAP_DATA.POINTS,
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

  function applyFloorView(floor: number) {
    if (!mapApiRef.current) return;

    const imageSrc = FLOORS.find((item) => item.id === floor)?.imageSrc;
    if (imageSrc) {
      mapApiRef.current.setFloorImage(imageSrc);
    }
    mapApiRef.current.setActiveFloor(floor);
    setSelectedFloor(floor);
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    mapApiRef.current = createMapCanvas(canvasRef.current, {
      getNodeById,
      roomPoints,
      structureData,
      initialFloorImageSrc: FLOORS[0].imageSrc,
      onFloorHintClick: (floor) => applyFloorView(floor),
    });

    return () => {
      mapApiRef.current?.destroy();
      mapApiRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapApiRef.current?.setFloorImage(selectedFloorImageSrc);
    mapApiRef.current?.setActiveFloor(selectedFloor);
  }, [selectedFloor, selectedFloorImageSrc]);

  useEffect(() => {
    const api = mapApiRef.current as
      | (MapCanvasApi & {
          setRoomPoints?: (points: typeof roomPoints) => void;
          setStructureData?: (data: typeof structureData) => void;
        })
      | null;
    if (!api || !canvasRef.current) return;

    if (typeof api.setRoomPoints === "function" && typeof api.setStructureData === "function") {
      api.setRoomPoints(roomPoints);
      api.setStructureData(structureData);
      return;
    }

    // HMR-safe fallback for stale instances created before data-setters existed.
    api.destroy();
    mapApiRef.current = createMapCanvas(canvasRef.current, {
      getNodeById,
      roomPoints,
      structureData,
      initialFloorImageSrc: FLOORS[0].imageSrc,
      onFloorHintClick: (floor) => applyFloorView(floor),
    });
  }, [roomPoints, structureData]);

  function doSearchPath() {
    if (!fromRoom || !toRoom || !mapApiRef.current) return;

    const result = findClassPath(fromRoom, toRoom);
    if (!result) return;

    setFromRoom(result.fromClassId);
    setToRoom(result.toClassId);

    const startFloor = getFloorFromRoomId(result.fromClassId);
    if (startFloor !== null && startFloor !== selectedFloor) {
      applyFloorView(startFloor);
    }

    mapApiRef.current.setFromRoom(result.fromClassId);
    mapApiRef.current.setToRoom(result.toClassId);
    mapApiRef.current.setPath(result.path);
    mapApiRef.current.resetView();
    setPathPanelVisible(false);
  }

  function doFindAuditory(targetRoomIdFromUi?: string) {
    const targetRoomId = targetRoomIdFromUi || findRoom;
    if (!targetRoomId || !mapApiRef.current) return;

    const targetNode = getNodeById(targetRoomId);
    if (!targetNode) return;

    const targetFloor =
      getFloorFromRoomId(targetRoomId) ?? (typeof targetNode.floor === "number" ? targetNode.floor : null);
    if (targetFloor !== null && targetFloor !== selectedFloor) {
      applyFloorView(targetFloor);
    }

    mapApiRef.current.setFromRoom(null);
    mapApiRef.current.setToRoom(targetRoomId);
    mapApiRef.current.setPath([]);
    mapApiRef.current.focusOnNode(targetRoomId, 1.35);
    setPathPanelVisible(false);
    setFindPanelVisible(false);
  }

  function openFindPanel() {
    setPathPanelVisible(false);
    setFindPanelVisible((prev) => !prev);
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
        <div className="top-bar pill-bar">
          <span className="building-name" style={{ margin: "0 auto", textAlign: "center" }}>Центральний корпус</span>
        </div>
        <canvas id="map-canvas" ref={canvasRef} width={800} height={600} />

        <div
          className={`overlay  ${pathPanelVisible || findPanelVisible ? "visible" : ""}`}
          style={{
            background: 'none'
          }}
          hidden={!pathPanelVisible && !findPanelVisible}
          onClick={() => {
            setPathPanelVisible(false);
            setFindPanelVisible(false);
          }}
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
              <Select
                items={roomItems}
                placeholder="Оберіть аудиторію"
                value={fromRoom}
                onValueChange={setFromRoom}
                inputId="from-room-input"
              />
            </div>
            <div className="path-field">
              <label htmlFor="to-room-input">До</label>
              <Select
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

        <div
          className={`path-search-panel find-room-panel stadium-card ${findPanelVisible ? "visible" : ""}`}
          style={{
            "zIndex": 101
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="path-fields">
            <div className="path-field">
              <label htmlFor="find-room-input">Аудиторія</label>
              <Select
                items={roomItems}
                placeholder="Оберіть аудиторію"
                value={findRoom}
                onValueChange={setFindRoom}
                inputId="find-room-input"
              />
            </div>
          </div>
          <div className="path-actions">
            <button type="button" className="btn-primary btn-pill" onClick={() => doFindAuditory(findRoom)} disabled={!findRoom}>
              Знайти
            </button>
          </div>
        </div>
      </main>

      <nav className="bottom-bar dock-wrap">
        <div className="dock pill-dock main-dock">
          <button
            type="button"
            className={`icon-btn-nav round-sq ${pathPanelVisible ? "active" : ""}`}
            aria-label="Маршрут"
            onClick={() => {
              setFindPanelVisible(false);
              setPathPanelVisible((prev) => !prev);
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 9l7 6 7-6" />
              <path d="M5 15l7-6 7 6" />
            </svg>
          </button>

          <button
            type="button"
            className={`icon-btn-nav round-sq ${findPanelVisible ? "active" : ""}`}
            aria-label="Знайти аудиторію"
            title="Знайти аудиторію"
            onClick={openFindPanel}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
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
