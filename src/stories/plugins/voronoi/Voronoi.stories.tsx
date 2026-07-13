import type { Meta, StoryObj } from '@storybook/react';

import { config, type Data } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';

import { kit, VoronoiGraph } from './VoronoiGraph';

const meta: Meta = {
  title: 'Plugins/Voronoi',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

// Coffee shops across a city grid, coloured by brand: each Voronoi cell is a shop's catchment area —
// the territory of points closer to it than to any rival. The classic "nearest facility" map.
const coffeeShops: Data = {
  columns: [{ key: 'x' }, { key: 'y' }, { key: 'label' }, { key: 'category' }],
  rows: [
    { x: 2, y: 8.5, label: 'Downtown', category: 'Bluebird' },
    { x: 8.4, y: 9, label: 'Harbor', category: 'Bluebird' },
    { x: 6.6, y: 1.4, label: 'South', category: 'Bluebird' },
    { x: 4.8, y: 5.6, label: 'Midtown', category: 'Roastery' },
    { x: 1.3, y: 3.8, label: 'West', category: 'Roastery' },
    { x: 9.2, y: 6.2, label: 'Heights', category: 'Roastery' },
    { x: 9.1, y: 2, label: 'Quay', category: 'Cup & Co' },
    { x: 3.7, y: 1.6, label: 'Park', category: 'Cup & Co' },
    { x: 5.2, y: 9.3, label: 'Garden', category: 'Cup & Co' },
  ],
};

// A 2-D embedding (think t-SNE/UMAP) of four clusters: the Voronoi makes the nearest-point hover regions
// visible, and the Delaunay overlay sketches the cluster adjacency graph. Deterministic placement (trig
// offsets, no randomness) so the layout is stable across renders.
const clusterCenters = [
  { name: 'Cluster A', cx: 26, cy: 70 },
  { name: 'Cluster B', cx: 72, cy: 76 },
  { name: 'Cluster C', cx: 78, cy: 28 },
  { name: 'Cluster D', cx: 30, cy: 30 },
];
const POINTS_PER_CLUSTER = 9;
const embedding: Data = {
  columns: [{ key: 'x' }, { key: 'y' }, { key: 'label' }, { key: 'category' }],
  rows: clusterCenters.flatMap((cluster, clusterIndex) =>
    Array.from({ length: POINTS_PER_CLUSTER }, (_unused, pointIndex) => {
      const angle = (pointIndex / POINTS_PER_CLUSTER) * Math.PI * 2 + clusterIndex;
      const radius = 6 + ((pointIndex * 7 + clusterIndex * 3) % 9);
      return {
        x: cluster.cx + Math.cos(angle) * radius,
        y: cluster.cy + Math.sin(angle) * radius,
        label: `${cluster.name} · ${pointIndex + 1}`,
        category: cluster.name,
      };
    })
  ),
};

// The author maps the coordinates/label the layout reads, and `color` to the real `category` column, so the
// engine's categorical scale colours each cell. The colour legend is suppressed to match the prior framing.
const aes = { x: 'x', y: 'y', label: 'label', category: 'category', color: 'category' };

const catchmentsSpec = kit.pipe(
  kit.createSpec({}),
  kit.geom.voronoi({ aes, params: { showLabels: true, showDelaunay: false } }),
  config({ legend: { position: 'none' } })
);

const clustersSpec = kit.pipe(
  kit.createSpec({}),
  kit.geom.voronoi({ aes, params: { showLabels: false, showDelaunay: true } }),
  config({ legend: { position: 'none' } })
);

export const StoreCatchments: Story = {
  render: () => <VoronoiGraph input={catchmentsSpec} data={coffeeShops} />,
};

export const EmbeddingClusters: Story = {
  render: () => <VoronoiGraph input={clustersSpec} data={embedding} />,
};
