import { buildAdjacency, getBoundaryVertexIds } from "./geometry";
import type { Point, Triangle } from "./types";

export function smoothUniformLaplacian(
  points: Point[],
  triangles: Triangle[],
  lambda: number,
  fixBoundary: boolean,
): Point[] {
  const adjacency = buildAdjacency(points.length, triangles);
  const boundaryIds = fixBoundary ? getBoundaryVertexIds(points) : new Set<number>();

  return points.map((point, index) => {
    const neighbors = adjacency.get(index);

    if (!neighbors || neighbors.size === 0 || boundaryIds.has(point.id)) {
      return { ...point };
    }

    let averageX = 0;
    let averageY = 0;

    for (const neighborIndex of neighbors) {
      averageX += points[neighborIndex].x;
      averageY += points[neighborIndex].y;
    }

    averageX /= neighbors.size;
    averageY /= neighbors.size;

    return {
      ...point,
      x: point.x + lambda * (averageX - point.x),
      y: point.y + lambda * (averageY - point.y),
    };
  });
}
