import type { Meta, StoryObj } from '@storybook/react';

import { config } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';

import { ForceDirectedGraph, kit } from './ForceDirectedGraph';

const meta: Meta = {
  title: 'Plugins/Force-Directed',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

// The author maps `color` to the geom's derived `node` identity, so the engine's categorical scale colours
// each node — and its outgoing edges — from the default palette. The per-node colour legend is suppressed:
// every node is labelled in place, so the key would be redundant.
const spec = kit.pipe(
  kit.createSpec({}),
  kit.geom.forceDirected({ aes: { source: 'source', target: 'target', value: 'value', color: 'node' } }),
  config({ legend: { position: 'none' } })
);

export const ServiceDependencies: Story = {
  render: () => (
    <ForceDirectedGraph
      input={spec}
      data={{
        columns: [{ key: 'source' }, { key: 'target' }, { key: 'value' }],
        rows: [
          { source: 'Gateway', target: 'Auth', value: 120 },
          { source: 'Gateway', target: 'Catalog', value: 200 },
          { source: 'Gateway', target: 'Cart', value: 90 },
          { source: 'Gateway', target: 'Orders', value: 85 },
          { source: 'Auth', target: 'Sessions', value: 100 },
          { source: 'Catalog', target: 'Search', value: 150 },
          { source: 'Catalog', target: 'Inventory', value: 110 },
          { source: 'Search', target: 'Inventory', value: 80 },
          { source: 'Cart', target: 'Inventory', value: 70 },
          { source: 'Cart', target: 'Payments', value: 60 },
          { source: 'Orders', target: 'Payments', value: 65 },
          { source: 'Orders', target: 'Inventory', value: 50 },
          { source: 'Payments', target: 'Ledger', value: 55 },
          { source: 'Payments', target: 'Notifications', value: 40 },
          { source: 'Notifications', target: 'Sessions', value: 30 },
        ],
      }}
    />
  ),
};

export const CollaborationNetwork: Story = {
  render: () => (
    <ForceDirectedGraph
      input={spec}
      data={{
        columns: [{ key: 'source' }, { key: 'target' }, { key: 'value' }],
        rows: [
          { source: 'Ana', target: 'Ben', value: 5 },
          { source: 'Ana', target: 'Carla', value: 3 },
          { source: 'Ana', target: 'Diego', value: 2 },
          { source: 'Ben', target: 'Carla', value: 4 },
          { source: 'Ben', target: 'Diego', value: 2 },
          { source: 'Ben', target: 'Frank', value: 1 },
          { source: 'Carla', target: 'Diego', value: 6 },
          { source: 'Carla', target: 'Eve', value: 3 },
          { source: 'Diego', target: 'Eve', value: 3 },
          { source: 'Diego', target: 'Grace', value: 2 },
          { source: 'Eve', target: 'Frank', value: 5 },
          { source: 'Eve', target: 'Grace', value: 3 },
          { source: 'Frank', target: 'Grace', value: 4 },
          { source: 'Grace', target: 'Ana', value: 2 },
        ],
      }}
    />
  ),
};
