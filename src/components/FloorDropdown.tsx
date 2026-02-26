type FloorItem = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  floors: FloorItem[];
  selectedFloor: number;
  onSelectFloor: (floor: number) => void;
  onClose: () => void;
};

export default function FloorDropdown({ open, floors, selectedFloor, onSelectFloor, onClose }: Props) {
  return (
    <>
      <div className={`overlay ${open ? "visible" : ""}`} style={{ background: "none" }} hidden={!open} onClick={onClose} />
      <div className="dropdown-panel rounded-card floor-dropdown-panel" hidden={!open}>
        <h3>Поверх</h3>
        <ul className="floor-list floor-pills">
          {floors.map((floor) => (
            <li
              key={floor.id}
              data-floor={floor.id}
              className={floor.id === selectedFloor ? "active" : ""}
              onClick={() => onSelectFloor(floor.id)}
            >
              {floor.name}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
