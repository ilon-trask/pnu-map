import { useState, type MutableRefObject } from "react";
import type { Canvas } from "../lib/canvas";
import { findClassPath } from "../lib/pathfinding";
import Select, { type SelectItem } from "./ui/Select";

type Props = {
  visible: boolean;
  items: SelectItem[];
  selectedFloor: number;
  mapApiRef: MutableRefObject<Canvas | null>;
  onApplyFloorView: (floor: number) => void;
  onClose: () => void;
};

export default function PathSearchPanel({
  visible,
  items,
  selectedFloor,
  mapApiRef,
  onApplyFloorView,
  onClose,
}: Props) {
  const [fromRoom, setFromRoom] = useState("");
  const [toRoom, setToRoom] = useState("");

  function doSearchPath() {
    if (!fromRoom || !toRoom || !mapApiRef.current) return;

    const result = findClassPath(fromRoom, toRoom);
    if (!result) return;

    setFromRoom(result.fromClassId);
    setToRoom(result.toClassId);

    const startFloor = result.path[0]?.floor;
    if (startFloor !== undefined && startFloor !== selectedFloor) {
      onApplyFloorView(startFloor);
    }

    mapApiRef.current.setFromRoom(result.fromClassId);
    mapApiRef.current.setToRoom(result.toClassId);
    mapApiRef.current.setPath(result.path);
    mapApiRef.current.resetViewportToDefault();
    onClose();
  }

  function clearPath() {
    setFromRoom("");
    setToRoom("");

    if (!mapApiRef.current) return;
    mapApiRef.current.setFromRoom(null);
    mapApiRef.current.setToRoom(null);
    mapApiRef.current.setPath([]);
  }

  return (
    <div
      className={`path-search-panel stadium-card ${visible ? "visible" : ""}`}
      style={{ zIndex: 101 }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="path-fields">
        <div className="path-field">
          <label htmlFor="from-room-input">З</label>
          <Select
            items={items}
            placeholder="Оберіть локацію"
            value={fromRoom}
            onValueChange={setFromRoom}
            inputId="from-room-input"
          />
        </div>
        <div className="path-field">
          <label htmlFor="to-room-input">До</label>
          <Select
            items={items}
            placeholder="Оберіть локацію"
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
  );
}
