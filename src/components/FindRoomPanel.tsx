import { useState, type MutableRefObject } from "react";
import type { Canvas } from "../lib/canvas";
import { getNodeById } from "../lib/pathfinding";
import Select, { type SelectItem } from "./ui/Select";

type Props = {
  visible: boolean;
  items: SelectItem[];
  selectedFloor: number;
  mapApiRef: MutableRefObject<Canvas | null>;
  onApplyFloorView: (floor: number) => void;
  onClose: () => void;
};

export default function FindRoomPanel({
  visible,
  items,
  selectedFloor,
  mapApiRef,
  onApplyFloorView,
  onClose,
}: Props) {
  const [findRoom, setFindRoom] = useState("");

  function doFindAuditory() {
    if (!findRoom || !mapApiRef.current) return;

    const targetNode = getNodeById(findRoom);
    if (!targetNode) return;

    const targetFloor = targetNode.floor;
    if (targetFloor !== selectedFloor) {
      onApplyFloorView(targetFloor);
    }

    mapApiRef.current.setFromRoom(null);
    mapApiRef.current.setToRoom(findRoom);
    mapApiRef.current.setPath([]);
    mapApiRef.current.focusOnNode(findRoom, 1.35);
    onClose();
  }

  return (
    <div
      className={`path-search-panel find-room-panel stadium-card ${visible ? "visible" : ""}`}
      style={{ zIndex: 101 }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="path-fields">
        <div className="path-field">
          <label htmlFor="find-room-input">Локація</label>
          <Select
            items={items}
            placeholder="Оберіть локацію"
            value={findRoom}
            onValueChange={setFindRoom}
            inputId="find-room-input"
          />
        </div>
      </div>
      <div className="path-actions">
        <button type="button" className="btn-primary btn-pill" onClick={doFindAuditory} disabled={!findRoom}>
          Знайти
        </button>
      </div>
    </div>
  );
}
