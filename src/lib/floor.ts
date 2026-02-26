const ROOM_CODE_PATTERN = /(\d{3,4})/;

export function getRoomCode(id: string): number | null {
  const numericPart = id.match(ROOM_CODE_PATTERN)?.[0];
  if (!numericPart) return null;

  const numericValue = Number(numericPart);
  if (!Number.isFinite(numericValue) || numericValue < 100) return null;

  return numericValue;
}
