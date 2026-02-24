export type Room = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  show: boolean
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
  { id: "101", name: "Аудиторія 1.01", x: 120, y: 80, w: 70, h: 50, show: true },
  { id: "102", name: "Аудиторія 1.02", x: 200, y: 80, w: 70, h: 50, show: true },
  { id: "103", name: "Аудиторія 1.03", x: 280, y: 80, w: 70, h: 50, show: true },
  { id: "104", name: "Аудиторія 1.04", x: 360, y: 80, w: 70, h: 50, show: true },
  { id: "105", name: "Аудиторія 1.05", x: 440, y: 80, w: 70, h: 50, show: true },
  { id: "106", name: "Аудиторія 1.06", x: 520, y: 80, w: 70, h: 50, show: true },
  { id: "107", name: "Аудиторія 1.07", x: 600, y: 80, w: 70, h: 50, show: true },
  { id: "108", name: "Аудиторія 1.08 (деканат)", x: 680, y: 80, w: 70, h: 50, show: true },
  { id: "109", name: "Аудиторія 1.09", x: 120, y: 140, w: 70, h: 50, show: true },
  { id: "110", name: "Аудиторія 1.10", x: 200, y: 140, w: 70, h: 50, show: true },
  { id: "111", name: "Аудиторія 1.11", x: 280, y: 140, w: 70, h: 50, show: true },
  { id: "112", name: "Аудиторія 1.12", x: 360, y: 140, w: 70, h: 50, show: true },
  { id: "113", name: "Аудиторія 1.13", x: 440, y: 140, w: 70, h: 50, show: true },
  { id: "114", name: "Аудиторія 1.14", x: 520, y: 140, w: 70, h: 50, show: true },
  { id: "115", name: "Аудиторія 1.15", x: 600, y: 140, w: 70, h: 50, show: true },
  { id: "116", name: "Аудиторія 1.16", x: 680, y: 140, w: 70, h: 50, show: true },
  { id: "117", name: "Аудиторія 1.17", x: 120, y: 200, w: 70, h: 50, show: true },
  { id: "118", name: "Аудиторія 1.18", x: 200, y: 200, w: 70, h: 50, show: true },
  { id: "119", name: "Аудиторія 1.19", x: 280, y: 200, w: 70, h: 50, show: true },
  { id: "120", name: "Аудиторія 1.20", x: 360, y: 200, w: 70, h: 50, show: true },
  { id: "121", name: "Аудиторія 1.21", x: 440, y: 200, w: 70, h: 50, show: true },
  { id: "122", name: "Аудиторія 1.22", x: 520, y: 200, w: 70, h: 50, show: true },
  { id: "123", name: "Аудиторія 1.23", x: 600, y: 200, w: 70, h: 50, show: true },
  { id: "124", name: "Аудиторія 1.24", x: 680, y: 200, w: 70, h: 50, show: true },
  { id: "125", name: "Аудиторія 1.25", x: 120, y: 260, w: 70, h: 50, show: true },

  { id: "201", name: "Аудиторія 2.01", x: 80, y: 200, w: 55, h: 45, show: true },
  { id: "202", name: "Аудиторія 2.02", x: 80, y: 255, w: 55, h: 45, show: true },
  { id: "203", name: "Аудиторія 2.03", x: 80, y: 310, w: 55, h: 45, show: true },
  { id: "204", name: "Аудиторія 2.04", x: 80, y: 365, w: 55, h: 45, show: true },
  { id: "205", name: "Аудиторія 2.05", x: 150, y: 200, w: 55, h: 45, show: true },
  { id: "206", name: "Аудиторія 2.06", x: 150, y: 255, w: 55, h: 45, show: true },
  { id: "207", name: "Аудиторія 2.07", x: 150, y: 310, w: 55, h: 45, show: true },
  { id: "208", name: "Аудиторія 2.08", x: 150, y: 365, w: 55, h: 45, show: true },
  { id: "209", name: "Аудиторія 2.09", x: 220, y: 200, w: 55, h: 45, show: true },
  { id: "210", name: "Аудиторія 2.10", x: 220, y: 255, w: 55, h: 45, show: true },
  { id: "211", name: "Аудиторія 2.11", x: 220, y: 310, w: 55, h: 45, show: true },
  { id: "212", name: "Аудиторія 2.12", x: 220, y: 365, w: 55, h: 45, show: true },
  { id: "213", name: "Аудиторія 2.13", x: 290, y: 200, w: 55, h: 45, show: true },
  { id: "214", name: "Аудиторія 2.14", x: 290, y: 255, w: 55, h: 45, show: true },
  { id: "215", name: "Аудиторія 2.15", x: 290, y: 310, w: 55, h: 45, show: true },
  { id: "216", name: "Аудиторія 2.16", x: 290, y: 365, w: 55, h: 45, show: true },
  { id: "217", name: "Аудиторія 2.17", x: 360, y: 200, w: 55, h: 45, show: true },
  { id: "218", name: "Аудиторія 2.18", x: 360, y: 255, w: 55, h: 45, show: true },
  { id: "219", name: "Аудиторія 2.19", x: 360, y: 310, w: 55, h: 45, show: true },
  { id: "220", name: "Аудиторія 2.20", x: 360, y: 365, w: 55, h: 45, show: true },
  { id: "221", name: "Аудиторія 2.21", x: 430, y: 200, w: 55, h: 45, show: true },
  { id: "222", name: "Аудиторія 2.22", x: 430, y: 255, w: 55, h: 45, show: true },
  { id: "223", name: "Аудиторія 2.23", x: 430, y: 310, w: 55, h: 45, show: true },
  { id: "224", name: "Аудиторія 2.24", x: 430, y: 365, w: 55, h: 45, show: true },
  { id: "225", name: "Аудиторія 2.25", x: 500, y: 200, w: 55, h: 45, show: true },
  { id: "226", name: "Аудиторія 2.26", x: 500, y: 255, w: 55, h: 45, show: true },
  { id: "227", name: "Аудиторія 2.27", x: 500, y: 310, w: 55, h: 45, show: true },
  { id: "228", name: "Аудиторія 2.28", x: 500, y: 365, w: 55, h: 45, show: true },
  { id: "229", name: "Аудиторія 2.29", x: 570, y: 200, w: 55, h: 45, show: true },

  { id: "301", name: "Аудиторія 3.01", x: 665, y: 200, w: 55, h: 45, show: true },
  { id: "302", name: "Аудиторія 3.02", x: 665, y: 255, w: 55, h: 45, show: true },
  { id: "303", name: "Аудиторія 3.03", x: 665, y: 310, w: 55, h: 45, show: true },
  { id: "304", name: "Аудиторія 3.04", x: 665, y: 365, w: 55, h: 45, show: true },
  { id: "305", name: "Аудиторія 3.05", x: 735, y: 200, w: 55, h: 45, show: true },
  { id: "306", name: "Аудиторія 3.06", x: 735, y: 255, w: 55, h: 45, show: true },
  { id: "307", name: "Аудиторія 3.07", x: 735, y: 310, w: 55, h: 45, show: true },
  { id: "308", name: "Аудиторія 3.08", x: 735, y: 365, w: 55, h: 45, show: true },
  { id: "309", name: "Аудиторія 3.09", x: 595, y: 255, w: 55, h: 45, show: true },
  { id: "310", name: "Аудиторія 3.10", x: 595, y: 310, w: 55, h: 45, show: true },
  { id: "311", name: "Аудиторія 3.11", x: 595, y: 365, w: 55, h: 45, show: true },
  { id: "312", name: "Аудиторія 3.12", x: 525, y: 200, w: 55, h: 45, show: true },
  { id: "313", name: "Аудиторія 3.13", x: 525, y: 255, w: 55, h: 45, show: true },
  { id: "314", name: "Аудиторія 3.14", x: 525, y: 310, w: 55, h: 45, show: true },
  { id: "315", name: "Аудиторія 3.15", x: 525, y: 365, w: 55, h: 45, show: true },
  { id: "316", name: "Аудиторія 3.16", x: 455, y: 200, w: 55, h: 45, show: true },
  { id: "317", name: "Аудиторія 3.17", x: 455, y: 255, w: 55, h: 45, show: true },
  { id: "318", name: "Аудиторія 3.18", x: 455, y: 310, w: 55, h: 45, show: true },
  { id: "319", name: "Аудиторія 3.19", x: 455, y: 365, w: 55, h: 45, show: true },
  { id: "320", name: "Аудиторія 3.20", x: 595, y: 200, w: 55, h: 45, show: true },

  { id: "401", name: "Аудиторія 4.01", x: 200, y: 480, w: 80, h: 55, show: true },
  { id: "402", name: "Аудиторія 4.02", x: 290, y: 480, w: 80, h: 55, show: true },
  { id: "403", name: "Аудиторія 4.03", x: 380, y: 480, w: 80, h: 55, show: true },
  { id: "404", name: "Аудиторія 4.04", x: 470, y: 480, w: 80, h: 55, show: true },
  { id: "405", name: "Аудиторія 4.05", x: 560, y: 480, w: 80, h: 55, show: true },

  { id: "stair-101", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },
  { id: "stair-102", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },
  { id: "stair-103", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },

  { id: "stair-201", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },
  { id: "stair-202", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },
  { id: "stair-203", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },

  { id: "stair-301", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },
  { id: "stair-302", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },
  { id: "stair-303", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },

  { id: "stair-401", name: "Сходи", x: 360, y: 280, w: 80, h: 80, show: false },
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
