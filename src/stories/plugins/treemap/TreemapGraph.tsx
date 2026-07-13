import { type ReactNode, useMemo } from 'react';

import {
  createGraphyKit,
  defineGeomRenderer,
  GraphRenderer,
  lightenCss,
  type RenderHitTester,
} from '@graphysdk/react-renderer';
import {
  type CompiledGeom,
  type CompiledLayer,
  type CompilerInput,
  type Data,
  type Dataset,
  type GeomCompilerInput,
  type IdentityKey,
  type Observation,
  toPercent,
} from '@graphysdk/viz-engine';
import {
  createDatasetFromKindPartitions,
  extractVariableName,
  Geom,
  getColor,
  readAuthoredNumber,
  readAuthoredString,
} from '@graphysdk/viz-engine';

import { computeTreemapLayout, type TreemapLeaf } from './treemap-layout';

/** The compile/render column vocabulary — the shared `*_COLUMNS` handshake (ADR-036 decision 7). */
const TREEMAP_COLUMNS = {
  kind: 'kind',
  markId: 'markId',
  group: 'group',
  label: 'label',
  value: 'value',
  shade: 'shade',
  x0: 'x0',
  y0: 'y0',
  x1: 'x1',
  y1: 'y1',
  headerY1: 'headerY1',
} as const;

/** Fill used only if the colour scale is somehow absent — every tile is otherwise scale-coloured. */
const FALLBACK_COLOR = '#888888';

interface TreemapParams {
  /** Gap between sibling leaf tiles, as a unit fraction. */
  padding: number;
  /** Inset around each group cell, as a unit fraction. */
  groupGap: number;
  /** Header band height reserved for a group's name, as a unit fraction. */
  groupHeader: number;
}

class TreemapGeom extends Geom<TreemapParams> {
  readonly type = 'treemap';
  override readonly defaultParams: TreemapParams = {
    padding: 0.004,
    groupGap: 0.008,
    groupHeader: 0.032,
  };
  override readonly identityKey: IdentityKey = { variable: TREEMAP_COLUMNS.markId };
  override readonly supportedCoordTypes = ['cartesian'] as const;
  override readonly highlightStrategy = null;
  // `label`/`value` are the hierarchy inputs the layout consumes (read straight from the mapped columns,
  // not scaled). `group` is a universal aesthetic — recognised without declaring — that the layout reads
  // when mapped; absent, the leaves form a single flat treemap. `color` is author-mapped (no forced
  // encoding) to `group`: a real input column carried to every group cell and leaf, so the engine's
  // categorical scale gives a group and its leaves one hue.
  override readonly aesthetics = [
    { kind: 'data', name: 'label', required: true },
    { kind: 'data', name: 'value', required: true },
    { kind: 'visual', name: 'color' },
  ] as const;
  override readonly tooltip = [
    { key: 'Item', aes: 'label' },
    { key: 'Value', aes: 'value' },
  ] as const;

  override readonly spatialKind = 'render-hit-test';

  compile({ data, params, mapping }: GeomCompilerInput): CompiledGeom {
    const resolved = { ...this.defaultParams, ...(params as Partial<TreemapParams>) };
    const leaves = readLeaves(data, mapping);
    const tiles = computeTreemapLayout(leaves, {
      padding: resolved.padding,
      groupGap: resolved.groupGap,
      groupHeader: resolved.groupHeader,
    });

    const table = createDatasetFromKindPartitions(
      [
        {
          kind: 'group',
          observations: tiles
            .filter((tile) => tile.kind === 'group')
            .map((tile) => ({
              [TREEMAP_COLUMNS.markId]: `group:${tile.group}`,
              [TREEMAP_COLUMNS.group]: tile.group,
              [TREEMAP_COLUMNS.label]: tile.label,
              [TREEMAP_COLUMNS.value]: tile.value,
              [TREEMAP_COLUMNS.shade]: tile.shade,
              [TREEMAP_COLUMNS.x0]: tile.x0,
              [TREEMAP_COLUMNS.y0]: tile.y0,
              [TREEMAP_COLUMNS.x1]: tile.x1,
              [TREEMAP_COLUMNS.y1]: tile.y1,
              [TREEMAP_COLUMNS.headerY1]: tile.headerY1,
            })),
        },
        {
          kind: 'leaf',
          observations: tiles
            .filter((tile) => tile.kind === 'leaf')
            .map((tile) => ({
              [TREEMAP_COLUMNS.markId]: `leaf:${tile.group}::${tile.label}`,
              [TREEMAP_COLUMNS.group]: tile.group,
              [TREEMAP_COLUMNS.label]: tile.label,
              [TREEMAP_COLUMNS.value]: tile.value,
              [TREEMAP_COLUMNS.shade]: tile.shade,
              [TREEMAP_COLUMNS.x0]: tile.x0,
              [TREEMAP_COLUMNS.y0]: tile.y0,
              [TREEMAP_COLUMNS.x1]: tile.x1,
              [TREEMAP_COLUMNS.y1]: tile.y1,
              [TREEMAP_COLUMNS.headerY1]: null,
            })),
        },
      ],
      TREEMAP_COLUMNS.kind
    );

    // Geometry stays in the geom's own columns, unscaled. The tooltip reads `label`/`value`. Colour is NOT
    // forced: the author maps `color` to `group` (carried on every tile), and the engine's categorical scale
    // resolves the base hue; the renderer lightens each leaf within it by `shade`.
    return {
      data: table,
      mapping: { label: { variable: TREEMAP_COLUMNS.label }, value: { variable: TREEMAP_COLUMNS.value } },
    };
  }
}

/** Zips the label/value (and optional group) columns into leaves, dropping rows missing a label or value. */
function readLeaves(data: Dataset, mapping: GeomCompilerInput['mapping']): TreemapLeaf[] {
  const groupVar = extractVariableName(mapping.group);
  const labelVar = extractVariableName(mapping.label);
  const valueVar = extractVariableName(mapping.value);
  // Read untyped and filter by `typeof` in the loop below, rather than the type-asserting `getValues`
  // overload: a present-but-wrong-typed mapping (e.g. `value` pointed at a categorical column) would
  // otherwise throw InternalError and surface an error panel, where this degrades to an empty chart.
  const groups = groupVar && data.hasVariable(groupVar) ? data.getValues(groupVar) : null;
  const labels = labelVar && data.hasVariable(labelVar) ? data.getValues(labelVar) : [];
  const values = valueVar && data.hasVariable(valueVar) ? data.getValues(valueVar) : [];

  const leaves: TreemapLeaf[] = [];
  for (let row = 0; row < labels.length; row += 1) {
    const label = labels[row];
    const value = values[row];
    if (typeof label !== 'string' || typeof value !== 'number') continue;
    const group = groups?.[row];
    leaves.push({ group: typeof group === 'string' ? group : '', label, value });
  }
  return leaves;
}

interface RenderTile {
  markId: string;
  kind: 'group' | 'leaf';
  label: string;
  value: number;
  /** The tile's base hue (its group's), stamped by the engine's colour scale. */
  color: string;
  shade: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Group only: bottom of the saturated header band (the band that carries the name + the hit). */
  headerY1: number;
}

/**
 * Reads the compiled dataset back into group cells and leaf tiles (render-half inverse of the
 * `createDatasetFromKindPartitions` compile step) — one pass dispatching each observation on its `kind`.
 */
function readTiles(data: Dataset): { groups: RenderTile[]; leaves: RenderTile[] } {
  const groups: RenderTile[] = [];
  const leaves: RenderTile[] = [];
  const toTile = (observation: Observation, kind: 'group' | 'leaf'): RenderTile => ({
    markId: readAuthoredString(observation, TREEMAP_COLUMNS.markId),
    kind,
    label: readAuthoredString(observation, TREEMAP_COLUMNS.label),
    value: readAuthoredNumber(observation, TREEMAP_COLUMNS.value),
    color: getColor(observation) ?? FALLBACK_COLOR,
    shade: readAuthoredNumber(observation, TREEMAP_COLUMNS.shade),
    x0: readAuthoredNumber(observation, TREEMAP_COLUMNS.x0),
    y0: readAuthoredNumber(observation, TREEMAP_COLUMNS.y0),
    x1: readAuthoredNumber(observation, TREEMAP_COLUMNS.x1),
    y1: readAuthoredNumber(observation, TREEMAP_COLUMNS.y1),
    headerY1: readAuthoredNumber(observation, TREEMAP_COLUMNS.headerY1),
  });

  for (const observation of data) {
    switch (readAuthoredString(observation, TREEMAP_COLUMNS.kind)) {
      case 'group':
        groups.push(toTile(observation, 'group'));
        break;
      case 'leaf':
        leaves.push(toTile(observation, 'leaf'));
        break;
    }
  }
  return { groups, leaves };
}

/**
 * Builds the cursor query over the tiles — a leaf rect first (leaves sit inside their group), then a
 * group's header band (the only part of a group cell that takes the hit; its body is the leaves). The
 * renderer memoizes this on `layer.data`, so the read above runs once per data change, not per move.
 */
function buildTreemapTester({ groups, leaves }: { groups: RenderTile[]; leaves: RenderTile[] }): RenderHitTester {
  return (cursor) => {
    for (const leaf of leaves) {
      if (cursor.x >= leaf.x0 && cursor.x <= leaf.x1 && cursor.y >= leaf.y0 && cursor.y <= leaf.y1) {
        return { key: leaf.markId };
      }
    }
    for (const group of groups) {
      if (cursor.x >= group.x0 && cursor.x <= group.x1 && cursor.y >= group.y0 && cursor.y <= group.headerY1) {
        return { key: group.markId };
      }
    }
    return null;
  };
}

/** A leaf reads as its group's hue, lightened for smaller values; a group reads as the saturated hue. */
function tileFill(tile: RenderTile): string {
  return tile.kind === 'group' ? tile.color : lightenCss(tile.color, (1 - tile.shade) * 0.55);
}

// Unit-fraction thresholds for label culling — proportional to the panel, so they adapt under resize.
const GROUP_LABEL_MIN_WIDTH = 0.05;
const LEAF_LABEL_MIN_WIDTH = 0.045;
const LEAF_LABEL_MIN_HEIGHT = 0.035;
const LEAF_VALUE_MIN_WIDTH = 0.07;
const LEAF_VALUE_MIN_HEIGHT = 0.08;

interface UnitBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * A nested SVG viewport occupying a tile's unit-space box, placed once in panel-relative percentages. Its
 * children live in the tile's OWN coordinate space — `100%` fills the box, `50%` is its centre — and are
 * clipped to the box by the viewport (a nested SVG hides overflow by default, so no explicit `clipPath`).
 * The box carries no distorting scale (unlike a `preserveAspectRatio="none"` unit layer), so a rect fills
 * it exactly while glyphs keep their shape: the geometry is expressed here once and the fill and label
 * reuse it relatively, rather than each recomputing an absolute position.
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

/** Group name, padded in from the band's left edge and vertically centered in it; white for contrast. */
const GroupLabel = ({ label }: { label: string }) => (
  <text x={5} y="50%" textAnchor="start" dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#fff">
    {label}
  </text>
);

function fitsLabel(width: number, height: number, minWidth: number, minHeight: number): boolean {
  return width >= minWidth && height >= minHeight;
}

/** Leaf label (name, plus value when the tile is large enough), centered in the tile, culled when small. */
const LeafLabel = ({ leaf }: { leaf: RenderTile }) => {
  const width = leaf.x1 - leaf.x0;
  const height = leaf.y1 - leaf.y0;
  if (!fitsLabel(width, height, LEAF_LABEL_MIN_WIDTH, LEAF_LABEL_MIN_HEIGHT)) return null;
  const showValue = fitsLabel(width, height, LEAF_VALUE_MIN_WIDTH, LEAF_VALUE_MIN_HEIGHT);
  return (
    <>
      <text
        x="50%"
        y="50%"
        dy={showValue ? -5 : 0}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fill="#1f2937"
      >
        {leaf.label}
      </text>
      {showValue && (
        <text
          x="50%"
          y="50%"
          dy={10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9.5}
          fill="rgba(31, 41, 55, 0.62)"
        >
          {leaf.value.toLocaleString()}
        </text>
      )}
    </>
  );
};

/**
 * A group cell: its saturated header band fills the band box, the group name clipped to it. The band box
 * doubles as the label's coordinate space, so the name positions relative to the band (left pad, vertical
 * centre) instead of against absolute panel coordinates. One component for base and hover paint.
 */
const TreemapGroupCell = ({ group }: { group: RenderTile }) => (
  <TileSvg box={{ x0: group.x0, y0: group.y0, x1: group.x1, y1: group.headerY1 }}>
    <rect width="100%" height="100%" fill={group.color} />
    {group.x1 - group.x0 >= GROUP_LABEL_MIN_WIDTH && <GroupLabel label={group.label} />}
  </TileSvg>
);

/**
 * A leaf tile: its rect fills the tile box and its name/value centre in it, clipped to the box so a label
 * never bleeds into a neighbour. One component for base and hover paint.
 */
const TreemapLeafTile = ({ leaf }: { leaf: RenderTile }) => (
  <TileSvg box={leaf}>
    <rect width="100%" height="100%" fill={tileFill(leaf)} />
    <LeafLabel leaf={leaf} />
  </TileSvg>
);

const TreemapLayer = ({ layer }: { layer: CompiledLayer }) => {
  const { groups, leaves } = useMemo(() => readTiles(layer.data), [layer.data]);

  return (
    <>
      {groups.map((group) => (
        <TreemapGroupCell key={group.markId} group={group} />
      ))}
      {leaves.map((leaf) => (
        <TreemapLeafTile key={leaf.markId} leaf={leaf} />
      ))}
    </>
  );
};

/** Outlines the hovered leaf tile or repaints the hovered group header band, above the base layer. */
const TreemapHighlight = ({ layer, observation }: { layer: CompiledLayer; observation: Observation }) => {
  const { groups, leaves } = useMemo(() => readTiles(layer.data), [layer.data]);
  const markId = readAuthoredString(observation, TREEMAP_COLUMNS.markId);

  const group = groups.find((candidate) => candidate.markId === markId);
  if (group) {
    return <TreemapGroupCell group={group} />;
  }

  const leaf = leaves.find((candidate) => candidate.markId === markId);
  if (leaf) {
    return <TreemapLeafTile leaf={leaf} />;
  }
  return null;
};

export const kit = createGraphyKit({
  plugins: [
    defineGeomRenderer(new TreemapGeom(), {
      coord: 'cartesian',
      render: ({ layer }) => <TreemapLayer layer={layer} />,
      hitTest: ({ layer }) => buildTreemapTester(readTiles(layer.data)),
      renderHover: ({ layer, primary }) => <TreemapHighlight layer={layer} observation={primary.observation} />,
      renderHoverCompanions: () => null,
    }),
  ],
});

export const TreemapGraph = ({ input, data }: { input: CompilerInput; data: Data }) => {
  return (
    <kit.GraphProvider input={input} data={data}>
      <GraphRenderer />
    </kit.GraphProvider>
  );
};
