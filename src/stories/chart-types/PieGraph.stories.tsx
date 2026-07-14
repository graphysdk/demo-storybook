import type { Meta, StoryObj } from '@storybook/react';

import { GraphRenderer } from '@graphysdk/react-renderer';
import type { BarGeomParams, Data } from '@graphysdk/viz-engine';
import { config, coord, createSpec, geom, pipe, scale } from '@graphysdk/viz-engine';

import { ResizablePlotDecorator } from '../../addons/ResizablePlotDecorator';
import { VizStoryGraphProvider } from '../../components/VizStoryGraphProvider';

interface SliceBorderArgs {
  borderColor: string;
  borderWidth: number;
}

const sliceBorderDefaults: SliceBorderArgs = {
  borderColor: '',
  borderWidth: 1,
};

const sliceBorderArgTypes = {
  borderColor: {
    control: 'color',
    description: 'Slice border color — also separates adjacent slices. Empty draws no border.',
  },
  borderWidth: {
    control: { type: 'range', min: 1, max: 6, step: 1 },
    description: 'Border width in pixels. Only takes effect when a border color is set.',
  },
} as const;

const buildSliceBorderParams = (args: SliceBorderArgs): Partial<BarGeomParams> => ({
  borderColor: args.borderColor || undefined,
  borderWidth: args.borderWidth,
});

const meta: Meta = {
  title: 'Chart Types/Pie Graph',
  decorators: [ResizablePlotDecorator],
};

export default meta;
type Story = StoryObj<SliceBorderArgs>;

// ─── Budget breakdown ──────────────────────────────────────────────────────
const budgetData: Data = {
  columns: [{ key: 'department' }, { key: 'spend' }],
  rows: [
    { department: 'Engineering', spend: 420 },
    { department: 'Marketing', spend: 180 },
    { department: 'Sales', spend: 150 },
    { department: 'Operations', spend: 95 },
    { department: 'HR', spend: 80 },
    { department: 'Legal', spend: 75 },
  ],
};

export const BudgetBreakdown: Story = {
  args: sliceBorderDefaults,
  argTypes: sliceBorderArgTypes,
  render: (args) => (
    <VizStoryGraphProvider
      data={budgetData}
      spec={pipe(
        createSpec({ x: '', y: 'spend', color: 'department' }),
        geom.bar({ position: 'fill', params: buildSliceBorderParams(args) }),
        coord.polar({ theta: 'y' }),
        scale.x(),
        scale.y(),
        scale.color.palette(),
        config({
          legend: {
            position: 'right',
          },
        })
      )}
      config={{
        type: 'pie',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Donut with dominant slice ─────────────────────────────────────────────
const marketShareData: Data = {
  columns: [{ key: 'browser' }, { key: 'share' }],
  rows: [
    { browser: 'Chrome', share: 65 },
    { browser: 'Safari', share: 18 },
    { browser: 'Firefox', share: 7 },
    { browser: 'Edge', share: 5 },
    { browser: 'Other', share: 5 },
  ],
};

export const MarketShare: Story = {
  args: sliceBorderDefaults,
  argTypes: sliceBorderArgTypes,
  render: (args) => (
    <VizStoryGraphProvider
      data={marketShareData}
      spec={pipe(
        createSpec({ x: '', y: 'share', color: 'browser' }),
        geom.bar({ position: 'fill', params: buildSliceBorderParams(args) }),
        coord.polar({ theta: 'y', innerRadius: 0.55 }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
      config={{
        type: 'donut',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};

// ─── Slices from a temporal column ──────────────────────────────────────────
// Temporal slice values form no group, so each must still become its own
// segment — a regression guard for per-x-value stacking in the fill adjuster.
const monthlySalesTemporalData: Data = {
  columns: [{ key: 'month' }, { key: 'sales' }],
  rows: [
    { month: new Date('2024-01-01'), sales: 32 },
    { month: new Date('2024-02-01'), sales: 28 },
    { month: new Date('2024-03-01'), sales: 35 },
    { month: new Date('2024-04-01'), sales: 41 },
    { month: new Date('2024-05-01'), sales: 47 },
    { month: new Date('2024-06-01'), sales: 52 },
    { month: new Date('2024-07-01'), sales: 58 },
    { month: new Date('2024-08-01'), sales: 55 },
    { month: new Date('2024-09-01'), sales: 44 },
    { month: new Date('2024-10-01'), sales: 38 },
    { month: new Date('2024-11-01'), sales: 30 },
    { month: new Date('2024-12-01'), sales: 34 },
  ],
};

export const MonthlySalesTemporal: Story = {
  render: () => (
    <VizStoryGraphProvider
      data={monthlySalesTemporalData}
      spec={pipe(
        createSpec({ x: '', y: 'sales', color: 'month' }),
        geom.bar({ position: 'fill' }),
        coord.polar({ theta: 'y' }),
        scale.x(),
        scale.y(),
        scale.color.palette()
      )}
      config={{
        type: 'pie',
      }}
    >
      <GraphRenderer />
    </VizStoryGraphProvider>
  ),
};
