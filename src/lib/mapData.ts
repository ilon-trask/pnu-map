export type Room = {
  id: string;
  name: string;
  x: number;
  y: number;
  show: boolean;
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
  { id: "101", name: "Аудиторія 1.01", x: 700, y: 275, show: true },
  { id: "102", name: "Аудиторія 1.02", x: 627, y: 275, show: true },
  { id: "103", name: "Аудиторія 1.03", x: 555, y: 275, show: true },
  { id: "104", name: "Аудиторія 1.04", x: 501, y: 275, show: true },
  { id: "105", name: "Аудиторія 1.05", x: 425, y: 275, show: true },
  { id: "106", name: "Аудиторія 1.06", x: 385, y: 275, show: true },
  { id: "107", name: "Аудиторія 1.07", x: 350, y: 275, show: true },
  { id: "108", name: "Аудиторія 1.08", x: 305, y: 275, show: true },
  { id: "109", name: "Аудиторія 1.09", x: 253, y: 275, show: true },
  { id: "110", name: "Аудиторія 1.10", x: 170, y: 275, show: true },
  { id: "111", name: "Аудиторія 1.11", x: 55, y: 157, show: true },
  { id: "112", name: "Аудиторія 1.12", x: 55, y: 215, show: true },
  { id: "113", name: "Аудиторія 1.13", x: 55, y: 365, show: true },
  { id: "114", name: "Аудиторія 1.14", x: 55, y: 440, show: true },
  { id: "115", name: "Аудиторія 1.15", x: 55, y: 515, show: true },
  { id: "116", name: "Аудиторія 1.16", x: 55, y: 575, show: true },
  { id: "117", name: "Аудиторія 1.17", x: 135, y: 320, show: true },
  { id: "118", name: "Аудиторія 1.18", x: 215, y: 320, show: true },
  { id: "119", name: "Аудиторія 1.19", x: 288, y: 320, show: true },
  { id: "120", name: "Аудиторія 1.20", x: 467, y: 320, show: true },
  { id: "121", name: "Аудиторія 1.21", x: 505, y: 320, show: true },
  { id: "122", name: "Аудиторія 1.22", x: 585, y: 320, show: true },
  { id: "123", name: "Аудиторія 1.23", x: 683, y: 320, show: true },
  { id: "124", name: "Аудиторія 1.24", x: 745, y: 320, show: true },
  { id: "125", name: "Аудиторія 1.25", x: 765, y: 320, show: true },

  { id: "201", name: "Аудиторія 2.01", x: 700, y: 275, show: true },
  { id: "202", name: "Аудиторія 2.02", x: 625, y: 275, show: true },
  { id: "203", name: "Аудиторія 2.03", x: 550, y: 275, show: true },
  { id: "204", name: "Аудиторія 2.04", x: 425, y: 275, show: true },
  { id: "205", name: "Аудиторія 2.05", x: 385, y: 275, show: true },
  { id: "206", name: "Аудиторія 2.06", x: 350, y: 275, show: true },
  { id: "207", name: "Аудиторія 2.07", x: 307, y: 275, show: true },
  { id: "208", name: "Аудиторія 2.08", x: 253, y: 275, show: true },
  { id: "209", name: "Аудиторія 2.09", x: 220, y: 275, show: true },
  { id: "210", name: "Аудиторія 2.10", x: 100, y: 275, show: true },
  { id: "211", name: "Аудиторія 2.11", x: 55, y: 15, show: true },
  { id: "212", name: "Аудиторія 2.12", x: 55, y: 70, show: true },
  { id: "213", name: "Аудиторія 2.13", x: 55, y: 145, show: true },
  { id: "214", name: "Аудиторія 2.14", x: 55, y: 205, show: true },
  { id: "215", name: "Аудиторія 2.15", x: 55, y: 360, show: true },
  { id: "216", name: "Аудиторія 2.16", x: 55, y: 435, show: true },
  { id: "217", name: "Аудиторія 2.17", x: 55, y: 515, show: true },
  { id: "218", name: "Аудиторія 2.18", x: 55, y: 575, show: true },
  { id: "219", name: "Аудиторія 2.19", x: 100, y: 320, show: true },
  { id: "220", name: "Аудиторія 2.20", x: 215, y: 320, show: true },
  { id: "221", name: "Аудиторія 2.21", x: 290, y: 320, show: true },
  { id: "222", name: "Аудиторія 2.22", x: 335, y: 320, show: true },
  { id: "223", name: "Аудиторія 2.23", x: 383, y: 320, show: true },
  { id: "224", name: "Аудиторія 2.24", x: 461, y: 320, show: true },
  { id: "225", name: "Аудиторія 2.25", x: 585, y: 320, show: true },
  { id: "226", name: "Аудиторія 2.26", x: 682, y: 320, show: true },
  { id: "227", name: "Аудиторія 2.27", x: 745, y: 320, show: true },

  { id: "301", name: "Аудиторія 3.01", x: 697, y: 275, show: true },
  { id: "302", name: "Аудиторія 3.02", x: 615, y: 275, show: true },
  { id: "303", name: "Аудиторія 3.03", x: 545, y: 275, show: true },
  { id: "304", name: "Аудиторія 3.04", x: 377, y: 275, show: true },
  { id: "305", name: "Аудиторія 3.05", x: 220, y: 275, show: true },
  { id: "306", name: "Аудиторія 3.06", x: 160, y: 275, show: true },
  { id: "307", name: "Аудиторія 3.07", x: 55, y: 13, show: true },
  { id: "308", name: "Аудиторія 3.08 (деканат)", x: 55, y: 60, show: true },
  { id: "309", name: "Аудиторія 3.09", x: 55, y: 180, show: true },
  { id: "310", name: "Аудиторія 3.10", x: 55, y: 370, show: true },
  { id: "311", name: "Аудиторія 3.11", x: 55, y: 500, show: true },
  { id: "312", name: "Аудиторія 3.12", x: 103, y: 320, show: true },
  { id: "313", name: "Аудиторія 3.13", x: 160, y: 320, show: true },
  { id: "314", name: "Аудиторія 3.14", x: 340, y: 320, show: true },
  { id: "315", name: "Аудиторія 3.15", x: 453, y: 320, show: true },
  { id: "316", name: "Аудиторія 3.16", x: 573, y: 320, show: true },
  { id: "317", name: "Аудиторія 3.17", x: 617, y: 320, show: true },
  { id: "318", name: "Аудиторія 3.18", x: 677, y: 320, show: true },
  { id: "319", name: "Аудиторія 3.19", x: 733, y: 320, show: true },
  { id: "320", name: "Аудиторія 3.20", x: 757, y: 320, show: true },

  { id: "401", name: "Аудиторія 4.01", x: 105, y: 10, show: true },
  { id: "402", name: "Аудиторія 4.02", x: 105, y: 60, show: true },
  { id: "403", name: "Аудиторія 4.03", x: 105, y: 180, show: true },
  { id: "404", name: "Аудиторія 4.04", x: 105, y: 370, show: true },
  { id: "405", name: "Аудиторія 4.05", x: 105, y: 500, show: true },

  { id: "stair-101", name: "Сходи", x: 55, y: 305, show: false },
  { id: "stair-102", name: "Сходи", x: 465, y: 275, show: false },
  { id: "stair-103", name: "Сходи", x: 730, y: 275, show: false },

  { id: "stair-201", name: "Сходи", x: 55, y: 305, show: false },
  { id: "stair-202", name: "Сходи", x: 465, y: 275, show: false },
  { id: "stair-203", name: "Сходи", x: 730, y: 275, show: false },

  { id: "stair-301", name: "Сходи", x: 55, y: 305, show: false },
  { id: "stair-302", name: "Сходи", x: 465, y: 275, show: false },
  { id: "stair-303", name: "Сходи", x: 730, y: 275, show: false },

  { id: "stair-401", name: "Сходи", x: 105, y: 300, show: false },
];

function getRoomCenter(room: Room): PointNode {
  return {
    id: room.id,
    name: room.name,
    x: room.x,
    y: room.y,
  };
}

const NODES: PointNode[] = ROOMS.map(getRoomCenter);

const JUNCTIONS: PointNode[] = [
  { id: "j1", x: 70, y: 300 },
  { id: "j2", x: 465, y: 300 },
  { id: "j3", x: 730, y: 300 },
  { id: "j4", x: 330, y: 300 },
  { id: "j5", x: 590, y: 300 },
  { id: "j6", x: 190, y: 300 },
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
  [80, 185, 700, 90],
  [0, 0, 55, 600],
  [80, 325, 720, 90],
];

const CORRIDORS: [number, number, number, number][] = [
  [80, 280, 720, 40],
  [55, 0, 25, 600],
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
