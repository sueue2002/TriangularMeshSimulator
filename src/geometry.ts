import type { Point, Triangle } from "./types";

const EPSILON = 1e-9;

export function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function triangleArea(a: Point, b: Point, c: Point): number {
  return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2;
}

export function pointToSegmentDistanceSquared(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq < EPSILON) {
    return distanceSquared(point, a);
  }

  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq));
  const projection = { id: -1, x: a.x + t * dx, y: a.y + t * dy };
  return distanceSquared(point, projection);
}

export function buildAdjacency(vertexCount: number, triangles: Triangle[]): Map<number, Set<number>> {
  const adjacency = new Map<number, Set<number>>();

  for (let i = 0; i < vertexCount; i += 1) {
    adjacency.set(i, new Set<number>());
  }

  for (const [a, b, c] of triangles) {
    adjacency.get(a)?.add(b);
    adjacency.get(a)?.add(c);
    adjacency.get(b)?.add(a);
    adjacency.get(b)?.add(c);
    adjacency.get(c)?.add(a);
    adjacency.get(c)?.add(b);
  }

  return adjacency;
}

export function getBoundaryVertexIds(points: Point[]): Set<number> {
  if (points.length < 3) {
    return new Set(points.map((point) => point.id));
  }

  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const lower: Point[] = [];
  const upper: Point[] = [];

  for (const point of sorted) {
    while (lower.length >= 2 && triangleArea(lower[lower.length - 2], lower[lower.length - 1], point) <= EPSILON) {
      lower.pop();
    }
    lower.push(point);
  }

  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (upper.length >= 2 && triangleArea(upper[upper.length - 2], upper[upper.length - 1], point) <= EPSILON) {
      upper.pop();
    }
    upper.push(point);
  }

  return new Set([...lower, ...upper].map((point) => point.id));
}

export function normalizeTriangle(a: number, b: number, c: number, points: Point[]): Triangle {
  const triangle: Triangle = [a, b, c];
  return triangleArea(points[a], points[b], points[c]) < 0 ? [a, c, b] : triangle;
}
