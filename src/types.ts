export type Point = {
  id: number;
  x: number;
  y: number;
};

export type Triangle = [number, number, number];

export type MeshStats = {
  iterations: number;
  vertices: number;
  triangles: number;
  processingTimeMs: number;
};
