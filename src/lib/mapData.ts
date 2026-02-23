export type Room = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PointNode = {
  id: string;
  x: number;
  y: number;
  name?: string;
};

export type Edge = {
  from: string;
  to: string;
};

export type OtherBuilding = {
  id: string;
  name: string;
  address: string;
};

const FLOOR_WIDTH = 800;
const FLOOR_HEIGHT = 600;

const ROOMS: Room[] = [
  { id: "101", name: "Аудиторія 101", x: 120, y: 80, w: 70, h: 50 },
  { id: "102", name: "Аудиторія 102", x: 200, y: 80, w: 70, h: 50 },
  { id: "103", name: "Аудиторія 103", x: 280, y: 80, w: 70, h: 50 },
  { id: "104", name: "Аудиторія 104", x: 360, y: 80, w: 70, h: 50 },
  { id: "105", name: "Аудиторія 105", x: 440, y: 80, w: 70, h: 50 },
  { id: "106", name: "Аудиторія 106", x: 520, y: 80, w: 70, h: 50 },
  { id: "107", name: "Аудиторія 107", x: 600, y: 80, w: 70, h: 50 },
  { id: "108", name: "Аудиторія 108", x: 680, y: 80, w: 70, h: 50 },
  { id: "201", name: "Аудиторія 201", x: 80, y: 200, w: 55, h: 45 },
  { id: "202", name: "Аудиторія 202", x: 80, y: 255, w: 55, h: 45 },
  { id: "203", name: "Аудиторія 203", x: 80, y: 310, w: 55, h: 45 },
  { id: "204", name: "Аудиторія 204", x: 80, y: 365, w: 55, h: 45 },
  { id: "301", name: "Аудиторія 301", x: 665, y: 200, w: 55, h: 45 },
  { id: "302", name: "Аудиторія 302", x: 665, y: 255, w: 55, h: 45 },
  { id: "303", name: "Аудиторія 303", x: 665, y: 310, w: 55, h: 45 },
  { id: "304", name: "Аудиторія 304", x: 665, y: 365, w: 55, h: 45 },
  { id: "401", name: "Аудиторія 401", x: 200, y: 480, w: 80, h: 55 },
  { id: "402", name: "Аудиторія 402", x: 290, y: 480, w: 80, h: 55 },
  { id: "403", name: "Аудиторія 403", x: 380, y: 480, w: 80, h: 55 },
  { id: "404", name: "Аудиторія 404", x: 470, y: 480, w: 80, h: 55 },
  { id: "405", name: "Аудиторія 405", x: 560, y: 480, w: 80, h: 55 },
  { id: "stair", name: "Сходи (центр)", x: 360, y: 280, w: 80, h: 80 },
];

function getRoomCenter(room: Room): PointNode {
  return {
    id: room.id,
    name: room.name,
    x: room.x + room.w / 2,
    y: room.y + room.h / 2,
  };
}

const NODES: PointNode[] = ROOMS.map(getRoomCenter);

const JUNCTIONS: PointNode[] = [
  { id: "j1", x: 155, y: 130 },
  { id: "j2", x: 400, y: 130 },
  { id: "j3", x: 645, y: 130 },
  { id: "j4", x: 107, y: 332 },
  { id: "j5", x: 400, y: 332 },
  { id: "j6", x: 693, y: 332 },
  { id: "j7", x: 400, y: 452 },
  { id: "j8", x: 320, y: 507 },
  { id: "j9", x: 400, y: 507 },
  { id: "j10", x: 480, y: 507 },
];

const ALL_NODES: PointNode[] = [...NODES, ...JUNCTIONS];

function findNode(id: string): PointNode | undefined {
  const room = ROOMS.find((item) => item.id === id);
  if (room) return getRoomCenter(room);
  return JUNCTIONS.find((item) => item.id === id);
}

const EDGES: Edge[] = [];

function addBidi(a: string, b: string): void {
  EDGES.push({ from: a, to: b });
  EDGES.push({ from: b, to: a });
}

["101", "102"].forEach((id) => addBidi(id, "j1"));
["103", "104"].forEach((id) => addBidi(id, "j2"));
["105", "106", "107", "108"].forEach((id) => addBidi(id, "j3"));
["201", "202", "203", "204"].forEach((id) => addBidi(id, "j4"));
["301", "302", "303", "304"].forEach((id) => addBidi(id, "j6"));
["401", "402"].forEach((id) => addBidi(id, "j8"));
addBidi("403", "j9");
["404", "405"].forEach((id) => addBidi(id, "j10"));
addBidi("stair", "j5");
[
  ["j1", "j2"],
  ["j2", "j3"],
  ["j1", "j4"],
  ["j4", "j5"],
  ["j5", "j6"],
  ["j5", "j7"],
  ["j7", "j8"],
  ["j7", "j9"],
  ["j7", "j10"],
].forEach(([a, b]) => addBidi(a, b));

const WALLS: [number, number, number, number][] = [
  [100, 60, 700, 90],
  [60, 60, 50, 360],
  [690, 60, 50, 360],
  [180, 440, 480, 110],
  [340, 260, 120, 120],
];

const CORRIDORS: [number, number, number, number][] = [
  [150, 150, 500, 30],
  [110, 180, 30, 200],
  [660, 180, 30, 200],
  [180, 380, 440, 60],
  [380, 260, 40, 120],
  [340, 380, 120, 40],
];

const OTHER_BUILDINGS: OtherBuilding[] = [
  { id: "b1", name: "Корпус № 1 (Адміністративний)", address: "вул. Шевченка, 57 (технічний), Івано-Франківськ" },
  { id: "b2", name: "Корпус № 2 (Аудиторний)", address: "вул. Шевченка, 57 (гуманітарний), Івано-Франківськ" },
  { id: "b3", name: "Корпус № 4 (Бібліотека/Актова зала)", address: "вул. Шевченка, 57, Івано-Франківськ" },
  { id: "b4", name: "Юридичний інститут", address: "вул. Шевченка, 44а, Івано-Франківськ" },
  { id: "b5", name: "Педагогічний факультет", address: "вул. С. Бандери, 1, Івано-Франківськ" },
  { id: "b6", name: "Факультет туризму", address: "вул. Галицька, 201д, Івано-Франківськ" },
  {
    id: "b7a",
    name: "Гуртожиток 1",
    address: "вул. Дорошенка, 22а, Івано-Франківськ",
  },
  {
    id: "b7b",
    name: "Гуртожиток 2",
    address: "вул. Коновальця, 141, Івано-Франківськ",
  },
  {
    id: "b7c",
    name: "Гуртожиток 4",
    address: "вул. Шевченка, 49а, Івано-Франківськ",
  },
  {
    id: "b7d",
    name: "Гуртожиток 5",
    address: "вул. Сухомлинського, 2, Івано-Франківськ",
  },
];

export const MAP_DATA = {
  FLOOR_WIDTH,
  FLOOR_HEIGHT,
  ROOMS,
  NODES,
  JUNCTIONS,
  ALL_NODES,
  EDGES,
  findNode,
  WALLS,
  CORRIDORS,
  OTHER_BUILDINGS,
};
