import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createGraphyKit,
  defineGeomRenderer,
  type GeomHoverPush,
  GraphRenderer,
  type ScreenRect,
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
import {
  createDatasetFromKindPartitions,
  extractVariableName,
  Geom,
  getColor,
  readAuthoredNumber,
  readAuthoredString,
} from '@graphysdk/viz-engine';

import { ALPHA_MIN, ForceSimulation, type SimEdge } from './force-layout';

/** The compile/render column vocabulary — the shared `*_COLUMNS` handshake (ADR-039 decision 7). */
const FORCE_COLUMNS = {
  kind: 'kind',
  markId: 'markId',
  label: 'label',
  value: 'value',
  // The geom's derived node identity — the field an author maps `color` to; the engine's categorical scale
  // keys on it. A node carries its own identity; an edge carries its source node's, so it inherits its hue.
  node: 'node',
  sourceIndex: 'sourceIndex',
  targetIndex: 'targetIndex',
} as const;

interface ForceDirectedParams {
  /** Repulsion magnitude between every node pair; larger spreads the graph wider. Consumed render-side. */
  chargeStrength: number;
  /** Spring rest length between linked nodes, as a fraction of the smaller panel side. Consumed render-side. */
  linkDistance: number;
}

interface InputEdge {
  source: string;
  target: string;
  value: number;
}

interface Topology {
  nodes: Array<{ name: string; value: number }>;
  edges: Array<{
    markId: string;
    label: string;
    value: number;
    node: string;
    sourceIndex: number;
    targetIndex: number;
  }>;
}

class ForceDirectedGeom extends Geom<ForceDirectedParams> {
  readonly type = 'forceDirected';
  override readonly defaultParams: ForceDirectedParams = {
    chargeStrength: 450,
    linkDistance: 0.22,
  };
  override readonly identityKey: IdentityKey = { variable: FORCE_COLUMNS.markId };
  override readonly supportedCoordTypes = ['cartesian'] as const;
  override readonly highlightStrategy = null;
  // `source`/`target`/`value` are relational inputs the topology consumes (read straight from the mapped
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

  // A live simulation: the compile half derives only the resolution-independent topology (nodes, weights)
  // and emits NO positions; the render half runs the simulation that turns it into moving geometry.
  compile({ data, mapping }: GeomCompilerInput): CompiledGeom {
    const topology = buildTopology(readEdges(data, mapping));

    const table = createDatasetFromKindPartitions(
      [
        {
          kind: 'node',
          observations: topology.nodes.map((node) => ({
            [FORCE_COLUMNS.markId]: `node:${node.name}`,
            [FORCE_COLUMNS.label]: node.name,
            [FORCE_COLUMNS.value]: node.value,
            [FORCE_COLUMNS.node]: node.name,
          })),
        },
        {
          kind: 'edge',
          observations: topology.edges.map((edge) => ({
            [FORCE_COLUMNS.markId]: edge.markId,
            [FORCE_COLUMNS.label]: edge.label,
            [FORCE_COLUMNS.value]: edge.value,
            [FORCE_COLUMNS.node]: edge.node,
            [FORCE_COLUMNS.sourceIndex]: edge.sourceIndex,
            [FORCE_COLUMNS.targetIndex]: edge.targetIndex,
          })),
        },
      ],
      FORCE_COLUMNS.kind
    );

    // Colour is NOT forced: the author maps `color` to the derived `node` field (a node carries its own
    // identity, an edge its source node's), and the engine's categorical scale resolves it per observation.
    return {
      data: table,
      mapping: { label: { variable: FORCE_COLUMNS.label }, value: { variable: FORCE_COLUMNS.value } },
    };
  }
}

/** Zips the source/target/value columns into edges, dropping rows with a missing field. */
function readEdges(data: Dataset, mapping: GeomCompilerInput['mapping']): InputEdge[] {
  const sourceVar = extractVariableName(mapping.source);
  const targetVar = extractVariableName(mapping.target);
  const valueVar = extractVariableName(mapping.value);
  const sources = sourceVar ? data.getValues(sourceVar) : [];
  const targets = targetVar ? data.getValues(targetVar) : [];
  const values = valueVar ? data.getValues(valueVar) : [];

  const edges: InputEdge[] = [];
  for (let row = 0; row < sources.length; row += 1) {
    const source = sources[row];
    const target = targets[row];
    const value = values[row];
    if (typeof source === 'string' && typeof target === 'string' && typeof value === 'number') {
      edges.push({ source, target, value });
    }
  }
  return edges;
}

/**
 * Derives nodes from the edge list (first-appearance order, so seeding is stable), sums each node's
 * incident edge weight as its size, and rewrites edges as index pairs into the node list. Each edge also
 * carries its source node's identity so it inherits that node's resolved colour.
 */
function buildTopology(edges: InputEdge[]): Topology {
  const indexByName = new Map<string, number>();
  const names: string[] = [];
  for (const edge of edges) {
    for (const name of [edge.source, edge.target]) {
      if (indexByName.has(name)) continue;
      indexByName.set(name, names.length);
      names.push(name);
    }
  }

  const weight = new Array<number>(names.length).fill(0);
  const outEdges: Topology['edges'] = [];
  edges.forEach((edge, index) => {
    const sourceIndex = indexByName.get(edge.source);
    const targetIndex = indexByName.get(edge.target);
    if (sourceIndex === undefined || targetIndex === undefined) return;
    weight[sourceIndex] = (weight[sourceIndex] ?? 0) + edge.value;
    weight[targetIndex] = (weight[targetIndex] ?? 0) + edge.value;
    outEdges.push({
      markId: `edge:${edge.source}->${edge.target}#${index}`,
      label: `${edge.source} → ${edge.target}`,
      value: edge.value,
      node: edge.source,
      sourceIndex,
      targetIndex,
    });
  });

  const nodes = names.map((name, index) => ({ name, value: weight[index] ?? 0 }));
  return { nodes, edges: outEdges };
}

const MIN_NODE_RADIUS = 6;
const MAX_NODE_RADIUS = 20;
const MIN_EDGE_WIDTH = 1.5;
const MAX_EDGE_WIDTH = 6;
const EDGE_HIT_WIDTH = 14;
/** Fill used only if the colour scale is somehow absent — every mark is otherwise scale-coloured. */
const FALLBACK_COLOR = '#888888';

interface GraphNode {
  markId: string;
  label: string;
  value: number;
  /** The node's resolved fill, stamped by the engine's colour scale. */
  color: string;
}

interface GraphEdge {
  markId: string;
  label: string;
  value: number;
  /** The edge's fill — its source node's resolved colour. */
  color: string;
  sourceIndex: number;
  targetIndex: number;
}

/** What the cursor is over, for the neighbourhood fade — the geom's own visual, distinct from the engine hover. */
interface FocusHover {
  kind: 'node' | 'edge';
  index: number;
}

/** The node and edge indices kept fully opaque under a hover; `null` means "no hover, everything active". */
interface Focus {
  nodes: Set<number> | null;
  edges: Set<number> | null;
}

/**
 * Splits the mixed node/edge dataset into the two mark sets the canvas paints, keyed by identity —
 * one pass dispatching each observation on its `kind` (render-half inverse of `createDatasetFromKindPartitions`).
 */
function partition(data: Dataset): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const observation of data) {
    switch (readAuthoredString(observation, FORCE_COLUMNS.kind)) {
      case 'node':
        nodes.push({
          markId: readAuthoredString(observation, FORCE_COLUMNS.markId),
          label: readAuthoredString(observation, FORCE_COLUMNS.label),
          value: readAuthoredNumber(observation, FORCE_COLUMNS.value),
          color: getColor(observation) ?? FALLBACK_COLOR,
        });
        break;
      case 'edge':
        edges.push({
          markId: readAuthoredString(observation, FORCE_COLUMNS.markId),
          label: readAuthoredString(observation, FORCE_COLUMNS.label),
          value: readAuthoredNumber(observation, FORCE_COLUMNS.value),
          color: getColor(observation) ?? FALLBACK_COLOR,
          sourceIndex: readAuthoredNumber(observation, FORCE_COLUMNS.sourceIndex),
          targetIndex: readAuthoredNumber(observation, FORCE_COLUMNS.targetIndex),
        });
        break;
    }
  }
  return { nodes, edges };
}

/**
 * Partitions the live topology and hands it to the canvas. Mounted by the renderer inside the overlay
 * portal (the L4 push path), so the screen-rect measurement, the portal, and the push wiring are the
 * renderer's job — this geom declares an overlay-hosted `render` and writes only the simulation.
 */
const ForceOverlay = ({
  layer,
  rect,
  pushHover,
}: {
  layer: CompiledLayer;
  rect: ScreenRect;
  pushHover: GeomHoverPush;
}) => {
  const { nodes, edges } = useMemo(() => partition(layer.data), [layer.data]);
  const params = layer.params as unknown as ForceDirectedParams;
  return <ForceCanvas rect={rect} pushHover={pushHover} nodes={nodes} edges={edges} params={params} />;
};

/**
 * The live canvas: an SVG fixed over the panel that runs the simulation and paints it each frame. The SVG
 * ignores pointer events; only the node circles and the invisible wide edge-hit lines capture them, so
 * gaps fall through to the chart below. Nodes paint after edges, so a node wins a pointer over the edges it
 * overlaps. Hover pushes through the `pushHover` the overlay supplies for the central tooltip; a local
 * `focusHover` state drives the neighbourhood fade (the geom's own visual).
 */
const ForceCanvas = ({
  rect,
  pushHover,
  nodes,
  edges,
  params,
}: {
  rect: ScreenRect;
  pushHover: GeomHoverPush;
  nodes: GraphNode[];
  edges: GraphEdge[];
  params: ForceDirectedParams;
}) => {
  const simRef = useRef<ForceSimulation | null>(null);
  const rafRef = useRef<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const rectRef = useRef(rect);
  rectRef.current = rect;

  const [, setFrame] = useState(0);
  const [focusHover, setFocusHover] = useState<FocusHover | null>(null);

  const runLoop = useCallback(() => {
    const sim = simRef.current;
    if (!sim) {
      rafRef.current = null;
      return;
    }
    sim.tick();
    setFrame((value) => value + 1);
    rafRef.current = sim.alpha > ALPHA_MIN || dragIndexRef.current !== null ? requestAnimationFrame(runLoop) : null;
  }, []);

  const ensureRunning = useCallback(() => {
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(runLoop);
  }, [runLoop]);

  // Build (or rebuild) the simulation when the topology or its tuning changes — never every frame.
  useEffect(() => {
    const simEdges: SimEdge[] = edges.map((edge) => ({ sourceIndex: edge.sourceIndex, targetIndex: edge.targetIndex }));
    const { width, height } = rectRef.current;
    simRef.current = new ForceSimulation(nodes.length, simEdges, {
      width,
      height,
      chargeStrength: params.chargeStrength,
      linkDistance: params.linkDistance * Math.min(width, height),
      margin: MAX_NODE_RADIUS + 2,
    });
    ensureRunning();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      // The rebuilt simulation has no active drag; clear the pin so the loop's
      // `dragIndexRef.current !== null` keep-alive can't spin forever if a topology change interrupts a
      // drag before `onLostPointerCapture` fires on the (now-replaced) node element.
      dragIndexRef.current = null;
    };
  }, [nodes, edges, params.chargeStrength, params.linkDistance, ensureRunning]);

  // Reflow into a resized panel without reseeding the layout.
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.resize(rect.width, rect.height);
    ensureRunning();
  }, [rect.width, rect.height, ensureRunning]);

  // Stable handlers (one per kind, not one per mark per frame) that read the mark index off the event
  // target's `data-index`, so the ~60fps frame ticks don't reallocate a closure for every node and edge.
  const handleNodePointerDown = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      event.currentTarget.setPointerCapture(event.pointerId);
      dragIndexRef.current = index;
      simRef.current?.startDrag(index, event.clientX - rectRef.current.left, event.clientY - rectRef.current.top);
      ensureRunning();
    },
    [ensureRunning]
  );

  const handleNodePointerMove = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      if (dragIndexRef.current === index) {
        simRef.current?.drag(index, event.clientX - rectRef.current.left, event.clientY - rectRef.current.top);
        ensureRunning();
      }
      setFocusHover({ kind: 'node', index });
      const node = nodes[index];
      if (node) pushHover(node.markId, { clientX: event.clientX, clientY: event.clientY });
    },
    [ensureRunning, nodes, pushHover]
  );

  // Pointer capture releases implicitly on pointerup/pointercancel, so ending the drag here also covers an
  // interrupted gesture (context menu, OS back-swipe, touch-cancel). Without it dragIndexRef would stay set
  // and the rAF loop would never stop (it keeps scheduling while a drag is "active").
  const handleNodeDragEnd = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      if (dragIndexRef.current === index) {
        simRef.current?.endDrag(index);
        dragIndexRef.current = null;
        ensureRunning();
      }
    },
    [ensureRunning]
  );

  const handleEdgePointerMove = useCallback(
    (event: ReactPointerEvent<SVGLineElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      setFocusHover({ kind: 'edge', index });
      const edge = edges[index];
      if (edge) pushHover(edge.markId, { clientX: event.clientX, clientY: event.clientY });
    },
    [edges, pushHover]
  );

  const clearHover = useCallback(() => {
    if (dragIndexRef.current === null) {
      setFocusHover(null);
      pushHover(null);
    }
  }, [pushHover]);

  const positions = simRef.current?.positions ?? [];
  // Memoized so the per-frame re-render (setFrame) doesn't re-spread the value arrays or rebuild the focus
  // Sets; only `positions` legitimately changes each frame.
  // Reduce, not `Math.max(1, ...values)`: a spread over a large graph overflows the call-argument limit.
  const maxNodeValue = useMemo(() => nodes.reduce((max, node) => Math.max(max, node.value), 1), [nodes]);
  const maxEdgeValue = useMemo(() => edges.reduce((max, edge) => Math.max(max, edge.value), 1), [edges]);
  const focus = useMemo(() => computeFocus(focusHover, edges), [focusHover, edges]);

  return (
    <svg width={rect.width} height={rect.height} style={{ pointerEvents: 'none', overflow: 'visible' }}>
      {edges.map((edge, index) => {
        const source = positions[edge.sourceIndex];
        const target = positions[edge.targetIndex];
        if (!source || !target) return null;
        const isActive = focus.edges ? focus.edges.has(index) : true;
        const color = edge.color;
        return (
          <g key={edge.markId}>
            <line
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={color}
              strokeWidth={edgeWidth(edge.value, maxEdgeValue)}
              strokeOpacity={isActive ? 0.55 : 0.08}
              strokeLinecap="round"
            />
            <line
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="transparent"
              strokeWidth={Math.max(edgeWidth(edge.value, maxEdgeValue), EDGE_HIT_WIDTH)}
              data-index={index}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onPointerMove={handleEdgePointerMove}
              onPointerLeave={clearHover}
            />
          </g>
        );
      })}
      {nodes.map((node, index) => {
        const position = positions[index];
        if (!position) return null;
        const isActive = focus.nodes ? focus.nodes.has(index) : true;
        const isDragging = dragIndexRef.current === index;
        return (
          <circle
            key={node.markId}
            data-index={index}
            cx={position.x}
            cy={position.y}
            r={nodeRadius(node.value, maxNodeValue)}
            fill={node.color}
            fillOpacity={isActive ? 1 : 0.2}
            stroke="#fff"
            strokeWidth={1.5}
            strokeOpacity={isActive ? 1 : 0.2}
            style={{ pointerEvents: 'all', cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={handleNodePointerDown}
            onPointerMove={handleNodePointerMove}
            onLostPointerCapture={handleNodeDragEnd}
            onPointerLeave={clearHover}
          />
        );
      })}
      {nodes.map((node, index) => {
        const position = positions[index];
        if (!position) return null;
        const isActive = focus.nodes ? focus.nodes.has(index) : true;
        return (
          <text
            key={`label:${node.markId}`}
            x={position.x}
            y={position.y - nodeRadius(node.value, maxNodeValue) - 4}
            textAnchor="middle"
            fontSize={11}
            fill="#333"
            fillOpacity={isActive ? 1 : 0.25}
            pointerEvents="none"
          >
            {node.label}
          </text>
        );
      })}
    </svg>
  );
};

/** Resolves which nodes and edges stay opaque under the current hover (its neighbourhood). */
function computeFocus(hover: FocusHover | null, edges: GraphEdge[]): Focus {
  if (!hover) return { nodes: null, edges: null };
  const activeNodes = new Set<number>();
  const activeEdges = new Set<number>();

  if (hover.kind === 'node') {
    activeNodes.add(hover.index);
    edges.forEach((edge, index) => {
      if (edge.sourceIndex !== hover.index && edge.targetIndex !== hover.index) return;
      activeEdges.add(index);
      activeNodes.add(edge.sourceIndex);
      activeNodes.add(edge.targetIndex);
    });
  } else {
    activeEdges.add(hover.index);
    const edge = edges[hover.index];
    if (edge) {
      activeNodes.add(edge.sourceIndex);
      activeNodes.add(edge.targetIndex);
    }
  }

  return { nodes: activeNodes, edges: activeEdges };
}

// Clamp the value/max ratio to [0, 1] before scaling: a negative input weight (a negative edge value
// summed into a node) would otherwise drive `Math.sqrt` to NaN and vanish the mark with no error.
function nodeRadius(value: number, maxValue: number): number {
  const ratio = Math.min(1, Math.max(0, value / maxValue));
  return MIN_NODE_RADIUS + Math.sqrt(ratio) * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);
}

function edgeWidth(value: number, maxValue: number): number {
  const ratio = Math.min(1, Math.max(0, value / maxValue));
  return MIN_EDGE_WIDTH + ratio * (MAX_EDGE_WIDTH - MIN_EDGE_WIDTH);
}

export const kit = createGraphyKit({
  plugins: [
    defineGeomRenderer(new ForceDirectedGeom(), {
      coord: 'cartesian',
      // The live, draggable simulation must own its pointer events, so `render` is overlay-hosted: the
      // renderer mounts it in a screen portal above the capture layer and supplies `overlay`. The central
      // hover layer contributes nothing; the tooltip is driven through the push path the overlay supplies.
      render: {
        fn: ({ layer, overlay }) => (
          <ForceOverlay layer={layer} rect={overlay.panelRect} pushHover={overlay.pushHover} />
        ),
        options: { overlay: true },
      },
      renderHover: () => null,
      renderHoverCompanions: () => null,
    }),
  ],
});

export const ForceDirectedGraph = ({ input, data }: { input: SpecInput; data: Data }) => {
  return (
    <kit.GraphProvider input={input} data={data}>
      <GraphRenderer />
    </kit.GraphProvider>
  );
};
