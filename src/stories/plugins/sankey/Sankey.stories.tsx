import type { Meta, StoryObj } from '@storybook/react';

import { config } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../../addons/ResizablePlotDecorator';

import { kit, SankeyGraph } from './SankeyGraph';

const meta: Meta = {
  title: 'Plugins/Sankey',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj;

/**
 * A cohesive cool palette (sky-blue → indigo → violet → magenta) supplied to the engine's colour scale,
 * so every node — and every source→target ribbon gradient blended between them — stays in one family.
 */
const COOL_PALETTE = [
  '#3F8EEB',
  '#5AA9E6',
  '#6C6CE0',
  '#8A5CD8',
  '#A64BC4',
  '#C13C9E',
  '#D6478A',
  '#2E3A8C',
  '#1F2A6B',
];

// The author maps `color` to the geom's derived `node` identity (ggalluvial's `after_stat(stratum)`),
// so the engine's categorical scale colours each node from COOL_PALETTE. Drop `color` and nodes render
// neutral — the geom forces no encoding.
const spec = kit.pipe(
  kit.createSpec({}),
  kit.geom.sankey({ aes: { source: 'source', target: 'target', value: 'value', color: 'node' } }),
  kit.scale.color.discrete({ range: COOL_PALETTE }),
  config({ legend: { position: 'none' } })
);

export const EnergyFlow: Story = {
  render: () => (
    <SankeyGraph
      input={spec}
      data={{
        columns: [{ key: 'source' }, { key: 'target' }, { key: 'value' }],
        rows: [
          { source: 'Coal', target: 'Electricity', value: 24 },
          { source: 'Gas', target: 'Electricity', value: 18 },
          { source: 'Gas', target: 'Heating', value: 12 },
          { source: 'Solar', target: 'Electricity', value: 8 },
          { source: 'Electricity', target: 'Industry', value: 22 },
          { source: 'Electricity', target: 'Residential', value: 18 },
          { source: 'Electricity', target: 'Transport', value: 10 },
          { source: 'Heating', target: 'Residential', value: 12 },
        ],
      }}
    />
  ),
};

export const BudgetFlow: Story = {
  render: () => (
    <SankeyGraph
      input={spec}
      data={{
        columns: [{ key: 'source' }, { key: 'target' }, { key: 'value' }],
        rows: [
          { source: 'Revenue', target: 'Product', value: 60 },
          { source: 'Revenue', target: 'Services', value: 40 },
          { source: 'Product', target: 'Salaries', value: 35 },
          { source: 'Product', target: 'Profit', value: 25 },
          { source: 'Services', target: 'Salaries', value: 22 },
          { source: 'Services', target: 'Profit', value: 18 },
        ],
      }}
    />
  ),
};
