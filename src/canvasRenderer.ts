import { getBoundaryVertexIds, pointToSegmentDistanceSquared } from "./geometry";
import type { Point, Triangle } from "./types";

type RenderOptions = {
  hoveredVertexId: number | null;
  draggedVertexId: number | null;
  fixBoundary: boolean;
};

const HIT_RADIUS = 12;

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D;
  private pixelRatio = window.devicePixelRatio || 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("2D canvas context is not available.");
    }

    this.context = context;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(rect.width * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * this.pixelRatio));
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  render(points: Point[], triangles: Triangle[], options: RenderOptions): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const boundaryIds = options.fixBoundary ? getBoundaryVertexIds(points) : new Set<number>();

    this.context.clearRect(0, 0, width, height);
    this.drawBackground(width, height);
    this.drawTriangles(points, triangles);
    this.drawVertices(points, boundaryIds, options);
  }

  getCanvasPoint(event: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      id: -1,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  findVertexAt(points: Point[], target: Point): Point | null {
    let nearest: Point | null = null;
    let nearestDistance = HIT_RADIUS * HIT_RADIUS;

    for (const point of points) {
      const distance = (point.x - target.x) ** 2 + (point.y - target.y) ** 2;

      if (distance <= nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  isNearMeshEdge(points: Point[], triangles: Triangle[], target: Point): boolean {
    for (const [a, b, c] of triangles) {
      const edges = [
        [points[a], points[b]],
        [points[b], points[c]],
        [points[c], points[a]],
      ];

      if (edges.some(([start, end]) => pointToSegmentDistanceSquared(target, start, end) <= HIT_RADIUS * HIT_RADIUS)) {
        return true;
      }
    }

    return false;
  }

  private drawBackground(width: number, height: number): void {
    this.context.fillStyle = "#f8fafc";
    this.context.fillRect(0, 0, width, height);

    this.context.strokeStyle = "#e2e8f0";
    this.context.lineWidth = 1;

    for (let x = 0; x <= width; x += 32) {
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, height);
      this.context.stroke();
    }

    for (let y = 0; y <= height; y += 32) {
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(width, y);
      this.context.stroke();
    }
  }

  private drawTriangles(points: Point[], triangles: Triangle[]): void {
    for (const [a, b, c] of triangles) {
      this.context.beginPath();
      this.context.moveTo(points[a].x, points[a].y);
      this.context.lineTo(points[b].x, points[b].y);
      this.context.lineTo(points[c].x, points[c].y);
      this.context.closePath();
      this.context.fillStyle = "rgba(20, 184, 166, 0.10)";
      this.context.fill();
      this.context.strokeStyle = "#0f766e";
      this.context.lineWidth = 1.25;
      this.context.stroke();
    }
  }

  private drawVertices(points: Point[], boundaryIds: Set<number>, options: RenderOptions): void {
    for (const point of points) {
      const isActive = point.id === options.draggedVertexId || point.id === options.hoveredVertexId;
      const isBoundary = boundaryIds.has(point.id);

      this.context.beginPath();
      this.context.arc(point.x, point.y, isActive ? 7 : 5, 0, Math.PI * 2);
      this.context.fillStyle = isBoundary ? "#f97316" : "#2563eb";
      this.context.fill();
      this.context.strokeStyle = "#ffffff";
      this.context.lineWidth = 2;
      this.context.stroke();
    }
  }
}
