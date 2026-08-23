/** One observation to place: its index into the layer data, its scaled x in [0, 1], and resolved fill. */
export interface SwarmPoint {
  /** Row index into the compiled layer data — the `'index'` identity key the hit-test returns. */
  index: number;
  /** The engine-scaled x position in [0, 1] (the only coordinate the compiler can know). */
  x01: number;
  /** The point's resolved fill, stamped by the engine's categorical colour scale. */
  color: string;
}

/** A placed point in panel pixel space — a true circle the renderer paints and the tester queries. */
export interface PlacedPoint extends SwarmPoint {
  cx: number;
  cy: number;
}

const EPSILON = 1e-6;

/**
 * The beeswarm dodge: every point sits at its scaled x and is nudged off the centre line just far enough
 * to clear each already-placed neighbour by one collision diameter. The collision is a **pixel** property
 * — the radius is a fixed pixel count, so a point's clearance depends on the panel's pixel size — which is
 * why this runs render-side (ADR-039 L3), not in the DOM-free compiler that owns the scale-derived x.
 *
 * Points are placed left-to-right, so each only has to clear the neighbours already laid down in its
 * column (those within one diameter on x). For each, the candidate ys are the centre line plus the two
 * tangent ys of every near neighbour; the nearest-to-centre candidate that clears them all wins.
 */
export function computeSwarm(points: SwarmPoint[], width: number, height: number, radius: number): PlacedPoint[] {
  const baseline = height / 2;
  const diameter = radius * 2;
  const diameterSq = diameter * diameter;
  const ordered = points
    .map((point) => ({ ...point, cx: point.x01 * width }))
    .sort((left, right) => left.cx - right.cx);

  const placed: PlacedPoint[] = [];
  for (const point of ordered) {
    const neighbours = placed.filter((other) => Math.abs(other.cx - point.cx) < diameter);
    const cy = resolveCy(point.cx, baseline, height, radius, diameterSq, neighbours);
    placed.push({ ...point, cy });
  }
  return placed;
}

/** Finds the y nearest the centre line where a circle at `cx` clears every near neighbour. */
function resolveCy(
  cx: number,
  baseline: number,
  height: number,
  radius: number,
  diameterSq: number,
  neighbours: PlacedPoint[]
): number {
  if (neighbours.length === 0) return baseline;

  const candidates = [baseline];
  for (const neighbour of neighbours) {
    const dx = cx - neighbour.cx;
    const span = Math.sqrt(diameterSq - dx * dx);
    candidates.push(neighbour.cy + span, neighbour.cy - span);
  }

  let best = baseline;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const cy of candidates) {
    if (cy < radius || cy > height - radius) continue;
    const clears = neighbours.every((neighbour) => {
      const dx = cx - neighbour.cx;
      const dy = cy - neighbour.cy;
      return dx * dx + dy * dy >= diameterSq - EPSILON;
    });
    if (!clears) continue;
    const distance = Math.abs(cy - baseline);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = cy;
    }
  }
  return best;
}
