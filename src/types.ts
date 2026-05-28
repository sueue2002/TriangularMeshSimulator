export type Point = {
  id: number;
  x: number;
  y: number;
};

export type Triangle = [number, number, number];

export type SmoothingMethod = "forward-euler" | "backward-euler" | "cotangent";

export type SmoothingResult = {
  points: Point[];
  processingTimeMs: number;
  averageDisplacement: number;
  maxDisplacement: number;
};

export type MethodComparison = {
  method: SmoothingMethod;
  label: string;
  processingTimeMs: number;
  averageDisplacement: number;
  maxDisplacement: number;
};

export type MeshStats = {
  iterations: number;
  vertices: number;
  triangles: number;
  processingTimeMs: number;
};
