import { useMemo } from 'react';

import {
  createGraphyKit,
  defineGeomRenderer,
  GraphRenderer,
  type RenderHitTester,
  UnitSpaceSvg,
} from '@graphysdk/react-renderer';
import type {
  CompiledGeom,
  CompiledLayer,
  CompilerInput,
  Data,
  GeomCompilerInput,
  IdentityKey,
  Observation,
} from '@graphysdk/viz-engine';
import {
  Dataset,
  extractVariableName,
  Geom,
  getColor,
  readAuthoredNumber,
  readAuthoredString,
  toPercent,
} from '@graphysdk/viz-engine';

import { computeVoronoiLayout, type VoronoiPoint } from './voronoi-layout';

/** The compile/render column vocabulary — the shared `*_COLUMNS` handshake (ADR-036 decision 7). */
const VORONOI_COLUMNS = {
  markId: 'markId',
  siteX: 'siteX',
  siteY: 'siteY',
  /** Cell ring and neighbour indices ride as JSON strings — a columnar dataset stores scalars only. */
  cell: 'cell',
  neighbors: 'neighbors',
  label: 'label',
  category: 'category',
} as const;

/** Fill used only if the colour scale is somehow absent — every cell is otherwise scale-coloured. */
const FALLBACK_COLOR = '#888888';

interface VoronoiParams {
  /** Inset of the seed points from the panel edge, as a fraction of the box. */
  padding: number;
  /** Whether to overlay the Delaunay triangulation (the dual: an edge per adjacent pair of cells). */
  showDelaunay: boolean;
  /** Whether to draw each point's label next to its seed (off for dense clouds). */
  showLabels: boolean;
  /** Cell fill opacity; cell borders and seed dots paint at full strength over it. */
  fillOpacity: number;
}

interface VoronoiRecord {
  x: number;
  y: number;
  label: string;
  category: string;
}

class VoronoiGeom extends Geom<VoronoiParams> {
  readonly type = 'voronoi';

  override readonly defaultParams: VoronoiParams = {
    padding: 0.04,
    showDelaunay: true,
    showLabels: false,
    fillOpacity: 0.35,
  };

  override readonly identityKey: IdentityKey = { variable: VORONOI_COLUMNS.markId };

  override readonly supportedCoordTypes = ['cartesian'] as const;

  override readonly highlightStrategy = null;

  // `x`/`y`/`label`/`category` are the point-cloud inputs the layout consumes (read straight from the
  // mapped columns, not scaled). `color` is author-mapped (no forced encoding): a site is 1:1 with an
  // input row, so the author maps it to a real input column (e.g. `category`), which the engine's
  // categorical scale resolves per cell.
  override readonly aesthetics = [
    { kind: 'data', name: 'x', required: true },
    { kind: 'data', name: 'y', required: true },
    { kind: 'data', name: 'label' },
    { kind: 'data', name: 'category' },
    { kind: 'visual', name: 'color' },
  ] as const;

  override readonly tooltip = [
    { key: 'Name', aes: 'label' },
    { key: 'Group', aes: 'category' },
  ];

  override readonly spatialKind = 'render-hit-test';

  compile({ data, params, mapping }: GeomCompilerInput): CompiledGeom {
    const resolved = { ...this.defaultParams, ...(params as Partial<VoronoiParams>) };
    const records = readRecords(data, mapping);
    const cells = computeVoronoiLayout(
      records.map((record): VoronoiPoint => ({ x: record.x, y: record.y })),
      { padding: resolved.padding }
    );

    const markId: string[] = [];
    const siteX: number[] = [];
    const siteY: number[] = [];
    const cell: string[] = [];
    const neighbors: string[] = [];
    const label: string[] = [];
    const category: string[] = [];

    records.forEach((record, index) => {
      const computed = cells[index];
      if (!computed) return;
      markId.push(`site:${index}`);
      siteX.push(computed.siteX);
      siteY.push(computed.siteY);
      cell.push(JSON.stringify(computed.polygon));
      neighbors.push(JSON.stringify(computed.neighbors));
      label.push(record.label);
      category.push(record.category);
    });

    const table = new Dataset({
      [VORONOI_COLUMNS.markId]: { type: 'categorical', values: markId },
      [VORONOI_COLUMNS.siteX]: { type: 'numeric', values: siteX },
      [VORONOI_COLUMNS.siteY]: { type: 'numeric', values: siteY },
      [VORONOI_COLUMNS.cell]: { type: 'categorical', values: cell },
      [VORONOI_COLUMNS.neighbors]: { type: 'categorical', values: neighbors },
      [VORONOI_COLUMNS.label]: { type: 'categorical', values: label },
      [VORONOI_COLUMNS.category]: { type: 'categorical', values: category },
    });

    // Geometry stays in the geom's own columns, unscaled. The tooltip reads `label`/`category`. Colour is
    // NOT forced: the author maps `color` to `category` (carried through here), and the engine's categorical
    // scale resolves each cell's fill.
    return {
      data: table,
      mapping: { label: { variable: VORONOI_COLUMNS.label }, category: { variable: VORONOI_COLUMNS.category } },
    };
  }
}

/**
 * Zips the coordinate, label, and category columns into records, dropping rows with a missing coordinate.
 * Label falls back to a 1-based index; category to the empty string when its column is unmapped.
 */
function readRecords(data: Dataset, mapping: GeomCompilerInput['mapping']): VoronoiRecord[] {
  const xVar = extractVariableName(mapping.x);
  const yVar = extractVariableName(mapping.y);
  const labelVar = extractVariableName(mapping.label);
  const categoryVar = extractVariableName(mapping.category);
  // Read untyped and filter by `typeof` in the loop below, rather than the type-asserting `getValues`
  // overload: a present-but-wrong-typed mapping (e.g. `x` pointed at a categorical column) would otherwise
  // throw InternalError and surface an error panel, where this degrades to an empty chart like sankey/force.
  const xs = xVar && data.hasVariable(xVar) ? data.getValues(xVar) : [];
  const ys = yVar && data.hasVariable(yVar) ? data.getValues(yVar) : [];
  const labels = labelVar && data.hasVariable(labelVar) ? data.getValues(labelVar) : null;
  const categories = categoryVar && data.hasVariable(categoryVar) ? data.getValues(categoryVar) : null;

  const records: VoronoiRecord[] = [];
  for (let row = 0; row < xs.length; row += 1) {
    const x = xs[row];
    const y = ys[row];
    if (typeof x !== 'number' || typeof y !== 'number') continue;

    const rawCategory = categories?.[row];
    const rawLabel = labels?.[row];
    records.push({
      x,
      y,
      label: typeof rawLabel === 'string' ? rawLabel : String(records.length + 1),
      category: typeof rawCategory === 'string' ? rawCategory : '',
    });
  }
  return records;
}

interface RenderSite {
  markId: string;
  label: string;
  siteX: number;
  siteY: number;
  polygon: Array<[number, number]>;
  neighbors: number[];
  /** The cell's resolved fill, stamped by the engine's colour scale. */
  color: string;
}

function readSites(data: Dataset): RenderSite[] {
  const sites: RenderSite[] = [];
  for (const observation of data) {
    sites.push({
      markId: readAuthoredString(observation, VORONOI_COLUMNS.markId),
      label: readAuthoredString(observation, VORONOI_COLUMNS.label),
      siteX: readAuthoredNumber(observation, VORONOI_COLUMNS.siteX),
      siteY: readAuthoredNumber(observation, VORONOI_COLUMNS.siteY),
      polygon: parseGeometry<Array<[number, number]>>(observation, VORONOI_COLUMNS.cell, []),
      neighbors: parseGeometry<number[]>(observation, VORONOI_COLUMNS.neighbors, []),
      color: getColor(observation) ?? FALLBACK_COLOR,
    });
  }
  return sites;
}

/**
 * Builds the cursor query over the sites — the nearest site by squared distance is the cell under the
 * cursor, which arrives in the cells' own top-left `[0, 1]` frame, so the rule that defines a cell also
 * hit-tests it and never misses. The renderer memoizes this on `layer.data`, so the `JSON.parse` of every
 * cell polygon in the read above runs once per data change, not per cursor move.
 */
function buildVoronoiTester(sites: RenderSite[]): RenderHitTester {
  return (cursor) => {
    let nearestKey: string | null = null;
    let nearestDistance = Infinity;
    for (const site of sites) {
      const distance = (site.siteX - cursor.x) ** 2 + (site.siteY - cursor.y) ** 2;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestKey = site.markId;
      }
    }
    return nearestKey === null ? null : { key: nearestKey };
  };
}

/** A closed polygon path in unit space. */
function cellPath(polygon: Array<[number, number]>): string {
  const [head, ...tail] = polygon;
  if (!head) return '';
  return `M ${head[0]} ${head[1]} ${tail.map(([x, y]) => `L ${x} ${y}`).join(' ')} Z`;
}

function parseGeometry<T>(observation: Observation, key: string, fallback: T): T {
  const raw = observation[key];
  if (typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface DelaunayEdge {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The Delaunay triangulation (the Voronoi dual): one edge per adjacent pair, de-duplicated by index. */
function delaunayEdges(sites: RenderSite[]): DelaunayEdge[] {
  const edges: DelaunayEdge[] = [];
  sites.forEach((site, index) => {
    for (const neighbor of site.neighbors) {
      if (neighbor <= index) continue;
      const target = sites[neighbor];
      if (!target) continue;
      edges.push({ key: `${index}-${neighbor}`, x1: site.siteX, y1: site.siteY, x2: target.siteX, y2: target.siteY });
    }
  });
  return edges;
}

const VoronoiLayer = ({ layer }: { layer: CompiledLayer }) => {
  const params = layer.params as unknown as VoronoiParams;
  const sites = useMemo(() => readSites(layer.data), [layer.data]);

  // Memoized on the already-memoized `sites` so the dual edge list isn't re-derived on every render.
  const delaunayLines = useMemo(() => (params.showDelaunay ? delaunayEdges(sites) : []), [sites, params.showDelaunay]);

  return (
    <>
      <UnitSpaceSvg>
        {sites.map((site) => (
          <path
            key={site.markId}
            d={cellPath(site.polygon)}
            fill={site.color}
            fillOpacity={params.fillOpacity}
            stroke="#fff"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {delaunayLines.map((edge) => (
          <line
            key={edge.key}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="#1f2937"
            strokeOpacity={0.18}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </UnitSpaceSvg>
      {sites.map((site) => (
        <circle key={`dot:${site.markId}`} cx={toPercent(site.siteX)} cy={toPercent(site.siteY)} r={3} fill="#1f2937" />
      ))}
      {params.showLabels &&
        sites.map((site) => (
          <text
            key={`label:${site.markId}`}
            x={toPercent(site.siteX)}
            y={toPercent(site.siteY)}
            dx={6}
            dy={-6}
            fontSize={11}
            fill="#333"
            pointerEvents="none"
          >
            {site.label}
          </text>
        ))}
    </>
  );
};

/** Repaints the hovered cell brighter with a bold border, above the dimmed base layer, in unit space. */
const VoronoiHighlight = ({ observation }: { observation: Observation }) => {
  const polygon = parseGeometry<Array<[number, number]>>(observation, VORONOI_COLUMNS.cell, []);
  const fill = getColor(observation) ?? FALLBACK_COLOR;
  return (
    <UnitSpaceSvg>
      <path
        d={cellPath(polygon)}
        fill={fill}
        fillOpacity={0.7}
        stroke="#1f2937"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </UnitSpaceSvg>
  );
};

export const kit = createGraphyKit({
  plugins: [
    defineGeomRenderer(new VoronoiGeom(), {
      coord: 'cartesian',
      render: ({ layer }) => <VoronoiLayer layer={layer} />,
      hitTest: ({ layer }) => buildVoronoiTester(readSites(layer.data)),
      renderHover: ({ primary }) => <VoronoiHighlight observation={primary.observation} />,
      renderHoverCompanions: () => null,
    }),
  ],
});

export const VoronoiGraph = ({ input, data }: { input: CompilerInput; data: Data }) => {
  return (
    <kit.GraphProvider input={input} data={data}>
      <GraphRenderer />
    </kit.GraphProvider>
  );
};
