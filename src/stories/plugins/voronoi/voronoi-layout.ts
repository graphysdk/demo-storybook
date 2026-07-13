/**
 * The Voronoi layout: a tessellation computed over the whole point set, not derived from positional
 * scales. It runs in unit `[0, 1]` space inside the geom's compile half, so the compiled geometry rides
 * in the spec as plain data and inherits hover for free. Kept free of any Graphy import.
 *
 * The tessellation comes from d3-delaunay: the Delaunay triangulation's dual, clipped to the `[0, 1]`
 * panel box. Each site's cell is the locus of points whose nearest site is this one — precisely why the
 * render half can hit-test by nearest-site alone: the painted polygon and the spatial map are the same
 * function. `voronoi.neighbors(i)` reads the Delaunay adjacency straight off the diagram (cells sharing
 * an edge), giving the triangulation for free.
 */
import { Delaunay } from 'd3-delaunay';

export interface VoronoiPoint {
  x: number;
  y: number;
}

export interface VoronoiCell {
  /** Seed-site position, normalised into the padded `[0, 1]` box. */
  siteX: number;
  siteY: number;
  /** The cell ring in `[0, 1]` unit space (no closing duplicate vertex). */
  polygon: Array<[number, number]>;
  /** Indices of the Delaunay-adjacent sites (cells that share an edge with this one). */
  neighbors: number[];
}

type Vertex = [number, number];

const EPSILON = 1e-12;

export function computeVoronoiLayout(points: VoronoiPoint[], options: { padding: number }): VoronoiCell[] {
  const sites = normalizeSites(points, options.padding);
  const voronoi = Delaunay.from(sites).voronoi([0, 0, 1, 1]);

  return sites.map((site, index) => {
    // d3 types cellPolygon as non-null, but it returns null for a degenerate (e.g. coincident) site.
    const ring = voronoi.cellPolygon(index) as Delaunay.Polygon | null;
    return {
      siteX: site[0],
      siteY: site[1],
      polygon: ring ? ring.slice(0, -1) : [],
      neighbors: [...voronoi.neighbors(index)],
    };
  });
}

/** Min–max normalises the raw points into a `[padding, 1 - padding]` box so cells fill the panel. */
function normalizeSites(points: VoronoiPoint[], padding: number): Vertex[] {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const span = 1 - 2 * padding;
  const project = (value: number, min: number, max: number): number =>
    max - min < EPSILON ? 0.5 : padding + ((value - min) / (max - min)) * span;

  // Reduce, not `Math.min(...xs)`: a spread over a large point cloud (the dense-cloud case this layout
  // is built for) overflows the call-argument limit and throws RangeError.
  const [minX, maxX] = extent(xs);
  const [minY, maxY] = extent(ys);

  return points.map((point) => [project(point.x, minX, maxX), project(point.y, minY, maxY)]);
}

/** Min/max of a list in a single pass — empty yields `[Infinity, -Infinity]`, which `project` treats as a degenerate span. */
function extent(values: number[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max];
}
