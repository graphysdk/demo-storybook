import type { SankeyNode } from 'd3-sankey';
import { sankey as d3Sankey } from 'd3-sankey';

const NODE_WIDTH = 0.13;
const NODE_PAD = 0.02;

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface LaidOutNode {
  id: string;
  value: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface LaidOutFlow {
  id: string;
  source: string;
  target: string;
  value: number;
  sx: number;
  sy0: number;
  sy1: number;
  tx: number;
  ty0: number;
  ty1: number;
}

/** The extra node/link properties d3-sankey carries alongside the geometry it computes. */
type LayoutNode = { name: string };
type LayoutLink = { value: number };

/** d3-sankey swaps each link's string endpoints for the laid-out node objects during layout. */
const resolveEndpoint = (
  endpoint: number | string | SankeyNode<LayoutNode, LayoutLink>
): SankeyNode<LayoutNode, LayoutLink> => endpoint as SankeyNode<LayoutNode, LayoutLink>;

/**
 * Lays the sankey out in unit `[0, 1]` space (top-left origin) with d3-sankey's iterative
 * crossing-minimisation. The `[0, 1]` extent makes d3 emit coordinates directly in the frame the geom
 * paints and hit-tests in, so its output drops straight into the `SANKEY_COLUMNS` dataset. We read
 * only scalars out of d3's (mutated, circular) node/link objects, keeping the compiled spec serialisable.
 */
export function computeSankeyLayout(links: readonly SankeyLink[]): { nodes: LaidOutNode[]; flows: LaidOutFlow[] } {
  const nodeNames = [...new Set(links.flatMap((link) => [link.source, link.target]))];

  const layout = d3Sankey<LayoutNode, LayoutLink>()
    .nodeId((node) => node.name)
    .nodeWidth(NODE_WIDTH)
    .nodePadding(NODE_PAD)
    .extent([
      [0, 0],
      [1, 1],
    ]);

  const graph = layout({
    nodes: nodeNames.map((name) => ({ name })),
    links: links.map((link) => ({ ...link })),
  });

  const nodes: LaidOutNode[] = graph.nodes.map((node) => ({
    id: node.name,
    value: node.value ?? 0,
    x0: node.x0 ?? 0,
    y0: node.y0 ?? 0,
    x1: node.x1 ?? 0,
    y1: node.y1 ?? 0,
  }));

  // Each laid-out link already points at its endpoint nodes — read geometry straight off them.
  const flows: LaidOutFlow[] = graph.links.map((link, index) => {
    const source = resolveEndpoint(link.source);
    const target = resolveEndpoint(link.target);
    const half = (link.width ?? 0) / 2;
    const sourceY = link.y0 ?? 0;
    const targetY = link.y1 ?? 0;
    return {
      id: `flow:${source.name}->${target.name}#${index}`,
      source: source.name,
      target: target.name,
      value: link.value,
      sx: source.x1 ?? 0,
      sy0: sourceY - half,
      sy1: sourceY + half,
      tx: target.x0 ?? 0,
      ty0: targetY - half,
      ty1: targetY + half,
    };
  });

  return { nodes, flows };
}
