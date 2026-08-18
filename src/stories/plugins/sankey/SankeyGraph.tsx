import { type ReactNode, useCallback, useMemo } from 'react';

import {
  createGraphyKit,
  defineGeomRenderer,
  GraphRenderer,
  type RenderHitTester,
  UnitSpaceSvg,
  useCompiledSelector,
} from '@graphysdk/react-renderer';
import type {
  CompiledGeom,
  CompiledLayer,
  Data,
  Dataset,
  GeomCompilerInput,
  IdentityKey,
  Observation,
  SpecInput,
} from '@graphysdk/viz-engine';
import {
  createDatasetFromKindPartitions,
  extractVariableName,
  Geom,
  getColor,
  readAuthoredNumber,
  readAuthoredString,
  toPercent,
} from '@graphysdk/viz-engine';

import { computeSankeyLayout } from './sankey-layout';

/** The compile/render column vocabulary — the shared `*_COLUMNS` handshake (ADR-039 decision 7). */
const SANKEY_COLUMNS = {
  kind: 'kind',
  markId: 'markId',
  label: 'label',
  value: 'value',
  // The geom's derived node identity (a node's own id, a flow's source id) — the field an author maps
  // `color` to, the engine's categorical scale keys on, à la ggalluvial's `after_stat(stratum)`.
  node: 'node',
  // A flow's target node id — its gradient end, read off the same colour scale render-side.
  targetKey: 'targetKey',
  // Node rect (unit space, top-left origin).
  x0: 'x0',
  y0: 'y0',
  x1: 'x1',
  y1: 'y1',
  // Flow ribbon endpoints (unit space): source right edge → target left edge.
  sx: 'sx',
  sy0: 'sy0',
  sy1: 'sy1',
  tx: 'tx',
  ty0: 'ty0',
  ty1: 'ty1',
} as const;

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

class SankeyGeom extends Geom<Record<string, never>> {
  readonly type = 'sankey';
  override readonly defaultParams = {};
  override readonly identityKey: IdentityKey = { variable: SANKEY_COLUMNS.markId };
  override readonly supportedCoordTypes = ['cartesian'] as const;
  override readonly highlightStrategy = null;
  // `source`/`target`/`value` are relational inputs the layout consumes (read straight from the mapped
  // columns, not scaled); `color` is author-mapped (no forced encoding), targeting the derived `node`.
  override readonly aesthetics = [
    { kind: 'data', name: 'source', required: true },
    { kind: 'data', name: 'target', required: true },
    { kind: 'data', name: 'value', required: true },
    { kind: 'visual', name: 'color' },
  ] as const;
  override readonly derivedVariables = ['node'] as const;
  override readonly tooltip = [
    { key: 'Name', aes: 'label' },
    { key: 'Value', aes: 'value' },
  ] as const;

  override readonly spatialKind = 'render-hit-test';

  compile({ data, mapping }: GeomCompilerInput): CompiledGeom {
    const sourceVar = extractVariableName(mapping.source);
    const targetVar = extractVariableName(mapping.target);
    const valueVar = extractVariableName(mapping.value);
    const sources = sourceVar ? data.getValues(sourceVar) : [];
    const targets = targetVar ? data.getValues(targetVar) : [];
    const values = valueVar ? data.getValues(valueVar) : [];

    const links: SankeyLink[] = [];
    for (let row = 0; row < sources.length; row += 1) {
      const source = sources[row];
      const target = targets[row];
      const value = values[row];
      if (typeof source === 'string' && typeof target === 'string' && typeof value === 'number') {
        links.push({ source, target, value });
      }
    }

    const { nodes, flows } = computeSankeyLayout(links);

    const table = createDatasetFromKindPartitions(
      [
        {
          kind: 'node',
          observations: nodes.map((node) => ({
            [SANKEY_COLUMNS.markId]: `node:${node.id}`,
            [SANKEY_COLUMNS.label]: node.id,
            [SANKEY_COLUMNS.value]: node.value,
            [SANKEY_COLUMNS.node]: node.id,
            [SANKEY_COLUMNS.x0]: node.x0,
            [SANKEY_COLUMNS.y0]: node.y0,
            [SANKEY_COLUMNS.x1]: node.x1,
            [SANKEY_COLUMNS.y1]: node.y1,
          })),
        },
        {
          kind: 'flow',
          observations: flows.map((flow) => ({
            [SANKEY_COLUMNS.markId]: flow.id,
            [SANKEY_COLUMNS.label]: `${flow.source} → ${flow.target}`,
            [SANKEY_COLUMNS.value]: flow.value,
            [SANKEY_COLUMNS.node]: flow.source,
            [SANKEY_COLUMNS.targetKey]: flow.target,
            [SANKEY_COLUMNS.sx]: flow.sx,
            [SANKEY_COLUMNS.sy0]: flow.sy0,
            [SANKEY_COLUMNS.sy1]: flow.sy1,
            [SANKEY_COLUMNS.tx]: flow.tx,
            [SANKEY_COLUMNS.ty0]: flow.ty0,
            [SANKEY_COLUMNS.ty1]: flow.ty1,
          })),
        },
      ],
      SANKEY_COLUMNS.kind
    );

    // Geometry stays in the geom's own columns, unscaled. The tooltip reads `label`/`value`. Colour is
    // NOT forced here: the author maps `color` to the derived `node` field (this geom emits it), and the
    // engine's categorical scale resolves it — the renderer reads a flow's target end off that same scale.
    return {
      data: table,
      mapping: {
        label: { variable: SANKEY_COLUMNS.label },
        value: { variable: SANKEY_COLUMNS.value },
      },
    };
  }
}

interface RenderNode {
  markId: string;
  label: string;
  value: number;
  /** The node's resolved fill, stamped by the engine's colour scale. */
  color: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface RenderFlow {
  markId: string;
  value: number;
  /** The flow's source-end fill (its own resolved colour); the target end is read off the colour scale. */
  sourceColor: string;
  /** The target node's identity, mapped to its colour via the compiled scale at paint time. */
  targetKey: string;
  sx: number;
  sy0: number;
  sy1: number;
  tx: number;
  ty0: number;
  ty1: number;
}

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

/**
 * The ribbon's top and bottom edge at a given easing factor — the single expression of the ribbon's
 * shape. The hit-test, the painted path, and the value label all derive their geometry from this, so
 * paint and hit-test stay structurally identical rather than three hand-copied interpolations.
 */
function ribbonEdges(flow: RenderFlow, ease: number): { yTop: number; yBottom: number } {
  return {
    yTop: flow.sy0 + (flow.ty0 - flow.sy0) * ease,
    yBottom: flow.sy1 + (flow.ty1 - flow.sy1) * ease,
  };
}

/**
 * Reads the compiled dataset back into node rects and flow ribbons (render-half inverse of the
 * `createDatasetFromKindPartitions` compile step) — one pass dispatching each observation on its `kind`.
 */
function readSankey(data: Dataset): { nodes: RenderNode[]; flows: RenderFlow[] } {
  const nodes: RenderNode[] = [];
  const flows: RenderFlow[] = [];

  for (const observation of data) {
    switch (readAuthoredString(observation, SANKEY_COLUMNS.kind)) {
      case 'node':
        nodes.push({
          markId: readAuthoredString(observation, SANKEY_COLUMNS.markId),
          label: readAuthoredString(observation, SANKEY_COLUMNS.label),
          value: readAuthoredNumber(observation, SANKEY_COLUMNS.value),
          color: getColor(observation) ?? FALLBACK_COLOR,
          x0: readAuthoredNumber(observation, SANKEY_COLUMNS.x0),
          y0: readAuthoredNumber(observation, SANKEY_COLUMNS.y0),
          x1: readAuthoredNumber(observation, SANKEY_COLUMNS.x1),
          y1: readAuthoredNumber(observation, SANKEY_COLUMNS.y1),
        });
        break;
      case 'flow':
        flows.push({
          markId: readAuthoredString(observation, SANKEY_COLUMNS.markId),
          value: readAuthoredNumber(observation, SANKEY_COLUMNS.value),
          sourceColor: getColor(observation) ?? FALLBACK_COLOR,
          targetKey: readAuthoredString(observation, SANKEY_COLUMNS.targetKey),
          sx: readAuthoredNumber(observation, SANKEY_COLUMNS.sx),
          sy0: readAuthoredNumber(observation, SANKEY_COLUMNS.sy0),
          sy1: readAuthoredNumber(observation, SANKEY_COLUMNS.sy1),
          tx: readAuthoredNumber(observation, SANKEY_COLUMNS.tx),
          ty0: readAuthoredNumber(observation, SANKEY_COLUMNS.ty0),
          ty1: readAuthoredNumber(observation, SANKEY_COLUMNS.ty1),
        });
        break;
    }
  }
  return { nodes, flows };
}

/**
 * Builds the cursor query over a node/flow layout — a node rect containment, then a flow ribbon
 * containment sampled with the same smoothstep the ribbon is painted with, so paint == hit-test. The
 * renderer memoizes this on `layer.data`, so the read above runs once per data change, not per move.
 */
function buildSankeyTester({ nodes, flows }: { nodes: RenderNode[]; flows: RenderFlow[] }): RenderHitTester {
  return (cursor) => {
    for (const node of nodes) {
      if (cursor.x >= node.x0 && cursor.x <= node.x1 && cursor.y >= node.y0 && cursor.y <= node.y1) {
        return { key: node.markId };
      }
    }
    for (const flow of flows) {
      // Bound by min/max so a backward or vertical ribbon (sx >= tx) stays hittable, not just sx < tx.
      if (cursor.x < Math.min(flow.sx, flow.tx) || cursor.x > Math.max(flow.sx, flow.tx)) continue;
      const span = flow.tx - flow.sx;
      const t = span === 0 ? 0 : (cursor.x - flow.sx) / span;
      const { yTop, yBottom } = ribbonEdges(flow, smoothstep(t));
      if (cursor.y >= yTop && cursor.y <= yBottom) return { key: flow.markId };
    }
    return null;
  };
}

const RIBBON_SAMPLES = 18;

/** Builds a filled ribbon path by sampling the same smoothstep the hit-test uses — paint == hit-test. */
function buildRibbonPath(flow: RenderFlow): string {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let step = 0; step <= RIBBON_SAMPLES; step += 1) {
    const t = step / RIBBON_SAMPLES;
    const x = flow.sx + (flow.tx - flow.sx) * t;
    const { yTop, yBottom } = ribbonEdges(flow, smoothstep(t));
    top.push(`${x},${yTop}`);
    bottom.push(`${x},${yBottom}`);
  }
  bottom.reverse();
  return `M${top.join('L')}L${bottom.join('L')}Z`;
}

const LABEL_DARK = '#1f2933';
const LABEL_LIGHT = '#ffffff';
/** Fill used only if the colour scale is somehow absent — every mark is otherwise scale-coloured. */
const FALLBACK_COLOR = '#888888';
/** Left padding (px) of the in-node label from the block's left edge. */
const NODE_LABEL_PAD = 10;
/** Minimum source-band height (unit fraction) a flow needs before its value label is worth drawing. */
const FLOW_LABEL_MIN_BAND = 0.028;
/** Fraction along the ribbon to sit the value label — past the source node's own label, clear of both ends. */
const FLOW_LABEL_T = 0.18;

interface UnitBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * A nested SVG viewport occupying a node's unit-space box, placed once in panel-relative percentages. Its
 * children live in the node's OWN coordinate space — `100%` fills the box, `50%` is its centre — and are
 * clipped to the box by the viewport (a nested SVG hides overflow by default, so no explicit `clipPath`).
 * The box carries no distorting scale (unlike a `preserveAspectRatio="none"` unit layer), so a rect fills
 * it exactly while glyphs keep their shape: the geometry is expressed here once and the fill and label reuse
 * it relatively, rather than each recomputing an absolute position.
 */
const TileSvg = ({ box, children }: { box: UnitBox; children: ReactNode }) => (
  <svg
    x={toPercent(box.x0)}
    y={toPercent(box.y0)}
    width={toPercent(box.x1 - box.x0)}
    height={toPercent(box.y1 - box.y0)}
    overflow="hidden"
    pointerEvents="none"
  >
    {children}
  </svg>
);

/** Picks dark or white label text for legibility on a node's fill, by relative luminance. */
function readableTextColor(fill: string): string {
  const hex = fill.replace('#', '');
  if (hex.length !== 6) return LABEL_DARK;
  const toLinear = (channel: number): number => {
    const ratio = channel / 255;
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
  };
  const red = toLinear(Number.parseInt(hex.slice(0, 2), 16));
  const green = toLinear(Number.parseInt(hex.slice(2, 4), 16));
  const blue = toLinear(Number.parseInt(hex.slice(4, 6), 16));
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance >= 0.3 ? LABEL_DARK : LABEL_LIGHT;
}

/**
 * Node name + total, drawn inside the block at the top-left with a contrast-aware fill. Positioned in the
 * node's own coordinate space (left pad in px, baselines stepped down), so text never stretches with the panel.
 */
const NodeLabel = ({ node, fill }: { node: RenderNode; fill: string }) => (
  <text textAnchor="start" fontSize={12} fill={readableTextColor(fill)}>
    <tspan x={NODE_LABEL_PAD} dy={18}>
      {node.label}
    </tspan>
    <tspan x={NODE_LABEL_PAD} dy="1.35em" fontWeight={700}>
      {node.value.toLocaleString()}
    </tspan>
  </text>
);

/** Flow value, centered on the ribbon a fraction in from the source (clear of node labels); culled when thin. */
const FlowLabel = ({ flow }: { flow: RenderFlow }) => {
  if (flow.sy1 - flow.sy0 < FLOW_LABEL_MIN_BAND) return null;
  const x = flow.sx + (flow.tx - flow.sx) * FLOW_LABEL_T;
  const { yTop, yBottom } = ribbonEdges(flow, smoothstep(FLOW_LABEL_T));
  return (
    <text
      x={toPercent(x)}
      y={toPercent((yTop + yBottom) / 2)}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={11}
      fill={LABEL_DARK}
      pointerEvents="none"
    >
      {flow.value.toLocaleString()}
    </text>
  );
};

/**
 * A node block plus its in-block label, both placed in the node's own viewport so the label never spills
 * into the flows or a neighbour (the viewport clips it) and stays undistorted. One component for the base
 * and hover paint, so the hover highlight redraws the node on top of itself instead of hiding it.
 */
const SankeyNode = ({ node, fill }: { node: RenderNode; fill: string }) => (
  <TileSvg box={node}>
    <rect width="100%" height="100%" fill={fill} />
    <NodeLabel node={node} fill={fill} />
  </TileSvg>
);

/**
 * A flow ribbon (path, unit space) plus its value label (pixel space). The ribbon fades from its source
 * node's colour to its target node's colour, so a flow reads as belonging to both ends. One component for
 * base + hover paint.
 */
const SankeyFlow = ({
  flow,
  sourceFill,
  targetFill,
  isHighlighted = false,
}: {
  flow: RenderFlow;
  sourceFill: string;
  targetFill: string;
  isHighlighted?: boolean;
}) => {
  const gradientId = `sankey-flow-grad:${flow.markId}${isHighlighted ? ':hover' : ''}`;
  return (
    <>
      <UnitSpaceSvg>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={sourceFill} />
            <stop offset="100%" stopColor={targetFill} />
          </linearGradient>
        </defs>
        <path d={buildRibbonPath(flow)} fill={`url(#${gradientId})`} fillOpacity={0.9} stroke="none" />
      </UnitSpaceSvg>
      <FlowLabel flow={flow} />
    </>
  );
};

/** Reads a node identity's colour off the compiled categorical colour scale (a flow's out-of-band end). */
function useColorFor(): (key: string) => string {
  const colorScale = useCompiledSelector((compiled) => compiled.scales.color);
  return useCallback((key: string) => (colorScale ? String(colorScale.map(key)) : FALLBACK_COLOR), [colorScale]);
}

const SankeyLayer = ({ layer }: { layer: CompiledLayer }) => {
  const { nodes, flows } = useMemo(() => readSankey(layer.data), [layer.data]);
  const colorFor = useColorFor();

  return (
    <>
      {flows.map((flow) => (
        <SankeyFlow key={flow.markId} flow={flow} sourceFill={flow.sourceColor} targetFill={colorFor(flow.targetKey)} />
      ))}
      {nodes.map((node) => (
        <SankeyNode key={node.markId} node={node} fill={node.color} />
      ))}
    </>
  );
};

const SankeyHighlight = ({ layer, observation }: { layer: CompiledLayer; observation: Observation }) => {
  const { nodes, flows } = useMemo(() => readSankey(layer.data), [layer.data]);
  const colorFor = useColorFor();
  const markId = readAuthoredString(observation, SANKEY_COLUMNS.markId);

  const node = nodes.find((candidate) => candidate.markId === markId);
  if (node) {
    return <SankeyNode node={node} fill={node.color} />;
  }

  const flow = flows.find((candidate) => candidate.markId === markId);
  if (flow) {
    return <SankeyFlow flow={flow} sourceFill={flow.sourceColor} targetFill={colorFor(flow.targetKey)} isHighlighted />;
  }
  return null;
};

export const kit = createGraphyKit({
  plugins: [
    defineGeomRenderer(new SankeyGeom(), {
      coord: 'cartesian',
      render: ({ layer }) => <SankeyLayer layer={layer} />,
      hitTest: ({ layer }) => buildSankeyTester(readSankey(layer.data)),
      renderHover: ({ layer, primary }) => <SankeyHighlight layer={layer} observation={primary.observation} />,
      renderHoverCompanions: () => null,
    }),
  ],
});

export const SankeyGraph = ({ input, data }: { input: SpecInput; data: Data }) => {
  return (
    <kit.GraphProvider input={input} data={data}>
      <GraphRenderer />
    </kit.GraphProvider>
  );
};
