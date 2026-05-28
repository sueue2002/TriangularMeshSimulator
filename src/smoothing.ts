import { buildAdjacency, getBoundaryVertexIds } from "./geometry";
import type { MethodComparison, Point, SmoothingMethod, SmoothingResult, Triangle } from "./types";

export const SMOOTHING_METHOD_LABELS: Record<SmoothingMethod, string> = {
  "forward-euler": "Forward Euler",
  "backward-euler": "Backward Euler",
  cotangent: "Cotangent Laplacian",
};

export function smoothMesh(
  points: Point[],
  triangles: Triangle[],
  lambda: number,
  fixBoundary: boolean,
  method: SmoothingMethod,
): SmoothingResult {
  const start = performance.now();
  const nextPoints = applySmoothingMethod(points, triangles, lambda, fixBoundary, method);
  const processingTimeMs = performance.now() - start;
  const displacement = measureDisplacement(points, nextPoints);

  return {
    points: nextPoints,
    processingTimeMs,
    averageDisplacement: displacement.average,
    maxDisplacement: displacement.max,
  };
}

export function compareSmoothingMethods(
  points: Point[],
  triangles: Triangle[],
  lambda: number,
  fixBoundary: boolean,
): MethodComparison[] {
  const methods: SmoothingMethod[] = ["forward-euler", "backward-euler", "cotangent"];

  return methods.map((method) => {
    const result = smoothMesh(points, triangles, lambda, fixBoundary, method);

    return {
      method,
      label: SMOOTHING_METHOD_LABELS[method],
      processingTimeMs: result.processingTimeMs,
      averageDisplacement: result.averageDisplacement,
      maxDisplacement: result.maxDisplacement,
    };
  });
}

function applySmoothingMethod(
  points: Point[],
  triangles: Triangle[],
  lambda: number,
  fixBoundary: boolean,
  method: SmoothingMethod,
): Point[] {
  if (method === "backward-euler") {
    return smoothBackwardEuler(points, triangles, lambda, fixBoundary);
  }

  if (method === "cotangent") {
    return smoothCotangentLaplacian(points, triangles, lambda, fixBoundary);
  }

  return smoothForwardEuler(points, triangles, lambda, fixBoundary);
}

function smoothForwardEuler(points: Point[], triangles: Triangle[], lambda: number, fixBoundary: boolean): Point[] {
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

function smoothBackwardEuler(points: Point[], triangles: Triangle[], lambda: number, fixBoundary: boolean): Point[] {
  const adjacency = buildAdjacency(points.length, triangles);
  const boundaryIds = fixBoundary ? getBoundaryVertexIds(points) : new Set<number>();
  let estimate = points.map((point) => ({ ...point }));

  for (let iteration = 0; iteration < 16; iteration += 1) {
    estimate = estimate.map((point, index) => {
      const neighbors = adjacency.get(index);

      if (!neighbors || neighbors.size === 0 || boundaryIds.has(point.id)) {
        return { ...points[index] };
      }

      let averageX = 0;
      let averageY = 0;

      for (const neighborIndex of neighbors) {
        averageX += estimate[neighborIndex].x;
        averageY += estimate[neighborIndex].y;
      }

      averageX /= neighbors.size;
      averageY /= neighbors.size;

      return {
        ...point,
        x: (points[index].x + lambda * averageX) / (1 + lambda),
        y: (points[index].y + lambda * averageY) / (1 + lambda),
      };
    });
  }

  return estimate;
}

function smoothCotangentLaplacian(points: Point[], triangles: Triangle[], lambda: number, fixBoundary: boolean): Point[] {
  const weights = buildCotangentWeights(points, triangles);
  const adjacency = buildAdjacency(points.length, triangles);
  const boundaryIds = fixBoundary ? getBoundaryVertexIds(points) : new Set<number>();

  return points.map((point, index) => {
    const neighborWeights = weights.get(index);

    if (boundaryIds.has(point.id)) {
      return { ...point };
    }

    let weightSum = 0;
    let targetX = 0;
    let targetY = 0;

    for (const [neighborIndex, weight] of neighborWeights ?? []) {
      weightSum += weight;
      targetX += points[neighborIndex].x * weight;
      targetY += points[neighborIndex].y * weight;
    }

    if (weightSum <= 0) {
      const neighbors = adjacency.get(index);

      if (!neighbors || neighbors.size === 0) {
        return { ...point };
      }

      for (const neighborIndex of neighbors) {
        targetX += points[neighborIndex].x;
        targetY += points[neighborIndex].y;
      }

      weightSum = neighbors.size;
    }

    targetX /= weightSum;
    targetY /= weightSum;

    return {
      ...point,
      x: point.x + lambda * (targetX - point.x),
      y: point.y + lambda * (targetY - point.y),
    };
  });
}

function buildCotangentWeights(points: Point[], triangles: Triangle[]): Map<number, Map<number, number>> {
  const weights = new Map<number, Map<number, number>>();

  for (let i = 0; i < points.length; i += 1) {
    weights.set(i, new Map<number, number>());
  }

  for (const [a, b, c] of triangles) {
    addEdgeWeight(weights, a, b, cotangent(points[c], points[a], points[b]));
    addEdgeWeight(weights, b, c, cotangent(points[a], points[b], points[c]));
    addEdgeWeight(weights, c, a, cotangent(points[b], points[c], points[a]));
  }

  return weights;
}

function addEdgeWeight(weights: Map<number, Map<number, number>>, a: number, b: number, rawWeight: number): void {
  const weight = Math.max(0, rawWeight) * 0.5;

  if (!Number.isFinite(weight) || weight <= 0) {
    return;
  }

  weights.get(a)?.set(b, (weights.get(a)?.get(b) ?? 0) + weight);
  weights.get(b)?.set(a, (weights.get(b)?.get(a) ?? 0) + weight);
}

function cotangent(origin: Point, a: Point, b: Point): number {
  const ax = a.x - origin.x;
  const ay = a.y - origin.y;
  const bx = b.x - origin.x;
  const by = b.y - origin.y;
  const cross = ax * by - ay * bx;
  const dot = ax * bx + ay * by;

  if (Math.abs(cross) < 1e-9) {
    return 0;
  }

  return dot / Math.abs(cross);
}

function measureDisplacement(before: Point[], after: Point[]): { average: number; max: number } {
  if (before.length === 0) {
    return { average: 0, max: 0 };
  }

  let total = 0;
  let max = 0;

  for (let i = 0; i < before.length; i += 1) {
    const dx = after[i].x - before[i].x;
    const dy = after[i].y - before[i].y;
    const distance = Math.hypot(dx, dy);
    total += distance;
    max = Math.max(max, distance);
  }

  return { average: total / before.length, max };
}
