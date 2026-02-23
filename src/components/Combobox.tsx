import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

export type ComboboxItem = {
  id: string;
  name: string;
};

type Props = {
  items: ComboboxItem[];
  value: string;
  placeholder: string;
  inputId: string;
  onValueChange: (id: string) => void;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function Combobox({ items, value, placeholder, inputId, onValueChange }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const selectedItem = useMemo(() => items.find((item) => item.id === value) ?? null, [items, value]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filtered = useMemo(() => {
    const q = normalize(query).trim();
    if (!q) return items;
    return items.filter((item) => normalize(item.name).includes(q));
  }, [items, query]);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function selectValue(id: string) {
    onValueChange(id);
    const picked = items.find((item) => item.id === id);
    setQuery(picked?.name ?? "");
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setOpen(true);
      setQuery(selectedItem?.name ?? "");
      setHighlightedIndex(filtered.length > 0 ? 0 : -1);
      return;
    }

    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      setHighlightedIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(highlightedIndex + 1, filtered.length - 1);
      setHighlightedIndex(next);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.max(highlightedIndex - 1, 0);
      setHighlightedIndex(next);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const picked = filtered[highlightedIndex];
      if (picked) selectValue(picked.id);
    }
  }

  useEffect(() => {
    if (!open || highlightedIndex < 0 || !listRef.current) return;
    const element = listRef.current.querySelector<HTMLLIElement>(`[data-index="${highlightedIndex}"]`);
    element?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  return (
    <div className="combobox" ref={rootRef}>
      <div className="combobox-trigger">
        <input
          id={inputId}
          type="text"
          className="combobox-input pill-input"
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          value={open ? query : (selectedItem?.name ?? "")}
          onFocus={() => {
            setOpen(true);
            setQuery(selectedItem?.name ?? "");
            setHighlightedIndex(filtered.length > 0 ? 0 : -1);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={onKeyDown}
        />
        <svg className="combobox-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <div className="combobox-content" role="listbox" hidden={!open}>
        <ul className="combobox-list" ref={listRef}>
          {filtered.map((item, index) => (
            <li
              key={item.id}
              role="option"
              data-index={index}
              data-value={item.id}
              aria-selected={item.id === value}
              className={`combobox-item ${highlightedIndex === index ? "highlighted" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectValue(item.id)}
            >
              {item.name}
            </li>
          ))}
        </ul>
        <p className="combobox-empty" hidden={filtered.length > 0}>
          Нічого не знайдено
        </p>
      </div>
    </div>
  );
}
