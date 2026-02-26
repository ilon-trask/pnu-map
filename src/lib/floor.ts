const ROOM_CODE_PATTERN = /(\d{3,4})/;

export type FloorScopedEntity = {
  id: string;
  floor?: number | null;
};

export function getRoomCode(id: string): number | null {
  const numericPart = id.match(ROOM_CODE_PATTERN)?.[0];
  if (!numericPart) return null;

  const numericValue = Number(numericPart);
  if (!Number.isFinite(numericValue) || numericValue < 100) return null;

  return numericValue;
}

export function getFloorFromIdentifier(id: string): number | null {
  const roomCode = getRoomCode(id);
  if (roomCode === null) return null;

  const floor = Math.floor(roomCode / 100);
  return floor > 0 ? floor : null;
}

export function getFloorFromEntity(entity: FloorScopedEntity): number | null {
  if (typeof entity.floor === "number") return entity.floor;
  return getFloorFromIdentifier(entity.id);
}
