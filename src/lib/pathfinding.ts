import { MAP_DATA } from "./mapData";

export type PathNode = {
  id: string;
  x: number;
  y: number;
  floor?: number;
};

export type ClassPathResult = {
  fromClassId: string;
  toClassId: string;
  path: PathNode[];
  distance: number;
};

type GraphEdge = PathNode & {
  dist: number;
};

type OpenNode = PathNode & {
  g: number;
  f: number;
};

const STAIR_ID_PREFIX = "stair-";
const FLOOR_NODE_DELIMITER = "__floor__";
const FLOOR_TRANSITION_COST = 140;
const NEARBY_JUNCTION_LINK_COUNT = 2;
const NEARBY_JUNCTION_MAX_DISTANCE = 220;

const roomNodes = new Map(
  MAP_DATA.ROOMS.map((room) => [
    room.id,
    {
      id: room.id,
      x: room.x,
      y: room.y,
      floor: getFloorFromRoomId(room.id) ?? undefined,
    } satisfies PathNode,
  ])
);

const junctionNodes = new Map(MAP_DATA.JUNCTIONS.map((junction) => [junction.id, junction satisfies PathNode]));

const roomIds = new Set(MAP_DATA.ROOMS.map((room) => room.id));
const junctionIds = new Set(MAP_DATA.JUNCTIONS.map((junction) => junction.id));
const stairRoomIds = Array.from(roomIds).filter((id) => isStairRoomId(id));

const availableFloors = Array.from(
  new Set(
    MAP_DATA.ROOMS.filter((room) => !isStairRoomId(room.id))
      .map((room) => getFloorFromRoomId(room.id))
      .filter((floor): floor is number => floor !== null)
  )
).sort((a, b) => a - b);

function getFloorFromRoomId(roomId: string): number | null {
  const numericPart = roomId.match(/(\d{3,4})/)?.[0];
  if (!numericPart) return null;

  const numericValue = Number(numericPart);
  if (!Number.isFinite(numericValue) || numericValue < 100) return null;

  const floor = Math.floor(numericValue / 100);
  return floor > 0 ? floor : null;
}

function toFloorScopedId(baseId: string, floor: number): string {
  return `${baseId}${FLOOR_NODE_DELIMITER}${floor}`;
}

function fromFloorScopedId(nodeId: string): { baseId: string; floor: number } | null {
  const [baseId, floorPart] = nodeId.split(FLOOR_NODE_DELIMITER);
  if (!baseId || !floorPart) return null;

  const floor = Number(floorPart);
  if (!Number.isFinite(floor)) return null;

  return { baseId, floor };
}

function isRoomNodeId(id: string): boolean {
  return roomIds.has(id);
}

function isFloorScopedBaseNodeId(id: string): boolean {
  return junctionIds.has(id);
}

function isStairRoomId(id: string): boolean {
  return id.startsWith(STAIR_ID_PREFIX) && roomIds.has(id);
}

function getStairShaftKey(id: string): string | null {
  if (!isStairRoomId(id)) return null;

  const number = id.match(/(\d{3,4})/)?.[0];
  if (number) {
    const numericValue = Number(number);
    if (Number.isFinite(numericValue) && numericValue >= 100) {
      return String(numericValue % 100).padStart(2, "0");
    }
  }

  return id.slice(STAIR_ID_PREFIX.length) || null;
}

function toGraphNodeId(baseId: string, floor: number): string | null {
  if (isRoomNodeId(baseId)) {
    return getFloorFromRoomId(baseId) === floor ? baseId : null;
  }
  if (isFloorScopedBaseNodeId(baseId)) {
    return toFloorScopedId(baseId, floor);
  }
  return null;
}

function resolveNode(id: string): PathNode | undefined {
  const room = roomNodes.get(id);
  if (room) return room;

  const junction = junctionNodes.get(id);
  if (junction) return junction;

  const scoped = fromFloorScopedId(id);
  if (!scoped) return undefined;

  const scopedJunction = junctionNodes.get(scoped.baseId);
  if (!scopedJunction) return undefined;
  return { id, x: scopedJunction.x, y: scopedJunction.y, floor: scoped.floor };
}

function floorOfNode(node: PathNode): number | null {
  if (typeof node.floor === "number") return node.floor;
  return getFloorFromRoomId(node.id);
}

function edgeDistance(a: PathNode, b: PathNode): number {
  const floorA = floorOfNode(a);
  const floorB = floorOfNode(b);
  if (floorA !== null && floorB !== null && floorA !== floorB) {
    return Math.abs(floorA - floorB) * FLOOR_TRANSITION_COST;
  }
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function floorsForEdge(fromId: string, toId: string): number[] {
  const fromRoom = isRoomNodeId(fromId);
  const toRoom = isRoomNodeId(toId);

  if (fromRoom && toRoom) {
    const fromFloor = getFloorFromRoomId(fromId);
    const toFloor = getFloorFromRoomId(toId);
    if (fromFloor === null || toFloor === null || fromFloor !== toFloor) return [];
    return [fromFloor];
  }

  if (isFloorScopedBaseNodeId(fromId) && isFloorScopedBaseNodeId(toId)) {
    return availableFloors;
  }

  const floor = getFloorFromRoomId(fromRoom ? fromId : toId);
  return floor === null ? [] : [floor];
}

function buildGraph(): { edges: Map<string, GraphEdge[]>; nodesById: Map<string, PathNode> } {
  const edges = new Map<string, GraphEdge[]>();
  const nodesById = new Map<string, PathNode>();

  function hasEdge(fromId: string, toId: string): boolean {
    return (edges.get(fromId) ?? []).some((edge) => edge.id === toId);
  }

  function addEdge(fromId: string, toId: string, forcedDistance?: number): void {
    const fromNode = resolveNode(fromId);
    const toNode = resolveNode(toId);
    if (!fromNode || !toNode) return;
    if (hasEdge(fromId, toId)) return;

    const fromWithId: PathNode = { ...fromNode, id: fromId };
    const toWithId: PathNode = { ...toNode, id: toId };
    nodesById.set(fromId, fromWithId);
    nodesById.set(toId, toWithId);

    const dist = forcedDistance ?? edgeDistance(fromWithId, toWithId);
    if (!edges.has(fromId)) edges.set(fromId, []);
    edges.get(fromId)?.push({ ...toWithId, dist });
  }

  MAP_DATA.EDGES.forEach((edge) => {
    const floors = floorsForEdge(edge.from, edge.to);
    floors.forEach((floor) => {
      const fromId = toGraphNodeId(edge.from, floor);
      const toId = toGraphNodeId(edge.to, floor);
      if (!fromId || !toId) return;
      addEdge(fromId, toId);
    });
  });

  // Supplement sparse/incomplete static edges by connecting each junction to nearby
  // local neighbors on the same floor. This prevents long detours in straight corridors.
  availableFloors.forEach((floor) => {
    const scopedJunctions = MAP_DATA.JUNCTIONS.map((junction) => toFloorScopedId(junction.id, floor))
      .map((id) => resolveNode(id))
      .filter((node): node is PathNode => Boolean(node));

    scopedJunctions.forEach((fromNode) => {
      const neighbors = scopedJunctions
        .filter((toNode) => toNode.id !== fromNode.id)
        .map((toNode) => ({
          id: toNode.id,
          distance: Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y),
        }))
        .filter((candidate) => candidate.distance <= NEARBY_JUNCTION_MAX_DISTANCE)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, NEARBY_JUNCTION_LINK_COUNT);

      neighbors.forEach((neighbor) => {
        addEdge(fromNode.id, neighbor.id);
        addEdge(neighbor.id, fromNode.id);
      });
    });
  });

  // Ensure every room has a floor-local connector to the nearest junction.
  // This corrects stale/manual edge definitions that can force long detours.
  roomIds.forEach((roomId) => {
    const floor = getFloorFromRoomId(roomId);
    const roomNode = resolveNode(roomId);
    if (floor === null || !roomNode) return;

    let nearestJunctionId: string | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    MAP_DATA.JUNCTIONS.forEach((junction) => {
      const junctionNodeId = toFloorScopedId(junction.id, floor);
      const junctionNode = resolveNode(junctionNodeId);
      if (!junctionNode) return;

      const distance = Math.hypot(junctionNode.x - roomNode.x, junctionNode.y - roomNode.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestJunctionId = junctionNodeId;
      }
    });

    if (!nearestJunctionId) return;
    addEdge(roomId, nearestJunctionId);
    addEdge(nearestJunctionId, roomId);
  });

  const stairsByShaft = new Map<string, { id: string; floor: number }[]>();
  stairRoomIds.forEach((id) => {
    const floor = getFloorFromRoomId(id);
    const shaft = getStairShaftKey(id);
    if (floor === null || !shaft) return;
    if (!stairsByShaft.has(shaft)) stairsByShaft.set(shaft, []);
    stairsByShaft.get(shaft)?.push({ id, floor });
  });

  stairsByShaft.forEach((stairs) => {
    stairs.sort((a, b) => a.floor - b.floor);
    for (let i = 1; i < stairs.length; i += 1) {
      addEdge(stairs[i - 1].id, stairs[i].id, FLOOR_TRANSITION_COST);
      addEdge(stairs[i].id, stairs[i - 1].id, FLOOR_TRANSITION_COST);
    }
  });

  roomNodes.forEach((node, id) => {
    if (!nodesById.has(id)) nodesById.set(id, node);
  });

  return { edges, nodesById };
}

const { edges: graph, nodesById } = buildGraph();

function getNodeById(id: string): PathNode | undefined {
  return nodesById.get(id) ?? resolveNode(id);
}

function heuristic(a: PathNode, b: PathNode): number {
  const floorA = floorOfNode(a) ?? 0;
  const floorB = floorOfNode(b) ?? 0;
  return Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(floorB - floorA) * FLOOR_TRANSITION_COST;
}

export function findPath(fromId: string, toId: string): PathNode[] | null {
  const from = getNodeById(fromId);
  const to = getNodeById(toId);
  if (!from || !to) return null;

  const open: OpenNode[] = [
    {
      id: from.id,
      x: from.x,
      y: from.y,
      floor: from.floor,
      g: 0,
      f: heuristic(from, to),
    },
  ];
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const closed = new Set<string>();
  gScore.set(from.id, 0);

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (!current) break;
    if (closed.has(current.id)) continue;

    if (current.id === to.id) {
      const path: PathNode[] = [];
      let cursor: string | undefined = to.id;
      while (cursor) {
        const node = getNodeById(cursor);
        if (node) path.unshift(node);
        cursor = cameFrom.get(cursor);
      }
      return path;
    }
    closed.add(current.id);

    const neighbors = graph.get(current.id);
    if (!neighbors) continue;

    neighbors.forEach((neighbor) => {
      if (closed.has(neighbor.id)) return;

      const tentative = (gScore.get(current.id) ?? Number.POSITIVE_INFINITY) + neighbor.dist;
      if (tentative >= (gScore.get(neighbor.id) ?? Number.POSITIVE_INFINITY)) return;

      cameFrom.set(neighbor.id, current.id);
      gScore.set(neighbor.id, tentative);
      open.push({
        id: neighbor.id,
        x: neighbor.x,
        y: neighbor.y,
        floor: neighbor.floor,
        g: tentative,
        f: tentative + heuristic(neighbor, to),
      });
    });
  }

  return null;
}

function normalizeClassQuery(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ").replace(/^аудиторія\s*/u, "");
}

function resolveClassroomId(query: string): string | null {
  const normalizedQuery = normalizeClassQuery(query);
  if (!normalizedQuery) return null;

  const classesOnly = MAP_DATA.ROOMS.filter((room) => room.show !== false && !isStairRoomId(room.id));

  const exactIdMatch = classesOnly.find((room) => room.id.toLowerCase() === normalizedQuery);
  if (exactIdMatch) return exactIdMatch.id;

  const idLike = normalizedQuery.match(/[0-9]{3}[a-zа-я]?/iu)?.[0];
  if (idLike) {
    const idMatch = classesOnly.find((room) => room.id.toLowerCase() === idLike.toLowerCase());
    if (idMatch) return idMatch.id;
  }

  const exactNameMatch = classesOnly.find((room) => normalizeClassQuery(room.name) === normalizedQuery);
  if (exactNameMatch) return exactNameMatch.id;

  return null;
}

function calculatePathDistance(path: PathNode[]): number {
  if (path.length < 2) return 0;

  let distance = 0;
  for (let i = 1; i < path.length; i += 1) {
    distance += edgeDistance(path[i - 1], path[i]);
  }
  return distance;
}

export function findClassPath(fromClass: string, toClass: string): ClassPathResult | null {
  const fromClassId = resolveClassroomId(fromClass);
  const toClassId = resolveClassroomId(toClass);
  if (!fromClassId || !toClassId) return null;

  if (fromClassId === toClassId) {
    const node = getNodeById(fromClassId);
    if (!node) return null;
    return {
      fromClassId,
      toClassId,
      path: [node],
      distance: 0,
    };
  }

  const path = findPath(fromClassId, toClassId);
  if (!path) return null;

  return {
    fromClassId,
    toClassId,
    path,
    distance: calculatePathDistance(path),
  };
}

export { getNodeById };
