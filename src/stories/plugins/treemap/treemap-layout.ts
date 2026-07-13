/**
 * A two-level treemap, computed in unit `[0, 1]` space with `y = 0` at the top (screen-natural — a
 * treemap shares no axis with anything else). This is the layout algorithm a custom layout geom owns:
 * geometry comes from the algorithm over the whole dataset, not from positional scales. Kept free of any
 * Graphy import so it is trivially testable and the geom half only has to marshal data in and columns out.
 *
 * The tiling is d3-hierarchy's `treemapSquarify` (Bruls–Huizing–van Wijk): leaves are grouped by their
 * `group`, the groups squarified across the panel, and each group's leaves squarified into that group's
 * cell below a reserved header band (`paddingTop`). The `[0, 1]` size makes d3 emit coordinates directly
 * in the frame the geom paints and hit-tests in. A single distinct group degrades to a flat treemap
 * (leaves hang straight off the root, no header). Tiles read squarest when the panel is square; the
 * renderer's non-uniform `[0,1] → panel` stretch skews them with the panel's aspect ratio — the trade a
 * unit-space layout accepts in exchange for resolution independence.
 */
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';

/** One leaf of the hierarchy. Input observations are leaves; the group is their parent. */
export interface TreemapLeaf {
  group: string;
  label: string;
  value: number;
}

export interface TreemapLayoutParams {
  /** Gap between sibling leaf tiles, as a unit fraction. */
  padding: number;
  /** Inset around each group cell, as a unit fraction, so neighbouring groups stay visually separate. */
  groupGap: number;
  /** Height reserved at the top of a group cell for its name, as a unit fraction. */
  groupHeader: number;
}

/**
 * A laid-out tile in unit space. A `group` tile is a header-bearing cell containing leaves; a `leaf`
 * tile is a single rectangle whose area is proportional to its value. `shade` varies a leaf's lightness
 * within its group's hue (`0` for a group tile); the hue itself comes from the engine's colour scale.
 */
export interface LaidOutTile {
  kind: 'group' | 'leaf';
  group: string;
  label: string;
  value: number;
  shade: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Bottom edge of a group's header band; `null` for a leaf. */
  headerY1: number | null;
}

interface GroupAggregate {
  name: string;
  value: number;
  leaves: TreemapLeaf[];
}

/** The hierarchy d3 lays out: internal nodes carry no value, leaves carry theirs; both carry presentation. */
interface TreeDatum {
  group: string;
  label: string;
  value: number;
  children?: TreeDatum[];
}

/**
 * Lays out a treemap from a flat list of leaves. Groups are squarified across the full unit square by
 * total value; each group's leaves are then squarified into that group's content rect (the cell inset by
 * `groupGap`, with `groupHeader` reserved for the name). Both levels are placed in descending value order,
 * which is what gives the squarify pass its near-square tiles.
 */
export function computeTreemapLayout(leaves: TreemapLeaf[], params: TreemapLayoutParams): LaidOutTile[] {
  const groups = aggregateGroups(leaves);
  if (groups.length === 0) return [];
  const isFlat = groups.length <= 1;

  const root = hierarchy<TreeDatum>(buildHierarchy(groups, isFlat))
    .sum((datum) => datum.value)
    .sort((left, right) => (right.value ?? 0) - (left.value ?? 0));

  const laidRoot = treemap<TreeDatum>()
    .size([1, 1])
    .tile(treemapSquarify)
    .paddingOuter((node) => (node.depth === 0 ? params.groupGap : 0))
    .paddingInner((node) => (node.depth === 0 && !isFlat ? params.groupGap * 2 : params.padding))
    .paddingTop((node) => (node.depth === 1 && !isFlat ? params.groupHeader : 0))(root);

  // Reduce, not `Math.max(...leaves)`: a spread over a very large group overflows the call-argument limit.
  const maxValueByGroup = new Map(
    groups.map((group) => [group.name, group.leaves.reduce((max, leaf) => Math.max(max, leaf.value), 0)])
  );

  const tiles: LaidOutTile[] = [];
  laidRoot.each((node) => {
    if (node.depth === 1 && !isFlat) {
      const headerHeight = Math.min(params.groupHeader, node.y1 - node.y0);
      tiles.push({
        kind: 'group',
        group: node.data.group,
        label: node.data.label,
        value: node.value ?? 0,
        shade: 0,
        x0: node.x0,
        y0: node.y0,
        x1: node.x1,
        y1: node.y1,
        headerY1: node.y0 + headerHeight,
      });
    } else if (!node.children) {
      tiles.push({
        kind: 'leaf',
        group: node.data.group,
        label: node.data.label,
        value: node.data.value,
        shade: shadeFor(node.data.value, maxValueByGroup.get(node.data.group) ?? 0),
        x0: node.x0,
        y0: node.y0,
        x1: node.x1,
        y1: node.y1,
        headerY1: null,
      });
    }
  });

  return tiles;
}

/**
 * Folds leaves into groups in first-appearance order, then sorts groups (and the leaves within each) by
 * descending value — the order the squarify pass wants and the order a group's palette hue is assigned in.
 */
function aggregateGroups(leaves: TreemapLeaf[]): GroupAggregate[] {
  const groups: GroupAggregate[] = [];
  const indexByName = new Map<string, number>();

  for (const leaf of leaves) {
    const existing = indexByName.get(leaf.group);
    if (existing === undefined) {
      indexByName.set(leaf.group, groups.length);
      groups.push({ name: leaf.group, value: leaf.value, leaves: [leaf] });
    } else {
      const group = groups[existing];
      if (group) {
        group.value += leaf.value;
        group.leaves.push(leaf);
      }
    }
  }

  groups.sort((left, right) => right.value - left.value);
  for (const group of groups) {
    group.leaves.sort((left, right) => right.value - left.value);
  }
  return groups;
}

/**
 * Builds the d3 hierarchy datum. A flat treemap skips the group level entirely — leaves hang straight off
 * the root with no header — so a lone group renders as a plain treemap. The group on each datum is what the
 * engine's colour scale keys on, so every tile in a group resolves to that group's hue.
 */
function buildHierarchy(groups: GroupAggregate[], isFlat: boolean): TreeDatum {
  const groupNodes = groups.map((group) => ({
    group: group.name,
    label: group.name,
    value: 0,
    children: group.leaves.map((leaf) => ({
      group: group.name,
      label: leaf.label,
      value: leaf.value,
    })),
  }));

  const children = isFlat ? (groupNodes[0]?.children ?? []) : groupNodes;
  return { group: '', label: '', value: 0, children };
}

/**
 * A leaf's lightness factor within its group's hue: larger leaves stay close to the base colour, smaller
 * leaves lighten. Clamped above `0.4` so even the smallest tile keeps enough colour to read.
 */
function shadeFor(value: number, maxValue: number): number {
  if (maxValue <= 0) return 1;
  return 0.4 + 0.6 * (value / maxValue);
}
