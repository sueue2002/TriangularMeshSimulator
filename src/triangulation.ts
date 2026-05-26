import { normalizeTriangle, triangleArea } from "./geometry";
import type { Point, Triangle } from "./types";

type Edge = [number, number];

type WorkingTriangle = {
  vertices: Triangle;
  circumcircle: {
    x: number;
    y: number;
    radiusSquared: number;
  };
};

const EPSILON = 1e-9;

export function triangulate(inputPoints: Point[]): Triangle[] {
  if (inputPoints.length < 3) {
    return [];
  }

  const points = inputPoints.map((point, index) => ({ ...point, id: index }));
  const superTriangle = createSuperTriangle(points);
  const workingPoints = [...points, ...superTriangle];
  const superStart = points.length;
  let triangles: WorkingTriangle[] = [
    makeWorkingTriangle([superStart, superStart + 1, superStart + 2], workingPoints),
  ];

  for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
    const point = workingPoints[pointIndex];
    const badTriangles = triangles.filter((triangle) => isInsideCircumcircle(point, triangle));
    const polygon = findBoundaryEdges(badTriangles);

    triangles = triangles.filter((triangle) => !badTriangles.includes(triangle));

    for (const [a, b] of polygon) {
      if (Math.abs(triangleArea(workingPoints[a], workingPoints[b], point)) < EPSILON) {
        continue;
      }

      triangles.push(makeWorkingTriangle(normalizeTriangle(a, b, pointIndex, workingPoints), workingPoints));
    }
  }

  return triangles
    .map((triangle) => triangle.vertices)
    .filter((triangle) => triangle.every((vertex) => vertex < superStart))
    .filter((triangle) => Math.abs(triangleArea(points[triangle[0]], points[triangle[1]], points[triangle[2]])) > EPSILON);
}

function createSuperTriangle(points: Point[]): Point[] {
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const dx = maxX - minX;
  const dy = maxY - minY;
  const delta = Math.max(dx, dy, 1) * 16;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  return [
    { id: points.length, x: midX - delta, y: midY - delta },
    { id: points.length + 1, x: midX, y: midY + delta },
    { id: points.length + 2, x: midX + delta, y: midY - delta },
  ];
}

function makeWorkingTriangle(vertices: Triangle, points: Point[]): WorkingTriangle {
  return {
    vertices,
    circumcircle: getCircumcircle(points[vertices[0]], points[vertices[1]], points[vertices[2]]),
  };
}

function getCircumcircle(a: Point, b: Point, c: Point): WorkingTriangle["circumcircle"] {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));

  if (Math.abs(d) < EPSILON) {
    return { x: 0, y: 0, radiusSquared: Number.POSITIVE_INFINITY };
  }

  const ux =
    ((a.x * a.x + a.y * a.y) * (b.y - c.y) +
      (b.x * b.x + b.y * b.y) * (c.y - a.y) +
      (c.x * c.x + c.y * c.y) * (a.y - b.y)) /
    d;
  const uy =
    ((a.x * a.x + a.y * a.y) * (c.x - b.x) +
      (b.x * b.x + b.y * b.y) * (a.x - c.x) +
      (c.x * c.x + c.y * c.y) * (b.x - a.x)) /
    d;

  const radiusSquared = (ux - a.x) * (ux - a.x) + (uy - a.y) * (uy - a.y);
  return { x: ux, y: uy, radiusSquared };
}

function isInsideCircumcircle(point: Point, triangle: WorkingTriangle): boolean {
  const dx = point.x - triangle.circumcircle.x;
  const dy = point.y - triangle.circumcircle.y;
  return dx * dx + dy * dy <= triangle.circumcircle.radiusSquared + EPSILON;
}

function findBoundaryEdges(triangles: WorkingTriangle[]): Edge[] {
  const edgeCounts = new Map<string, Edge>();
  const duplicates = new Set<string>();

  for (const triangle of triangles) {
    const [a, b, c] = triangle.vertices;
    for (const edge of [
      [a, b],
      [b, c],
      [c, a],
    ] as Edge[]) {
      const key = edgeKey(edge);

      if (edgeCounts.has(key)) {
        duplicates.add(key);
      } else {
        edgeCounts.set(key, edge);
      }
    }
  }

  return [...edgeCounts.entries()].filter(([key]) => !duplicates.has(key)).map(([, edge]) => edge);
}

function edgeKey([a, b]: Edge): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
