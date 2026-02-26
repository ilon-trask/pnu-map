type Props = {
  pathPanelVisible: boolean;
  findPanelVisible: boolean;
  selectedFloorName: string;
  floorDropdownOpen: boolean;
  onTogglePathPanel: () => void;
  onToggleFindPanel: () => void;
  onOpenBuildingsPanel: () => void;
  onToggleFloorDropdown: () => void;
};

export default function BottomNav({
  pathPanelVisible,
  findPanelVisible,
  selectedFloorName,
  floorDropdownOpen,
  onTogglePathPanel,
  onToggleFindPanel,
  onOpenBuildingsPanel,
  onToggleFloorDropdown,
}: Props) {
  return (
    <nav className="bottom-bar dock-wrap">
      <div className="dock pill-dock main-dock">
        <button
          type="button"
          className={`icon-btn-nav round-sq ${pathPanelVisible ? "active" : ""}`}
          aria-label="Маршрут"
          onClick={onTogglePathPanel}
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
          onClick={onToggleFindPanel}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>

        <button type="button" className="icon-btn-nav round-sq" aria-label="Меню" onClick={onOpenBuildingsPanel}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <button
          type="button"
          className="btn-floor pill"
          onClick={onToggleFloorDropdown}
          aria-haspopup="true"
          aria-expanded={floorDropdownOpen}
        >
          <span>{selectedFloorName}</span>
        </button>
      </div>
    </nav>
  );
}
