import { useEffect, useRef, useState } from "react";
import "./App.css";
import BottomNav from "./components/BottomNav";
import BuildingsPanel from "./components/BuildingsPanel";
import FindRoomPanel from "./components/FindRoomPanel";
import FloorDropdown from "./components/FloorDropdown";
import PathSearchPanel from "./components/PathSearchPanel";
import TopBar from "./components/TopBar";
import { useSelectableItems } from "./hooks/useSelectableItems";
import { Canvas } from "./lib/canvas";
import { DATA } from "./lib/data";
import { getNodeById } from "./lib/pathfinding";

const DEFAULT_FLOOR = DATA.FLOORS[0];
const FLOOR_BY_ID = new Map(DATA.FLOORS.map((floor) => [floor.id, floor]));
const ROOM_POINTS = DATA.POINTS;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapApiRef = useRef<Canvas | null>(null);

  const [pathPanelVisible, setPathPanelVisible] = useState(false);
  const [findPanelVisible, setFindPanelVisible] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [floorDropdownOpen, setFloorDropdownOpen] = useState(false);
  const [buildingsPanelOpen, setBuildingsPanelOpen] = useState(false);

  const selectableItems = useSelectableItems();

  const selectedFloorMeta = FLOOR_BY_ID.get(selectedFloor) ?? DEFAULT_FLOOR;
  const selectedFloorName = selectedFloorMeta.name || `Поверх ${selectedFloor}`;
  const selectedFloorImageSrc = selectedFloorMeta.imageSrc;

  function applyFloorView(floor: number) {
    setSelectedFloor(floor);

    if (!mapApiRef.current) return;

    const nextFloor = FLOOR_BY_ID.get(floor);
    if (nextFloor) {
      mapApiRef.current.setFloorImage(nextFloor.imageSrc);
    }
    mapApiRef.current.setActiveFloor(floor);
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    mapApiRef.current = new Canvas(canvasRef.current, {
      getNodeById,
      roomPoints: ROOM_POINTS,
      initialFloorImageSrc: DEFAULT_FLOOR.imageSrc,
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

  function openFindPanel() {
    setPathPanelVisible(false);
    setFindPanelVisible((prev) => !prev);
  }

  return (
    <div className="app">
      <main className="map-wrapper">
        <TopBar buildingName="Центральний корпус" />
        <canvas id="map-canvas" ref={canvasRef} width={800} height={600} />

        <div
          className={`overlay ${pathPanelVisible || findPanelVisible ? "visible" : ""}`}
          style={{ background: "none" }}
          hidden={!pathPanelVisible && !findPanelVisible}
          onClick={() => {
            setPathPanelVisible(false);
            setFindPanelVisible(false);
          }}
          aria-hidden="true"
        />
        <PathSearchPanel
          visible={pathPanelVisible}
          items={selectableItems}
          selectedFloor={selectedFloor}
          mapApiRef={mapApiRef}
          onApplyFloorView={applyFloorView}
          onClose={() => setPathPanelVisible(false)}
        />
        <FindRoomPanel
          visible={findPanelVisible}
          items={selectableItems}
          selectedFloor={selectedFloor}
          mapApiRef={mapApiRef}
          onApplyFloorView={applyFloorView}
          onClose={() => {
            setPathPanelVisible(false);
            setFindPanelVisible(false);
          }}
        />
      </main>

      <BottomNav
        pathPanelVisible={pathPanelVisible}
        findPanelVisible={findPanelVisible}
        selectedFloorName={selectedFloorName}
        floorDropdownOpen={floorDropdownOpen}
        onTogglePathPanel={() => {
          setFindPanelVisible(false);
          setPathPanelVisible((prev) => !prev);
        }}
        onToggleFindPanel={openFindPanel}
        onOpenBuildingsPanel={() => setBuildingsPanelOpen(true)}
        onToggleFloorDropdown={() => setFloorDropdownOpen((open) => !open)}
      />
      <FloorDropdown
        open={floorDropdownOpen}
        floors={DATA.FLOORS}
        selectedFloor={selectedFloor}
        onSelectFloor={(floor) => {
          applyFloorView(floor);
          setFloorDropdownOpen(false);
        }}
        onClose={() => setFloorDropdownOpen(false)}
      />
      <BuildingsPanel
        open={buildingsPanelOpen}
        buildings={DATA.OTHER_BUILDINGS}
        onClose={() => setBuildingsPanelOpen(false)}
      />
    </div>
  );
}
