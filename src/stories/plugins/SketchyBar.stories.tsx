import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useMemo } from 'react';
import rough from 'roughjs';

import { defineGeomRenderer, GraphProvider, GraphRenderer } from '@graphysdk/react-renderer';
import type {
  CartesianCoordSystem,
  CompiledLayer,
  Data,
  MainAxis,
  Observation,
  Rect,
  SpecInput,
} from '@graphysdk/viz-engine';
import {
  createSpec,
  geom,
  getAlpha,
  getBarRectBounds,
  getColor,
  mapping,
  pipe,
  scale,
  transform,
} from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';

// The nominal square canvas the bars paint into; the browser stretches it to the panel via
// `preserveAspectRatio="none"`, so the renderer never needs the panel's pixel size. 100 (not 1) keeps
// rough.js's pixel-scale internals (wobble, hachure gap, ≈2-unit randomness) in their intuitive range.
const VIEWBOX_SIZE = 100;
const DEFAULT_INK = '#4e79a7';
// One shared generator — `toPaths` is stateless (produces path data, touches no DOM).
const generator = rough.generator();

type RoughPath = ReturnType<typeof generator.toPaths>[number];

interface BarStyle {
  strokeWidth: number;
  fillWeight: number;
  hachureGap: number;
}

const BASE_STYLE: BarStyle = { strokeWidth: 1.8, fillWeight: 1.2, hachureGap: 2.2 };
// Hover: a bolder outline and denser fill, drawn over the dimmed base bar so the focused one reads as
// inked-in. Sharing the base bar's seed keeps the heavier strokes registered to the bar underneath.
const HOVER_STYLE: BarStyle = { strokeWidth: 3.3, fillWeight: 2.4, hachureGap: 1.4 };

/** FNV-1a hash → a stable positive rough.js seed, so a bar's wobble is deterministic across re-render/hover. */
const hashSeed = (key: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2147483647 || 1;
};

// Seed derived from the bar's geometry — base paint and hover highlight independently compute the same
// one for the same observation, so the heavier hover wobble lands exactly over the base bar.
const rectSeed = (bounds: Rect): number => hashSeed(`${bounds.x}:${bounds.y}:${bounds.width}:${bounds.height}`);

/** rough.js path set for one normalized [0,1] bar rect, scaled into the nominal viewBox. */
const buildBarPaths = (bounds: Rect, color: string, style: BarStyle): RoughPath[] =>
  generator.toPaths(
    generator.rectangle(
      bounds.x * VIEWBOX_SIZE,
      bounds.y * VIEWBOX_SIZE,
      bounds.width * VIEWBOX_SIZE,
      bounds.height * VIEWBOX_SIZE,
      {
        seed: rectSeed(bounds),
        roughness: 0.8,
        bowing: 1.2,
        stroke: color,
        fill: color,
        fillStyle: 'hachure',
        ...style,
      }
    )
  );

/** The nominal-viewBox canvas every sketchy bar (and its hover overlay) paints into. */
const SketchyCanvas = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
    preserveAspectRatio="none"
    width="100%"
    height="100%"
    style={{ overflow: 'visible' }}
    data-geom="sketchy-bar"
  >
    {children}
  </svg>
);

const RoughPathSet = ({ paths }: { paths: RoughPath[] }) => (
  <>
    {paths.map((path, index) => (
      <path
        key={index}
        d={path.d}
        stroke={path.stroke}
        strokeWidth={path.strokeWidth}
        fill={path.fill ?? 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    ))}
  </>
);

interface SketchyBarsProps {
  layer: CompiledLayer;
  coordSystem: CartesianCoordSystem;
}

interface SketchyBar {
  key: number;
  opacity: number;
  paths: RoughPath[];
}

/**
 * A render-only override of the built-in `bar` geom, registered by name. It reuses the unchanged
 * built-in bar *compile* half (positions, stacking, scales, axes all come from the compiled layer) and
 * replaces only the *paint* half: each bar is drawn with [rough.js](https://roughjs.com) as a hand-drawn,
 * hachure-filled rectangle. This is the `defineGeomRenderer('bar', …)` path — no compile definition is
 * registered, so nothing about the geometry changes.
 *
 * The geom renderer receives normalized [0,1] bounds, so the bars paint into a nominal `VIEWBOX_SIZE`
 * square `<svg>` that the browser stretches to the panel. `vectorEffect="non-scaling-stroke"` keeps the
 * ink weight constant through that non-uniform stretch — no panel measurement needed.
 */
const SketchyBars = ({ layer, coordSystem }: SketchyBarsProps) => {
  const bars = useMemo<SketchyBar[]>(() => {
    const result: SketchyBar[] = [];
    let index = 0;
    for (const observation of layer.data) {
      const key = index;
      index += 1;
      const bounds = getBarRectBounds(coordSystem.mainAxis, observation);
      if (!bounds || bounds.width <= 0 || bounds.height <= 0) continue;

      const color = getColor(observation) ?? DEFAULT_INK;
      result.push({ key, opacity: getAlpha(observation) ?? 1, paths: buildBarPaths(bounds, color, BASE_STYLE) });
    }
    return result;
  }, [layer.data, coordSystem.mainAxis]);

  return (
    <SketchyCanvas>
      {bars.map((bar) => (
        <g key={bar.key} opacity={bar.opacity}>
          <RoughPathSet paths={bar.paths} />
        </g>
      ))}
    </SketchyCanvas>
  );
};

/** In-place hover highlight: the same bar redrawn bolder, registered via the shared rect seed. */
const SketchyBarHighlight = ({ observation, mainAxis }: { observation: Observation; mainAxis: MainAxis }) => {
  const bounds = getBarRectBounds(mainAxis, observation);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;

  const color = getColor(observation) ?? DEFAULT_INK;
  return (
    <SketchyCanvas>
      <RoughPathSet paths={buildBarPaths(bounds, color, HOVER_STYLE)} />
    </SketchyCanvas>
  );
};

const sketchyBar = defineGeomRenderer('bar', {
  coord: 'cartesian',
  guideMode: 'band',
  render: ({ layer, coordSystem }) => {
    if (coordSystem.type !== 'cartesian') return null;
    return <SketchyBars layer={layer} coordSystem={coordSystem} />;
  },
  renderHover: ({ primary, coordSystem }) => {
    if (coordSystem.type !== 'cartesian') return null;
    return <SketchyBarHighlight observation={primary.observation} mainAxis={coordSystem.mainAxis} />;
  },
  renderHoverCompanions: () => null,
});

const SketchyGraph = ({ data, spec }: { data: Data; spec: SpecInput }) => {
  return (
    <GraphProvider input={spec} data={data} plugins={[sketchyBar]}>
      <GraphRenderer />
    </GraphProvider>
  );
};

const meta: Meta = {
  title: 'Plugins/Sketchy Bar',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

const simpleData: Data = {
  columns: [{ key: 'category' }, { key: 'revenue' }],
  rows: [
    { category: 'Product A', revenue: 1200 },
    { category: 'Product B', revenue: 1800 },
    { category: 'Product C', revenue: 2400 },
    { category: 'Product D', revenue: 1600 },
    { category: 'Product E', revenue: 3200 },
    { category: 'Product F', revenue: 2800 },
  ],
};

export const Simple: Story = {
  render: () => (
    <SketchyGraph
      data={simpleData}
      spec={pipe(createSpec(), mapping({ x: 'category', y: 'revenue' }), geom.bar(), scale.x(), scale.y())}
    />
  ),
};

const multiSeriesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

export const Stacked: Story = {
  render: () => (
    <SketchyGraph
      data={multiSeriesData}
      spec={pipe(
        createSpec(),
        transform.reshape({
          keep: ['quarter'],
          reshape: ['North', 'South', 'West'],
          keyName: 'region',
          valueName: 'sales',
        }),
        mapping({ x: 'quarter', y: 'sales', color: 'region' }),
        geom.bar({ position: 'stack' }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
    />
  ),
};
