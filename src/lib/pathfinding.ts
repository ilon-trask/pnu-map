import { getRoomCode } from "./floor";
import { DATA } from "./data";
import type { ClassPathResult, GraphEdge, OpenNode, PathNode } from "./types";


const FLOOR_NODE_DELIMITER = "__floor__";
const FLOOR_TRANSITION_COST = 140;
const NEARBY_JUNCTION_LINK_COUNT = 2;
const NEARBY_JUNCTION_MAX_DISTANCE = 220;
const ROOM_CONNECTOR_LINK_COUNT = 2;
const ROOM_CONNECTOR_MAX_DISTANCE = 220;

const roomNodes = new Map(
  DATA.ROOMS.map((room) => [
    room.id,
    {
      id: room.id,
      x: room.x,
      y: room.y,
      floor: room.floor,
    } satisfies PathNode,
  ])
);

const roomIds = new Set(DATA.ROOMS.map((room) => room.id));

const customPointNodes = new Map(
  DATA.POINTS.filter((point) => !roomIds.has(point.id)).map((point) => [
    point.id,
    {
      id: point.id,
      x: point.x,
      y: point.y,
      floor: point.floor,
    } satisfies PathNode,
  ])
);

const stairRoomIds = Array.from(roomIds).filter((id) => isStairRoomId(id));

const availableFloors = DATA.FLOORS.map(el => el.id).sort((a, b) => a - b);

function getJunctionsForFloor(floor: number): Array<Pick<PathNode, "id" | "x" | "y">> {
  const structure = DATA.getStructureDataByFloor(floor);
  if (structure.junctions.length > 0) return structure.junctions;
  return DATA.JUNCTIONS;
}

function toFloorScopedId(baseId: string, floor: number): string {
  return `${baseId}${FLOOR_NODE_DELIMITER}${floor}`;
}

const junctionNodesByFloor = new Map<number, PathNode[]>(
  availableFloors.map((floor) => [
    floor,
    getJunctionsForFloor(floor).map((junction) => ({
      id: toFloorScopedId(junction.id, floor),
      x: junction.x,
      y: junction.y,
      floor,
    })),
  ])
);

const junctionNodesById = new Map(
  Array.from(junctionNodesByFloor.values())
    .flat()
    .map((junction) => [junction.id, junction] as const)
);

function isStairRoomId(id: string): boolean {
  return id.startsWith(DATA.STAIR_ID_PREFIX) && roomIds.has(id);
}

function getStairShaftKey(id: string): string | null {
  if (!isStairRoomId(id)) return null;

  const roomCode = getRoomCode(id);
  if (roomCode !== null) {
    return String(roomCode % 100).padStart(2, "0");
  }

  return id.slice(DATA.STAIR_ID_PREFIX.length) || null;
}


function resolveNode(id: string): PathNode | undefined {
  const room = roomNodes.get(id);
  if (room) return room;
  const point = customPointNodes.get(id);
  if (point) return point;

  return junctionNodesById.get(id);
}

function edgeDistance(a: PathNode, b: PathNode): number {
  const floorA = a.floor;
  const floorB = b.floor;
  if (floorA !== null && floorB !== null && floorA !== floorB) {
    return Math.abs(floorA - floorB) * FLOOR_TRANSITION_COST;
  }
  return Math.hypot(b.x - a.x, b.y - a.y);
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

  function getNearestAnchorIds(
    sourceId: string,
    sourceNode: PathNode,
    floorJunctions: PathNode[]
  ): string[] {
    const rankedAnchors = floorJunctions
      .filter((candidate) => candidate.id !== sourceId)
      .map((candidate) => ({
        id: candidate.id,
        distance: Math.hypot(candidate.x - sourceNode.x, candidate.y - sourceNode.y),
      }))
      .sort((a, b) => a.distance - b.distance);

    const inRangeAnchors = rankedAnchors
      .filter((candidate) => candidate.distance <= ROOM_CONNECTOR_MAX_DISTANCE)
      .slice(0, ROOM_CONNECTOR_LINK_COUNT)
      .map((candidate) => candidate.id);

    if (inRangeAnchors.length > 0) return inRangeAnchors;

    const fallbackAnchor = rankedAnchors[0];
    return fallbackAnchor ? [fallbackAnchor.id] : [];
  }

  availableFloors.forEach((floor) => {
    const scopedJunctions = junctionNodesByFloor.get(floor) ?? [];

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

  roomIds.forEach((roomId) => {
    const roomNode = roomNodes.get(roomId);
    if (!roomNode) return;
    const floorJunctions = junctionNodesByFloor.get(roomNode.floor) ?? [];
    if (floorJunctions.length === 0) return;
    const nearestAnchorIds = getNearestAnchorIds(roomId, roomNode, floorJunctions);

    nearestAnchorIds.forEach((anchorId) => {
      addEdge(roomId, anchorId);
      addEdge(anchorId, roomId);
    });
  });

  customPointNodes.forEach((pointNode, pointId) => {
    const floor = pointNode.floor;
    if (floor === null) return;
    const floorJunctions = junctionNodesByFloor.get(floor) ?? [];
    if (floorJunctions.length === 0) return;

    const nearestAnchorIds = getNearestAnchorIds(pointId, pointNode, floorJunctions);
    nearestAnchorIds.forEach((anchorId) => {
      addEdge(pointId, anchorId);
      addEdge(anchorId, pointId);
    });
  });

  const stairsByShaft = new Map<string, { id: string; floor: number }[]>();
  stairRoomIds.forEach((id) => {
    const shaft = getStairShaftKey(id);
    const stairNode = roomNodes.get(id);
    if (!stairNode || !shaft) return;
    if (!stairsByShaft.has(shaft)) stairsByShaft.set(shaft, []);
    stairsByShaft.get(shaft)?.push({ id, floor: stairNode.floor });
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
  customPointNodes.forEach((node, id) => {
    if (!nodesById.has(id)) nodesById.set(id, node);
  });

  return { edges, nodesById };
}

const { edges: graph, nodesById } = buildGraph();

function getNodeById(id: string): PathNode | undefined {
  return nodesById.get(id) ?? resolveNode(id);
}

function heuristic(a: PathNode, b: PathNode): number {
  return Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(b.floor - a.floor) * FLOOR_TRANSITION_COST;
}

function findPath(fromId: string, toId: string): PathNode[] | null {
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

function calculatePathDistance(path: PathNode[]): number {
  if (path.length < 2) return 0;

  let distance = 0;
  for (let i = 1; i < path.length; i += 1) {
    distance += edgeDistance(path[i - 1], path[i]);
  }
  return distance;
}

export function findClassPath(fromClassId: string, toClassId: string): ClassPathResult | null {
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
