import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer, type ThemeOverrides } from '@graphysdk/react-renderer';
import type { Data } from '@graphysdk/viz-engine';
import { createSpec, geom, mapping, pipe, scale, transform } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

const meta: Meta = {
  title: 'Features/Themes',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Shared spec ──────────────────────────────────────────────────────────────

const salesData: Data = {
  columns: [{ key: 'quarter' }, { key: 'North' }, { key: 'South' }, { key: 'West' }],
  rows: [
    { quarter: 'Q1', North: 350, South: 200, West: 500 },
    { quarter: 'Q2', North: 300, South: 250, West: 350 },
    { quarter: 'Q3', North: 400, South: 300, West: 300 },
    { quarter: 'Q4', North: 200, South: 150, West: 400 },
  ],
};

const sharedSpec = pipe(
  createSpec(
    transform.reshape({
      keep: ['quarter'],
      reshape: ['North', 'South', 'West'],
      keyName: 'region',
      valueName: 'sales',
    }),
    mapping({ x: 'quarter', y: 'sales', color: 'region' })
  ),
  geom.bar({ position: 'stack' }),
  scale.x(),
  scale.y(),
  scale.color.palette()
);

// ─── Dark theme ───────────────────────────────────────────────────────────────

export const Dark: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Opt into the built-in dark theme by passing `colorScheme="dark"` to the `GraphProvider`.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider
      data={salesData}
      spec={sharedSpec}
      config={{ type: 'columnStacked', axes: { y: { label: 'sales' } } }}
      colorScheme="dark"
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Custom theme ─────────────────────────────────────────────────────────────

const customTheme: ThemeOverrides = {
  graphBackground: '#fdf6e3',
  textPrimary: '#586e75',
  textSecondary: '#93a1a1',
  gridLineColor: '#eee8d5',
  legendBackground: '#eee8d5',
  legendBorderColor: '#93a1a1',
  legendTextColor: '#586e75',
  fontFamilyDefault: 'Georgia, "Times New Roman", serif',
  fontFamilyHeading: 'Georgia, "Times New Roman", serif',
};

export const Custom: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Provide arbitrary token overrides through the `themeOverrides` prop of `GraphProvider`. Only the tokens you pass are overridden; everything else falls back to chosen theme.',
      },
    },
  },
  render: () => (
    <VizStoryGraphProvider
      data={salesData}
      spec={sharedSpec}
      config={{ type: 'columnStacked', axes: { y: { label: 'sales' } } }}
      themeOverrides={customTheme}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
