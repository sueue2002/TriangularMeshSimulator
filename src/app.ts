import { CanvasRenderer } from "./canvasRenderer";
import { smoothUniformLaplacian } from "./smoothing";
import { triangulate } from "./triangulation";
import type { MeshStats, Point, Triangle } from "./types";

const DEFAULT_POINTS: Point[] = [
  { id: 0, x: 160, y: 140 },
  { id: 1, x: 360, y: 120 },
  { id: 2, x: 540, y: 190 },
  { id: 3, x: 220, y: 340 },
  { id: 4, x: 450, y: 360 },
];

export class MeshApp {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: CanvasRenderer;
  private readonly smoothButton: HTMLButtonElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly lambdaSlider: HTMLInputElement;
  private readonly lambdaValue: HTMLElement;
  private readonly fixBoundaryCheckbox: HTMLInputElement;
  private readonly statsValues: Record<keyof MeshStats, HTMLElement>;
  private points: Point[] = DEFAULT_POINTS.map((point) => ({ ...point }));
  private triangles: Triangle[] = triangulate(this.points);
  private iterations = 0;
  private processingTimeMs = 0;
  private nextId = DEFAULT_POINTS.length;
  private draggedVertexId: number | null = null;
  private hoveredVertexId: number | null = null;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="shell">
        <header class="header">
          <div>
            <p class="eyebrow">Mesh smoothing lab</p>
            <h1>Triangular Mesh Smoothing</h1>
          </div>
          <div class="hint">Click empty canvas space to add vertices. Drag vertices to reshape the mesh.</div>
        </header>

        <main class="layout">
          <section class="toolbar" aria-label="Mesh controls">
            <button class="primary-button" type="button" data-action="smooth">Smooth 1 Step</button>
            <label class="slider-control">
              <span>lambda <strong data-role="lambda-value">0.50</strong></span>
              <input data-role="lambda" type="range" min="0" max="1" step="0.05" value="0.5" />
            </label>
            <label class="check-control">
              <input data-role="fix-boundary" type="checkbox" checked />
              <span>Fix boundary vertices</span>
            </label>
            <button class="secondary-button" type="button" data-action="reset">Reset</button>
          </section>

          <section class="workspace" aria-label="Mesh canvas">
            <canvas data-role="canvas"></canvas>
          </section>

          <aside class="stats" aria-label="Mesh statistics">
            <div><span>Iterations</span><strong data-stat="iterations">0</strong></div>
            <div><span>Vertices</span><strong data-stat="vertices">0</strong></div>
            <div><span>Triangles</span><strong data-stat="triangles">0</strong></div>
            <div><span>Last time</span><strong data-stat="processingTimeMs">0.00 ms</strong></div>
          </aside>
        </main>
      </div>
    `;

    this.canvas = this.requireElement(root, "[data-role='canvas']", HTMLCanvasElement);
    this.renderer = new CanvasRenderer(this.canvas);
    this.smoothButton = this.requireElement(root, "[data-action='smooth']", HTMLButtonElement);
    this.resetButton = this.requireElement(root, "[data-action='reset']", HTMLButtonElement);
    this.lambdaSlider = this.requireElement(root, "[data-role='lambda']", HTMLInputElement);
    this.lambdaValue = this.requireElement(root, "[data-role='lambda-value']", HTMLElement);
    this.fixBoundaryCheckbox = this.requireElement(root, "[data-role='fix-boundary']", HTMLInputElement);
    this.statsValues = {
      iterations: this.requireElement(root, "[data-stat='iterations']", HTMLElement),
      vertices: this.requireElement(root, "[data-stat='vertices']", HTMLElement),
      triangles: this.requireElement(root, "[data-stat='triangles']", HTMLElement),
      processingTimeMs: this.requireElement(root, "[data-stat='processingTimeMs']", HTMLElement),
    };

    this.bindEvents();
    this.render();
  }

  private bindEvents(): void {
    this.smoothButton.addEventListener("click", () => this.smooth());
    this.resetButton.addEventListener("click", () => this.reset());
    this.lambdaSlider.addEventListener("input", () => {
      this.lambdaValue.textContent = this.lambda.toFixed(2);
    });
    this.fixBoundaryCheckbox.addEventListener("change", () => this.render());

    this.canvas.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    this.canvas.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    this.canvas.addEventListener("pointerup", () => this.stopDragging());
    this.canvas.addEventListener("pointercancel", () => this.stopDragging());
    window.addEventListener("resize", () => {
      this.renderer.resize();
      this.render();
    });
  }

  private handlePointerDown(event: PointerEvent): void {
    const canvasPoint = this.renderer.getCanvasPoint(event);
    const vertex = this.renderer.findVertexAt(this.points, canvasPoint);

    if (vertex) {
      this.draggedVertexId = vertex.id;
      this.canvas.setPointerCapture(event.pointerId);
    } else {
      this.points = [...this.points, { id: this.nextId, x: canvasPoint.x, y: canvasPoint.y }];
      this.nextId += 1;
      this.retriangulate();
    }

    this.render();
  }

  private handlePointerMove(event: PointerEvent): void {
    const canvasPoint = this.renderer.getCanvasPoint(event);

    if (this.draggedVertexId !== null) {
      this.points = this.points.map((point) =>
        point.id === this.draggedVertexId ? { ...point, x: canvasPoint.x, y: canvasPoint.y } : point,
      );
      this.retriangulate();
      this.render();
      return;
    }

    const hovered = this.renderer.findVertexAt(this.points, canvasPoint);
    const nextHoveredId = hovered?.id ?? null;

    if (nextHoveredId !== this.hoveredVertexId) {
      this.hoveredVertexId = nextHoveredId;
      this.render();
    }

    this.canvas.classList.toggle(
      "is-over-mesh",
      Boolean(hovered) || this.renderer.isNearMeshEdge(this.points, this.triangles, canvasPoint),
    );
  }

  private stopDragging(): void {
    this.draggedVertexId = null;
    this.render();
  }

  private smooth(): void {
    if (this.triangles.length === 0) {
      return;
    }

    const start = performance.now();
    this.points = smoothUniformLaplacian(this.points, this.triangles, this.lambda, this.fixBoundaryCheckbox.checked);
    this.retriangulate();
    this.processingTimeMs = performance.now() - start;
    this.iterations += 1;
    this.render();
  }

  private reset(): void {
    this.points = DEFAULT_POINTS.map((point) => ({ ...point }));
    this.nextId = DEFAULT_POINTS.length;
    this.iterations = 0;
    this.processingTimeMs = 0;
    this.draggedVertexId = null;
    this.hoveredVertexId = null;
    this.retriangulate();
    this.render();
  }

  private retriangulate(): void {
    this.triangles = triangulate(this.points);
  }

  private render(): void {
    this.renderer.render(this.points, this.triangles, {
      hoveredVertexId: this.hoveredVertexId,
      draggedVertexId: this.draggedVertexId,
      fixBoundary: this.fixBoundaryCheckbox.checked,
    });
    this.updateStats();
  }

  private updateStats(): void {
    this.statsValues.iterations.textContent = String(this.iterations);
    this.statsValues.vertices.textContent = String(this.points.length);
    this.statsValues.triangles.textContent = String(this.triangles.length);
    this.statsValues.processingTimeMs.textContent = `${this.processingTimeMs.toFixed(2)} ms`;
  }

  private get lambda(): number {
    return Number.parseFloat(this.lambdaSlider.value);
  }

  private requireElement<T extends HTMLElement>(
    root: HTMLElement,
    selector: string,
    constructor: new (...args: never[]) => T,
  ): T {
    const element = root.querySelector(selector);

    if (!(element instanceof constructor)) {
      throw new Error(`Required element was not found: ${selector}`);
    }

    return element;
  }
}
