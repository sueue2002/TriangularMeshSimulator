# Triangular Mesh Smoothing

A browser-based teaching app for exploring triangular mesh generation and Uniform Laplacian Smoothing.

## Usage

Open the app in a browser, then use the canvas and controls:

- Click empty canvas space to add a vertex.
- Drag a vertex to move it.
- Press **Smooth 1 Step** to apply one Uniform Laplacian Smoothing step.
- Adjust **lambda** to change the smoothing strength.
- Toggle **Fix boundary vertices** to keep convex-hull vertices fixed during smoothing.
- Watch the statistics panel for iteration count, vertex count, triangle count, and processing time.

The app automatically retriangulates the mesh after vertices are added, moved, or smoothed.

## About

This is a static Vite + TypeScript web app using Canvas for 2D rendering. It is intended as a small visual aid for learning how simple mesh smoothing changes vertex positions.
