import type { Building, Edge, Node,PointPlacement, Room, StructureData, StructureRect } from "./types";

const FLOOR_WIDTH = 800;
const FLOOR_HEIGHT = 600;

const FLOORS = [
  { id: 1, name: "1", imageSrc: "/floors/1.svg" },
  { id: 2, name: "2", imageSrc: "/floors/2.svg" },
  { id: 3, name: "3", imageSrc: "/floors/3.svg" },
  { id: 4, name: "4", imageSrc: "/floors/4.svg" },
];

const ROOMS: Room[] = [
  { id: "101", floor: 1, name: "Аудиторія 1.01", x: 700, y: 275, show: true },
  { id: "102", floor: 1, name: "Аудиторія 1.02", x: 627, y: 275, show: true },
  { id: "103", floor: 1, name: "Аудиторія 1.03", x: 555, y: 275, show: true },
  { id: "104", floor: 1, name: "Аудиторія 1.04", x: 501, y: 275, show: true },
  { id: "105", floor: 1, name: "Аудиторія 1.05", x: 425, y: 275, show: true },
  { id: "106", floor: 1, name: "Аудиторія 1.06", x: 385, y: 275, show: true },
  { id: "107", floor: 1, name: "Аудиторія 1.07", x: 350, y: 275, show: true },
  { id: "108", floor: 1, name: "Аудиторія 1.08", x: 305, y: 275, show: true },
  { id: "109", floor: 1, name: "Аудиторія 1.09", x: 253, y: 275, show: true },
  { id: "110", floor: 1, name: "Аудиторія 1.10", x: 170, y: 275, show: true },
  { id: "111", floor: 1, name: "Аудиторія 1.11", x: 55, y: 157, show: true },
  { id: "112", floor: 1, name: "Аудиторія 1.12", x: 55, y: 215, show: true },
  { id: "113", floor: 1, name: "Аудиторія 1.13", x: 55, y: 365, show: true },
  { id: "114", floor: 1, name: "Аудиторія 1.14", x: 55, y: 440, show: true },
  { id: "115", floor: 1, name: "Аудиторія 1.15", x: 55, y: 515, show: true },
  { id: "116", floor: 1, name: "Аудиторія 1.16", x: 55, y: 575, show: true },
  { id: "117", floor: 1, name: "Аудиторія 1.17", x: 135, y: 320, show: true },
  { id: "118", floor: 1, name: "Аудиторія 1.18", x: 215, y: 320, show: true },
  { id: "119", floor: 1, name: "Аудиторія 1.19", x: 288, y: 320, show: true },
  { id: "120", floor: 1, name: "Аудиторія 1.20", x: 467, y: 320, show: true },
  { id: "121", floor: 1, name: "Аудиторія 1.21", x: 505, y: 320, show: true },
  { id: "122", floor: 1, name: "Аудиторія 1.22", x: 585, y: 320, show: true },
  { id: "123", floor: 1, name: "Аудиторія 1.23", x: 683, y: 320, show: true },
  { id: "124", floor: 1, name: "Аудиторія 1.24", x: 745, y: 320, show: true },
  { id: "125", floor: 1, name: "Аудиторія 1.25", x: 765, y: 320, show: true },

  { id: "201", floor: 2, name: "Аудиторія 2.01", x: 700, y: 275, show: true },
  { id: "202", floor: 2, name: "Аудиторія 2.02", x: 625, y: 275, show: true },
  { id: "203", floor: 2, name: "Аудиторія 2.03", x: 550, y: 275, show: true },
  { id: "204", floor: 2, name: "Аудиторія 2.04", x: 425, y: 275, show: true },
  { id: "205", floor: 2, name: "Аудиторія 2.05", x: 385, y: 275, show: true },
  { id: "206", floor: 2, name: "Аудиторія 2.06", x: 350, y: 275, show: true },
  { id: "207", floor: 2, name: "Аудиторія 2.07", x: 307, y: 275, show: true },
  { id: "208", floor: 2, name: "Аудиторія 2.08", x: 253, y: 275, show: true },
  { id: "209", floor: 2, name: "Аудиторія 2.09", x: 220, y: 275, show: true },
  { id: "210", floor: 2, name: "Аудиторія 2.10", x: 100, y: 275, show: true },
  { id: "211", floor: 2, name: "Аудиторія 2.11", x: 55, y: 15, show: true },
  { id: "212", floor: 2, name: "Аудиторія 2.12", x: 55, y: 70, show: true },
  { id: "213", floor: 2, name: "Аудиторія 2.13", x: 55, y: 145, show: true },
  { id: "214", floor: 2, name: "Аудиторія 2.14", x: 55, y: 205, show: true },
  { id: "215", floor: 2, name: "Аудиторія 2.15", x: 55, y: 360, show: true },
  { id: "216", floor: 2, name: "Аудиторія 2.16", x: 55, y: 435, show: true },
  { id: "217", floor: 2, name: "Аудиторія 2.17", x: 55, y: 515, show: true },
  { id: "218", floor: 2, name: "Аудиторія 2.18", x: 55, y: 575, show: true },
  { id: "219", floor: 2, name: "Аудиторія 2.19", x: 100, y: 320, show: true },
  { id: "220", floor: 2, name: "Аудиторія 2.20", x: 215, y: 320, show: true },
  { id: "221", floor: 2, name: "Аудиторія 2.21", x: 290, y: 320, show: true },
  { id: "222", floor: 2, name: "Аудиторія 2.22", x: 335, y: 320, show: true },
  { id: "223", floor: 2, name: "Аудиторія 2.23", x: 383, y: 320, show: true },
  { id: "224", floor: 2, name: "Аудиторія 2.24", x: 461, y: 320, show: true },
  { id: "225", floor: 2, name: "Аудиторія 2.25", x: 585, y: 320, show: true },
  { id: "226", floor: 2, name: "Аудиторія 2.26", x: 682, y: 320, show: true },
  { id: "227", floor: 2, name: "Аудиторія 2.27", x: 745, y: 320, show: true },

  { id: "301", floor: 3, name: "Аудиторія 3.01", x: 697, y: 275, show: true },
  { id: "302", floor: 3, name: "Аудиторія 3.02", x: 615, y: 275, show: true },
  { id: "303", floor: 3, name: "Аудиторія 3.03", x: 545, y: 275, show: true },
  { id: "304", floor: 3, name: "Аудиторія 3.04", x: 377, y: 275, show: true },
  { id: "305", floor: 3, name: "Аудиторія 3.05", x: 220, y: 275, show: true },
  { id: "306", floor: 3, name: "Аудиторія 3.06", x: 160, y: 275, show: true },
  { id: "307", floor: 3, name: "Аудиторія 3.07", x: 55, y: 13, show: true },
  { id: "308", floor: 3, name: "Аудиторія 3.08", x: 55, y: 60, show: true },
  { id: "309", floor: 3, name: "Аудиторія 3.09", x: 55, y: 180, show: true },
  { id: "310", floor: 3, name: "Аудиторія 3.10", x: 55, y: 370, show: true },
  { id: "311", floor: 3, name: "Аудиторія 3.11", x: 55, y: 500, show: true },
  { id: "312", floor: 3, name: "Аудиторія 3.12", x: 103, y: 320, show: true },
  { id: "313", floor: 3, name: "Аудиторія 3.13", x: 160, y: 320, show: true },
  { id: "314", floor: 3, name: "Аудиторія 3.14", x: 340, y: 320, show: true },
  { id: "315", floor: 3, name: "Аудиторія 3.15", x: 453, y: 320, show: true },
  { id: "316", floor: 3, name: "Аудиторія 3.16", x: 573, y: 320, show: true },
  { id: "317", floor: 3, name: "Аудиторія 3.17", x: 617, y: 320, show: true },
  { id: "318", floor: 3, name: "Аудиторія 3.18", x: 677, y: 320, show: true },
  { id: "319", floor: 3, name: "Аудиторія 3.19", x: 733, y: 320, show: true },
  { id: "320", floor: 3, name: "Аудиторія 3.20", x: 757, y: 320, show: true },

  { id: "401", floor: 4, name: "Аудиторія 4.01", x: 105, y: 10, show: true },
  { id: "402", floor: 4, name: "Аудиторія 4.02", x: 105, y: 60, show: true },
  { id: "403", floor: 4, name: "Аудиторія 4.03", x: 105, y: 180, show: true },
  { id: "404", floor: 4, name: "Аудиторія 4.04", x: 105, y: 370, show: true },
  { id: "405", floor: 4, name: "Аудиторія 4.05", x: 105, y: 500, show: true },

  { id: "stair-101", floor: 1, name: "Сходи", x: 55, y: 305, show: false },
  { id: "stair-102", floor: 1, name: "Сходи", x: 465, y: 275, show: false },
  { id: "stair-103", floor: 1, name: "Сходи", x: 730, y: 275, show: false },

  { id: "stair-201", floor: 2, name: "Сходи", x: 55, y: 305, show: false },
  { id: "stair-202", floor: 2, name: "Сходи", x: 465, y: 275, show: false },
  { id: "stair-203", floor: 2, name: "Сходи", x: 730, y: 275, show: false },

  { id: "stair-301", floor: 3, name: "Сходи", x: 55, y: 305, show: false },
  { id: "stair-302", floor: 3, name: "Сходи", x: 465, y: 275, show: false },
  { id: "stair-303", floor: 3, name: "Сходи", x: 730, y: 275, show: false },

  { id: "stair-401", floor: 4, name: "Сходи", x: 105, y: 300, show: false },
];

function getRoomCenter(room: Room): Node {
  return {
    id: room.id,
    x: room.x,
    y: room.y,
  };
}

const NODES: Node[] = ROOMS.map(getRoomCenter);

const JUNCTIONS: Node[] = [
  { id: "j1", x: 70, y: 300 },
  { id: "j2", x: 465, y: 300 },
  { id: "j3", x: 730, y: 300 },
  { id: "j4", x: 330, y: 300 },
  { id: "j5", x: 590, y: 300 },
  { id: "j6", x: 190, y: 300 },
];

const ALL_NODES: Node[] = [...NODES, ...JUNCTIONS];

function findNode(id: string): Node | undefined {
  const room = ROOMS.find((item) => item.id === id);
  if (room) return getRoomCenter(room);
  return JUNCTIONS.find((item) => item.id === id);
}

const EDGES: Edge[] = [];

const WALLS: StructureRect[] = [
  [80, 185, 700, 90],
  [0, 0, 55, 600],
  [80, 325, 720, 90],
];

const CORRIDORS: StructureRect[] = [
  [80, 280, 720, 40],
  [55, 0, 25, 600],
];

const FLOOR_4_WALLS: StructureRect[] = [
  [0, 0, 95, 600],
];

const FLOOR_4_CORRIDORS: StructureRect[] = [
  [100, 0, 55, 600],
];

const FLOOR_4_JUNCTIONS: Node[] = [
  { id: "f4-j3", x: 140, y: 300 },
];

const STRUCTURES_BY_FLOOR: Record<number, StructureData> = {
  1: { walls: WALLS, corridors: CORRIDORS, junctions: JUNCTIONS },
  2: { walls: WALLS, corridors: CORRIDORS, junctions: JUNCTIONS },
  3: { walls: WALLS, corridors: CORRIDORS, junctions: JUNCTIONS },
  4: { walls: FLOOR_4_WALLS, corridors: FLOOR_4_CORRIDORS, junctions: FLOOR_4_JUNCTIONS },
};

function getStructureDataByFloor(floor: number): StructureData {
  return STRUCTURES_BY_FLOOR[floor] ?? STRUCTURES_BY_FLOOR[1];
}

const OTHER_BUILDINGS: Building[] = [
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

// Edit this array to place custom map points.
// x/y use the same coordinate system as room coordinates.
// id must be the id of the room the point refers to.
// fileName is optional and lets you target exact file names from /public/points.
const POINTS: PointPlacement[] = [
  { id: "self", title: "ХОЛ", src: "/points/ХОЛ.svg", floor: 1, x: 400, y: 320, iconSize: 82 },
  { id: "stair-102", title: "ЇДАЛЬНЯ", src: "/points/CANTEEN.svg", floor: 1, x: 462, y: 210, iconSize: 82 },
  { id: "204", title: "РЕКТОР", src: "/points/РЕКТОР.svg", floor: 2, x: 422, y: 210, iconSize: 82 },
  { id: "223", title: "БУХГАЛТЕРІЯ", src: "/points/БУХГАЛТЕРІЯ.svg", floor: 2, x: 400, y: 340, iconSize: 82 },
  { id: "319", title: "КАФЕДРА", src: "/points/КАФЕДРА.svg", floor: 3, x: 728, y: 340, iconSize: 82 },
  { id: "308", title: "ДЕКАНАТ", src: "/points/ДЕКАНАТ.svg", floor: 3, x: 30, y: 50, iconSize: 82 },
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
  STRUCTURES_BY_FLOOR,
  getStructureDataByFloor,
  OTHER_BUILDINGS,
  POINTS,
  FLOORS,
};
