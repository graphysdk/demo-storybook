import { useMemo } from 'react';

import {
  createGraphyKit,
  defineGeomRenderer,
  GraphRenderer,
  type RenderHitTester,
  useElementScreenRect,
  useGeomHitTest,
  useHoverState,
} from '@graphysdk/react-renderer';
import type {
  CompiledGeom,
  CompiledLayer,
  Data,
  Dataset,
  GeomCompilerInput,
  IdentityKey,
  SpecInput,
} from '@graphysdk/viz-engine';
import { Geom, getColor, getX } from '@graphysdk/viz-engine';

import { computeSwarm, type PlacedPoint, type SwarmPoint } from './beeswarm-layout';

/** Circle radius in pixels — the collision diameter the dodge clears. Small enough for a dense swarm. */
const POINT_RADIUS = 3.5;
/** Hover hit radius — a touch larger than the drawn dot so dense points stay easy to target. */
const POINT_HIT_RADIUS = POINT_RADIUS + 2;
/** Fill used only if the colour scale is somehow absent — every point is otherwise scale-coloured. */
const FALLBACK_COLOR = '#888888';

/**
 * A custom `beeswarm` geom — the ADR-039 **L3** reference. Its x is scale-derived (the engine trains the
 * value axis and the renderer reads the `[0, 1]` position), but its off-axis dodge is a browser-computed
 * **pixel-radius collision**: the geometry depends on the panel's pixel size, so it can't be precomputed
 * in the DOM-free compiler the way an L2 sankey/treemap can. The placed geometry therefore lives in
 * component state, and the geom registers its spatial query through the public `useGeomHitTest` hook (the
 * L3 escape hatch) rather than the declarative `hitTest` factory — the one spike that exercises that path.
 */
class BeeswarmGeom extends Geom {
  readonly type = 'beeswarm';
  override readonly defaultParams = {};
  override readonly identityKey: IdentityKey = 'index';
  override readonly supportedCoordTypes = ['cartesian'] as const;
  override readonly highlightStrategy = null;
  // Only x is a position the engine scales onto an axis; y is owned by the render-side dodge, so the geom
  // declares a single x role and no y mapping (the chart gets no y axis). `name` is a free `data` input
  // carried for the tooltip; `color` is author-mapped, so the engine's categorical scale assigns the hues.
  override readonly positionRoles = [{ axis: 'x', role: 'point', valueKind: 'value' }] as const;
  override readonly aesthetics = [
    { kind: 'data', name: 'name' },
    { kind: 'visual', name: 'color' },
  ] as const;
  override readonly tooltip = [
    { key: 'Name', aes: 'name' },
    { key: 'Group', aes: 'color' },
  ] as const;

  override readonly spatialKind = 'render-hit-test';

  // The engine scales x and trains the colour scale; the geom adds nothing to the data and injects no y —
  // the dodge is render-side. Passing the data through keeps row order, so the `'index'` identity the
  // hit-test returns lines up with the engine's `byKey` map.
  compile({ data }: GeomCompilerInput): CompiledGeom {
    return { data, mapping: {} };
  }
}

/** Reads each row's scaled x and resolved colour, preserving the row index as the identity key. */
function readPoints(data: Dataset): SwarmPoint[] {
  const points: SwarmPoint[] = [];
  let index = 0;
  for (const observation of data) {
    const x01 = getX(observation);
    if (x01 !== null) {
      points.push({ index, x01, color: getColor(observation) ?? FALLBACK_COLOR });
    }
    index += 1;
  }
  return points;
}

/** The cursor query over the placed circles — nearest-first from the top, so the drawn-last point wins. */
function buildSwarmTester(placed: PlacedPoint[], width: number, height: number, radius: number): RenderHitTester {
  const radiusSq = radius * radius;
  return (cursor) => {
    const px = cursor.x * width;
    const py = cursor.y * height;
    for (let index = placed.length - 1; index >= 0; index -= 1) {
      const point = placed[index];
      if (!point) continue;
      const dx = px - point.cx;
      const dy = py - point.cy;
      if (dx * dx + dy * dy <= radiusSq) return { key: String(point.index) };
    }
    return null;
  };
}

/**
 * Paints the swarm and owns its hover. The dodge needs the panel's pixel size, so it measures the panel
 * (`useElementScreenRect`), lays the circles out in pixel space — true circles, since the panel SVG's user
 * units are pixels — and registers the spatial query with `useGeomHitTest`. The hovered point is read
 * straight from the shared hover store and repainted on top, so the geom inherits the central tooltip and
 * needs no `renderHover` overlay.
 */
const BeeswarmLayer = ({ layer }: { layer: CompiledLayer }) => {
  const { measureRef, screenRect } = useElementScreenRect();
  const points = useMemo(() => readPoints(layer.data), [layer.data]);
  const placed = useMemo(
    () => (screenRect ? computeSwarm(points, screenRect.width, screenRect.height, POINT_RADIUS) : []),
    [points, screenRect]
  );
  const tester = useMemo<RenderHitTester>(
    () => (screenRect ? buildSwarmTester(placed, screenRect.width, screenRect.height, POINT_HIT_RADIUS) : () => null),
    [placed, screenRect]
  );
  useGeomHitTest(layer.id, tester);

  const hoveredIndex = useHoverState((state) =>
    state.hover.primary && state.hover.primary.layerId === layer.id ? state.hover.primary.pointIndex : null
  );
  const hovered = hoveredIndex === null ? null : (placed.find((point) => point.index === hoveredIndex) ?? null);

  return (
    <>
      <rect ref={measureRef} width="100%" height="100%" fill="transparent" pointerEvents="none" />
      {placed.map((point) => (
        <circle
          key={point.index}
          cx={point.cx}
          cy={point.cy}
          r={POINT_RADIUS}
          fill={point.color}
          stroke="#fff"
          strokeWidth={0.5}
        />
      ))}
      {hovered && (
        <circle
          cx={hovered.cx}
          cy={hovered.cy}
          r={POINT_RADIUS + 2}
          fill={hovered.color}
          stroke="#1f2937"
          strokeWidth={1.5}
        />
      )}
    </>
  );
};

export const kit = createGraphyKit({
  plugins: [
    defineGeomRenderer(new BeeswarmGeom(), {
      coord: 'cartesian',
      swatchShape: 'circle',
      // No `hitTest` factory: the dodge is computed render-side, so the tester is registered through the
      // `useGeomHitTest` hook inside the layer (the L3 escape hatch). Hover paint is inline, so renderHover
      // contributes nothing.
      render: ({ layer }) => <BeeswarmLayer layer={layer} />,
      renderHover: () => null,
      renderHoverCompanions: () => null,
    }),
  ],
});

export const BeeswarmGraph = ({ input, data }: { input: SpecInput; data: Data }) => {
  return (
    <kit.GraphProvider input={input} data={data}>
      <GraphRenderer />
    </kit.GraphProvider>
  );
};
