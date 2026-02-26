type Props = {
  buildingName: string;
};

export default function TopBar({ buildingName }: Props) {
  return (
    <div className="top-bar pill-bar">
      <span className="building-name" style={{ margin: "0 auto", textAlign: "center" }}>
        {buildingName}
      </span>
    </div>
  );
}
