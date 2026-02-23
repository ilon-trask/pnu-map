import { MAP_DATA } from "./mapData";

export type PathNode = {
  id: string;
  x: number;
  y: number;
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

function getNodeById(id: string): PathNode | undefined {
  const room = MAP_DATA.ROOMS.find((item) => item.id === id);
  if (room) {
    return { id: room.id, x: room.x + room.w / 2, y: room.y + room.h / 2 };
  }

  return MAP_DATA.JUNCTIONS.find((item) => item.id === id);
}

function buildGraph(): Map<string, GraphEdge[]> {
  const edges = new Map<string, GraphEdge[]>();

  MAP_DATA.EDGES.forEach((edge) => {
    const fromNode = getNodeById(edge.from);
    const toNode = getNodeById(edge.to);
    if (!fromNode || !toNode) return;

    const dist = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y);
    if (!edges.has(edge.from)) edges.set(edge.from, []);
    edges.get(edge.from)?.push({ id: toNode.id, x: toNode.x, y: toNode.y, dist });
  });

  return edges;
}

const graph = buildGraph();

function heuristic(a: PathNode, b: PathNode): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function findPath(fromId: string, toId: string): PathNode[] | null {
  const from = getNodeById(fromId);
  const to = getNodeById(toId);
  if (!from || !to) return null;

  const open: OpenNode[] = [{ id: from.id, x: from.x, y: from.y, g: 0, f: heuristic(from, to) }];
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  gScore.set(from.id, 0);

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (!current) break;

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

    const neighbors = graph.get(current.id);
    if (!neighbors) continue;

    neighbors.forEach((neighbor) => {
      const tentative = (gScore.get(current.id) ?? Number.POSITIVE_INFINITY) + neighbor.dist;
      if (tentative >= (gScore.get(neighbor.id) ?? Number.POSITIVE_INFINITY)) return;

      cameFrom.set(neighbor.id, current.id);
      gScore.set(neighbor.id, tentative);
      open.push({
        id: neighbor.id,
        x: neighbor.x,
        y: neighbor.y,
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

  const classesOnly = MAP_DATA.ROOMS.filter((room) => room.id !== "stair");

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
    distance += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
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
