/**
 * A force-directed layout, run render-side as a live simulation. Where the sankey/treemap/voronoi layouts
 * are pure functions the geom evaluates once in unit space, a force layout settles frame by frame and
 * accepts node drags, so it has no resolution-independent form to precompute and lives in the render half.
 * Kept free of any Graphy import: the geom half marshals topology in, the plugin half drives the clock and
 * reads positions out.
 *
 * The physics is d3-force (charge + link springs + centring); this wrapper owns the panel-pixel concerns
 * d3 leaves to the caller — seeding around the panel centre, clamping nodes to the panel rect, pinning a
 * dragged node, and rescaling on resize — and drives `tick()` manually from the plugin's `requestAnimationFrame`
 * loop rather than d3's own timer.
 */
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationNodeDatum,
} from 'd3-force';

/** Alpha below which the system is at rest and the animation clock can stop. */
export const ALPHA_MIN = 0.005;

/** One edge as a pair of node indices into the node list. */
export interface SimEdge {
  sourceIndex: number;
  targetIndex: number;
}

export interface ForceLayoutOptions {
  width: number;
  height: number;
  /** Repulsion magnitude applied between every node pair; larger spreads the graph wider. */
  chargeStrength: number;
  /** Spring rest length between linked nodes, in pixels. */
  linkDistance: number;
  /** Distance from the panel edge nodes are clamped to, in pixels. */
  margin: number;
}

/** d3 mutates these in place: `x`/`y` are the live position, `fx`/`fy` pin a dragged node. */
interface SimNode extends SimulationNodeDatum {
  x: number;
  y: number;
}

/** d3's link record after binding: `source`/`target` start as indices and become node references. */
interface ForceLink {
  source: number | SimNode;
  target: number | SimNode;
}

const LINK_STRENGTH = 0.5;
const REHEAT_ALPHA = 0.5;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * A d3-force simulation steered manually. Owns its node array; callers read {@link positions} each frame
 * and steer drags through {@link startDrag}/{@link drag}/{@link endDrag}.
 */
export class ForceSimulation {
  private readonly simulation: Simulation<SimNode, ForceLink>;
  private readonly simNodes: SimNode[];
  private options: ForceLayoutOptions;

  constructor(nodeCount: number, edges: SimEdge[], options: ForceLayoutOptions) {
    this.options = options;
    this.simNodes = seedNodes(nodeCount, options.width, options.height);
    const links: ForceLink[] = edges.map((edge) => ({ source: edge.sourceIndex, target: edge.targetIndex }));
    this.simulation = forceSimulation<SimNode, ForceLink>(this.simNodes)
      .force('charge', forceManyBody().strength(-options.chargeStrength))
      .force('link', forceLink<SimNode, ForceLink>(links).distance(options.linkDistance).strength(LINK_STRENGTH))
      .force('center', forceCenter(options.width / 2, options.height / 2))
      .alphaMin(ALPHA_MIN)
      .stop();
  }

  get alpha(): number {
    return this.simulation.alpha();
  }

  /** Live node positions in panel pixels, read each frame by the plugin. */
  get positions(): ReadonlyArray<{ x: number; y: number }> {
    return this.simNodes;
  }

  /** Advances one frame, then clamps every free node back inside the panel. */
  tick(): void {
    this.simulation.tick();
    const { margin, width, height } = this.options;
    for (const node of this.simNodes) {
      node.x = clamp(node.x, margin, width - margin);
      node.y = clamp(node.y, margin, height - margin);
    }
  }

  /** Re-energises the system so it re-settles around a change (a grab or a resize). */
  reheat(): void {
    if (this.simulation.alpha() < REHEAT_ALPHA) this.simulation.alpha(REHEAT_ALPHA);
  }

  /** Pins the grabbed node to the cursor and reheats. */
  startDrag(index: number, x: number, y: number): void {
    this.pin(index, x, y);
    this.reheat();
  }

  /** Moves the pinned node with the cursor. */
  drag(index: number, x: number, y: number): void {
    this.pin(index, x, y);
    this.reheat();
  }

  /** Releases the pin so the node rejoins the free simulation. */
  endDrag(index: number): void {
    const node = this.simNodes[index];
    if (!node) return;
    node.fx = null;
    node.fy = null;
  }

  /** Rescales positions into a resized panel and reheats so the layout re-settles. */
  resize(width: number, height: number): void {
    const scaleX = this.options.width > 0 ? width / this.options.width : 1;
    const scaleY = this.options.height > 0 ? height / this.options.height : 1;
    for (const node of this.simNodes) {
      node.x *= scaleX;
      node.y *= scaleY;
      if (node.fx !== null && node.fx !== undefined) node.fx *= scaleX;
      if (node.fy !== null && node.fy !== undefined) node.fy *= scaleY;
    }

    // The link rest length was set as a fraction of the smaller panel side at build, so it must track the
    // panel on resize too — otherwise the springs keep pulling nodes toward the pre-resize spacing.
    const oldMinSide = Math.min(this.options.width, this.options.height);
    const nextMinSide = Math.min(width, height);
    const nextLinkDistance =
      oldMinSide > 0 ? (this.options.linkDistance * nextMinSide) / oldMinSide : this.options.linkDistance;
    const link = this.simulation.force('link') as ReturnType<typeof forceLink<SimNode, ForceLink>> | undefined;
    link?.distance(nextLinkDistance);

    this.options = { ...this.options, width, height, linkDistance: nextLinkDistance };
    const center = this.simulation.force('center') as ReturnType<typeof forceCenter> | undefined;
    center?.x(width / 2).y(height / 2);
    this.reheat();
  }

  private pin(index: number, x: number, y: number): void {
    const node = this.simNodes[index];
    if (!node) return;
    const { margin, width, height } = this.options;
    node.fx = clamp(x, margin, width - margin);
    node.fy = clamp(y, margin, height - margin);
  }
}

/** Seeds nodes on a phyllotaxis spiral around the panel centre, so the first tick is never degenerate. */
function seedNodes(count: number, width: number, height: number): SimNode[] {
  const centreX = width / 2;
  const centreY = height / 2;
  const initialRadius = Math.min(width, height) * 0.18;
  const nodes: SimNode[] = [];
  for (let index = 0; index < count; index += 1) {
    const radius = initialRadius * Math.sqrt(0.5 + index);
    const angle = index * GOLDEN_ANGLE;
    nodes.push({ x: centreX + radius * Math.cos(angle), y: centreY + radius * Math.sin(angle) });
  }
  return nodes;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}
