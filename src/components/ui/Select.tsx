export type SelectItem = {
  id: string;
  name: string;
};

type Props = {
  items: SelectItem[];
  value: string;
  placeholder: string;
  inputId: string;
  onValueChange: (id: string) => void;
};

export default function Select({ items, value, placeholder, inputId, onValueChange }: Props) {
  return (
    <select
      id={inputId}
      className="room-select pill-input"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}
